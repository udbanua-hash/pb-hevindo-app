/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Athlete, POSSale, CourtRental } from '../types';

// Read Supabase credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    typeof supabaseUrl === 'string' &&
    typeof supabaseAnonKey === 'string' &&
    supabaseUrl.trim().startsWith('http') &&
    supabaseAnonKey.trim().length > 10
  );
};

export const getSupabaseConfig = () => ({
  url: supabaseUrl ? `${supabaseUrl.slice(0, 20)}...` : 'Belum diatur',
  isConfigured: isSupabaseConfigured(),
});

// Singleton client instance - always non-null SupabaseClient
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-anon-key'
    );

/**
 * Adaptive upsert helper that removes columns if Postgres rejects them
 * because they don't exist in the user's specific table schema.
 */
export async function adaptiveUpsert(
  tableName: string,
  payload: Record<string, any>,
  matchCol: string = 'id',
  maxRetries: number = 8
): Promise<{ data: any; error: any }> {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client tidak terkonfigurasi.') };
  }

  let currentPayload = { ...payload };
  let retries = 0;

  // Try updating first if record with matchCol exists
  if (currentPayload[matchCol]) {
    try {
      const { data: existing } = await supabase
        .from(tableName)
        .select(matchCol)
        .eq(matchCol, currentPayload[matchCol])
        .limit(1);

      if (existing && existing.length > 0) {
        while (retries < maxRetries) {
          const { data, error } = await supabase
            .from(tableName)
            .update(currentPayload)
            .eq(matchCol, currentPayload[matchCol])
            .select();

          if (!error) return { data, error: null };

          const match = error.message.match(/column "([^"]+)" of relation/i);
          if (match && match[1] && match[1] in currentPayload) {
            delete currentPayload[match[1]];
            retries++;
            continue;
          }
          break;
        }
      }
    } catch {
      // Continue to upsert
    }
  }

  retries = 0;
  while (retries < maxRetries) {
    let { data, error } = await supabase
      .from(tableName)
      .upsert(currentPayload, { onConflict: matchCol })
      .select();

    if (!error) {
      return { data, error: null };
    }

    // If ON CONFLICT specification failed or unknown matchCol constraint
    if (error.message.includes('ON CONFLICT') || error.message.includes('constraint')) {
      const insRes = await supabase.from(tableName).insert(currentPayload).select();
      if (!insRes.error) return { data: insRes.data, error: null };
      error = insRes.error;
    }

    // Check if error is about unknown column
    // e.g. column "name" of relation "athletes" does not exist
    const match = error.message.match(/column "([^"]+)" of relation/i);
    if (match && match[1] && match[1] in currentPayload) {
      delete currentPayload[match[1]];
      retries++;
      continue;
    }

    // Return the actual error if we cannot adaptively remove
    return { data: null, error };
  }

  return { data: null, error: new Error('Gagal menyimpan data setelah adaptasi kolom.') };
}

// ==========================================
// 1. MODUL DATA ATLET (Tabel: 'athletes')
// ==========================================

export function mapSupabaseRowToAthlete(row: any): Athlete {
  return {
    id: String(row.id || row.id_atlet || `ATL-${Date.now()}`),
    idPb: String(row.id_pb || row.idPb || row.id_pbsi || row.no_pbsi || '-'),
    nik: String(row.nik || '-'),
    name: String(row.name || row.nama || row.athlete_name || 'Tanpa Nama'),
    gender: (row.gender === 'PUTRA' || row.jenis_kelamin === 'Putra' || row.gender === 'Putra') ? 'Putra' : 'Putri',
    birthPlace: String(row.birth_place || row.tempat_lahir || 'Pekanbaru'),
    birthDate: String(row.birth_date || row.tanggal_lahir || '2014-01-01'),
    ageCategory: (row.age_category || row.kategori_usia || 'Pemula') as any,
    trainingCategory: (row.training_category || row.kategori_latihan || 'Pembibitan') as any,
    clubId: String(row.club_id || row.klub_id || 'CLB-001'),
    clubName: String(row.club_name || row.nama_klub || 'PB Hevindo'),
    parentName: String(row.parent_name || row.nama_orang_tua || '-'),
    phoneNumber: String(row.phone_number || row.no_hp || row.telepon || '-'),
    address: String(row.address || row.alamat || '-'),
    isActive: row.status_aktif !== undefined ? Boolean(row.status_aktif) : (row.is_active !== undefined ? Boolean(row.is_active) : true),
    duesStatus: (row.dues_status === 'LUNAS' || row.status_iuran === 'Lunas'
      ? 'Lunas'
      : row.dues_status === 'GRATIS_REWARD' || row.status_iuran === 'Gratis'
      ? 'Gratis'
      : 'Belum Bayar') as any,
    joinDate: String(row.created_at ? row.created_at.split('T')[0] : (row.tanggal_gabung || row.join_date || '2025-01-01')),
    qrCodeToken: String(row.qr_code_token || row.qr_token || row.qrCodeToken || `HEV-QR-${row.id || Date.now()}`),
    achievements: Array.isArray(row.achievements)
      ? row.achievements
      : typeof row.prestasi === 'string'
      ? JSON.parse(row.prestasi)
      : [],
    transferHistory: Array.isArray(row.transfer_history)
      ? row.transfer_history
      : typeof row.riwayat_transfer === 'string'
      ? JSON.parse(row.riwayat_transfer)
      : [],
  };
}

/**
 * Mengambil data secara async dari tabel Supabase 'athletes'
 * (await supabase.from('athletes').select('*'))
 */
export async function fetchAtlet(): Promise<{ data: Athlete[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      // Retry without ordering if 'id' column ordering is not supported
      const retry = await supabase.from('athletes').select('*');
      if (!retry.error && retry.data) {
        return { data: retry.data.map(mapSupabaseRowToAthlete), error: null };
      }
      return { data: [], error };
    }

    if (!data || !Array.isArray(data)) {
      return { data: [], error: null };
    }

    return { data: data.map(mapSupabaseRowToAthlete), error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

// Alias for backwards compatibility
export async function fetchAthletesFromSupabase(): Promise<Athlete[]> {
  const res = await fetchAtlet();
  return res.data;
}

/**
 * Menyimpan data atlet baru ke Supabase
 * (await supabase.from('athletes').insert([...]))
 */
export async function insertAthleteToSupabase(athlete: Athlete): Promise<{ success: boolean; data?: any; error?: any }> {
  const basePayload: Record<string, any> = {
    id: athlete.id,
    nik: athlete.nik,
    id_pb: athlete.idPb,
    nama: athlete.name,
    name: athlete.name,
    jenis_kelamin: athlete.gender === 'Putra' ? 'PUTRA' : 'PUTRI',
    gender: athlete.gender === 'Putra' ? 'PUTRA' : 'PUTRI',
    tempat_lahir: athlete.birthPlace,
    birth_place: athlete.birthPlace,
    tanggal_lahir: athlete.birthDate,
    birth_date: athlete.birthDate,
    kategori_usia: athlete.ageCategory,
    age_category: athlete.ageCategory,
    kategori_latihan: athlete.trainingCategory,
    training_category: athlete.trainingCategory,
    nama_klub: athlete.clubName,
    club_name: athlete.clubName,
    klub_id: athlete.clubId,
    club_id: athlete.clubId,
    nama_orang_tua: athlete.parentName,
    parent_name: athlete.parentName,
    no_hp: athlete.phoneNumber,
    telepon: athlete.phoneNumber,
    phone_number: athlete.phoneNumber,
    alamat: athlete.address,
    address: athlete.address,
    status_iuran: athlete.duesStatus === 'Lunas' ? 'LUNAS' : athlete.duesStatus === 'Gratis' ? 'GRATIS_REWARD' : 'BELUM_BAYAR',
    dues_status: athlete.duesStatus === 'Lunas' ? 'LUNAS' : athlete.duesStatus === 'Gratis' ? 'GRATIS_REWARD' : 'BELUM_BAYAR',
    status_aktif: athlete.isActive,
    is_active: athlete.isActive,
    tanggal_gabung: athlete.joinDate,
    join_date: athlete.joinDate,
    qr_code_token: athlete.qrCodeToken || `HEV-QR-${Date.now()}`,
    achievements: athlete.achievements || [],
    transfer_history: athlete.transferHistory || [],
  };

  let curPayload = { ...basePayload };
  let retries = 0;
  while (retries < 15) {
    const { data, error } = await supabase.from('athletes').insert([curPayload]).select();
    if (!error) {
      return { success: true, data };
    }

    // Jika kolom tidak ada di tabel, hapus kolom tersebut dari payload lalu retry
    const match = error.message.match(/column "([^"]+)" of relation "athletes" does not exist/i);
    if (match && match[1] && match[1] in curPayload) {
      delete curPayload[match[1]];
      retries++;
      continue;
    }

    // Jika id bermasalah (misal serial/uuid otomatis)
    if (error.message.includes('invalid input syntax') && 'id' in curPayload) {
      delete curPayload.id;
      retries++;
      continue;
    }

    // Coba fallback adaptiveUpsert jika ada konflik constraint
    const fallback = await adaptiveUpsert('athletes', curPayload, 'id');
    if (!fallback.error) {
      return { success: true, data: fallback.data };
    }

    return { success: false, error: error.message };
  }

  return { success: false, error: 'Gagal menambahkan atlet ke Supabase.' };
}

/**
 * Memperbarui data atlet yang sudah ada di Supabase
 * (await supabase.from('athletes').update(...).eq('id', id))
 */
export async function updateAthleteToSupabase(athlete: Athlete): Promise<{ success: boolean; data?: any; error?: any }> {
  const basePayload: Record<string, any> = {
    nik: athlete.nik,
    id_pb: athlete.idPb,
    nama: athlete.name,
    name: athlete.name,
    jenis_kelamin: athlete.gender === 'Putra' ? 'PUTRA' : 'PUTRI',
    gender: athlete.gender === 'Putra' ? 'PUTRA' : 'PUTRI',
    tempat_lahir: athlete.birthPlace,
    birth_place: athlete.birthPlace,
    tanggal_lahir: athlete.birthDate,
    birth_date: athlete.birthDate,
    kategori_usia: athlete.ageCategory,
    age_category: athlete.ageCategory,
    kategori_latihan: athlete.trainingCategory,
    training_category: athlete.trainingCategory,
    nama_klub: athlete.clubName,
    club_name: athlete.clubName,
    klub_id: athlete.clubId,
    club_id: athlete.clubId,
    nama_orang_tua: athlete.parentName,
    parent_name: athlete.parentName,
    no_hp: athlete.phoneNumber,
    telepon: athlete.phoneNumber,
    phone_number: athlete.phoneNumber,
    alamat: athlete.address,
    address: athlete.address,
    status_iuran: athlete.duesStatus === 'Lunas' ? 'LUNAS' : athlete.duesStatus === 'Gratis' ? 'GRATIS_REWARD' : 'BELUM_BAYAR',
    dues_status: athlete.duesStatus === 'Lunas' ? 'LUNAS' : athlete.duesStatus === 'Gratis' ? 'GRATIS_REWARD' : 'BELUM_BAYAR',
    status_aktif: athlete.isActive,
    is_active: athlete.isActive,
    achievements: athlete.achievements || [],
    transfer_history: athlete.transferHistory || [],
  };

  let curPayload = { ...basePayload };
  let retries = 0;
  while (retries < 15) {
    let { data, error } = await supabase.from('athletes').update(curPayload).eq('id', athlete.id).select();
    if (!error) {
      return { success: true, data };
    }

    const match = error.message.match(/column "([^"]+)" of relation "athletes" does not exist/i);
    if (match && match[1] && match[1] in curPayload) {
      delete curPayload[match[1]];
      retries++;
      continue;
    }

    // Coba fallback dengan match id_atlet
    const retryIdAtlet = await supabase.from('athletes').update(curPayload).eq('id_atlet', athlete.id).select();
    if (!retryIdAtlet.error) {
      return { success: true, data: retryIdAtlet.data };
    }

    return { success: false, error: error.message };
  }

  return { success: false, error: 'Gagal memperbarui data atlet di Supabase.' };
}

// Alias saveAthleteToSupabase
export async function saveAthleteToSupabase(athlete: Athlete): Promise<{ success: boolean; error?: any }> {
  // Cek apakah sudah ada untuk update atau insert
  const updateRes = await updateAthleteToSupabase(athlete);
  if (updateRes.success) return { success: true };
  return insertAthleteToSupabase(athlete);
}

/**
 * Menghapus data atlet dari Supabase
 * (await supabase.from('athletes').delete().eq('id', id))
 */
export async function deleteAthleteFromSupabase(athleteId: string): Promise<{ success: boolean; error?: any }> {
  try {
    let { error } = await supabase.from('athletes').delete().eq('id', athleteId);
    if (error) {
      // Fallback coba kolom 'id_atlet'
      const fallback = await supabase.from('athletes').delete().eq('id_atlet', athleteId);
      if (!fallback.error) return { success: true };
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// 2. MODUL KANTIN & POS (Tabel: 'pos_sales')
// ==========================================

export async function fetchKantinTransaksiFromSupabase(): Promise<POSSale[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('pos_sales')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Gagal membaca transaksi kantin dari Supabase:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row: any): POSSale => ({
      id: String(row.id || row.sale_id || `POS-${Date.now()}`),
      receiptNumber: String(row.invoice_number || row.nomor_struk || row.receipt_number || `INV-${Date.now()}`),
      invoiceNo: String(row.invoice_number || row.nomor_struk || row.receipt_number || ''),
      date: String(row.created_at ? row.created_at.split('T')[0] : (row.tanggal || row.date || new Date().toISOString().split('T')[0])),
      time: String(row.created_at ? row.created_at.split('T')[1].slice(0, 5) : (row.jam || row.time || '12:00 WIB')),
      customerName: String(row.customer_name || row.nama_pembeli || 'Pelanggan'),
      customerType: String(row.customer_type || row.tipe_pembeli || 'Umum'),
      totalAmount: Number(row.total_amount || row.total_harga || row.total || 0),
      cashierName: String(row.cashier_name || row.nama_kasir || 'Petugas Kasir'),
      paymentMethod: String(row.payment_method || row.metode_pembayaran || 'CASH'),
      items: Array.isArray(row.sales_data)
        ? row.sales_data
        : typeof row.sales_data === 'string'
        ? JSON.parse(row.sales_data)
        : Array.isArray(row.items)
        ? row.items
        : typeof row.items === 'string'
        ? JSON.parse(row.items)
        : [],
    }));
  } catch (err) {
    console.error('Error fetching kantin transactions from Supabase:', err);
    return [];
  }
}

export async function saveKantinTransaksiToSupabase(sale: POSSale): Promise<{ success: boolean; error?: any }> {
  if (!supabase) {
    return { success: false, error: 'Supabase credentials belum diatur.' };
  }

  try {
    const payload: Record<string, any> = {
      id: sale.id,
      invoice_number: sale.receiptNumber || sale.invoiceNo || `INV-${Date.now()}`,
      nomor_struk: sale.receiptNumber,
      receipt_number: sale.receiptNumber,
      invoice_no: sale.receiptNumber,
      tanggal: sale.date,
      date: sale.date,
      jam: sale.time,
      time: sale.time,
      nama_pembeli: sale.customerName,
      customer_name: sale.customerName,
      tipe_pembeli: sale.customerType,
      customer_type: sale.customerType,
      total_harga: sale.totalAmount,
      total_amount: sale.totalAmount,
      total: sale.totalAmount,
      nama_kasir: sale.cashierName,
      cashier_name: sale.cashierName,
      metode_pembayaran: sale.paymentMethod || 'CASH',
      payment_method: sale.paymentMethod || 'CASH',
      sales_data: sale.items || [],
      items: sale.items || [],
    };

    const { error } = await adaptiveUpsert('pos_sales', payload, 'id');
    if (error) {
      console.warn('Gagal menyimpan transaksi kantin ke Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// 3. MODUL SEWA LAPANGAN (Tabel: 'court_rentals')
// ==========================================

export async function fetchSewaLapanganFromSupabase(): Promise<CourtRental[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('court_rentals')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Gagal membaca sewa lapangan dari Supabase:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row: any): CourtRental => ({
      id: String(row.id || row.rental_id || `RENT-${Date.now()}`),
      bookingCode: String(row.booking_code || row.kode_booking || `HEV-${Date.now()}`),
      renterName: String(row.renter_name || row.nama_penyewa || 'Penyewa'),
      renterPhone: String(row.renter_phone || row.telepon || row.no_hp || ''),
      rentalType: (row.rental_type === 'HARIAN' || row.jenis_sewa === 'Harian' ? 'Harian' : row.rental_type === 'MINGGUAN' || row.jenis_sewa === 'Mingguan' ? 'Mingguan' : 'Bulanan') as any,
      buildingId: String(row.building_id || row.gedung_id || 'BLD-01'),
      buildingName: String(row.building_name || row.nama_gedung || 'GOR PB Hevindo'),
      courtId: String(row.court_id || row.lapangan_id || 'CRT-01'),
      courtName: String(row.court_name || row.nama_lapangan || 'Lapangan 1'),
      startDate: String(row.rental_date || row.tanggal_mulai || row.start_date || new Date().toISOString().split('T')[0]),
      endDate: row.tanggal_selesai || row.end_date,
      timeSlot: String((row.start_time && row.end_time) ? `${row.start_time} - ${row.end_time}` : (row.jam_sewa || row.time_slot || '19:00 - 21:00')),
      durationHours: Number(row.duration_hours || row.durasi_jam || 2),
      pricePerUnit: Number(row.price_per_unit || row.harga_per_jam || 50000),
      totalPrice: Number(row.total_price || row.total_biaya || row.total_harga || 100000),
      status: (row.status || 'Aktif') as any,
      paymentStatus: (row.payment_status === 'PAID' || row.status_pembayaran === 'Lunas' ? 'Lunas' : 'Belum Bayar') as any,
      paymentMethod: (row.payment_method || row.metode_pembayaran || 'Tunai') as any,
      notes: row.notes || row.catatan || '',
    }));
  } catch (err) {
    console.error('Error fetching sewa lapangan from Supabase:', err);
    return [];
  }
}

export async function saveSewaLapanganToSupabase(rental: CourtRental): Promise<{ success: boolean; error?: any }> {
  if (!supabase) {
    return { success: false, error: 'Supabase credentials belum diatur.' };
  }

  try {
    const payload: Record<string, any> = {
      id: rental.id,
      booking_code: rental.bookingCode,
      kode_booking: rental.bookingCode,
      renter_name: rental.renterName,
      nama_penyewa: rental.renterName,
      renter_phone: rental.renterPhone,
      telepon: rental.renterPhone,
      no_hp: rental.renterPhone,
      rental_type: rental.rentalType === 'Harian' ? 'HARIAN' : rental.rentalType === 'Mingguan' ? 'MINGGUAN' : 'BULANAN',
      jenis_sewa: rental.rentalType,
      building_id: rental.buildingId,
      gedung_id: rental.buildingId,
      building_name: rental.buildingName,
      nama_gedung: rental.buildingName,
      court_id: rental.courtId,
      lapangan_id: rental.courtId,
      court_name: rental.courtName,
      nama_lapangan: rental.courtName,
      rental_date: rental.startDate,
      tanggal_mulai: rental.startDate,
      start_date: rental.startDate,
      end_date: rental.endDate,
      tanggal_selesai: rental.endDate,
      start_time: rental.timeSlot ? rental.timeSlot.split('-')[0].trim() : '14:00',
      end_time: rental.timeSlot ? rental.timeSlot.split('-')[1].trim() : '16:00',
      jam_sewa: rental.timeSlot,
      time_slot: rental.timeSlot,
      duration_hours: rental.durationHours,
      durasi_jam: rental.durationHours,
      price_per_unit: rental.pricePerUnit,
      harga_per_jam: rental.pricePerUnit,
      total_price: rental.totalPrice,
      total_biaya: rental.totalPrice,
      total_harga: rental.totalPrice,
      status: rental.status,
      payment_status: rental.paymentStatus === 'Lunas' ? 'PAID' : 'UNPAID',
      status_pembayaran: rental.paymentStatus,
      payment_method: rental.paymentMethod,
      metode_pembayaran: rental.paymentMethod,
      notes: rental.notes,
      catatan: rental.notes,
    };

    const { error } = await adaptiveUpsert('court_rentals', payload, 'id');
    if (error) {
      console.warn('Gagal menyimpan sewa lapangan ke Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteSewaLapanganFromSupabase(rentalId: string): Promise<{ success: boolean; error?: any }> {
  if (!supabase) return { success: false, error: 'Supabase belum diatur.' };

  try {
    const { error } = await supabase.from('court_rentals').delete().eq('id', rentalId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}