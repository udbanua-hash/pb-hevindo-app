/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Athlete,
  POSSale,
  CourtRental,
  Coach,
  Referee,
  Building,
  Court,
  TrainingSchedule,
  MonthlyDues,
  AttendanceRecord,
} from '../types';

/**
 * Normalizes Supabase URL format:
 * - If user enters "yqboknuybcaqvurqwiot" -> "https://yqboknuybcaqvurqwiot.supabase.co"
 * - If user enters "myproject.supabase.co" -> "https://myproject.supabase.co"
 * - If user enters "https://.../" -> strips trailing slash
 */
export function normalizeSupabaseUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/+$/, '');
  }

  if (trimmed.includes('.supabase.co')) {
    return `https://${trimmed}`.replace(/\/+$/, '');
  }

  // If user passed only the project reference identifier (e.g. "yqboknuybcaqvurqwiot")
  if (/^[a-z0-9_-]+$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }

  return `https://${trimmed}`.replace(/\/+$/, '');
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = typeof rawSupabaseAnonKey === 'string' ? rawSupabaseAnonKey.trim() : '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 10
  );
};

export const getSupabaseConfig = () => ({
  url: supabaseUrl ? `${supabaseUrl.slice(0, 25)}...` : 'Belum diatur',
  isConfigured: isSupabaseConfigured(),
});

// Helper to ensure a string is a valid UUID, or generate a deterministic / random UUID
export function ensureUUID(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Singleton client instance created safely without throwing Uncaught Error
function initSupabaseClient(): SupabaseClient {
  const targetUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co';
  const targetKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key';

  try {
    return createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Gagal inisialisasi Supabase client dengan URL:', targetUrl, err);
    return createClient('https://placeholder.supabase.co', 'placeholder-anon-key');
  }
}

export const supabase: SupabaseClient = initSupabaseClient();

/**
 * Adaptive upsert helper that removes columns if Postgres rejects them
 * because they don't exist in the specific table schema.
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
// 1. MODUL ATLET (Tabel: 'athletes' / 'atlet')
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
    ageCategory: (row.age_category || row.kategori_usia || 'Pemula (U-15)') as any,
    trainingCategory: (row.training_category || row.kategori_latihan || 'Pembibitan') as any,
    clubId: String(row.club_id || row.klub_id || 'CLB-001'),
    clubName: String(row.club_name || row.nama_klub || 'PB Hevindo'),
    parentName: String(row.parent_name || row.nama_orang_tua || row.nama_ortu || '-'),
    phoneNumber: String(row.phone_number || row.no_hp || row.telepon || '-'),
    address: String(row.address || row.alamat || '-'),
    isActive: row.status_aktif !== undefined ? Boolean(row.status_aktif) : (row.is_active !== undefined ? Boolean(row.is_active) : true),
    duesStatus: (row.dues_status === 'LUNAS' || row.status_iuran === 'Lunas' || row.status_iuran === 'LUNAS'
      ? 'Lunas'
      : row.dues_status === 'GRATIS_REWARD' || row.status_iuran === 'Gratis' || row.status_iuran === 'Gratis / Reward Juara'
      ? 'Gratis / Reward Juara'
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

export async function fetchAtlet(): Promise<{ data: Athlete[]; error: any }> {
  if (!isSupabaseConfigured()) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
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

export async function fetchAthletesFromSupabase(): Promise<Athlete[]> {
  const res = await fetchAtlet();
  return res.data;
}

export async function saveAthleteToSupabase(athlete: Athlete): Promise<{ success: boolean; error?: any; data?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur' };

  const validId = ensureUUID(athlete.id);
  const basePayload: Record<string, any> = {
    id: validId,
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
    nama_ortu: athlete.parentName,
    nama_orang_tua: athlete.parentName,
    parent_name: athlete.parentName,
    no_hp: athlete.phoneNumber,
    phone_number: athlete.phoneNumber,
    telepon: athlete.phoneNumber,
    alamat: athlete.address,
    address: athlete.address,
    status_iuran: athlete.duesStatus === 'Lunas' ? 'LUNAS' : athlete.duesStatus === 'Gratis / Reward Juara' ? 'GRATIS_REWARD' : 'BELUM_BAYAR',
    dues_status: athlete.duesStatus === 'Lunas' ? 'LUNAS' : athlete.duesStatus === 'Gratis / Reward Juara' ? 'GRATIS_REWARD' : 'BELUM_BAYAR',
    status_aktif: athlete.isActive,
    is_active: athlete.isActive,
    tanggal_gabung: athlete.joinDate,
    join_date: athlete.joinDate,
    qr_code_token: athlete.qrCodeToken || `HEV-QR-${athlete.id || Date.now()}`,
    achievements: athlete.achievements || [],
    transfer_history: athlete.transferHistory || [],
  };

  const { data, error } = await adaptiveUpsert('athletes', basePayload, 'id');
  if (error) {
    console.warn('Gagal menyimpan atlet ke Supabase:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function insertAthleteToSupabase(athlete: Athlete): Promise<{ success: boolean; data?: any; error?: any }> {
  return saveAthleteToSupabase(athlete);
}

export async function updateAthleteToSupabase(athlete: Athlete): Promise<{ success: boolean; data?: any; error?: any }> {
  return saveAthleteToSupabase(athlete);
}

export async function deleteAthleteFromSupabase(athleteId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };
  try {
    const { error } = await supabase.from('athletes').delete().eq('id', athleteId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ========================================================
// 2. MODUL PELATIH & WASIT (Tabel: 'pelatih_wasit' / 'pelatih')
// ========================================================

export async function fetchPelatihWasitFromSupabase(): Promise<{ coaches: Coach[]; referees: Referee[] }> {
  if (!isSupabaseConfigured()) return { coaches: [], referees: [] };

  try {
    // Read from pelatih_wasit first, fallback to pelatih
    let res = await supabase.from('pelatih_wasit').select('*').order('created_at', { ascending: true });
    if (res.error || !res.data) {
      res = await supabase.from('pelatih').select('*').order('created_at', { ascending: true });
    }

    if (res.error || !res.data || !Array.isArray(res.data)) {
      console.warn('Gagal memuat pelatih & wasit dari Supabase:', res.error?.message);
      return { coaches: [], referees: [] };
    }

    const coaches: Coach[] = [];
    const referees: Referee[] = [];

    for (const row of res.data) {
      const roleStr = String(row.peran || row.role || (row.certification ? 'Wasit' : 'Pelatih')).toLowerCase();
      const isReferee = roleStr.includes('wasit') || roleStr.includes('referee');

      if (isReferee) {
        referees.push({
          id: String(row.id),
          name: String(row.nama || row.name || 'Wasit PBSI'),
          certification: (row.lisensi || row.certification || 'Sertifikasi PBSI Nasional') as any,
          licenseNumber: String(row.no_lisensi || row.license_number || `PBSI-WST-${String(row.id).slice(0, 5)}`),
          phone: String(row.no_hp || row.phone || row.telepon || '-'),
          assignedMatchesCount: Number(row.assigned_matches_count || row.total_pertandingan || 0),
          status: (row.status || 'Tersedia') as any,
        });
      } else {
        coaches.push({
          id: String(row.id),
          name: String(row.nama || row.name || 'Pelatih Hevindo'),
          category: (row.kategori || row.category || row.spesialisasi || 'Tunggal') as any,
          phone: String(row.no_hp || row.phone || row.telepon || '-'),
          email: String(row.email || '-'),
          honorPerSession: Number(row.honor_per_session || row.honor_per_sesi || 150000),
          monthlyHonor: Number(row.monthly_honor || row.honor_bulanan || 4500000),
          scheduleNotes: String(row.schedule_notes || row.jadwal || row.catatan || 'Jadwal Reguler PB Hevindo'),
          status: (row.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif') as any,
        });
      }
    }

    return { coaches, referees };
  } catch (err) {
    console.error('Error fetching pelatih & wasit:', err);
    return { coaches: [], referees: [] };
  }
}

export async function savePelatihWasitToSupabase(
  item: {
    id?: string;
    name: string;
    role?: 'Pelatih' | 'Wasit';
    category?: string;
    license?: string;
    phone?: string;
    email?: string;
    honorPerSession?: number;
    monthlyHonor?: number;
    scheduleNotes?: string;
    status?: string;
    assignedMatchesCount?: number;
  },
  fallbackRole?: 'Pelatih' | 'Wasit'
): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials belum diatur.' };
  }

  const role = item.role || fallbackRole || 'Pelatih';
  const validId = ensureUUID(item.id);
  const payload: Record<string, any> = {
    id: validId,
    nama: item.name,
    name: item.name,
    peran: role,
    role: role,
    kategori: item.category || 'Tunggal',
    category: item.category || 'Tunggal',
    spesialisasi: item.category || 'Tunggal',
    lisensi: item.license || (role === 'Wasit' ? 'Sertifikasi PBSI Nasional' : 'BWF Level 1'),
    certification: item.license || (role === 'Wasit' ? 'Sertifikasi PBSI Nasional' : 'BWF Level 1'),
    no_hp: item.phone || '-',
    phone: item.phone || '-',
    telepon: item.phone || '-',
    email: item.email || '-',
    honor_per_session: Number(item.honorPerSession || 0),
    honor_per_sesi: Number(item.honorPerSession || 0),
    monthly_honor: Number(item.monthlyHonor || 0),
    honor_bulanan: Number(item.monthlyHonor || 0),
    status: item.status || 'Aktif',
  };

  // Upsert to pelatih_wasit
  const res1 = await adaptiveUpsert('pelatih_wasit', payload, 'id');
  if (!res1.error) {
    return { success: true, data: res1.data };
  }

  // Fallback to pelatih table
  const res2 = await adaptiveUpsert('pelatih', payload, 'id');
  if (!res2.error) {
    return { success: true, data: res2.data };
  }

  return { success: false, error: res1.error?.message || res2.error?.message };
}

export async function deletePelatihWasitFromSupabase(id: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };
  try {
    await supabase.from('pelatih_wasit').delete().eq('id', id);
    await supabase.from('pelatih').delete().eq('id', id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ========================================================
// 3. MODUL GEDUNG & LAPANGAN (Tabel: 'gedung' & 'lapangan')
// ========================================================

export async function fetchGedungLapanganFromSupabase(): Promise<Building[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data: gedungRows, error: gErr } = await supabase.from('gedung').select('*').order('created_at', { ascending: true });
    if (gErr || !gedungRows || !Array.isArray(gedungRows) || gedungRows.length === 0) {
      return [];
    }

    const { data: lapanganRows } = await supabase.from('lapangan').select('*');
    const allCourts = Array.isArray(lapanganRows) ? lapanganRows : [];

    return gedungRows.map((g: any): Building => {
      const bldId = String(g.id);
      const bldCourts = allCourts.filter((c: any) => String(c.building_id || c.gedung_id) === bldId);

      const mappedCourts: Court[] = bldCourts.length > 0
        ? bldCourts.map((c: any): Court => ({
            id: String(c.id),
            name: String(c.name || c.nama || 'Lapangan'),
            buildingId: bldId,
            buildingName: String(g.name || g.nama || 'GOR Hevindo'),
            surfaceType: (c.surface_type || c.jenis_lantai || 'Karpet Vinyl BWF') as any,
            isActive: c.is_active !== undefined ? Boolean(c.is_active) : true,
          }))
        : (Array.isArray(g.courts) && g.courts.length > 0
            ? g.courts.map((c: any, idx: number): Court => ({
                id: String(c.id || `${bldId}-CRT-${idx + 1}`),
                name: String(c.name || `Lapangan ${idx + 1}`),
                buildingId: bldId,
                buildingName: String(g.name || g.nama || 'GOR Hevindo'),
                surfaceType: (c.surfaceType || 'Karpet Vinyl BWF') as any,
                isActive: true,
              }))
            : [
                {
                  id: `${bldId}-CRT-1`,
                  name: 'Lapangan 1',
                  buildingId: bldId,
                  buildingName: String(g.name || g.nama || 'GOR Hevindo'),
                  surfaceType: 'Karpet Vinyl BWF',
                  isActive: true,
                },
              ]);

      return {
        id: bldId,
        name: String(g.name || g.nama || 'GOR Hevindo Pusat'),
        address: String(g.address || g.alamat || 'Pekanbaru'),
        description: String(g.description || g.deskripsi || 'Fasilitas Lapangan Bulutangkis Standar BWF'),
        courts: mappedCourts,
        rateMorningWeekday: Number(g.rate_morning_weekday || g.rate_morning || 45000),
        rateAfternoonWeekday: Number(g.rate_afternoon_weekday || g.rate_afternoon || 55000),
        rateEveningWeekday: Number(g.rate_evening_weekday || g.rate_evening || 80000),
        rateMorningWeekend: Number(g.rate_morning_weekend || 55000),
        rateAfternoonWeekend: Number(g.rate_afternoon_weekend || 70000),
        rateEveningWeekend: Number(g.rate_evening_weekend || 95000),
        rateMorning: Number(g.rate_morning || 45000),
        rateAfternoon: Number(g.rate_afternoon || 55000),
        rateEvening: Number(g.rate_evening || 80000),
      };
    });
  } catch (err) {
    console.error('Error fetching gedung & lapangan from Supabase:', err);
    return [];
  }
}

export async function saveGedungToSupabase(building: Building): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase credentials belum diatur.' };

  const validBuildingId = ensureUUID(building.id);
  const payload: Record<string, any> = {
    id: validBuildingId,
    name: building.name,
    nama: building.name,
    address: building.address,
    alamat: building.address,
    description: building.description,
    deskripsi: building.description,
    rate_morning: building.rateMorning,
    rate_afternoon: building.rateAfternoon,
    rate_evening: building.rateEvening,
    rate_morning_weekday: building.rateMorningWeekday ?? building.rateMorning,
    rate_afternoon_weekday: building.rateAfternoonWeekday ?? building.rateAfternoon,
    rate_evening_weekday: building.rateEveningWeekday ?? building.rateEvening,
    rate_morning_weekend: building.rateMorningWeekend ?? (building.rateMorning + 10000),
    rate_afternoon_weekend: building.rateAfternoonWeekend ?? (building.rateAfternoon + 15000),
    rate_evening_weekend: building.rateEveningWeekend ?? (building.rateEvening + 15000),
    courts: building.courts || [],
  };

  const { error } = await adaptiveUpsert('gedung', payload, 'id');
  if (error) {
    return { success: false, error: error.message };
  }

  // Also sync court rows to 'lapangan' table
  if (Array.isArray(building.courts)) {
    for (const crt of building.courts) {
      await saveLapanganToSupabase(crt, validBuildingId, building.name);
    }
  }

  return { success: true };
}

export async function deleteGedungFromSupabase(buildingId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };
  try {
    // Delete courts of this building first
    await supabase.from('lapangan').delete().eq('building_id', buildingId);
    await supabase.from('lapangan').delete().eq('gedung_id', buildingId);
    // Delete building
    const { error } = await supabase.from('gedung').delete().eq('id', buildingId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveLapanganToSupabase(
  court: Court,
  buildingId: string,
  buildingName: string
): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };

  const validCourtId = ensureUUID(court.id);
  const payload: Record<string, any> = {
    id: validCourtId,
    building_id: buildingId,
    gedung_id: buildingId,
    building_name: buildingName,
    nama_gedung: buildingName,
    name: court.name,
    nama: court.name,
    surface_type: court.surfaceType || 'Karpet Vinyl BWF',
    jenis_lantai: court.surfaceType || 'Karpet Vinyl BWF',
    is_active: court.isActive !== undefined ? court.isActive : true,
  };

  const { error } = await adaptiveUpsert('lapangan', payload, 'id');
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteLapanganFromSupabase(courtId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };
  try {
    const { error } = await supabase.from('lapangan').delete().eq('id', courtId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ========================================================
// 4. MODUL SEWA LAPANGAN (Tabel: 'court_rentals' / 'sewa_lapangan')
// ========================================================

export async function fetchSewaLapanganFromSupabase(): Promise<CourtRental[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    let res = await supabase.from('court_rentals').select('*').order('created_at', { ascending: false });
    if (res.error || !res.data) {
      res = await supabase.from('sewa_lapangan').select('*').order('created_at', { ascending: false });
    }

    if (res.error || !res.data || !Array.isArray(res.data)) {
      console.warn('Gagal membaca sewa lapangan dari Supabase:', res.error?.message);
      return [];
    }

    return res.data.map((row: any): CourtRental => {
      const pStatus = (row.payment_status || row.status_pembayaran || 'Belum Bayar') as any;
      const normalizedPaymentStatus: 'Lunas' | 'DP / Panjar' | 'Belum Bayar' =
        pStatus === 'PAID' || pStatus === 'Lunas'
          ? 'Lunas'
          : pStatus === 'DP' || pStatus === 'DP / Panjar'
          ? 'DP / Panjar'
          : 'Belum Bayar';

      return {
        id: String(row.id || row.rental_id || `RENT-${Date.now()}`),
        bookingCode: String(row.booking_code || row.kode_booking || `SW-${Date.now()}`),
        renterName: String(row.renter_name || row.nama_penyewa || 'Penyewa'),
        renterPhone: String(row.renter_phone || row.no_hp_penyewa || row.telepon || row.no_hp || '-'),
        rentalType: (row.rental_type === 'HARIAN' || row.jenis_sewa === 'Harian'
          ? 'Harian'
          : row.rental_type === 'MINGGUAN' || row.jenis_sewa === 'Mingguan'
          ? 'Mingguan'
          : row.rental_type === 'TAHUNAN' || row.jenis_sewa === 'Tahunan'
          ? 'Tahunan'
          : 'Bulanan') as any,
        buildingId: row.building_id ? String(row.building_id) : undefined,
        buildingName: String(row.building_name || row.nama_gedung || 'GOR PB Hevindo'),
        courtId: String(row.court_id || row.lapangan_id || 'CRT-01'),
        courtName: String(row.court_name || row.nama_lapangan || 'Lapangan 1'),
        startDate: String(row.start_date || row.rental_date || row.tanggal_mulai || new Date().toISOString().split('T')[0]),
        endDate: row.end_date || row.tanggal_selesai,
        timeSlotPeriod: (row.time_slot_period || 'Malam') as any,
        startTime: row.start_time ? String(row.start_time).slice(0, 5) : '19:00',
        endTime: row.end_time ? String(row.end_time).slice(0, 5) : '21:00',
        timeSlot: String(row.time_slot || (row.start_time && row.end_time ? `${row.start_time} - ${row.end_time}` : '19:00 - 21:00')),
        durationHours: Number(row.duration_hours || row.durasi_jam || 2),
        pricePerHour: Number(row.price_per_hour || row.harga_per_jam || 50000),
        pricePerUnit: Number(row.price_per_unit || row.total_harga || 100000),
        totalPrice: Number(row.total_price || row.total_biaya || row.total_harga || 100000),
        status: (row.status || 'Aktif') as any,
        paymentStatus: normalizedPaymentStatus,
        dpAmount: row.dp_amount ? Number(row.dp_amount) : undefined,
        remainingAmount: row.remaining_amount ? Number(row.remaining_amount) : 0,
        paymentMethod: (row.payment_method || row.metode_pembayaran || 'Transfer Bank') as any,
        notes: row.notes || row.catatan || '',
        isWeekend: Boolean(row.is_weekend),
        dayType: row.is_weekend ? 'Akhir Pekan (Sabtu - Minggu)' : 'Hari Kerja (Senin - Jumat)',
      };
    });
  } catch (err) {
    console.error('Error fetching sewa lapangan from Supabase:', err);
    return [];
  }
}

export async function saveSewaLapanganToSupabase(rental: CourtRental): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials belum diatur.' };
  }

  const validId = ensureUUID(rental.id);
  const payload: Record<string, any> = {
    id: validId,
    booking_code: rental.bookingCode,
    kode_booking: rental.bookingCode,
    renter_name: rental.renterName,
    nama_penyewa: rental.renterName,
    renter_phone: rental.renterPhone,
    no_hp_penyewa: rental.renterPhone,
    rental_type: rental.rentalType,
    jenis_sewa: rental.rentalType,
    building_id: rental.buildingId && rental.buildingId.includes('-') && rental.buildingId.length >= 32 ? rental.buildingId : null,
    building_name: rental.buildingName,
    court_name: rental.courtName,
    start_date: rental.startDate,
    rental_date: rental.startDate,
    end_date: rental.endDate || null,
    start_time: rental.startTime || '19:00',
    end_time: rental.endTime || '21:00',
    time_slot: rental.timeSlot,
    time_slot_period: rental.timeSlotPeriod || 'Malam',
    duration_hours: rental.durationHours || 2,
    price_per_hour: rental.pricePerHour || 50000,
    price_per_unit: rental.pricePerUnit || 100000,
    total_price: rental.totalPrice || 100000,
    dp_amount: rental.dpAmount || 0,
    remaining_amount: rental.remainingAmount || 0,
    payment_status: rental.paymentStatus,
    status_pembayaran: rental.paymentStatus,
    payment_method: rental.paymentMethod || 'Transfer Bank',
    metode_pembayaran: rental.paymentMethod || 'Transfer Bank',
    notes: rental.notes || '',
    catatan: rental.notes || '',
    is_weekend: Boolean(rental.isWeekend),
    status: rental.status || 'Aktif',
  };

  const { data, error } = await adaptiveUpsert('court_rentals', payload, 'id');
  if (error) {
    // Fallback coba ke tabel sewa_lapangan
    const fallback = await adaptiveUpsert('sewa_lapangan', payload, 'id');
    if (!fallback.error) return { success: true, data: fallback.data };
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function updateSewaPaymentStatusInSupabase(
  rentalId: string,
  paymentStatus: 'Lunas' | 'DP / Panjar' | 'Belum Bayar',
  dpAmount?: number,
  remainingAmount?: number
): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur' };

  const updates: Record<string, any> = {
    payment_status: paymentStatus,
    status_pembayaran: paymentStatus,
    dp_amount: dpAmount || 0,
    remaining_amount: remainingAmount || 0,
  };

  try {
    const res1 = await supabase.from('court_rentals').update(updates).eq('id', rentalId);
    if (!res1.error) return { success: true };
    const res2 = await supabase.from('sewa_lapangan').update(updates).eq('id', rentalId);
    if (!res2.error) return { success: true };
    return { success: false, error: res1.error?.message || res2.error?.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteSewaLapanganFromSupabase(rentalId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };
  try {
    await supabase.from('court_rentals').delete().eq('id', rentalId);
    await supabase.from('sewa_lapangan').delete().eq('id', rentalId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ========================================================
// 5. MODUL KANTIN & POS (Tabel: 'pos_sales' / 'kantin_transaksi')
// ========================================================

export async function fetchKantinTransaksiFromSupabase(): Promise<POSSale[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    let res = await supabase.from('pos_sales').select('*').order('created_at', { ascending: false });
    if (res.error || !res.data) {
      res = await supabase.from('kantin_transaksi').select('*').order('created_at', { ascending: false });
    }

    if (res.error || !res.data || !Array.isArray(res.data)) return [];

    return res.data.map((row: any): POSSale => ({
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
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };

  const payload: Record<string, any> = {
    id: ensureUUID(sale.id),
    invoice_number: sale.receiptNumber || sale.invoiceNo || `INV-${Date.now()}`,
    nomor_struk: sale.receiptNumber,
    customer_name: sale.customerName,
    nama_pembeli: sale.customerName,
    customer_type: sale.customerType,
    tipe_pembeli: sale.customerType,
    total_amount: sale.totalAmount,
    total_harga: sale.totalAmount,
    cashier_name: sale.cashierName,
    nama_kasir: sale.cashierName,
    payment_method: sale.paymentMethod || 'CASH',
    metode_pembayaran: sale.paymentMethod || 'CASH',
    sales_data: sale.items || [],
  };

  const { error } = await adaptiveUpsert('pos_sales', payload, 'id');
  if (error) {
    await adaptiveUpsert('kantin_transaksi', payload, 'id');
  }
  return { success: true };
}

// ========================================================
// 6. MODUL JADWAL LATIHAN (Tabel: 'jadwal_latihan')
// ========================================================

export async function fetchJadwalLatihanFromSupabase(): Promise<TrainingSchedule[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase.from('jadwal_latihan').select('*').order('created_at', { ascending: true });
    if (error || !data || !Array.isArray(data)) return [];

    return data.map((row: any): TrainingSchedule => ({
      id: String(row.id),
      trainingCategory: (row.training_category || row.kategori || 'Pembibitan') as any,
      venue: (row.venue || 'Hevindo 1') as any,
      day: (row.day || row.hari || 'Senin') as any,
      startTime: row.start_time ? String(row.start_time).slice(0, 5) : '15:00',
      endTime: row.end_time ? String(row.end_time).slice(0, 5) : '17:00',
      coachId: row.coach_id ? String(row.coach_id) : 'COA-001',
      coachName: String(row.coach_name || row.nama_pelatih || 'Coach Hevindo'),
      courtNumbers: Array.isArray(row.court_numbers) ? row.court_numbers : ['Lapangan 1', 'Lapangan 2'],
      monthlyFee: Number(row.monthly_fee || 250000),
    }));
  } catch (err) {
    console.error('Error fetching jadwal latihan from Supabase:', err);
    return [];
  }
}

export async function saveJadwalLatihanToSupabase(sched: TrainingSchedule): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };

  const validId = ensureUUID(sched.id);
  const payload: Record<string, any> = {
    id: validId,
    training_category: sched.trainingCategory || 'Pembibitan',
    venue: sched.venue || 'Hevindo 1',
    day: sched.day || 'Senin',
    start_time: sched.startTime || '15:00',
    end_time: sched.endTime || '17:00',
    coach_name: sched.coachName || 'Coach Hevindo',
    court_numbers: sched.courtNumbers || ['Lapangan 1'],
    monthly_fee: sched.monthlyFee || 250000,
  };

  const { error } = await adaptiveUpsert('jadwal_latihan', payload, 'id');
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteJadwalLatihanFromSupabase(id: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };
  try {
    const { error } = await supabase.from('jadwal_latihan').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ========================================================
// 7. MODUL IURAN BULANAN (Tabel: 'iuran_bulanan')
// ========================================================

export async function fetchIuranBulananFromSupabase(): Promise<MonthlyDues[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase.from('iuran_bulanan').select('*').order('created_at', { ascending: false });
    if (error || !data || !Array.isArray(data)) return [];

    return data.map((row: any): MonthlyDues => ({
      id: String(row.id),
      athleteId: String(row.athlete_id || row.atlet_id || ''),
      athleteName: String(row.athlete_name || row.nama_atlet || 'Atlet Hevindo'),
      trainingCategory: (row.training_category || row.category || 'Pembibitan') as any,
      periodMonth: String(row.period_month ? row.period_month.slice(0, 7) : (row.bulan || '2026-09')),
      amount: Number(row.amount || row.jumlah || 250000),
      status: (row.status === 'Lunas' || row.status === 'Sudah Bayar'
        ? 'Sudah Bayar'
        : row.status === 'Gratis / Reward Juara'
        ? 'Gratis / Reward Juara'
        : 'Belum Bayar') as any,
      paymentDate: row.created_at ? row.created_at.split('T')[0] : (row.tanggal_bayar || row.paid_date),
      paymentMethod: (row.payment_method || row.metode_pembayaran || 'Cash') as any,
      invoiceNumber: String(row.invoice_number || row.no_invoice || `INV-${String(row.id).slice(0, 8)}`),
      notes: row.notes || row.catatan || '',
    }));
  } catch (err) {
    console.error('Error fetching iuran bulanan from Supabase:', err);
    return [];
  }
}

export async function saveIuranBulananToSupabase(due: MonthlyDues): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };

  const validId = ensureUUID(due.id);
  const periodDate = due.periodMonth && due.periodMonth.length === 7 ? `${due.periodMonth}-01` : (due.periodMonth || '2026-09-01');

  const payload: Record<string, any> = {
    id: validId,
    athlete_id: due.athleteId && due.athleteId.includes('-') && due.athleteId.length >= 32 ? due.athleteId : null,
    athlete_name: due.athleteName,
    nama_atlet: due.athleteName,
    training_category: due.trainingCategory,
    kategori: due.trainingCategory,
    period_month: periodDate,
    bulan: due.periodMonth,
    amount: due.amount || 250000,
    jumlah: due.amount || 250000,
    status: due.status === 'Sudah Bayar' ? 'Lunas' : due.status,
    payment_status: due.status,
    payment_method: due.paymentMethod || 'Cash',
    metode_pembayaran: due.paymentMethod || 'Cash',
    paid_date: due.paymentDate || new Date().toISOString().split('T')[0],
    tanggal_bayar: due.paymentDate || new Date().toISOString().split('T')[0],
    invoice_number: due.invoiceNumber,
    no_invoice: due.invoiceNumber,
    notes: due.notes || '',
    catatan: due.notes || '',
  };

  const { error } = await adaptiveUpsert('iuran_bulanan', payload, 'id');
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function bulkSaveIuranBulananToSupabase(duesList: MonthlyDues[]): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured() || duesList.length === 0) return { success: true };
  try {
    for (const due of duesList) {
      await saveIuranBulananToSupabase(due);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error in bulkSaveIuranBulananToSupabase:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteIuranBulananFromSupabase(id: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };
  try {
    const { error } = await supabase.from('iuran_bulanan').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ========================================================
// 8. MODUL PRESENSI QR (Tabel: 'absensi')
// ========================================================

export async function fetchAbsensiFromSupabase(): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase.from('absensi').select('*').order('created_at', { ascending: false });
    if (error || !data || !Array.isArray(data)) return [];

    return data.map((row: any): AttendanceRecord => ({
      id: String(row.id),
      athleteId: String(row.person_id || row.athlete_id || ''),
      athleteName: String(row.person_name || row.athlete_name || 'Atlet Hevindo'),
      personId: String(row.person_id || row.athlete_id || ''),
      personName: String(row.person_name || row.athlete_name || 'Atlet Hevindo'),
      personType: (row.person_type === 'PELATIH' ? 'Pelatih' : 'Atlet') as any,
      date: String(row.date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0])),
      sessionTime: String(row.scan_time || (row.created_at ? row.created_at.split('T')[1].slice(0, 5) : '15:00')),
      trainingCategory: (row.training_category || row.category || 'Pembibitan') as any,
      status: (row.status || 'Hadir') as any,
      scannedViaQr: Boolean(row.scanned_via_qr),
    }));
  } catch (err) {
    console.error('Error fetching absensi from Supabase:', err);
    return [];
  }
}

export async function saveAbsensiToSupabase(rec: AttendanceRecord): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };

  const validId = ensureUUID(rec.id);
  const candidateId = rec.personId || rec.athleteId;
  const personId = candidateId && candidateId.includes('-') && candidateId.length >= 32 ? candidateId : ensureUUID();
  const isQr = Boolean(rec.scannedViaQr || (rec as any).scannedViaQR);
  const personName = rec.personName || rec.athleteName || 'Peserta Hevindo';
  const personType = (rec.personType || 'ATLET').toUpperCase();

  const payload: Record<string, any> = {
    id: validId,
    person_id: personId,
    person_name: personName,
    person_type: personType,
    date: rec.date || new Date().toISOString().split('T')[0],
    status: rec.status || 'Hadir',
    scanned_via_qr: isQr,
    method: isQr ? 'QR_SCAN' : 'MANUAL',
    training_category: rec.trainingCategory || 'Pembibitan',
  };

  const { error } = await adaptiveUpsert('absensi', payload, 'id');
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteAbsensiFromSupabase(id: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase belum diatur.' };
  try {
    const { error } = await supabase.from('absensi').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function bulkSaveAbsensiToSupabase(records: AttendanceRecord[]): Promise<{ success: boolean; count: number; error?: any }> {
  if (!isSupabaseConfigured() || !records || records.length === 0) return { success: true, count: 0 };
  let successCount = 0;
  let lastErr = null;
  for (const rec of records) {
    const res = await saveAbsensiToSupabase(rec);
    if (res.success) {
      successCount++;
    } else {
      lastErr = res.error;
    }
  }
  return { success: successCount > 0 || !lastErr, count: successCount, error: lastErr };
}
