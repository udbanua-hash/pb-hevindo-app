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

// Singleton client instance
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Adaptive upsert helper that removes columns if Postgres rejects them
 * because they don't exist in the user's specific table schema.
 */
async function adaptiveUpsert(
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
    // e.g. column "name" of relation "atlet" does not exist
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
// 1. MODUL DATA ATLET (Tabel: 'atlet')
// ==========================================

export async function fetchAthletesFromSupabase(): Promise<Athlete[]> {
  if (!supabase) return [];

  try {
    let { data, error } = await supabase
      .from('atlet')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Gagal membaca data atlet dengan order id, mencoba tanpa order:', error.message);
      const retry = await supabase.from('atlet').select('*');
      if (!retry.error) {
        data = retry.data;
        error = null;
      } else {
        console.warn('Gagal membaca data atlet dari Supabase:', retry.error.message);
        return [];
      }
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row: any): Athlete => ({
      id: String(row.id || row.id_atlet || `ATL-${Date.now()}`),
      idPb: String(row.id_pb || row.idPb || row.id_pbsi || ''),
      nik: String(row.nik || ''),
      name: String(row.nama || row.name || row.athlete_name || 'Tanpa Nama'),
      gender: (row.jenis_kelamin || row.gender || 'Putra') as any,
      birthPlace: String(row.tempat_lahir || row.birth_place || 'Pekanbaru'),
      birthDate: String(row.tanggal_lahir || row.birth_date || '2012-01-01'),
      ageCategory: (row.kategori_usia || row.age_category || 'Pemula (U-15)') as any,
      trainingCategory: (row.kategori_latihan || row.training_category || 'Regular') as any,
      clubId: String(row.klub_id || row.club_id || 'CLUB-001'),
      clubName: String(row.nama_klub || row.club_name || 'PB HEVINDO PEKANBARU'),
      parentName: String(row.nama_orang_tua || row.parent_name || ''),
      phoneNumber: String(row.telepon || row.no_hp || row.phone_number || ''),
      address: String(row.alamat || row.address || ''),
      isActive: row.status_aktif !== undefined ? Boolean(row.status_aktif) : (row.is_active !== undefined ? Boolean(row.is_active) : true),
      duesStatus: (row.status_iuran || row.dues_status || 'Lunas') as any,
      joinDate: String(row.tanggal_gabung || row.join_date || '2025-01-01'),
      qrCodeToken: String(row.qr_token || row.qrCodeToken || `QR-${row.id || Date.now()}`),
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
    }));
  } catch (err) {
    console.error('Error fetching athletes from Supabase:', err);
    return [];
  }
}

export async function saveAthleteToSupabase(athlete: Athlete): Promise<{ success: boolean; error?: any }> {
  if (!supabase) {
    return { success: false, error: 'Supabase credentials belum diatur.' };
  }

  try {
    const payload: Record<string, any> = {
      id: athlete.id,
      nik: athlete.nik,
      id_pb: athlete.idPb,
      nama: athlete.name,
      name: athlete.name,
      jenis_kelamin: athlete.gender,
      gender: athlete.gender,
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
      telepon: athlete.phoneNumber,
      no_hp: athlete.phoneNumber,
      phone_number: athlete.phoneNumber,
      alamat: athlete.address,
      address: athlete.address,
      status_iuran: athlete.duesStatus,
      dues_status: athlete.duesStatus,
      status_aktif: athlete.isActive,
      is_active: athlete.isActive,
      tanggal_gabung: athlete.joinDate,
      join_date: athlete.joinDate,
    };

    const { error } = await adaptiveUpsert('atlet', payload, 'id');
    if (error) {
      console.warn('Gagal menyimpan atlet ke Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAthleteFromSupabase(athleteId: string): Promise<{ success: boolean; error?: any }> {
  if (!supabase) return { success: false, error: 'Supabase belum diatur.' };

  try {
    let { error } = await supabase.from('atlet').delete().eq('id', athleteId);
    if (error) {
      // Fallback try column 'id_atlet'
      const fallback = await supabase.from('atlet').delete().eq('id_atlet', athleteId);
      if (!fallback.error) return { success: true };
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// 2. MODUL KANTIN & POS (Tabel: 'kantin_transaksi')
// ==========================================

export async function fetchKantinTransaksiFromSupabase(): Promise<POSSale[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('kantin_transaksi')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Gagal membaca transaksi kantin dari Supabase:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row: any): POSSale => ({
      id: String(row.id || row.sale_id || `POS-${Date.now()}`),
      receiptNumber: String(row.nomor_struk || row.receipt_number || row.invoice_no || `INV-${Date.now()}`),
      invoiceNo: String(row.invoice_no || row.nomor_struk || row.receipt_number || ''),
      date: String(row.tanggal || row.date || new Date().toISOString().split('T')[0]),
      time: String(row.jam || row.time || '12:00 WIB'),
      customerName: String(row.nama_pembeli || row.customer_name || 'Pelanggan'),
      customerType: String(row.tipe_pembeli || row.customer_type || 'Umum'),
      totalAmount: Number(row.total_harga || row.total_amount || row.total || 0),
      cashierName: String(row.nama_kasir || row.cashier_name || 'Petugas Kasir'),
      paymentMethod: String(row.metode_pembayaran || row.payment_method || 'Tunai'),
      items: Array.isArray(row.items)
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
      metode_pembayaran: sale.paymentMethod,
      payment_method: sale.paymentMethod,
      items: sale.items,
    };

    const { error } = await adaptiveUpsert('kantin_transaksi', payload, 'id');
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
// 3. MODUL SEWA LAPANGAN (Tabel: 'sewa_lapangan')
// ==========================================

export async function fetchSewaLapanganFromSupabase(): Promise<CourtRental[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('sewa_lapangan')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Gagal membaca sewa lapangan dari Supabase:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row: any): CourtRental => ({
      id: String(row.id || row.rental_id || `RENT-${Date.now()}`),
      bookingCode: String(row.kode_booking || row.booking_code || `HEV-${Date.now()}`),
      renterName: String(row.nama_penyewa || row.renter_name || 'Penyewa'),
      renterPhone: String(row.telepon || row.no_hp || row.renter_phone || ''),
      rentalType: (row.jenis_sewa || row.rental_type || 'Harian') as any,
      buildingId: String(row.gedung_id || row.building_id || 'BLD-01'),
      buildingName: String(row.nama_gedung || row.building_name || 'GOR PB Hevindo'),
      courtId: String(row.lapangan_id || row.court_id || 'CRT-01'),
      courtName: String(row.nama_lapangan || row.court_name || 'Lapangan 1'),
      startDate: String(row.tanggal_mulai || row.start_date || new Date().toISOString().split('T')[0]),
      endDate: row.tanggal_selesai || row.end_date,
      timeSlot: String(row.jam_sewa || row.time_slot || '19:00 - 21:00'),
      durationHours: Number(row.durasi_jam || row.duration_hours || 2),
      pricePerUnit: Number(row.harga_per_jam || row.price_per_unit || 50000),
      totalPrice: Number(row.total_biaya || row.total_harga || row.total_price || 100000),
      status: (row.status || 'Aktif') as any,
      paymentStatus: (row.status_pembayaran || row.payment_status || 'Lunas') as any,
      paymentMethod: (row.metode_pembayaran || row.payment_method || 'Tunai') as any,
      notes: row.catatan || row.notes || '',
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
      kode_booking: rental.bookingCode,
      booking_code: rental.bookingCode,
      nama_penyewa: rental.renterName,
      renter_name: rental.renterName,
      telepon: rental.renterPhone,
      no_hp: rental.renterPhone,
      renter_phone: rental.renterPhone,
      jenis_sewa: rental.rentalType,
      rental_type: rental.rentalType,
      gedung_id: rental.buildingId,
      building_id: rental.buildingId,
      nama_gedung: rental.buildingName,
      building_name: rental.buildingName,
      lapangan_id: rental.courtId,
      court_id: rental.courtId,
      nama_lapangan: rental.courtName,
      court_name: rental.courtName,
      tanggal_mulai: rental.startDate,
      start_date: rental.startDate,
      tanggal_selesai: rental.endDate,
      end_date: rental.endDate,
      jam_sewa: rental.timeSlot,
      time_slot: rental.timeSlot,
      durasi_jam: rental.durationHours,
      duration_hours: rental.durationHours,
      harga_per_jam: rental.pricePerUnit,
      price_per_unit: rental.pricePerUnit,
      total_biaya: rental.totalPrice,
      total_harga: rental.totalPrice,
      total_price: rental.totalPrice,
      status: rental.status,
      status_pembayaran: rental.paymentStatus,
      payment_status: rental.paymentStatus,
      metode_pembayaran: rental.paymentMethod,
      payment_method: rental.paymentMethod,
      catatan: rental.notes,
      notes: rental.notes,
    };

    const { error } = await adaptiveUpsert('sewa_lapangan', payload, 'id');
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
    const { error } = await supabase.from('sewa_lapangan').delete().eq('id', rentalId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
