import React, { useState, useMemo } from 'react';
import { MonthlyDues, Athlete, UserRole, TrainingCategory } from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  matchesMultiFieldSearch,
  sortData,
  exportToCSV,
  getStandardMonthlyFee,
  getAllMonthlyFeeSettings,
  saveMonthlyFeeSettings,
  MonthlyFeeConfig,
} from '../../utils/helpers';
import {
  DollarSign,
  Search,
  CheckCircle,
  Clock,
  Award,
  CreditCard,
  Printer,
  Download,
  Send,
  Filter,
  AlertCircle,
  FileText,
  Plus,
  Edit2,
  Calendar,
  User,
  History,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  CheckSquare,
  Square,
  Layers,
  Users,
  Copy,
  Check,
  Settings,
  Sliders,
} from 'lucide-react';
import { BulkPaymentModal } from './BulkPaymentModal';
import { DuesPrintReportModal } from './DuesPrintReportModal';
import { WhatsAppShareModal, WhatsAppAthleteTarget } from './WhatsAppShareModal';
import { ReceiptModal } from './ReceiptModal';

interface MonthlyDuesTabProps {
  dues: MonthlyDues[];
  athletes: Athlete[];
  onPayDue: (dueId: string, paymentMethod: 'Cash' | 'Transfer Bank' | 'QRIS', notes?: string) => void;
  onUpdateDue?: (due: MonthlyDues) => void;
  onAddDue?: (due: MonthlyDues) => void;
  onBulkSaveDues?: (dues: MonthlyDues[], description?: string) => void;
  onApplyRewardFree: (dueId: string, tournamentTitle: string) => void;
  onApplyRewardWithDuration?: (
    athleteId: string,
    athleteName: string,
    category: TrainingCategory,
    tournamentTitle: string,
    startMonth: string,
    durationMonths: number
  ) => void;
  currentRole: UserRole;
}

type TabViewMode = 'all_dues' | 'arrears_recap' | 'payment_history';

export const MonthlyDuesTab: React.FC<MonthlyDuesTabProps> = ({
  dues = [],
  athletes = [],
  onPayDue,
  onUpdateDue,
  onAddDue,
  onBulkSaveDues,
  onApplyRewardFree,
  onApplyRewardWithDuration,
  currentRole,
}) => {
  // Navigation View Mode
  const [viewMode, setViewMode] = useState<TabViewMode>('all_dues');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, Sudah Bayar, Belum Bayar, Gratis / Reward Juara
  const [filterMonth, setFilterMonth] = useState<string>('2026-09');
  const [sortKey, setSortKey] = useState<keyof MonthlyDues>('athleteName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ========================================================
  // CHECKBOX SELECTION STATES FOR HUNDREDS OF ATHLETES
  // ========================================================
  const [selectedDueIds, setSelectedDueIds] = useState<Set<string>>(new Set());
  const [selectedArrearsAthleteIds, setSelectedArrearsAthleteIds] = useState<Set<string>>(new Set());

  // Modals
  const [isBulkPayModalOpen, setIsBulkPayModalOpen] = useState(false);
  const [bulkPayAthleteId, setBulkPayAthleteId] = useState<string | undefined>(undefined);
  const [bulkPayInitialDueIds, setBulkPayInitialDueIds] = useState<string[]>([]);

  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false);
  const [printReportType, setPrintReportType] = useState<'unpaid' | 'paid' | 'arrears_recap' | 'all'>('unpaid');

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTargets, setWhatsAppTargets] = useState<WhatsAppAthleteTarget[]>([]);

  const [receiptDue, setReceiptDue] = useState<MonthlyDues | null>(null);

  // Edit Single Due Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDue, setEditingDue] = useState<MonthlyDues | null>(null);
  const [dueForm, setDueForm] = useState<{
    id?: string;
    athleteId: string;
    athleteName: string;
    trainingCategory: TrainingCategory;
    periodMonth: string;
    amount: number;
    status: 'Belum Bayar' | 'Sudah Bayar' | 'Gratis / Reward Juara';
    paymentMethod: 'Cash' | 'Transfer Bank' | 'QRIS' | 'Reward Otomatis';
    paymentDate: string;
    invoiceNumber: string;
    notes: string;
  }>({
    athleteId: '',
    athleteName: '',
    trainingCategory: 'Pembibitan',
    periodMonth: '2026-09',
    amount: 350000,
    status: 'Sudah Bayar',
    paymentMethod: 'Transfer Bank',
    paymentDate: new Date().toISOString().split('T')[0],
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    notes: '',
  });

  // Reward with duration modal
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardAthleteId, setRewardAthleteId] = useState('');
  const [rewardTitle, setRewardTitle] = useState('Juara 1 Kejurkot PBSI Pekanbaru 2026');
  const [rewardStartMonth, setRewardStartMonth] = useState('2026-09');
  const [rewardDuration, setRewardDuration] = useState<number>(3);

  // Settings Tarif Iuran Bulanan
  const [feeSettings, setFeeSettings] = useState<MonthlyFeeConfig>(() => getAllMonthlyFeeSettings());
  const [isFeeSettingsModalOpen, setIsFeeSettingsModalOpen] = useState(false);
  const [editFeeForm, setEditFeeForm] = useState<MonthlyFeeConfig>(() => getAllMonthlyFeeSettings());
  const [feeSaveToast, setFeeSaveToast] = useState<string | null>(null);

  // Sync fee settings across tabs / windows
  React.useEffect(() => {
    const handleFeesUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<MonthlyFeeConfig>;
      if (customEvent.detail) {
        setFeeSettings(customEvent.detail);
      } else {
        setFeeSettings(getAllMonthlyFeeSettings());
      }
    };
    window.addEventListener('monthly_fees_updated', handleFeesUpdated);
    return () => window.removeEventListener('monthly_fees_updated', handleFeesUpdated);
  }, []);

  const handleSaveFeeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized: MonthlyFeeConfig = {
      Pembibitan: Math.max(0, Number(editFeeForm.Pembibitan) || 0),
      Regular: Math.max(0, Number(editFeeForm.Regular) || 0),
      Pusdiklat: Math.max(0, Number(editFeeForm.Pusdiklat) || 0),
    };
    saveMonthlyFeeSettings(sanitized);
    setFeeSettings(sanitized);
    setFeeSaveToast('✓ Tarif iuran bulanan berhasil diperbarui & disimpan!');
    setIsFeeSettingsModalOpen(false);
    setTimeout(() => setFeeSaveToast(null), 3500);
  };

  const handleResetDefaultFees = () => {
    const defaults: MonthlyFeeConfig = {
      Pembibitan: 350000,
      Regular: 450000,
      Pusdiklat: 600000,
    };
    setEditFeeForm(defaults);
  };

  const canEdit = currentRole !== 'Publik';
  const safeDues = dues || [];
  const safeAthletes = athletes || [];

  // ==========================================
  // 1. Tagihan Terfilter
  // ==========================================
  const filteredDues = useMemo(() => {
    return safeDues.filter((d) => {
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (viewMode === 'all_dues' && filterMonth && d.periodMonth !== filterMonth) return false;
      return matchesMultiFieldSearch(searchQuery, [
        d.invoiceNumber,
        d.athleteName,
        d.trainingCategory,
        d.status,
        d.paymentMethod,
      ]);
    });
  }, [safeDues, filterStatus, filterMonth, searchQuery, viewMode]);

  const sortedDues = useMemo(() => {
    return sortData(filteredDues, sortKey, sortDirection);
  }, [filteredDues, sortKey, sortDirection]);

  // ==========================================
  // 2. Rekap Tunggakan Atlet (Berapa Bulan Belum Bayar)
  // ==========================================
  const arrearsRecap = useMemo(() => {
    const arrearsMap = new Map<
      string,
      {
        athleteId: string;
        athleteName: string;
        trainingCategory: TrainingCategory;
        parentPhone?: string;
        parentName?: string;
        unpaidMonths: string[];
        totalUnpaidAmount: number;
        unpaidDues: MonthlyDues[];
      }
    >();

    safeAthletes.forEach((ath) => {
      const athleteUnpaidDues = safeDues.filter(
        (d) =>
          (d.athleteId === ath.id || d.athleteName.toLowerCase() === ath.name.toLowerCase()) &&
          d.status === 'Belum Bayar'
      );

      if (athleteUnpaidDues.length > 0) {
        const sortedMonths = athleteUnpaidDues.map((d) => d.periodMonth).sort();
        const total = athleteUnpaidDues.reduce((acc, curr) => acc + curr.amount, 0);
        arrearsMap.set(ath.id, {
          athleteId: ath.id,
          athleteName: ath.name,
          trainingCategory: ath.trainingCategory,
          parentPhone: (ath as any).parentPhone || ath.phoneNumber || '-',
          parentName: ath.parentName || 'Wali Atlet',
          unpaidMonths: sortedMonths,
          totalUnpaidAmount: total,
          unpaidDues: athleteUnpaidDues,
        });
      }
    });

    return Array.from(arrearsMap.values()).sort(
      (a, b) => b.unpaidMonths.length - a.unpaidMonths.length || b.totalUnpaidAmount - a.totalUnpaidAmount
    );
  }, [safeDues, safeAthletes]);

  // Filtered Arrears by search query
  const filteredArrears = useMemo(() => {
    return arrearsRecap.filter((item) =>
      matchesMultiFieldSearch(searchQuery, [
        item.athleteName,
        item.trainingCategory,
        item.parentName,
        item.parentPhone,
        item.unpaidMonths.join(' '),
      ])
    );
  }, [arrearsRecap, searchQuery]);

  // ==========================================
  // 3. Histori Pembayaran
  // ==========================================
  const paymentHistory = useMemo(() => {
    return safeDues
      .filter((d) => d.status === 'Sudah Bayar' || d.status === 'Gratis / Reward Juara')
      .sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));
  }, [safeDues]);

  // KPI Statistics
  const totalAmountPeriod = safeDues
    .filter((d) => d.periodMonth === filterMonth)
    .reduce((acc, curr) => acc + curr.amount, 0);
  const paidAmountPeriod = safeDues
    .filter((d) => d.periodMonth === filterMonth && d.status === 'Sudah Bayar')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const unpaidCountPeriod = safeDues.filter(
    (d) => d.periodMonth === filterMonth && d.status === 'Belum Bayar'
  ).length;
  const rewardCountPeriod = safeDues.filter(
    (d) => d.periodMonth === filterMonth && d.status === 'Gratis / Reward Juara'
  ).length;

  const totalAllUnpaidAthletesCount = arrearsRecap.length;
  const totalAllArrearsAmount = arrearsRecap.reduce((acc, curr) => acc + curr.totalUnpaidAmount, 0);

  // Selected Dues Total
  const selectedDuesList = useMemo(() => {
    return safeDues.filter((d) => selectedDueIds.has(d.id));
  }, [safeDues, selectedDueIds]);

  const selectedTotalAmount = useMemo(() => {
    return selectedDuesList.reduce((acc, curr) => acc + curr.amount, 0);
  }, [selectedDuesList]);

  // ========================================================
  // CHECKBOX SELECTION HANDLERS
  // ========================================================
  const toggleSelectDue = (id: string) => {
    setSelectedDueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisibleDues = () => {
    if (selectedDueIds.size === sortedDues.length && sortedDues.length > 0) {
      setSelectedDueIds(new Set());
    } else {
      setSelectedDueIds(new Set(sortedDues.map((d) => d.id)));
    }
  };

  const toggleSelectArrearsAthlete = (athleteId: string) => {
    setSelectedArrearsAthleteIds((prev) => {
      const next = new Set(prev);
      if (next.has(athleteId)) next.delete(athleteId);
      else next.add(athleteId);
      return next;
    });
  };

  const toggleSelectAllArrears = () => {
    if (selectedArrearsAthleteIds.size === filteredArrears.length && filteredArrears.length > 0) {
      setSelectedArrearsAthleteIds(new Set());
    } else {
      setSelectedArrearsAthleteIds(new Set(filteredArrears.map((a) => a.athleteId)));
    }
  };

  // Bulk Payment Modal Triggers
  const handleOpenBulkPaymentModal = (athleteId?: string, initialDues?: string[]) => {
    setBulkPayAthleteId(athleteId);
    setBulkPayInitialDueIds(initialDues || Array.from(selectedDueIds));
    setIsBulkPayModalOpen(true);
  };

  const handleSaveBulkPayment = (records: MonthlyDues[], description: string) => {
    if (onBulkSaveDues) {
      onBulkSaveDues(records, description);
    } else {
      records.forEach((r) => {
        if (onUpdateDue) onUpdateDue(r);
      });
    }
    setSelectedDueIds(new Set());
    setSelectedArrearsAthleteIds(new Set());
  };

  // WhatsApp Batch Trigger
  const handleOpenWhatsAppModalForSelected = () => {
    if (viewMode === 'arrears_recap' && selectedArrearsAthleteIds.size > 0) {
      const targets: WhatsAppAthleteTarget[] = arrearsRecap
        .filter((a) => selectedArrearsAthleteIds.has(a.athleteId))
        .map((a) => ({
          athleteId: a.athleteId,
          athleteName: a.athleteName,
          trainingCategory: a.trainingCategory,
          parentName: a.parentName,
          parentPhone: a.parentPhone,
          unpaidMonths: a.unpaidMonths,
          totalAmount: a.totalUnpaidAmount,
        }));
      setWhatsAppTargets(targets);
      setIsWhatsAppModalOpen(true);
    } else if (selectedDueIds.size > 0) {
      // Group selected dues by athlete
      const map = new Map<string, WhatsAppAthleteTarget>();
      selectedDuesList.forEach((d) => {
        const ath = safeAthletes.find((a) => a.id === d.athleteId || a.name === d.athleteName);
        if (!map.has(d.athleteName)) {
          map.set(d.athleteName, {
            athleteId: d.athleteId,
            athleteName: d.athleteName,
            trainingCategory: d.trainingCategory,
            parentName: ath?.parentName,
            parentPhone: (ath as any)?.parentPhone || ath?.phoneNumber || '-',
            unpaidMonths: [d.periodMonth],
            totalAmount: d.amount,
          });
        } else {
          const item = map.get(d.athleteName)!;
          if (!item.unpaidMonths.includes(d.periodMonth)) {
            item.unpaidMonths.push(d.periodMonth);
          }
          item.totalAmount += d.amount;
        }
      });
      setWhatsAppTargets(Array.from(map.values()));
      setIsWhatsAppModalOpen(true);
    }
  };

  // WhatsApp Single Trigger
  const handleSendSingleWAReminder = (item: (typeof arrearsRecap)[0]) => {
    setWhatsAppTargets([
      {
        athleteId: item.athleteId,
        athleteName: item.athleteName,
        trainingCategory: item.trainingCategory,
        parentName: item.parentName,
        parentPhone: item.parentPhone,
        unpaidMonths: item.unpaidMonths,
        totalAmount: item.totalUnpaidAmount,
      },
    ]);
    setIsWhatsAppModalOpen(true);
  };

  // Export to Excel / CSV options
  const handleExportCSV = (type: 'unpaid' | 'paid' | 'arrears_recap' | 'all') => {
    if (type === 'arrears_recap') {
      exportToCSV(
        arrearsRecap.map((item, idx) => ({
          'No': idx + 1,
          'Nama Atlet': item.athleteName,
          'Program Kelas': item.trainingCategory,
          'Jumlah Bulan Belum Bayar': item.unpaidMonths.length,
          'Rincian Bulan': item.unpaidMonths.join(', '),
          'Total Tunggakan': item.totalUnpaidAmount,
          'Nama Wali': item.parentName,
          'No. HP / WA Wali': item.parentPhone,
        })),
        `Rekap_Tunggakan_Atlet_PB_HEVINDO_${new Date().toISOString().slice(0, 10)}`
      );
    } else {
      const dataToExport = safeDues.filter((d) => {
        if (type === 'unpaid') return d.status === 'Belum Bayar';
        if (type === 'paid') return d.status === 'Sudah Bayar';
        return true;
      });

      exportToCSV(
        dataToExport.map((d) => ({
          'No Invoice': d.invoiceNumber,
          'Nama Atlet': d.athleteName,
          'Kategori Kelas': d.trainingCategory,
          'Periode Bulan': d.periodMonth,
          'Nominal': d.amount,
          'Status Pembayaran': d.status,
          'Metode Bayar': d.paymentMethod || '-',
          'Tanggal Bayar': d.paymentDate || '-',
          'Catatan': d.notes || '-',
        })),
        `Laporan_Iuran_${type.toUpperCase()}_PB_HEVINDO_${new Date().toISOString().slice(0, 10)}`
      );
    }
  };

  // Print PDF Trigger
  const handleOpenPrintReport = (type: 'unpaid' | 'paid' | 'arrears_recap' | 'all') => {
    setPrintReportType(type);
    setIsPrintReportModalOpen(true);
  };

  // Single Add / Edit Handlers
  const handleOpenAdd = () => {
    const firstAth = safeAthletes[0];
    const cat = firstAth?.trainingCategory || 'Pembibitan';
    setDueForm({
      athleteId: firstAth?.id || '',
      athleteName: firstAth?.name || 'Atlet Hevindo',
      trainingCategory: cat,
      periodMonth: filterMonth || '2026-09',
      amount: getStandardMonthlyFee(cat),
      status: 'Sudah Bayar',
      paymentMethod: 'Transfer Bank',
      paymentDate: new Date().toISOString().split('T')[0],
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      notes: 'Pembayaran iuran bulanan kasir',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (due: MonthlyDues) => {
    setEditingDue(due);
    setDueForm({
      id: due.id,
      athleteId: due.athleteId,
      athleteName: due.athleteName,
      trainingCategory: due.trainingCategory,
      periodMonth: due.periodMonth,
      amount: due.amount,
      status: due.status,
      paymentMethod: due.paymentMethod || 'Transfer Bank',
      paymentDate: due.paymentDate || new Date().toISOString().split('T')[0],
      invoiceNumber: due.invoiceNumber,
      notes: due.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newDue: MonthlyDues = {
      id: `DUE-${Date.now()}`,
      athleteId: dueForm.athleteId,
      athleteName: dueForm.athleteName,
      trainingCategory: dueForm.trainingCategory,
      periodMonth: dueForm.periodMonth,
      amount: Number(dueForm.amount),
      status: dueForm.status,
      paymentMethod: dueForm.status === 'Sudah Bayar' ? dueForm.paymentMethod : undefined,
      paymentDate: dueForm.status === 'Sudah Bayar' ? dueForm.paymentDate : undefined,
      invoiceNumber: dueForm.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      notes: dueForm.notes,
    };

    if (onAddDue) onAddDue(newDue);
    else if (onUpdateDue) onUpdateDue(newDue);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDue) return;

    const updated: MonthlyDues = {
      ...editingDue,
      amount: Number(dueForm.amount),
      status: dueForm.status,
      paymentMethod:
        dueForm.status === 'Sudah Bayar'
          ? dueForm.paymentMethod
          : dueForm.status === 'Gratis / Reward Juara'
          ? 'Reward Otomatis'
          : undefined,
      paymentDate: dueForm.status === 'Sudah Bayar' ? dueForm.paymentDate : dueForm.paymentDate,
      invoiceNumber: dueForm.invoiceNumber,
      notes: dueForm.notes,
    };

    if (onUpdateDue) onUpdateDue(updated);
    setIsEditModalOpen(false);
    setEditingDue(null);
  };

  const handleApplyRewardDurationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const athlete = safeAthletes.find((a) => a.id === rewardAthleteId);
    if (!athlete) {
      alert('Pilih atlet penerima reward!');
      return;
    }

    if (onApplyRewardWithDuration) {
      onApplyRewardWithDuration(
        athlete.id,
        athlete.name,
        athlete.trainingCategory,
        rewardTitle,
        rewardStartMonth,
        rewardDuration
      );
    }
    setIsRewardModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* ======================================================== */}
      {/* TOP HEADER & ACTION CONTROLS */}
      {/* ======================================================== */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Manajemen Iuran Bulanan & Reward Atlet PB Hevindo</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola tagihan per kelas, input data bayar multi-bulan / kolektif, pantau akumulasi tunggakan, dan ekspor dokumen WhatsApp/PDF/Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              {/* PRIMARY ACTION: Input Pembayaran Massal / Multi-Bulan */}
              <button
                id="btn-bulk-payment-modal"
                onClick={() => handleOpenBulkPaymentModal()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950/40"
              >
                <CreditCard className="w-4 h-4 text-emerald-200" />
                <span>⚡ Input Pembayaran Massal / Multi-Bulan</span>
              </button>

              {/* SECONDARY ACTION: Input Data Bayar Manual Satuan */}
              <button
                id="btn-single-payment-modal"
                onClick={() => {
                  const first = safeAthletes[0];
                  setDueForm({
                    athleteId: first?.id || '',
                    athleteName: first?.name || '',
                    trainingCategory: first?.trainingCategory || 'Pembibitan',
                    periodMonth: filterMonth,
                    amount: getStandardMonthlyFee(first?.trainingCategory || 'Pembibitan'),
                    status: 'Sudah Bayar',
                    paymentMethod: 'Transfer Bank',
                    paymentDate: new Date().toISOString().split('T')[0],
                    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
                    notes: 'Pelunasan manual iuran bulanan',
                  });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Input Data Bayar Satuan</span>
              </button>

              <button
                id="btn-setting-tarif-iuran"
                onClick={() => {
                  setEditFeeForm(getAllMonthlyFeeSettings());
                  setIsFeeSettingsModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold transition"
                title="Atur patokan harga iuran bulanan per kelas pembinaan"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>⚙️ Pengaturan Tarif</span>
              </button>

              <button
                onClick={() => {
                  setRewardAthleteId(safeAthletes[0]?.id || '');
                  setIsRewardModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-lg text-xs font-bold transition shadow-md"
              >
                <Award className="w-3.5 h-3.5 text-amber-200" />
                <span>Atur Masa Reward Juara</span>
              </button>
            </>
          )}

          {/* Cetak & Ekspor PDF Resmi */}
          <button
            onClick={() => handleOpenPrintReport(viewMode === 'arrears_recap' ? 'arrears_recap' : 'unpaid')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cetak / Simpan PDF</span>
          </button>

          {/* Unduh Excel CSV */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition">
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ekspor Excel (.csv)</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 w-52 hidden group-hover:block z-30 text-xs">
              <button
                onClick={() => handleExportCSV('unpaid')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-red-400 hover:text-white font-medium"
              >
                Ekspor Daftar Belum Lunas
              </button>
              <button
                onClick={() => handleExportCSV('paid')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-emerald-400 hover:text-white font-medium"
              >
                Ekspor Daftar Sudah Lunas
              </button>
              <button
                onClick={() => handleExportCSV('arrears_recap')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-amber-400 hover:text-white font-medium"
              >
                Ekspor Rekap Tunggakan Atlet
              </button>
              <button
                onClick={() => handleExportCSV('all')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                Ekspor Semua Data Iuran
              </button>
            </div>
          </div>
        </div>
      </div>

      {feeSaveToast && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <span className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span>{feeSaveToast}</span>
          </span>
          <button onClick={() => setFeeSaveToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TIERED PRICING GUIDE BANNER (SESUAI KELAS PEMBINAAN) */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-200">💡 Tarif Iuran Resmi PB Hevindo Sesuai Kelas:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 font-semibold flex items-center space-x-1.5">
            <span>🌱 Pembibitan:</span>
            <strong className="font-mono text-white">{formatRupiah(feeSettings.Pembibitan)}</strong>
            <span className="text-[10px] text-emerald-400/80">/ bln</span>
          </div>

          <div className="px-3 py-1 bg-blue-950/60 border border-blue-500/40 rounded-lg text-blue-300 font-semibold flex items-center space-x-1.5">
            <span>🏸 Regular:</span>
            <strong className="font-mono text-white">{formatRupiah(feeSettings.Regular)}</strong>
            <span className="text-[10px] text-blue-400/80">/ bln</span>
          </div>

          <div className="px-3 py-1 bg-purple-950/60 border border-purple-500/40 rounded-lg text-purple-300 font-semibold flex items-center space-x-1.5">
            <span>🏆 Pusdiklat:</span>
            <strong className="font-mono text-white">{formatRupiah(feeSettings.Pusdiklat)}</strong>
            <span className="text-[10px] text-purple-400/80">/ bln</span>
          </div>

          {canEdit && (
            <button
              onClick={() => {
                setEditFeeForm(getAllMonthlyFeeSettings());
                setIsFeeSettingsModalOpen(true);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
              title="Ubah patokan nominal iuran per kelas"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ubah Tarif</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* KPI METRICS SUMMARY */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Tagihan Periode ({filterMonth})</span>
          <span className="text-xl font-bold text-white mt-1 block">{formatRupiah(totalAmountPeriod)}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Total kewajiban atlet terdaftar</span>
        </div>

        <div className="bg-slate-850 p-3.5 rounded-xl border border-emerald-500/30">
          <span className="text-[11px] text-emerald-400 block font-medium">Realisasi Lunas ({filterMonth})</span>
          <span className="text-xl font-bold text-emerald-300 mt-1 block">{formatRupiah(paidAmountPeriod)}</span>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
            {safeDues.filter((d) => d.periodMonth === filterMonth && d.status === 'Sudah Bayar').length} Atlet Terbayar
          </span>
        </div>

        <div className="bg-slate-850 p-3.5 rounded-xl border border-amber-500/30">
          <span className="text-[11px] text-amber-400 block font-medium">Reward Bebas Iuran ({filterMonth})</span>
          <span className="text-xl font-bold text-amber-300 mt-1 block">{rewardCountPeriod} Atlet</span>
          <span className="text-[10px] text-amber-400/80 mt-0.5 block">🏆 Atlet Berprestasi Juara</span>
        </div>

        <div
          onClick={() => setViewMode('arrears_recap')}
          className="bg-slate-850 p-3.5 rounded-xl border border-red-500/30 hover:border-red-500/60 cursor-pointer transition"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-red-400 block font-medium">Total Atlet Menunggak</span>
            <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-bold">
              Lihat Rincian →
            </span>
          </div>
          <span className="text-xl font-bold text-red-400 mt-1 block">{totalAllUnpaidAthletesCount} Atlet</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Akumulasi: {formatRupiah(totalAllArrearsAmount)}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW TABS (DAFTAR TAGIHAN, REKAP TUNGGAKAN, HISTORI) */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
        <div className="flex space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('all_dues')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'all_dues'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daftar Tagihan Iuran</span>
          </button>

          <button
            onClick={() => setViewMode('arrears_recap')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'arrears_recap'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Rekap Tunggakan Atlet ({arrearsRecap.length})</span>
          </button>

          <button
            onClick={() => setViewMode('payment_history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'payment_history'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histori Pembayaran ({paymentHistory.length})</span>
          </button>
        </div>

        {/* Periode Month Filter */}
        {viewMode === 'all_dues' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Periode:</span>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* FLOATING ACTION DOCK (KETIKA BARIS CENTANG CHECKBOX AKTIF) */}
      {/* ======================================================== */}
      {selectedDueIds.size > 0 && viewMode === 'all_dues' && (
        <div className="sticky top-2 z-40 bg-emerald-950/95 border border-emerald-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold rounded-lg border border-emerald-500/40">
              ✓ {selectedDueIds.size} Tagihan Terpilih
            </span>
            <span className="text-slate-300">
              Total Nominal:{' '}
              <strong className="text-white font-mono font-bold text-sm">
                {formatRupiah(selectedTotalAmount)}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button
                onClick={() => handleOpenBulkPaymentModal(undefined, Array.from(selectedDueIds))}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-black transition flex items-center space-x-1.5 shadow"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Input / Proses Bayar ({selectedDueIds.size})</span>
              </button>
            )}

            <button
              onClick={handleOpenWhatsAppModalForSelected}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold transition flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim WA Pengingat</span>
            </button>

            <button
              onClick={() => handleOpenPrintReport('unpaid')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-medium transition flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Terpilih</span>
            </button>

            <button
              onClick={() => setSelectedDueIds(new Set())}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white font-medium"
            >
              ✕ Batal
            </button>
          </div>
        </div>
      )}

      {selectedArrearsAthleteIds.size > 0 && viewMode === 'arrears_recap' && (
        <div className="sticky top-2 z-40 bg-red-950/95 border border-red-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-red-500/20 text-red-300 font-extrabold rounded-lg border border-red-500/40">
              ✓ {selectedArrearsAthleteIds.size} Atlet Menunggak Terpilih
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenWhatsAppModalForSelected}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition flex items-center space-x-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Pesan WA ke {selectedArrearsAthleteIds.size} Atlet</span>
            </button>

            <button
              onClick={() => handleOpenPrintReport('arrears_recap')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-medium transition flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap Terpilih</span>
            </button>

            <button
              onClick={() => setSelectedArrearsAthleteIds(new Set())}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white font-medium"
            >
              ✕ Batal
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: DAFTAR TAGIHAN IURAN (CHECKBOX BANYAK ATLET) */}
      {/* ======================================================== */}
      {viewMode === 'all_dues' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterStatus === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Semua Tagihan ({safeDues.filter((d) => d.periodMonth === filterMonth).length})
              </button>
              <button
                onClick={() => setFilterStatus('Sudah Bayar')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterStatus === 'Sudah Bayar'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-emerald-400 hover:text-white border border-slate-800'
                }`}
              >
                ✓ Sudah Lunas ({safeDues.filter((d) => d.periodMonth === filterMonth && d.status === 'Sudah Bayar').length})
              </button>
              <button
                onClick={() => setFilterStatus('Belum Bayar')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterStatus === 'Belum Bayar'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-900 text-red-400 hover:text-white border border-slate-800'
                }`}
              >
                ⚠ Belum Bayar ({unpaidCountPeriod})
              </button>
              <button
                onClick={() => setFilterStatus('Gratis / Reward Juara')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterStatus === 'Gratis / Reward Juara'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-900 text-amber-400 hover:text-white border border-slate-800'
                }`}
              >
                🏆 Reward Juara ({rewardCountPeriod})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari atlet, invoice, kelas..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Table Tagihan dengan Checkbox */}
          <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={sortedDues.length > 0 && selectedDueIds.size === sortedDues.length}
                        onChange={toggleSelectAllVisibleDues}
                        className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                        title="Pilih Semua Baris"
                      />
                    </th>
                    <th className="p-3">No. Invoice</th>
                    <th className="p-3">Nama Atlet</th>
                    <th className="p-3">Kategori & Tarif</th>
                    <th className="p-3">Status Iuran</th>
                    <th className="p-3">Metode & Tgl Bayar</th>
                    <th className="p-3">Catatan / Bukti</th>
                    <th className="p-3 text-center">Aksi & Kasir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedDues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Tidak ada data iuran pada periode {filterMonth} untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    sortedDues.map((due) => {
                      const isChecked = selectedDueIds.has(due.id);
                      return (
                        <tr
                          key={due.id}
                          className={`transition ${isChecked ? 'bg-emerald-950/30' : 'hover:bg-slate-800/50'}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectDue(due.id)}
                              className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono font-medium text-slate-200">{due.invoiceNumber}</td>
                          <td className="p-3">
                            <div className="font-semibold text-white">{due.athleteName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{due.athleteId}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-slate-200 block">{due.trainingCategory}</span>
                            <span className="text-emerald-400 font-bold text-[11px]">
                              {formatRupiah(due.amount)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                due.status === 'Gratis / Reward Juara'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : due.status === 'Sudah Bayar'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {due.status === 'Gratis / Reward Juara' && <span>🏆</span>}
                              <span>{due.status}</span>
                            </span>
                          </td>
                          <td className="p-3 text-[11px]">
                            {due.status === 'Sudah Bayar' ? (
                              <>
                                <div className="font-semibold text-white flex items-center space-x-1">
                                  <CreditCard className="w-3 h-3 text-emerald-400" />
                                  <span>{due.paymentMethod || 'Cash'}</span>
                                </div>
                                <div className="text-slate-400 text-[10px]">{due.paymentDate || '-'}</div>
                              </>
                            ) : due.status === 'Gratis / Reward Juara' ? (
                              <span className="text-amber-300 font-medium">Bebas Iuran Prestasi</span>
                            ) : (
                              <span className="text-red-400 font-medium">Belum Dilunasi</span>
                            )}
                          </td>
                          <td className="p-3 text-[11px] text-slate-400 max-w-xs truncate">
                            {due.notes || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {due.status === 'Belum Bayar' && canEdit && (
                                <button
                                  onClick={() => handleOpenBulkPaymentModal(due.athleteId, [due.id])}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition shadow"
                                >
                                  Bayar
                                </button>
                              )}

                              {canEdit && (
                                <button
                                  onClick={() => handleOpenEdit(due)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                  title="Edit Tagihan"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                                </button>
                              )}

                              {due.status === 'Sudah Bayar' && (
                                <button
                                  onClick={() => setReceiptDue(due)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                  title="Cetak Kwitansi Resmi"
                                >
                                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: REKAP TUNGGAKAN ATLET (DENGAN CHECKBOX & MULTI-BULAN) */}
      {/* ======================================================== */}
      {viewMode === 'arrears_recap' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-red-500/20 p-4 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Rekap Atlet Menunggak & Jumlah Bulan Belum Bayar
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Centang atlet untuk kirim WhatsApp serentak, proses bayar multi-bulan (tunggakan 2-3 bulan sekaligus), atau cetak surat tagihan resmi.
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleOpenPrintReport('arrears_recap')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-red-400" />
                <span>Cetak Rekap PDF</span>
              </button>
              <button
                onClick={() => handleExportCSV('arrears_recap')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unduh Excel</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredArrears.length > 0 &&
                          selectedArrearsAthleteIds.size === filteredArrears.length
                        }
                        onChange={toggleSelectAllArrears}
                        className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700 focus:ring-red-500 cursor-pointer"
                        title="Pilih Semua Atlet Menunggak"
                      />
                    </th>
                    <th className="p-3">Nama Atlet</th>
                    <th className="p-3">Program Kelas</th>
                    <th className="p-3 text-center">Jml Bulan Menunggak</th>
                    <th className="p-3">Rincian Bulan</th>
                    <th className="p-3 text-right">Total Kewajiban</th>
                    <th className="p-3">Kontak Wali Atlet</th>
                    <th className="p-3 text-center">Aksi Bayar & WA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredArrears.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-emerald-400 font-bold">
                        🎉 Hebat! Tidak ada atlet yang memiliki tunggakan iuran bulanan.
                      </td>
                    </tr>
                  ) : (
                    filteredArrears.map((item) => {
                      const isChecked = selectedArrearsAthleteIds.has(item.athleteId);
                      return (
                        <tr
                          key={item.athleteId}
                          className={`transition ${isChecked ? 'bg-red-950/30' : 'hover:bg-slate-800/50'}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectArrearsAthlete(item.athleteId)}
                              className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700 focus:ring-red-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{item.athleteName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.athleteId}</div>
                          </td>
                          <td className="p-3 font-medium text-slate-200">
                            <span>{item.trainingCategory}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              ({formatRupiah(getStandardMonthlyFee(item.trainingCategory))}/bln)
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                item.unpaidMonths.length >= 3
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                  : item.unpaidMonths.length === 2
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                              }`}
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{item.unpaidMonths.length} Bulan</span>
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {item.unpaidMonths.map((m) => (
                                <span
                                  key={m}
                                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-mono font-medium"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-red-400 text-sm">
                            {formatRupiah(item.totalUnpaidAmount)}
                          </td>
                          <td className="p-3 text-[11px]">
                            <div className="text-slate-300 font-medium">{item.parentName}</div>
                            <div className="text-slate-400 font-mono">{item.parentPhone}</div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenBulkPaymentModal(item.athleteId)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition shadow"
                                  title="Input bayar 2 atau 3 bulan sekaligus"
                                >
                                  Bayar Multi-Bulan
                                </button>
                              )}
                              <button
                                onClick={() => handleSendSingleWAReminder(item)}
                                className="p-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 transition"
                                title="Kirim Pengingat Tagihan WhatsApp"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: HISTORI PEMBAYARAN IURAN */}
      {/* ======================================================== */}
      {viewMode === 'payment_history' && (
        <div className="space-y-4">
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Histori Seluruh Transaksi Pembayaran Iuran</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Total {paymentHistory.length} transaksi pembayaran lunas dan bebas iuran reward yang tercatat.
              </p>
            </div>
            <button
              onClick={() => handleOpenPrintReport('paid')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cetak Laporan Lunas</span>
            </button>
          </div>

          <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Tanggal Bayar</th>
                    <th className="p-3">No. Invoice</th>
                    <th className="p-3">Nama Atlet</th>
                    <th className="p-3">Program Kelas</th>
                    <th className="p-3">Periode Bulan</th>
                    <th className="p-3">Nominal</th>
                    <th className="p-3">Cara Bayar</th>
                    <th className="p-3">Catatan / Keterangan</th>
                    <th className="p-3 text-center">Kwitansi & Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Belum ada riwayat pembayaran yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    paymentHistory.map((due) => (
                      <tr key={due.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3 text-slate-300 font-medium">
                          {due.paymentDate || 'Baru Saja'}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-semibold">{due.invoiceNumber}</td>
                        <td className="p-3 font-bold text-white">{due.athleteName}</td>
                        <td className="p-3">{due.trainingCategory}</td>
                        <td className="p-3 font-mono">{due.periodMonth}</td>
                        <td className="p-3 font-mono font-bold text-white">
                          {due.status === 'Gratis / Reward Juara' ? (
                            <span className="text-amber-400">GRATIS (REWARD)</span>
                          ) : (
                            formatRupiah(due.amount)
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold">
                            <CreditCard className="w-3 h-3 text-emerald-400" />
                            <span>{due.paymentMethod || 'Cash'}</span>
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs truncate">{due.notes || '-'}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setReceiptDue(due)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold border border-slate-700 transition"
                            >
                              Kwitansi
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEdit(due)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400"
                                title="Edit Transaksi Ini"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FLOATING ACTION DOCK AT BOTTOM FOR DUES & ARREARS */}
      {/* ======================================================== */}
      {selectedDueIds.size > 0 && viewMode === 'all_dues' && canEdit && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-emerald-500/50 shadow-2xl shadow-black/80 rounded-2xl p-3 flex flex-wrap items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom">
          <div className="flex items-center space-x-2 text-xs font-bold text-white px-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>{selectedDueIds.size} Tagihan Terpilih ({formatRupiah(selectedTotalAmount)})</span>
          </div>
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <button
            onClick={() => handleOpenBulkPaymentModal(undefined, Array.from(selectedDueIds))}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-950/40"
          >
            <CreditCard className="w-4 h-4 text-emerald-200" />
            <span>⚡ Input Pelunasan Massal ({selectedDueIds.size})</span>
          </button>
          <button
            onClick={handleOpenWhatsAppModalForSelected}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold transition flex items-center space-x-1 border border-emerald-500/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim WA</span>
          </button>
          <button
            onClick={() => setSelectedDueIds(new Set())}
            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Batal
          </button>
        </div>
      )}

      {selectedArrearsAthleteIds.size > 0 && viewMode === 'arrears_recap' && canEdit && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-red-500/50 shadow-2xl shadow-black/80 rounded-2xl p-3 flex flex-wrap items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom">
          <div className="flex items-center space-x-2 text-xs font-bold text-white px-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>{selectedArrearsAthleteIds.size} Atlet Menunggak Terpilih</span>
          </div>
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <button
            onClick={() => {
              const firstAthleteId = Array.from(selectedArrearsAthleteIds)[0] as string | undefined;
              handleOpenBulkPaymentModal(firstAthleteId);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow"
          >
            <CreditCard className="w-4 h-4" />
            <span>⚡ Input Bayar Multi-Bulan</span>
          </button>
          <button
            onClick={handleOpenWhatsAppModalForSelected}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold transition flex items-center space-x-1 border border-emerald-500/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim WA Serentak</span>
          </button>
          <button
            onClick={() => setSelectedArrearsAthleteIds(new Set())}
            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Batal
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* BULK PAYMENT MODAL (MULTI-BULAN & KOLEKTIF) */}
      {/* ======================================================== */}
      <BulkPaymentModal
        isOpen={isBulkPayModalOpen}
        onClose={() => setIsBulkPayModalOpen(false)}
        athletes={safeAthletes}
        dues={safeDues}
        initialAthleteId={bulkPayAthleteId}
        initialSelectedDueIds={bulkPayInitialDueIds}
        onSaveBulkPayment={handleSaveBulkPayment}
      />

      {/* ======================================================== */}
      {/* OFFICIAL PRINT & PDF REPORT MODAL */}
      {/* ======================================================== */}
      <DuesPrintReportModal
        isOpen={isPrintReportModalOpen}
        onClose={() => setIsPrintReportModalOpen(false)}
        dues={safeDues}
        athletes={safeAthletes}
        initialType={printReportType}
      />

      {/* ======================================================== */}
      {/* WHATSAPP REMINDER SHARE MODAL */}
      {/* ======================================================== */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        targets={whatsAppTargets}
      />

      {/* ======================================================== */}
      {/* OFFICIAL RECEIPT MODAL */}
      {/* ======================================================== */}
      <ReceiptModal receiptDue={receiptDue} onClose={() => setReceiptDue(null)} />

      {/* ======================================================== */}
      {/* MODAL: EDIT DATA PEMBAYARAN */}
      {/* ======================================================== */}
      {isEditModalOpen && editingDue && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <span>Edit Data Pembayaran & Tagihan</span>
              </h4>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-800 rounded-xl space-y-1">
                <div className="text-white font-bold text-sm">{editingDue.athleteName}</div>
                <div className="text-slate-400 text-xs">
                  Kelas {editingDue.trainingCategory} • Periode {editingDue.periodMonth}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Status Pembayaran</label>
                <select
                  value={dueForm.status}
                  onChange={(e) =>
                    setDueForm({
                      ...dueForm,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                >
                  <option value="Belum Bayar">Belum Bayar</option>
                  <option value="Sudah Bayar">Sudah Bayar (Lunas)</option>
                  <option value="Gratis / Reward Juara">Gratis / Reward Juara</option>
                </select>
              </div>

              {dueForm.status === 'Sudah Bayar' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Metode Pembayaran</label>
                      <select
                        value={dueForm.paymentMethod}
                        onChange={(e) =>
                          setDueForm({
                            ...dueForm,
                            paymentMethod: e.target.value as any,
                          })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="Cash">Cash / Tunai</option>
                        <option value="Transfer Bank">Transfer Bank</option>
                        <option value="QRIS">QRIS Kasir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Tanggal Pembayaran</label>
                      <input
                        type="date"
                        value={dueForm.paymentDate}
                        onChange={(e) => setDueForm({ ...dueForm, paymentDate: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  value={dueForm.amount}
                  onChange={(e) => setDueForm({ ...dueForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Catatan Transaksi</label>
                <input
                  type="text"
                  value={dueForm.notes}
                  onChange={(e) => setDueForm({ ...dueForm, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ATUR REWARD MASA WAKTU */}
      {/* ======================================================== */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Atur Masa Waktu Reward Bebas Iuran Juara</span>
              </h4>
              <button
                onClick={() => setIsRewardModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyRewardDurationSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                💡 Fasilitas <strong>Bebas Iuran</strong> diberikan kepada atlet berprestasi yang berhasil meraih juara
                turnamen, dengan masa waktu aktif yang dapat disesuaikan.
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Pilih Atlet Penerima Reward</label>
                <select
                  value={rewardAthleteId}
                  onChange={(e) => setRewardAthleteId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                  required
                >
                  {safeAthletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.trainingCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Prestasi / Turnamen Yang Dimenangkan</label>
                <input
                  type="text"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="Contoh: Juara 1 Tunggal Remaja Kejurkot 2026..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Mulai Periode Bulan</label>
                  <input
                    type="month"
                    value={rewardStartMonth}
                    onChange={(e) => setRewardStartMonth(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Masa Waktu (Durasi)</label>
                  <select
                    value={rewardDuration}
                    onChange={(e) => setRewardDuration(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
                  >
                    <option value={1}>1 Bulan Bebas Iuran</option>
                    <option value={2}>2 Bulan Bebas Iuran</option>
                    <option value={3}>3 Bulan Bebas Iuran (1 Triwulan)</option>
                    <option value={6}>6 Bulan Bebas Iuran (1 Semester)</option>
                    <option value={12}>12 Bulan Bebas Iuran (1 Tahun)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[11px] text-slate-400 block">Ringkasan Pemberian Fasilitas:</span>
                <p className="text-white font-semibold">
                  Bebas Iuran selama <strong className="text-amber-400">{rewardDuration} Bulan</strong> mulai periode{' '}
                  <strong className="text-emerald-400">{rewardStartMonth}</strong>.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Terapkan Reward Masa Waktu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PENGATURAN TARIF IURAN BULANAN PB HEVINDO */}
      {/* ======================================================== */}
      {isFeeSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-cyan-950/40">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Pengaturan Tarif Iuran Bulanan PB Hevindo</h3>
                  <p className="text-[11px] text-slate-400">Atur nominal standar iuran per bulan untuk tiap kelas pembinaan</p>
                </div>
              </div>
              <button
                onClick={() => setIsFeeSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFeeSettings} className="p-5 space-y-4 text-xs">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-emerald-400">
                      <span>🌱 Program Pembibitan</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Usia Dini / Pemula Dasar</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={editFeeForm.Pembibitan}
                      onChange={(e) =>
                        setEditFeeForm((prev) => ({ ...prev, Pembibitan: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Terformat: {formatRupiah(editFeeForm.Pembibitan)} / bulan</p>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-blue-400">
                      <span>🏸 Program Regular</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Anak-anak & Remaja</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={editFeeForm.Regular}
                      onChange={(e) =>
                        setEditFeeForm((prev) => ({ ...prev, Regular: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Terformat: {formatRupiah(editFeeForm.Regular)} / bulan</p>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-purple-400">
                      <span>🏆 Program Pusdiklat</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Taruna, Dewasa & Atlet Prestasi</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={editFeeForm.Pusdiklat}
                      onChange={(e) =>
                        setEditFeeForm((prev) => ({ ...prev, Pusdiklat: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Terformat: {formatRupiah(editFeeForm.Pusdiklat)} / bulan</p>
                </div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-200 flex items-center space-x-1">
                  <span>💡 Informasi Kebijakan Tarif:</span>
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Perubahan tarif akan disimpan otomatis ke sistem dan langsung menjadi acuan otomatis saat input pembayaran massal, pelunasan multi-bulan, kalkulator tunggakan, serta pendaftaran jadwal latihan baru.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetDefaultFees}
                  className="text-xs text-slate-400 hover:text-amber-400 underline transition"
                >
                  ↺ Reset ke Standar Hevindo
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsFeeSettingsModalOpen(false)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-cyan-950/40 flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Tarif Baru</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
