/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Athlete,
  Club,
  Coach,
  Referee,
  TrainingSchedule,
  InventoryItem,
  MonthlyDues,
  POSSale,
  CourtRental,
  Tournament,
  TournamentMatch,
  AttendanceRecord,
  AuditLog,
  NotificationItem,
  UserRole,
  PortalType,
  Building,
} from './types';
import {
  initialAthletes,
  initialClubs,
  initialCoaches,
  initialReferees,
  initialSchedules,
  initialInventory,
  initialMonthlyDues,
  initialPOSSales,
  initialBuildings,
  initialRentals,
  initialTournaments,
  initialMatches,
  initialAttendance,
  initialAuditLogs,
  initialNotifications,
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { WelcomePortalSelector } from './components/WelcomePortalSelector';
import { KantinPortal } from './components/Kantin/KantinPortal';
import { CourtRentalsPortal } from './components/CourtRentals/CourtRentalsPortal';
import { TournamentPortal } from './components/Tournaments/TournamentPortal';
import { AthletesTab } from './components/MasterData/AthletesTab';
import { ClubsTab } from './components/MasterData/ClubsTab';
import { CoachesRefereesTab } from './components/MasterData/CoachesRefereesTab';
import { SchedulesTab } from './components/MasterData/SchedulesTab';
import { MonthlyDuesTab } from './components/Transactions/MonthlyDuesTab';
import { AttendanceTab } from './components/Attendance/AttendanceTab';
import { ReportsTab } from './components/Reports/ReportsTab';
import { AuditLogsTab } from './components/Security/AuditLogsTab';
import {
  fetchAthletesFromSupabase,
  saveAthleteToSupabase,
  deleteAthleteFromSupabase,
  fetchKantinTransaksiFromSupabase,
  saveKantinTransaksiToSupabase,
  fetchSewaLapanganFromSupabase,
  saveSewaLapanganToSupabase,
  deleteSewaLapanganFromSupabase,
  isSupabaseConfigured,
} from './services/supabase';

// Helper to determine active portal from URL hash or query params
const getPortalFromUrl = (): PortalType => {
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal');

  if (hash.includes('kantin') || hash.includes('pos') || portalParam === 'kantin') return 'kantin';
  if (hash.includes('lapangan') || hash.includes('sewa') || portalParam === 'lapangan') return 'lapangan';
  if (hash.includes('turnamen') || hash.includes('tournament') || hash.includes('livescore') || portalParam === 'turnamen') return 'turnamen';
  if (hash.includes('audit') || portalParam === 'audit') return 'audit';
  if (hash.includes('pb-hevindo') || hash.includes('hevindo') || portalParam === 'hevindo') return 'hevindo';
  return 'welcome'; // Default to welcome screen
};

export default function App() {
  // Multi-Portal Navigation & Access State
  const [activePortal, setActivePortal] = useState<PortalType>(getPortalFromUrl);
  const [activeTab, setActiveTab] = useState<string>('athletes');
  const [currentRole, setCurrentRole] = useState<UserRole>('Master Admin');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // PB Hevindo Master Data State
  const [athletes, setAthletes] = useState<Athlete[]>(initialAthletes);
  const [clubs, setClubs] = useState<Club[]>(initialClubs);
  const [coaches, setCoaches] = useState<Coach[]>(initialCoaches);
  const [referees, setReferees] = useState<Referee[]>(initialReferees);
  const [schedules, setSchedules] = useState<TrainingSchedule[]>(initialSchedules);
  const [monthlyDues, setMonthlyDues] = useState<MonthlyDues[]>(initialMonthlyDues);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendance);

  // Kantin & Toko POS State
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [posSales, setPosSales] = useState<POSSale[]>(initialPOSSales);

  // Sewa Lapangan Multi-Gedung State
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [courtRentals, setCourtRentals] = useState<CourtRental[]>(initialRentals);

  // Turnamen & Live Score State
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const [matches, setMatches] = useState<TournamentMatch[]>(initialMatches);

  // Audit Logs & Notifications
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  // Sync portal changes to URL hash
  const changePortal = (portal: PortalType) => {
    setActivePortal(portal);
    let targetHash = '';
    switch (portal) {
      case 'kantin':
        targetHash = '/kantin';
        break;
      case 'lapangan':
        targetHash = '/sewa-lapangan';
        break;
      case 'turnamen':
        targetHash = '/turnamen';
        break;
      case 'audit':
        targetHash = '/audit';
        break;
      case 'hevindo':
        targetHash = '/pb-hevindo';
        break;
      case 'welcome':
      default:
        targetHash = '/';
        break;
    }
    window.location.hash = targetHash;
  };

  // URL Hash & Query listener
  useEffect(() => {
    const handleUrlChange = () => {
      const portal = getPortalFromUrl();
      setActivePortal(portal);
      const params = new URLSearchParams(window.location.search);
      if (portal === 'turnamen' && (params.get('portal') === 'turnamen' || window.location.hash.includes('turnamen'))) {
        setCurrentRole((prev) => (prev === 'Master Admin' ? prev : 'Publik'));
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    return () => window.removeEventListener('hashchange', handleUrlChange);
  }, []);

  // Helper to log audit actions
  const logAction = (action: string, targetEntity: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      action,
      performedBy: `User (${currentRole})`,
      role: currentRole,
      timestamp: new Date().toLocaleString('id-ID'),
      details,
      targetEntity,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Helper to add notification
  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'reward') => {
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title,
      message,
      type,
      timestamp: 'Baru saja',
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Supabase Cloud State & Sync Engine
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    syncing: boolean;
    lastSynced?: string;
    message?: string;
  }>({
    configured: isSupabaseConfigured(),
    syncing: false,
  });

  const syncWithSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    setSupabaseStatus((prev) => ({ ...prev, syncing: true, message: 'Menyinkronkan dengan Supabase...' }));
    try {
      // 1. Fetch data atlet dari tabel 'atlet'
      const dbAthletes = await fetchAthletesFromSupabase();
      if (dbAthletes.length > 0) {
        setAthletes(dbAthletes);
      }

      // 2. Fetch data transaksi kantin dari tabel 'kantin_transaksi'
      const dbSales = await fetchKantinTransaksiFromSupabase();
      if (dbSales.length > 0) {
        setPosSales(dbSales);
      }

      // 3. Fetch data sewa lapangan dari tabel 'sewa_lapangan'
      const dbRentals = await fetchSewaLapanganFromSupabase();
      if (dbRentals.length > 0) {
        setCourtRentals(dbRentals);
      }

      const syncTime = new Date().toLocaleTimeString('id-ID');
      setSupabaseStatus({
        configured: true,
        syncing: false,
        lastSynced: syncTime,
        message: 'Tersinkronisasi dengan Supabase (atlet, kantin_transaksi, sewa_lapangan).',
      });
      addNotification(
        'Supabase Terhubung',
        `Data atlet, transaksi kantin, dan sewa lapangan berhasil disinkronkan (${syncTime}).`,
        'success'
      );
    } catch (err: any) {
      setSupabaseStatus((prev) => ({
        ...prev,
        syncing: false,
        message: `Gagal sinkronisasi: ${err?.message || err}`,
      }));
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      syncWithSupabase();
    }
  }, []);

  // Master Data Handlers: Athletes (Tersambung ke Supabase 'atlet')
  const handleAddAthlete = async (athlete: Athlete) => {
    setAthletes((prev) => [athlete, ...prev]);
    if (isSupabaseConfigured()) {
      const res = await saveAthleteToSupabase(athlete);
      if (res.success) {
        addNotification('Tersimpan di Supabase', `Data atlet ${athlete.name} berhasil disimpan ke database cloud.`, 'info');
      } else {
        addNotification('Peringatan Supabase', `Tersimpan secara lokal. Gagal ke cloud: ${res.error || 'Periksa tabel'}`, 'warning');
      }
    } else {
      addNotification('Atlet Baru Terdaftar', `${athlete.name} berhasil didaftarkan di kategori ${athlete.trainingCategory}.`, 'info');
    }
    logAction('TAMBAH_ATLET', 'Master Atlet', `Menambahkan atlet baru ${athlete.name} (${athlete.id})`);
  };

  const handleUpdateAthlete = async (athlete: Athlete) => {
    setAthletes((prev) => prev.map((a) => (a.id === athlete.id ? athlete : a)));
    if (isSupabaseConfigured()) {
      const res = await saveAthleteToSupabase(athlete);
      if (res.success) {
        addNotification('Supabase Terupdate', `Perubahan profil ${athlete.name} tersimpan ke cloud.`, 'info');
      } else {
        addNotification('Peringatan Supabase', `Perubahan tersimpan lokal. Gagal ke cloud: ${res.error || 'Periksa tabel'}`, 'warning');
      }
    }
    logAction('UPDATE_ATLET', 'Master Atlet', `Memperbarui profil atlet ${athlete.name} (${athlete.id})`);
  };

  const handleDeleteAthlete = async (id: string) => {
    const target = athletes.find((a) => a.id === id);
    setAthletes((prev) => prev.filter((a) => a.id !== id));
    if (isSupabaseConfigured()) {
      const res = await deleteAthleteFromSupabase(id);
      if (res.success) {
        addNotification('Dihapus dari Supabase', `Atlet ${target?.name || id} telah dihapus dari database cloud.`, 'info');
      } else {
        addNotification('Peringatan Supabase', `Dihapus secara lokal. Gagal di cloud: ${res.error || 'Periksa izin'}`, 'warning');
      }
    }
    logAction('HAPUS_ATLET', 'Master Atlet', `Menghapus atlet ${target?.name || id}`);
  };

  const handleBulkDeleteAthletes = async (ids: string[]) => {
    setAthletes((prev) => prev.filter((a) => !ids.includes(a.id)));
    if (isSupabaseConfigured()) {
      await Promise.all(ids.map((id) => deleteAthleteFromSupabase(id)));
      addNotification('Hapus Massal Supabase', `${ids.length} atlet dihapus dari database cloud.`, 'info');
    }
    logAction('HAPUS_MASSAL_ATLET', 'Master Atlet', `Menghapus massal ${ids.length} atlet`);
  };

  // Master Data: Clubs
  const handleAddClub = (club: Club) => {
    setClubs((prev) => [...prev, club]);
    logAction('TAMBAH_KLUB', 'Master Klub', `Menambahkan klub ${club.name}`);
  };

  const handleUpdateClub = (club: Club) => {
    setClubs((prev) => prev.map((c) => (c.id === club.id ? club : c)));
    logAction('UPDATE_KLUB', 'Master Klub', `Memperbarui data klub ${club.name}`);
  };

  const handleDeleteClub = (id: string) => {
    setClubs((prev) => prev.filter((c) => c.id !== id));
    logAction('HAPUS_KLUB', 'Master Klub', `Menghapus klub ID ${id}`);
  };

  // Master Data: Coaches & Referees
  const handleAddCoach = (coach: Coach) => {
    setCoaches((prev) => [...prev, coach]);
    logAction('TAMBAH_PELATIH', 'Master Pelatih', `Menambahkan pelatih ${coach.name}`);
  };
  const handleUpdateCoach = (coach: Coach) => {
    setCoaches((prev) => prev.map((c) => (c.id === coach.id ? coach : c)));
  };
  const handleDeleteCoach = (id: string) => {
    setCoaches((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddReferee = (ref: Referee) => {
    setReferees((prev) => [...prev, ref]);
    logAction('TAMBAH_WASIT', 'Master Wasit', `Menambahkan wasit ${ref.name}`);
  };
  const handleUpdateReferee = (ref: Referee) => {
    setReferees((prev) => prev.map((r) => (r.id === ref.id ? ref : r)));
  };
  const handleDeleteReferee = (id: string) => {
    setReferees((prev) => prev.filter((r) => r.id !== id));
  };

  // Schedules
  const handleAddSchedule = (sched: TrainingSchedule) => {
    setSchedules((prev) => [...prev, sched]);
    logAction('TAMBAH_JADWAL', 'Master Jadwal', `Menambahkan jadwal latihan ${sched.trainingCategory} - ${sched.day}`);
  };
  const handleUpdateSchedule = (sched: TrainingSchedule) => {
    setSchedules((prev) => prev.map((s) => (s.id === sched.id ? sched : s)));
  };
  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Inventory & Kantin POS Handlers
  const handleAddInventory = (item: InventoryItem) => {
    setInventory((prev) => [...prev, item]);
    logAction('TAMBAH_BARANG', 'Kantin & Toko', `Menambahkan barang ${item.name} (${item.category})`);
  };
  const handleUpdateInventory = (item: InventoryItem) => {
    setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  };
  const handleDeleteInventory = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCompleteSale = (sale: POSSale) => {
    setPosSales((prev) => [sale, ...prev]);

    if (isSupabaseConfigured()) {
      saveKantinTransaksiToSupabase(sale).catch(console.error);
    }

    // Deduct inventory quantities
    setInventory((prev) =>
      prev.map((item) => {
        const sold = sale.items.find((si) => si.itemId === item.id);
        if (sold) {
          return {
            ...item,
            stock: Math.max(0, item.stock - sold.quantity),
          };
        }
        return item;
      })
    );

    const buyerLabel = sale.customerType === 'Atlet' ? `Atlet: ${sale.customerName}` : 'Umum';
    logAction(
      'PENJUALAN_KANTIN',
      'Kantin & Toko',
      `Penjualan ${sale.id} senilai Rp ${sale.totalAmount.toLocaleString('id-ID')} (${buyerLabel})`
    );
    addNotification(
      'Transaksi Kantin Selesai',
      `Penjualan #${sale.id} untuk ${buyerLabel} senilai Rp ${sale.totalAmount.toLocaleString('id-ID')} berhasil disimpan.`,
      'success'
    );
  };

  // Monthly Dues & Automatic Reward Logic
  const handlePayDue = (
    dueId: string,
    paymentMethod: 'Cash' | 'Transfer Bank' | 'QRIS',
    notes?: string
  ) => {
    setMonthlyDues((prev) =>
      prev.map((d) => {
        if (d.id === dueId) {
          return {
            ...d,
            status: 'Sudah Bayar',
            paymentMethod,
            paymentDate: new Date().toISOString().split('T')[0],
            notes: notes || 'Pembayaran berhasil dikonfirmasi kasir',
          };
        }
        return d;
      })
    );

    const targetDue = monthlyDues.find((d) => d.id === dueId);
    if (targetDue) {
      setAthletes((prev) =>
        prev.map((a) => (a.name === targetDue.athleteName ? { ...a, duesStatus: 'Sudah Bayar' } : a))
      );
      logAction('BAYAR_IURAN', 'Transaksi Iuran', `Pembayaran iuran ${targetDue.athleteName} via ${paymentMethod}`);
      addNotification('Pembayaran Iuran Berhasil', `Kwitansi iuran ${targetDue.athleteName} telah diterbitkan.`, 'success');
    }
  };

  const handleApplyRewardFree = (dueId: string, tournamentTitle: string) => {
    setMonthlyDues((prev) =>
      prev.map((d) => {
        if (d.id === dueId) {
          return {
            ...d,
            status: 'Gratis / Reward Juara',
            notes: `Reward Bebas Iuran atas Juara Turnamen ${tournamentTitle}`,
            paymentDate: new Date().toISOString().split('T')[0],
          };
        }
        return d;
      })
    );

    const targetDue = monthlyDues.find((d) => d.id === dueId);
    if (targetDue) {
      setAthletes((prev) =>
        prev.map((a) => (a.name === targetDue.athleteName ? { ...a, duesStatus: 'Gratis / Reward Juara' } : a))
      );
      logAction('REWARD_BEBAS_IURAN', 'Transaksi Iuran', `Pemberian reward bebas iuran kepada ${targetDue.athleteName}`);
      addNotification('Reward Bebas Iuran Diberikan', `${targetDue.athleteName} mendapatkan bebas iuran karena berprestasi juara di ${tournamentTitle}!`, 'reward');
    }
  };

  // Sewa Lapangan Multi-Gedung Handlers
  const handleAddBuilding = (building: Building) => {
    setBuildings((prev) => [...prev, building]);
    logAction('TAMBAH_GEDUNG', 'Sewa Lapangan', `Menambahkan gedung ${building.name} dengan ${building.courts.length} lapangan`);
  };

  const handleUpdateBuilding = (building: Building) => {
    setBuildings((prev) => prev.map((b) => (b.id === building.id ? building : b)));
    logAction('UPDATE_GEDUNG', 'Sewa Lapangan', `Memperbarui konfigurasi tarif gedung ${building.name}`);
  };

  const handleAddRental = (rental: CourtRental) => {
    setCourtRentals((prev) => [rental, ...prev]);
    if (isSupabaseConfigured()) {
      saveSewaLapanganToSupabase(rental).catch(console.error);
    }
    logAction('BOOKING_SEWA_LAPANGAN', 'Sewa Lapangan', `Booking sewa ${rental.courtName} (${rental.buildingName}) oleh ${rental.renterName}`);
    addNotification('Booking Sewa Lapangan', `Penyewaan ${rental.courtName} atas nama ${rental.renterName} berhasil didaftarkan.`, 'success');
  };

  const handleUpdateRental = (rental: CourtRental) => {
    setCourtRentals((prev) => prev.map((r) => (r.id === rental.id ? rental : r)));
    if (isSupabaseConfigured()) {
      saveSewaLapanganToSupabase(rental).catch(console.error);
    }
  };

  const handleDeleteRental = (id: string) => {
    setCourtRentals((prev) => prev.filter((r) => r.id !== id));
    if (isSupabaseConfigured()) {
      deleteSewaLapanganFromSupabase(id).catch(console.error);
    }
  };

  // Tournament Matches & Event Handlers
  const handleAddTournament = (newTourn: Tournament) => {
    setTournaments((prev) => [newTourn, ...prev]);
    logAction('BUAT_TURNAMEN', 'Turnamen', `Membuat turnamen baru: ${newTourn.name} (${newTourn.level})`);
    addNotification('Turnamen Dibuat', `Turnamen "${newTourn.name}" berhasil dibuat dan siap untuk registrasi.`, 'success');
  };

  const handleUpdateTournament = (updated: Tournament) => {
    setTournaments((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    logAction('UPDATE_TURNAMEN', 'Turnamen', `Memperbarui data turnamen: ${updated.name}`);
  };

  const handleDeleteTournament = (id: string) => {
    setTournaments((prev) => prev.filter((t) => t.id !== id));
    setMatches((prev) => prev.filter((m) => m.tournamentId !== id));
    logAction('HAPUS_TURNAMEN', 'Turnamen', `Menghapus turnamen ID ${id}`);
    addNotification('Turnamen Dihapus', `Turnamen dan jadwal pertandingan terkait telah dihapus.`, 'info');
  };

  const handleUpdateMatch = (updatedMatch: TournamentMatch) => {
    setMatches((prev) => prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)));
    logAction('UPDATE_SKOR_PERTANDINGAN', 'Turnamen', `Memperbarui skor pertandingan ${updatedMatch.id} (${updatedMatch.playerAName} vs ${updatedMatch.playerBName})`);
  };

  const handleAddMatch = (newMatch: TournamentMatch) => {
    setMatches((prev) => [newMatch, ...prev]);
  };

  const handleDeleteMatch = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const handleBatchAddMatches = (newMatches: TournamentMatch[]) => {
    setMatches((prev) => [...newMatches, ...prev]);
    logAction('GENERATE_DRAW', 'Turnamen', `Menghasilkan ${newMatches.length} partai undian bagan turnamen`);
    addNotification('Undian Selesai', `${newMatches.length} partai pertandingan bagan turnamen berhasil dibuat otomatis.`, 'success');
  };

  // Attendance Handlers
  const handleAddAttendance = (record: AttendanceRecord) => {
    setAttendanceRecords((prev) => [record, ...prev]);
    const personName = record.athleteName || record.personName || 'Peserta';
    const personRole = record.personType || 'Atlet';
    logAction('PRESENSI_LATIHAN', 'Presensi', `Presensi ${personName} (${personRole}) status: ${record.status}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Universal Navbar */}
      <Navbar
        activePortal={activePortal}
        setActivePortal={changePortal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        notifications={notifications}
        onMarkAllAsRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
        auditLogs={auditLogs}
        onOpenAuditLogs={() => changePortal('audit')}
        supabaseStatus={supabaseStatus}
        onSyncSupabase={syncWithSupabase}
      />

      {/* Login & Role Selection Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={(role) => {
          setCurrentRole(role);
          logAction('GANTI_ROLE', 'Sistem Otentikasi', `Beralih ke hak akses: ${role}`);
        }}
        onSwitchPortal={(portal) => {
          changePortal(portal);
        }}
      />

      {/* Main Viewport Content based on activePortal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* PORTAL 0: WELCOME SCREEN / DIRECTORY (Pilihan Portal Mandiri & Alamat Web) */}
        {activePortal === 'welcome' && (
          <WelcomePortalSelector
            onSelectPortal={changePortal}
            currentRole={currentRole}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {/* PORTAL 1: PB HEVINDO (Pelatihan & Akademi Badminton) */}
        {activePortal === 'hevindo' && (
          <div>
            {activeTab === 'athletes' && (
              <AthletesTab
                athletes={athletes}
                onAddAthlete={handleAddAthlete}
                onUpdateAthlete={handleUpdateAthlete}
                onDeleteAthlete={handleDeleteAthlete}
                onBulkDelete={handleBulkDeleteAthletes}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'coaches' && (
              <CoachesRefereesTab
                coaches={coaches}
                referees={referees}
                onAddCoach={handleAddCoach}
                onUpdateCoach={handleUpdateCoach}
                onDeleteCoach={handleDeleteCoach}
                onAddReferee={handleAddReferee}
                onUpdateReferee={handleUpdateReferee}
                onDeleteReferee={handleDeleteReferee}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'schedules' && (
              <SchedulesTab
                schedules={schedules}
                onAddSchedule={handleAddSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'dues' && (
              <MonthlyDuesTab
                dues={monthlyDues}
                athletes={athletes}
                onPayDue={handlePayDue}
                onApplyRewardFree={handleApplyRewardFree}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceTab
                attendanceRecords={attendanceRecords}
                athletes={athletes}
                coaches={coaches}
                onAddAttendance={handleAddAttendance}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'clubs' && (
              <ClubsTab
                clubs={clubs}
                onAddClub={handleAddClub}
                onUpdateClub={handleUpdateClub}
                onDeleteClub={handleDeleteClub}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsTab
                dues={monthlyDues}
                posSales={posSales}
                rentals={courtRentals}
                athletes={athletes}
                currentRole={currentRole}
              />
            )}
          </div>
        )}

        {/* PORTAL 2: KANTIN & TOKO POS (Menu Terpisah Sesuai Instruksi) */}
        {activePortal === 'kantin' && (
          <KantinPortal
            inventory={inventory}
            posSales={posSales}
            athletes={athletes}
            onCompleteSale={handleCompleteSale}
            onAddInventory={handleAddInventory}
            onUpdateInventory={handleUpdateInventory}
            onDeleteInventory={handleDeleteInventory}
            currentRole={currentRole}
          />
        )}

        {/* PORTAL 3: SEWA LAPANGAN MULTI-GEDUNG (Menu Terpisah Sesuai Instruksi) */}
        {activePortal === 'lapangan' && (
          <CourtRentalsPortal
            buildings={buildings}
            rentals={courtRentals}
            onAddBuilding={handleAddBuilding}
            onUpdateBuilding={handleUpdateBuilding}
            onAddRental={handleAddRental}
            onUpdateRental={handleUpdateRental}
            onDeleteRental={handleDeleteRental}
            currentRole={currentRole}
          />
        )}

        {/* PORTAL 4: TURNAMEN & LIVE SCORE (Akses Publik Bebas / Wasit Login) */}
        {activePortal === 'turnamen' && (
          <TournamentPortal
            tournaments={tournaments}
            matches={matches}
            clubs={clubs}
            athletes={athletes}
            onUpdateMatch={handleUpdateMatch}
            onAddMatch={handleAddMatch}
            onDeleteMatch={handleDeleteMatch}
            onBatchAddMatches={handleBatchAddMatches}
            onAddTournament={handleAddTournament}
            onUpdateTournament={handleUpdateTournament}
            onDeleteTournament={handleDeleteTournament}
            currentRole={currentRole}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {/* PORTAL 5: AUDIT LOGS */}
        {activePortal === 'audit' && (
          <AuditLogsTab logs={auditLogs} currentRole={currentRole} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span>© 2026 PB HEVINDO Pekanbaru — Sistem Terpisah & Terintegrasi Multi-Modul</span>
            {activePortal !== 'welcome' && (
              <button
                onClick={() => changePortal('welcome')}
                className="text-emerald-400 hover:underline font-medium text-xs ml-2"
              >
                (← Buka Pilihan Portal / Welcome Screen)
              </button>
            )}
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            Portal Aktif: <strong className="text-emerald-400 uppercase">{activePortal}</strong> • Hak Akses: <strong className="text-white">{currentRole}</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
