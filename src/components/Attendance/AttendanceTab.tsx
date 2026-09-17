import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Athlete, Coach, UserRole, AttendanceStatus, TrainingCategory } from '../../types';
import { formatIndonesianDate, exportToCSV } from '../../utils/helpers';
import {
  QrCode,
  CheckCircle2,
  UserCheck,
  Calendar,
  Filter,
  Download,
  Plus,
  Camera,
  CheckSquare,
  Users,
  Clock,
  Search,
  AlertCircle,
  Save,
  Trash2,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface AttendanceTabProps {
  attendanceRecords: AttendanceRecord[];
  athletes: Athlete[];
  coaches: Coach[];
  onAddAttendance: (record: AttendanceRecord) => void;
  onBulkAddAttendance?: (records: AttendanceRecord[]) => void;
  currentRole: UserRole;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  attendanceRecords = [],
  athletes = [],
  coaches = [],
  onAddAttendance,
  onBulkAddAttendance,
  currentRole,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeType, setActiveType] = useState<'Atlet' | 'Pelatih'>('Atlet');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mode View: 'roster_list' | 'bulk_mode'
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Bulk State (Map of personId -> { status, notes })
  const [bulkState, setBulkState] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});
  const [bulkSessionTime, setBulkSessionTime] = useState('14:00 - 17:00 WIB');
  const [bulkSaveMsg, setBulkSaveMsg] = useState('');
  const [quickSaveToast, setQuickSaveToast] = useState<{
    personName: string;
    status: AttendanceStatus;
    time: string;
  } | null>(null);

  // Modal Manual Input Presensi
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState<{
    personType: 'Atlet' | 'Pelatih';
    personId: string;
    personName: string;
    trainingCategory: TrainingCategory;
    date: string;
    sessionTime: string;
    status: AttendanceStatus;
    notes: string;
  }>({
    personType: 'Atlet',
    personId: '',
    personName: '',
    trainingCategory: 'Pembibitan',
    date: new Date().toISOString().split('T')[0],
    sessionTime: '14:00 - 17:00 WIB',
    status: 'Hadir',
    notes: '',
  });

  // Modal QR Code Scanner
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scannedInput, setScannedInput] = useState('');
  const [scanSuccessMsg, setScanSuccessMsg] = useState('');

  const safeAttendance = attendanceRecords || [];
  const safeAthletes = athletes || [];
  const safeCoaches = coaches || [];
  const canEdit = currentRole !== 'Publik';

  // Selection for action bar bulk attendance
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  // Filtered attendance for selected date & type
  const dayRecords = useMemo(() => {
    return safeAttendance.filter((r) => r.date === selectedDate && r.personType === activeType);
  }, [safeAttendance, selectedDate, activeType]);

  // Target list of persons
  const targetList = useMemo(() => {
    if (activeType === 'Atlet') {
      return safeAthletes.filter((a) => {
        if (filterCategory !== 'all' && a.trainingCategory !== filterCategory) return false;
        if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
    } else {
      return safeCoaches.filter((c) => {
        if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
    }
  }, [activeType, safeAthletes, safeCoaches, filterCategory, searchQuery]);

  // Bulk mode: initialize bulk state when entering bulk mode or changing targetList
  const initializeBulkState = (defaultStatus: AttendanceStatus = 'Hadir') => {
    const nextState: Record<string, { status: AttendanceStatus; notes: string }> = {};
    targetList.forEach((person) => {
      const existing = dayRecords.find((r) => r.personId === person.id);
      nextState[person.id] = {
        status: existing?.status || defaultStatus,
        notes: '',
      };
    });
    setBulkState(nextState);
  };

  const handleToggleBulkMode = () => {
    if (!isBulkMode) {
      initializeBulkState('Hadir');
    }
    setIsBulkMode(!isBulkMode);
  };

  // Toggle selection for action bar
  const toggleSelectAllPersons = () => {
    if (selectedPersonIds.length === targetList.length) {
      setSelectedPersonIds([]);
    } else {
      setSelectedPersonIds(targetList.map((p) => p.id));
    }
  };

  const toggleSelectPerson = (id: string) => {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk mark status for selected persons from Action Bar
  const handleMarkSelectedStatus = (status: AttendanceStatus) => {
    if (selectedPersonIds.length === 0) return;

    const selectedPersons = targetList.filter((p) => selectedPersonIds.includes(p.id));
    const recordsToSave: AttendanceRecord[] = selectedPersons.map((person) => {
      const cat = 'trainingCategory' in person ? person.trainingCategory : person.category;
      return {
        id: `ATT-ACT-${Date.now()}-${person.id}`,
        personId: person.id,
        personName: person.name,
        personType: activeType,
        trainingCategory: (cat as any) || 'Regular',
        date: selectedDate,
        status,
        sessionTime: bulkSessionTime,
        scannedViaQr: false,
      };
    });

    if (onBulkAddAttendance) {
      onBulkAddAttendance(recordsToSave);
    } else {
      recordsToSave.forEach((rec) => onAddAttendance(rec));
    }

    setBulkSaveMsg(`✓ Berhasil mencatat status "${status}" untuk ${recordsToSave.length} ${activeType}!`);
    setQuickSaveToast({
      personName: `${recordsToSave.length} ${activeType}`,
      status,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });
    setSelectedPersonIds([]);
    setTimeout(() => {
      setBulkSaveMsg('');
      setQuickSaveToast(null);
    }, 3000);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    targetList.forEach((person) => {
      updated[person.id] = {
        status,
        notes: bulkState[person.id]?.notes || '',
      };
    });
    setBulkState(updated);
  };

  // Submit Bulk Attendance
  const handleSaveBulk = () => {
    const recordsToSave: AttendanceRecord[] = targetList.map((person) => {
      const cat = 'trainingCategory' in person ? person.trainingCategory : person.category;
      const stateItem = bulkState[person.id] || { status: 'Hadir', notes: '' };
      return {
        id: `ATT-BULK-${Date.now()}-${person.id}`,
        personId: person.id,
        personName: person.name,
        personType: activeType,
        trainingCategory: (cat as any) || 'Regular',
        date: selectedDate,
        status: stateItem.status,
        sessionTime: bulkSessionTime,
        scannedViaQr: false,
      };
    });

    if (onBulkAddAttendance) {
      onBulkAddAttendance(recordsToSave);
    } else {
      recordsToSave.forEach((rec) => onAddAttendance(rec));
    }

    setBulkSaveMsg(`✓ Berhasil menyimpan presensi massal untuk ${recordsToSave.length} ${activeType}!`);
    setQuickSaveToast({
      personName: `${recordsToSave.length} ${activeType} (Presensi Massal)`,
      status: 'Hadir',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });
    setTimeout(() => {
      setBulkSaveMsg('');
      setQuickSaveToast(null);
      setIsBulkMode(false);
    }, 2500);
  };

  // Single Quick Status Change
  const handleQuickStatusChange = (
    personId: string,
    personName: string,
    category: any,
    status: AttendanceStatus
  ) => {
    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}-${personId}`,
      personId,
      personName,
      personType: activeType,
      trainingCategory: category || 'Regular',
      date: selectedDate,
      status,
      sessionTime: bulkSessionTime,
      scannedViaQr: false,
    };
    onAddAttendance(newRecord);
    setQuickSaveToast({
      personName,
      status,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });
    setTimeout(() => {
      setQuickSaveToast(null);
    }, 2500);
  };

  // Submit Manual Form
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.personId) {
      alert('Pilih orang terlebih dahulu!');
      return;
    }

    const rec: AttendanceRecord = {
      id: `ATT-MAN-${Date.now()}`,
      personId: manualForm.personId,
      personName: manualForm.personName,
      personType: manualForm.personType,
      trainingCategory: manualForm.trainingCategory,
      date: manualForm.date,
      status: manualForm.status,
      sessionTime: manualForm.sessionTime,
      scannedViaQr: false,
    };

    onAddAttendance(rec);
    setIsManualModalOpen(false);
  };

  // Handle QR Scan
  const handleProcessQrScan = (idToScan: string) => {
    const target = safeAthletes.find((a) => a.id.toLowerCase() === idToScan.toLowerCase() || a.name.toLowerCase().includes(idToScan.toLowerCase()));
    if (!target) {
      alert(`Atlet dengan ID/Kode "${idToScan}" tidak ditemukan.`);
      return;
    }

    const rec: AttendanceRecord = {
      id: `ATT-QR-${Date.now()}`,
      personId: target.id,
      personName: target.name,
      personType: 'Atlet',
      trainingCategory: target.trainingCategory,
      date: selectedDate,
      status: 'Hadir',
      sessionTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      scannedViaQr: true,
    };

    onAddAttendance(rec);
    setScanSuccessMsg(`✓ Scan Berhasil! ${target.name} (${target.trainingCategory}) tercatat HADIR.`);
    setScannedInput('');
    setTimeout(() => {
      setScanSuccessMsg('');
    }, 2500);
  };

  // Export Attendance to CSV
  const handleExportCSV = () => {
    exportToCSV(
      targetList.map((person) => {
        const rec = dayRecords.find((r) => r.personId === person.id);
        const cat = 'trainingCategory' in person ? person.trainingCategory : person.category;
        return {
          'Tanggal': selectedDate,
          'ID': person.id,
          'Nama': person.name,
          'Tipe': activeType,
          'Kategori': cat,
          'Status Kehadiran': rec?.status || 'Belum Presensi',
          'Waktu': rec?.sessionTime || '-',
          'Metode': rec?.scannedViaQr ? 'QR Code Scanner' : rec ? 'Manual' : '-',
        };
      }),
      `Rekap_Presensi_${activeType}_${selectedDate}`
    );
  };

  // Statistics for the day
  const totalTargetCount = targetList.length;
  const hadirCount = dayRecords.filter((r) => r.status === 'Hadir').length;
  const izinCount = dayRecords.filter((r) => r.status === 'Izin').length;
  const sakitCount = dayRecords.filter((r) => r.status === 'Sakit').length;
  const alpaCount = dayRecords.filter((r) => r.status === 'Alpa').length;
  const attendanceRate = totalTargetCount > 0 ? Math.round((hadirCount / totalTargetCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header & Controls Bar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setActiveType('Atlet');
                setIsBulkMode(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                activeType === 'Atlet' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Presensi Atlet ({safeAthletes.length})
            </button>
            <button
              onClick={() => {
                setActiveType('Pelatih');
                setIsBulkMode(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                activeType === 'Pelatih' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Presensi Pelatih ({safeCoaches.length})
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleBulkMode}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-md ${
                isBulkMode
                  ? 'bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-blue-400" />
              <span>{isBulkMode ? 'Tutup Presensi Massal' : '⚡ Presensi Massal (Bulk Checklist)'}</span>
            </button>

            <button
              onClick={() => {
                const first = activeType === 'Atlet' ? safeAthletes[0] : safeCoaches[0];
                setManualForm({
                  personType: activeType,
                  personId: first?.id || '',
                  personName: first?.name || '',
                  trainingCategory: (first && 'trainingCategory' in first ? first.trainingCategory : 'Regular') as any,
                  date: selectedDate,
                  sessionTime: '14:00 - 17:00 WIB',
                  status: 'Hadir',
                  notes: '',
                });
                setIsManualModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Input Manual</span>
            </button>

            <button
              onClick={() => {
                setScannedInput(safeAthletes[0]?.id || '');
                setIsQrScannerOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950/40"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Ekspor Rekap Kehadiran"
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards: Kehadiran Hari Terpilih */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-medium">Tingkat Kehadiran</span>
          <span className="text-xl font-bold text-white mt-0.5 block">{attendanceRate}%</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {hadirCount} dari {totalTargetCount} hadir
          </span>
        </div>

        <div className="bg-slate-850 p-3 rounded-xl border border-emerald-500/30">
          <span className="text-[10px] text-emerald-400 block font-medium">Hadir (Checked)</span>
          <span className="text-xl font-bold text-emerald-300 mt-0.5 block">{hadirCount}</span>
          <span className="text-[10px] text-emerald-400/70 mt-0.5 block">Tercatat Hadir</span>
        </div>

        <div className="bg-slate-850 p-3 rounded-xl border border-blue-500/30">
          <span className="text-[10px] text-blue-400 block font-medium">Izin Terkonfirmasi</span>
          <span className="text-xl font-bold text-blue-300 mt-0.5 block">{izinCount}</span>
          <span className="text-[10px] text-blue-400/70 mt-0.5 block">Surat/Pemberitahuan</span>
        </div>

        <div className="bg-slate-850 p-3 rounded-xl border border-amber-500/30">
          <span className="text-[10px] text-amber-400 block font-medium">Sakit</span>
          <span className="text-xl font-bold text-amber-300 mt-0.5 block">{sakitCount}</span>
          <span className="text-[10px] text-amber-400/70 mt-0.5 block">Keterangan Medis</span>
        </div>

        <div className="bg-slate-850 p-3 rounded-xl border border-red-500/30 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-red-400 block font-medium">Alpa / Belum Absen</span>
          <span className="text-xl font-bold text-red-400 mt-0.5 block">{alpaCount + (totalTargetCount - dayRecords.length)}</span>
          <span className="text-[10px] text-red-400/70 mt-0.5 block">Tanpa Keterangan</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BULK ATTENDANCE BANNER & QUICK ACTIONS (JIKA AKTIF) */}
      {/* ========================================================================= */}
      {isBulkMode && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-850 p-4 rounded-xl border border-blue-500/30 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                <span>Mode Presensi Massal (Bulk Checklist) — {activeType}</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Tandai kehadiran seluruh {activeType.toLowerCase()} sekaligus dalam satu tampilan tanpa perlu input 1 per 1.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Sesi Jam:</span>
              <input
                type="text"
                value={bulkSessionTime}
                onChange={(e) => setBulkSessionTime(e.target.value)}
                placeholder="14:00 - 17:00 WIB"
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs w-36"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleMarkAll('Hadir')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
              >
                ⚡ Tandai Semua Hadir ({targetList.length})
              </button>
              <button
                onClick={() => handleMarkAll('Izin')}
                className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Tandai Semua Izin
              </button>
              <button
                onClick={() => handleMarkAll('Alpa')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Reset / Kosongkan
              </button>
            </div>

            <button
              onClick={handleSaveBulk}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950/40"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Presensi Massal ({targetList.length} Record)</span>
            </button>
          </div>

          {bulkSaveMsg && (
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold text-center animate-pulse">
              {bulkSaveMsg}
            </div>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {activeType === 'Atlet' && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-900 text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value="all">Semua Program Pembinaan</option>
              <option value="Pembibitan">Program Pembibitan</option>
              <option value="Regular">Program Regular</option>
              <option value="Pusdiklat">Program Pusdiklat</option>
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari nama ${activeType.toLowerCase()}...`}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && targetList.length > 0 && (
            <button
              onClick={toggleSelectAllPersons}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition"
            >
              {selectedPersonIds.length === targetList.length ? 'Batal Pilih Semua' : `Pilih Semua (${targetList.length})`}
            </button>
          )}
          <span className="text-xs text-slate-400">
            Menampilkan <strong className="text-white">{targetList.length}</strong> {activeType}
          </span>
        </div>
      </div>

      {/* Action Bar Presensi (Saat atlet dipilih melalui checkbox) */}
      {selectedPersonIds.length > 0 && canEdit && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 p-3.5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-white text-xs block">
                Action Bar Presensi: {selectedPersonIds.length} {activeType} Dipilih
              </span>
              <span className="text-[11px] text-emerald-300/80">
                Pilih status kehadiran untuk mencatat sekaligus pada sesi {selectedDate} ({bulkSessionTime})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleMarkSelectedStatus('Hadir')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-950/50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Tandai Hadir ({selectedPersonIds.length})</span>
            </button>

            <button
              onClick={() => handleMarkSelectedStatus('Izin')}
              className="px-3 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition"
            >
              Tandai Izin
            </button>

            <button
              onClick={() => handleMarkSelectedStatus('Sakit')}
              className="px-3 py-2 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
            >
              Tandai Sakit
            </button>

            <button
              onClick={() => handleMarkSelectedStatus('Alpa')}
              className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
            >
              Tandai Alpa
            </button>

            <button
              onClick={() => setSelectedPersonIds([])}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition ml-1"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Table: Roster Kehadiran */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                {canEdit && (
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={targetList.length > 0 && selectedPersonIds.length === targetList.length}
                      onChange={toggleSelectAllPersons}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      title="Pilih Semua"
                    />
                  </th>
                )}
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Program / Posisi</th>
                <th className="p-3">Status Terkini</th>
                <th className="p-3">Waktu & Metode</th>
                {canEdit && (
                  <th className="p-3 text-center">
                    {isBulkMode ? (
                      <span className="text-emerald-400 font-bold">Pilih Status (Lalu Klik Simpan)</span>
                    ) : (
                      <span className="flex items-center justify-center space-x-1">
                        <span>Tandai Status</span>
                        <span className="text-[10px] text-emerald-400 font-normal lowercase">(otomatis tersimpan ✓)</span>
                      </span>
                    )}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {targetList.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="p-8 text-center text-slate-400">
                    Tidak ada data {activeType.toLowerCase()} yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                targetList.map((person) => {
                  const rec = dayRecords.find((r) => r.personId === person.id);
                  const category = 'trainingCategory' in person ? person.trainingCategory : person.category;
                  const currentStatus = isBulkMode
                    ? bulkState[person.id]?.status || 'Hadir'
                    : rec?.status || 'Belum Absen';

                  return (
                    <tr
                      key={person.id}
                      className={`hover:bg-slate-800/40 transition ${
                        selectedPersonIds.includes(person.id) ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {canEdit && (
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedPersonIds.includes(person.id)}
                            onChange={() => toggleSelectPerson(person.id)}
                            className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="p-3">
                        <div className="font-bold text-white">{person.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{person.id}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-200">{category}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            currentStatus === 'Hadir'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : currentStatus === 'Izin'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : currentStatus === 'Sakit'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : currentStatus === 'Alpa'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {rec?.scannedViaQr ? (
                          <span className="flex items-center space-x-1 text-cyan-400 font-medium">
                            <QrCode className="w-3.5 h-3.5" />
                            <span>QR Code ({rec.sessionTime})</span>
                          </span>
                        ) : rec ? (
                          <span>Manual ({rec.sessionTime})</span>
                        ) : isBulkMode ? (
                          <span className="text-blue-400 italic">Siap Disimpan Bulk</span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Interactive Controls */}
                      {canEdit && (
                        <td className="p-3 text-center">
                          {isBulkMode ? (
                            <div className="inline-flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                              {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as AttendanceStatus[]).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setBulkState((prev) => ({
                                      ...prev,
                                      [person.id]: {
                                        status: st,
                                        notes: prev[person.id]?.notes || '',
                                      },
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                    bulkState[person.id]?.status === st
                                      ? st === 'Hadir'
                                        ? 'bg-emerald-600 text-white shadow'
                                        : st === 'Izin'
                                        ? 'bg-blue-600 text-white shadow'
                                        : st === 'Sakit'
                                        ? 'bg-amber-600 text-white shadow'
                                        : 'bg-red-600 text-white shadow'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="inline-flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                              {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as AttendanceStatus[]).map((st) => (
                                <button
                                  key={st}
                                  onClick={() =>
                                    handleQuickStatusChange(person.id, person.name, category, st)
                                  }
                                  title={`Tandai status ${st} untuk ${person.name} (Langsung tersimpan otomatis)`}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                    rec?.status === st
                                      ? st === 'Hadir'
                                        ? 'bg-emerald-600 text-white shadow'
                                        : st === 'Izin'
                                        ? 'bg-blue-600 text-white shadow'
                                        : st === 'Sakit'
                                        ? 'bg-amber-600 text-white shadow'
                                        : 'bg-red-600 text-white shadow'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer save bar for isBulkMode */}
        {isBulkMode && canEdit && (
          <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Status presensi telah dipilih untuk <strong>{targetList.length} {activeType}</strong>. Klik tombol untuk menyimpan semua perubahan:</span>
            </div>
            <button
              id="btn-save-bulk-bottom"
              onClick={handleSaveBulk}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950/40"
            >
              <Save className="w-4 h-4" />
              <span>💾 Simpan Presensi Massal ({targetList.length} Record)</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FLOATING ACTION DOCK (PRESENSI BULK UNTUK ATLET TERPILIH VIA CHECKBOX) */}
      {/* ========================================================================= */}
      {selectedPersonIds.length > 0 && canEdit && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-emerald-500/50 shadow-2xl shadow-black/80 rounded-2xl p-3 flex flex-wrap items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom">
          <div className="flex items-center space-x-2 text-xs font-bold text-white px-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>{selectedPersonIds.length} {activeType} Terpilih</span>
          </div>
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <button
            onClick={() => handleMarkSelectedStatus('Hadir')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>💾 Simpan Hadir ({selectedPersonIds.length})</span>
          </button>
          <button
            onClick={() => handleMarkSelectedStatus('Izin')}
            className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition"
          >
            💾 Simpan Izin
          </button>
          <button
            onClick={() => handleMarkSelectedStatus('Sakit')}
            className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
          >
            💾 Simpan Sakit
          </button>
          <button
            onClick={() => handleMarkSelectedStatus('Alpa')}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
          >
            💾 Simpan Alpa
          </button>
          <button
            onClick={() => setSelectedPersonIds([])}
            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Batal
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING SAVE DOCK FOR BULK MODE */}
      {/* ========================================================================= */}
      {isBulkMode && selectedPersonIds.length === 0 && canEdit && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-emerald-500/60 shadow-2xl shadow-black/80 rounded-2xl p-3 flex flex-wrap items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom">
          <div className="flex items-center space-x-2 text-xs font-bold text-white px-2">
            <Save className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Mode Presensi Massal: <strong>{targetList.length} {activeType}</strong></span>
          </div>
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <button
            onClick={handleSaveBulk}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>💾 Simpan Presensi Massal ({targetList.length} Record)</span>
          </button>
          <button
            onClick={() => setIsBulkMode(false)}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Batal
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING TOAST NOTIFICATION FOR REAL-TIME SAVE */}
      {/* ========================================================================= */}
      {quickSaveToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/95 border border-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-950/60 backdrop-blur-md flex items-center space-x-3 text-xs font-medium animate-in slide-in-from-top duration-200">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center space-x-1.5">
              <span>Data Presensi Tersimpan Otomatis ✓</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">({quickSaveToast.time})</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              <strong>{quickSaveToast.personName}</strong> dicatat sebagai <span className="font-bold text-emerald-400 uppercase tracking-wide">"{quickSaveToast.status}"</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT PRESENSI MANUAL SATUAN */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Input Presensi Manual ({manualForm.personType})</span>
              </h4>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tipe Peserta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const first = safeAthletes[0];
                      setManualForm({
                        ...manualForm,
                        personType: 'Atlet',
                        personId: first?.id || '',
                        personName: first?.name || '',
                        trainingCategory: first?.trainingCategory || 'Pembibitan',
                      });
                    }}
                    className={`py-2 rounded-lg border text-center font-bold text-xs ${
                      manualForm.personType === 'Atlet'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Atlet Hevindo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const first = safeCoaches[0];
                      setManualForm({
                        ...manualForm,
                        personType: 'Pelatih',
                        personId: first?.id || '',
                        personName: first?.name || '',
                        trainingCategory: 'Regular' as any,
                      });
                    }}
                    className={`py-2 rounded-lg border text-center font-bold text-xs ${
                      manualForm.personType === 'Pelatih'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Pelatih / Coach
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Pilih Nama</label>
                <select
                  value={manualForm.personId}
                  onChange={(e) => {
                    const list = manualForm.personType === 'Atlet' ? safeAthletes : safeCoaches;
                    const found = list.find((p) => p.id === e.target.value);
                    if (found) {
                      const cat = 'trainingCategory' in found ? found.trainingCategory : 'Regular';
                      setManualForm({
                        ...manualForm,
                        personId: found.id,
                        personName: found.name,
                        trainingCategory: cat as any,
                      });
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                >
                  {(manualForm.personType === 'Atlet' ? safeAthletes : safeCoaches).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tanggal Presensi</label>
                  <input
                    type="date"
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Sesi Waktu Latihan</label>
                  <input
                    type="text"
                    value={manualForm.sessionTime}
                    onChange={(e) => setManualForm({ ...manualForm, sessionTime: e.target.value })}
                    placeholder="Contoh: 14:00 - 17:00 WIB"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Status Kehadiran</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, status: st })}
                      className={`py-2 rounded-lg border text-center font-bold text-xs transition ${
                        manualForm.status === st
                          ? st === 'Hadir'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : st === 'Izin'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : st === 'Sakit'
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-red-600 border-red-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Contoh: Mengikuti ujian sekolah / demam..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QR CODE SCANNER (LIVE CAMERA SIMULATOR & INPUT KODE QR) */}
      {/* ========================================================================= */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Pemindai QR Code Presensi Atlet PB HEVINDO</span>
              </h4>
              <button onClick={() => setIsQrScannerOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            {/* Viewfinder simulation */}
            <div className="relative w-full h-48 bg-slate-950 rounded-xl border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
              <div className="w-32 h-32 border-2 border-emerald-400 rounded-lg flex items-center justify-center relative">
                <QrCode className="w-20 h-20 text-emerald-400/60" />
                <div className="absolute inset-x-0 h-0.5 bg-emerald-400 animate-pulse top-1/2 shadow-lg shadow-emerald-400"></div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Arahkan ID Card Atlet ke Kamera / Gunakan Barcode Scanner
              </p>
            </div>

            {scanSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold text-center animate-bounce">
                {scanSuccessMsg}
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Pilih ID Atlet untuk Disimulasikan:</label>
                <select
                  value={scannedInput}
                  onChange={(e) => setScannedInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {safeAthletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.name} ({a.trainingCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={scannedInput}
                  onChange={(e) => setScannedInput(e.target.value)}
                  placeholder="Atau ketik/scan ID Atlet..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                />
                <button
                  onClick={() => handleProcessQrScan(scannedInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-md transition"
                >
                  Scan QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
