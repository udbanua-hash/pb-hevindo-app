// Core types for Klub Bulutangkis HEVINDO Database & Ecosystem System

export type UserRole = 
  | 'Master Admin'
  | 'Admin PB Hevindo'
  | 'Bagian Kasir'
  | 'Bagian Lapangan'
  | 'Wasit / Admin Turnamen'
  | 'Publik'
  // Legacy aliases
  | 'Admin'
  | 'Operator'
  | 'Pelatih'
  | 'Kasir';

export type PortalType = 
  | 'welcome'    // Welcome Screen / Portal Directory
  | 'hevindo'    // PB HEVINDO (Akademi, Atlet, Pelatih, Jadwal, Iuran, Presensi)
  | 'kantin'     // Kantin & Toko POS
  | 'lapangan'   // Sewa Lapangan & Multi-Gedung
  | 'turnamen'   // Portal Turnamen (Akses Publik & Wasit)
  | 'audit';     // Pusat Audit & Laporan Global

export type TimeSlotPeriod = 'Pagi' | 'Siang' | 'Malam';

export interface Court {
  id: string;
  name: string; // e.g. "Lapangan 1"
  buildingId: string;
  buildingName: string;
  surfaceType: 'Karpet Vinyl BWF' | 'Parket Kayu Standar' | 'Semen Halus';
  isActive: boolean;
}

export interface Building {
  id: string;
  name: string; // e.g. "Gedung Utama (GOR Hevindo Pusat)"
  address: string;
  description: string;
  courts: Court[];
  // Variasi harga sewa per jam Hari Biasa (Senin - Jumat):
  rateMorningWeekday?: number;   // Pagi: 06:00 - 12:00 (Rp / jam)
  rateAfternoonWeekday?: number; // Siang: 12:00 - 18:00 (Rp / jam)
  rateEveningWeekday?: number;   // Malam: 18:00 - 24:00 (Rp / jam)
  // Variasi harga sewa per jam Akhir Pekan (Sabtu - Minggu / Libur):
  rateMorningWeekend?: number;   // Pagi: 06:00 - 12:00 (Rp / jam)
  rateAfternoonWeekend?: number; // Siang: 12:00 - 18:00 (Rp / jam)
  rateEveningWeekend?: number;   // Malam: 18:00 - 24:00 (Rp / jam)
  // Fallback defaults
  rateMorning: number;   // Pagi: 06:00 - 12:00 (Rp / jam)
  rateAfternoon: number; // Siang: 12:00 - 18:00 (Rp / jam)
  rateEvening: number;   // Malam: 18:00 - 24:00 (Rp / jam)
}

// PBSI Age Categories
// 9–10: Usia Dini, 11–12: Anak-anak, 13–14: Pemula, 15–16: Remaja, 17–18: Taruna, 19+: Dewasa
export type PBSIAgeCategory = 
  | 'Usia Dini (U-11)'
  | 'Anak-anak (U-13)'
  | 'Pemula (U-15)'
  | 'Remaja (U-17)'
  | 'Taruna (U-19)'
  | 'Dewasa';

// Hevindo Training Categories & Business Logic
export type TrainingCategory = 'Pembibitan' | 'Regular' | 'Pusdiklat';

export type Gender = 'Putra' | 'Putri';

export interface AthleteAchievement {
  id: string;
  tournamentName: string;
  year: number;
  category: string;
  position: 'Juara 1' | 'Juara 2' | 'Juara 3 / Semifinalis';
  dateAchieved: string;
}

export interface ClubTransferHistory {
  id: string;
  date: string;
  fromClub: string;
  toClub: string;
  type: 'Masuk' | 'Keluar' | 'Pindah Kategori';
  notes?: string;
}

export interface Athlete {
  id: string;
  idPb: string; // PBSI ID / SI PBSI
  nik: string;
  name: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  ageCategory: PBSIAgeCategory;
  trainingCategory: TrainingCategory;
  clubId: string;
  clubName: string;
  parentName: string;
  phoneNumber: string;
  address: string;
  isActive: boolean;
  duesStatus: 'Lunas' | 'Belum Bayar' | 'Gratis / Reward Juara';
  rewardActiveMonth?: string; // e.g. "2026-09"
  achievements: AthleteAchievement[];
  transferHistory: ClubTransferHistory[];
  joinDate: string;
  qrCodeToken: string;
}

export interface Club {
  id: string;
  name: string;
  city: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  totalAthletes: number;
}

export interface Coach {
  id: string;
  name: string;
  category: 'Tunggal' | 'Ganda' | 'Fisik' | 'Pembibitan' | 'Pusdiklat Head Coach';
  phone: string;
  email: string;
  honorPerSession: number; // in IDR
  monthlyHonor: number; // in IDR
  scheduleNotes: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface Referee {
  id: string;
  name: string;
  certification: 'Sertifikasi Kota/Kabupaten' | 'Sertifikasi PBSI Provinsi' | 'Sertifikasi PBSI Nasional' | 'BWF Accredited';
  licenseNumber: string;
  phone: string;
  assignedMatchesCount: number;
  status: 'Tersedia' | 'Bertugas' | 'Nonaktif';
}

export interface TrainingSchedule {
  id: string;
  trainingCategory: TrainingCategory;
  venue: 'Hevindo 1' | 'Hevindo 2' | 'Arena Badminton Hall';
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  coachId: string;
  coachName: string;
  courtNumbers: string; // e.g., "Court 1, 2"
  monthlyFee: number; // in IDR
}

export type InventoryCategory = 'Kantin' | 'Toko' | 'Koperasi' | 'Sewa Lapangan';

export interface InventoryItem {
  id: string;
  code?: string;
  name: string;
  category: InventoryCategory | string;
  buyPrice?: number;
  sellPrice?: number;
  price?: number;
  stock: number;
  unit: string; // pcs, slot, kaleng, botol, roll, pasang
  minStockAlert: number;
  status?: 'Tersedia' | 'Stok Menipis' | 'Habis' | string;
}

export interface MonthlyDues {
  id: string;
  athleteId: string;
  athleteName: string;
  trainingCategory: TrainingCategory;
  periodMonth: string; // YYYY-MM
  amount: number;
  status: 'Belum Bayar' | 'Sudah Bayar' | 'Gratis / Reward Juara';
  paymentDate?: string;
  paymentMethod?: 'Cash' | 'Transfer Bank' | 'QRIS' | 'Reward Otomatis';
  invoiceNumber: string;
  notes?: string;
}

export interface POSSaleItem {
  itemId: string;
  itemName: string;
  category?: InventoryCategory | string;
  unitPrice?: number;
  price?: number;
  quantity: number;
  subtotal: number;
}

export interface POSSale {
  id: string;
  invoiceNo?: string;
  receiptNumber?: string;
  date: string;
  time: string;
  customerName: string;
  customerType: 'Atlet' | 'Wali Atlet' | 'Pengunjung Umum' | 'Member' | string;
  items: POSSaleItem[];
  totalAmount: number;
  cashierName: string;
  paymentMethod: 'Tunai' | 'QRIS' | 'Debit' | string;
}

export interface CourtRental {
  id: string;
  bookingCode: string;
  renterName: string;
  renterPhone: string;
  rentalType: 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan';
  buildingId?: string;
  buildingName?: string;
  courtId: string;
  courtName: string; // e.g. "Lapangan 1 - GOR Utama"
  startDate: string;
  endDate?: string;
  timeSlotPeriod?: TimeSlotPeriod; // 'Pagi' | 'Siang' | 'Malam'
  startTime?: string; // e.g. "19:00"
  endTime?: string;   // e.g. "21:00"
  timeSlot: string;   // e.g. "19:00 - 21:00"
  durationHours: number;
  pricePerUnit: number;
  pricePerHour?: number;
  totalPrice: number;
  status: 'Aktif' | 'Selesai' | 'Dibatalkan';
  paymentStatus: 'Lunas' | 'DP / Panjar' | 'Belum Bayar';
  dpAmount?: number;
  remainingAmount?: number;
  paymentMethod?: 'Tunai' | 'Transfer Bank' | 'QRIS';
  notes?: string;
  isWeekend?: boolean;
  dayType?: 'Hari Kerja (Senin - Jumat)' | 'Akhir Pekan (Sabtu - Minggu)';
}

export interface AthleteHeadToHead {
  matchId: string;
  tournamentName: string;
  date: string;
  round: string;
  category: PBSIAgeCategory | string;
  opponentId: string;
  opponentName: string;
  opponentClub: string;
  result: 'Menang' | 'Kalah';
  scoreSummary: string; // e.g. "21-17, 19-21, 21-14"
  setScores: { set1: string; set2: string; set3?: string };
}

export type TournamentLevel = 'Tingkat Klub' | 'Kota / Kabupaten' | 'Daerah / Provinsi' | 'Nasional';

export type TournamentEventType =
  | 'Tunggal Putra (MS)'
  | 'Tunggal Putri (WS)'
  | 'Ganda Putra (MD)'
  | 'Ganda Putri (WD)'
  | 'Ganda Campuran (XD)';

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  eventType: TournamentEventType;
  ageCategory: PBSIAgeCategory;
  player1Id?: string;
  player1Name: string;
  player1Club: string;
  player2Id?: string;
  player2Name?: string;
  player2Club?: string;
  seed?: number; // 1, 2, 3, 4, etc.
  registrationDate: string;
  paymentStatus: 'Lunas' | 'Belum Bayar';
  contactPhone?: string;
  notes?: string;
}

export interface Tournament {
  id: string;
  name: string;
  title?: string;
  level: TournamentLevel;
  startDate: string;
  endDate: string;
  location: string;
  description?: string;
  categories: PBSIAgeCategory[];
  eventTypes?: TournamentEventType[];
  category?: string;
  status: 'Pendaftaran' | 'Drawing' | 'Berlangsung' | 'Selesai';
  totalParticipants: number;
  participants?: Athlete[];
  participantsList?: TournamentParticipant[];
  rallyPoints: number; // Default 15 or 21
  gamesPerMatch: number; // Default 3
  liveStreamYouTubeUrl?: string;
  liveStreamTikTokUrl?: string;
}

export interface MatchScore {
  game1PlayerA: number;
  game1PlayerB: number;
  game2PlayerA: number;
  game2PlayerB: number;
  game3PlayerA?: number;
  game3PlayerB?: number;
}

export interface MatchCardEvent {
  id: string;
  matchId: string;
  playerNumber: 1 | 2;
  playerName: string;
  cardType: 'Kuning' | 'Merah' | 'Hitam';
  reason: string;
  timestamp: string;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  tournamentName: string;
  ageCategory?: PBSIAgeCategory;
  eventType?: TournamentEventType;
  round: 'Babak 16 Besar' | 'Perempat Final' | 'Semifinal' | 'Final' | 'Babak 1' | string;
  matchNumber: number | string;
  court: string;
  scheduledTime?: string;
  playerAId?: string;
  playerAName?: string;
  playerAClub?: string;
  playerASeed?: number;
  playerBId?: string;
  playerBName?: string;
  playerBClub?: string;
  playerBSeed?: number;

  player1Id?: string;
  player1Name?: string;
  player1Club?: string;
  player1Seed?: number;
  player2Id?: string;
  player2Name?: string;
  player2Club?: string;
  player2Seed?: number;

  player1Score1?: number;
  player1Score2?: number;
  player1Score3?: number;
  player2Score1?: number;
  player2Score2?: number;
  player2Score3?: number;
  currentSet?: number;
  courtSwitchedSet3?: boolean;
  cardEvents?: MatchCardEvent[];
  winnerName?: string;

  scores?: MatchScore;
  winnerId?: string;
  refereeName: string;
  refereeCertification?: string;
  status: 'Dijadwalkan' | 'Sedang Main' | 'Selesai' | 'Berlangsung' | string;
  liveCourtStatus?: 'Live' | 'Warm-up' | 'Break';
  liveStreamYouTubeUrl?: string;
  liveStreamTikTokUrl?: string;
}

export type Match = TournamentMatch;
export type AgeCategory = PBSIAgeCategory;
export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';

export interface AttendanceRecord {
  id: string;
  date: string;
  trainingScheduleId?: string;
  scheduleTitle?: string;
  athleteId?: string;
  athleteName?: string;
  personId?: string;
  personName?: string;
  personType?: 'Atlet' | 'Pelatih';
  category?: TrainingCategory | string;
  trainingCategory?: TrainingCategory | string;
  status: AttendanceStatus;
  method?: 'Manual' | 'QR Code Scan';
  scanTime?: string;
  sessionTime?: string;
  scannedViaQr?: boolean;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userRole?: UserRole;
  userName?: string;
  performedBy?: string;
  role?: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REWARD_TRIGGER' | 'PAYMENT' | string;
  entity?: 'Atlet' | 'Iuran' | 'Kantin' | 'Sewa Lapangan' | 'Turnamen' | 'Absensi' | 'Jadwal' | string;
  targetEntity?: string;
  details: string;
}

export interface SystemNotification {
  id: string;
  type: 'iuran' | 'latihan' | 'pertandingan' | 'reward' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority?: 'normal' | 'high';
}

export type NotificationItem = SystemNotification;
