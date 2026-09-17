import React, { useState, useMemo } from 'react';
import { Building, CourtRental, UserRole, TimeSlotPeriod } from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  matchesMultiFieldSearch,
  sortData,
  exportToCSV,
} from '../../utils/helpers';
import {
  Building2,
  Calendar,
  Clock,
  Plus,
  Search,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText,
  Printer,
  Download,
  Sunrise,
  Sun,
  Moon,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  MapPin,
  Edit2,
} from 'lucide-react';

interface CourtRentalsPortalProps {
  buildings: Building[];
  rentals: CourtRental[];
  onAddRental: (rental: CourtRental) => void;
  onUpdateRental: (rental: CourtRental) => void;
  onDeleteRental: (id: string) => void;
  onAddBuilding: (building: Building) => void;
  onUpdateBuilding: (building: Building) => void;
  onDeleteBuilding?: (id: string) => void;
  currentRole: UserRole;
}

export const CourtRentalsPortal: React.FC<CourtRentalsPortalProps> = ({
  buildings = [],
  rentals = [],
  onAddRental,
  onUpdateRental,
  onDeleteRental,
  onAddBuilding,
  onUpdateBuilding,
  onDeleteBuilding,
  currentRole,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'buildings' | 'matrix'>('bookings');

  // Filter & Search states for bookings
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [sortKey, setSortKey] = useState<keyof CourtRental>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRentalForInvoice, setSelectedRentalForInvoice] = useState<CourtRental | null>(null);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);

  // Edit Booking Modal State
  const [isEditRentalModalOpen, setIsEditRentalModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<CourtRental | null>(null);

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'rental' | 'building';
    id: string;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'rental',
    id: '',
    title: '',
    description: '',
  });

  // New Booking Form State
  const defaultBuilding = buildings[0] || null;
  const [newBooking, setNewBooking] = useState<{
    renterName: string;
    renterPhone: string;
    rentalType: 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan';
    buildingId: string;
    courtId: string;
    startDate: string;
    startTime: string;
    endTime: string;
    paymentStatus: 'Lunas' | 'DP / Panjar' | 'Belum Bayar';
    dpAmount: number;
    paymentMethod: 'Tunai' | 'Transfer Bank' | 'QRIS';
    notes: string;
  }>({
    renterName: '',
    renterPhone: '',
    rentalType: 'Harian',
    buildingId: defaultBuilding?.id || 'BLD-01',
    courtId: defaultBuilding?.courts[0]?.id || 'CRT-01',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '21:00',
    paymentStatus: 'Lunas',
    dpAmount: 0,
    paymentMethod: 'Transfer Bank',
    notes: '',
  });

  // Calculate session period & rate from time
  const selectedBuilding = useMemo(() => {
    return buildings.find((b) => b.id === newBooking.buildingId) || buildings[0];
  }, [buildings, newBooking.buildingId]);

  const availableCourts = useMemo(() => {
    return selectedBuilding?.courts || [];
  }, [selectedBuilding]);

  // Determine period (Pagi, Siang, Malam)
  const calculatedPeriod: TimeSlotPeriod = useMemo(() => {
    const startHour = parseInt(newBooking.startTime.split(':')[0] || '19', 10);
    if (startHour < 12) return 'Pagi';
    if (startHour < 18) return 'Siang';
    return 'Malam';
  }, [newBooking.startTime]);

  // Calculate day of week and weekend status
  const bookingDayOfWeek = useMemo(() => {
    if (!newBooking.startDate) return 1;
    const parts = newBooking.startDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.getDay(); // 0 = Minggu, 6 = Sabtu
    }
    return 1;
  }, [newBooking.startDate]);

  const isWeekend = useMemo(() => {
    return bookingDayOfWeek === 0 || bookingDayOfWeek === 6;
  }, [bookingDayOfWeek]);

  const dayNameIndo = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[bookingDayOfWeek] || 'Hari Kerja';
  }, [bookingDayOfWeek]);

  // Hourly price for this building, period, AND day type (Weekend vs Weekday)
  const hourlyRate = useMemo(() => {
    if (!selectedBuilding) return 50000;
    if (isWeekend) {
      if (calculatedPeriod === 'Pagi') {
        return selectedBuilding.rateMorningWeekend ?? (selectedBuilding.rateMorning ? selectedBuilding.rateMorning + 10000 : 55000);
      }
      if (calculatedPeriod === 'Siang') {
        return selectedBuilding.rateAfternoonWeekend ?? (selectedBuilding.rateAfternoon ? selectedBuilding.rateAfternoon + 15000 : 70000);
      }
      return selectedBuilding.rateEveningWeekend ?? (selectedBuilding.rateEvening ? selectedBuilding.rateEvening + 15000 : 95000);
    } else {
      if (calculatedPeriod === 'Pagi') {
        return selectedBuilding.rateMorningWeekday ?? selectedBuilding.rateMorning ?? 45000;
      }
      if (calculatedPeriod === 'Siang') {
        return selectedBuilding.rateAfternoonWeekday ?? selectedBuilding.rateAfternoon ?? 55000;
      }
      return selectedBuilding.rateEveningWeekday ?? selectedBuilding.rateEvening ?? 80000;
    }
  }, [selectedBuilding, calculatedPeriod, isWeekend]);

  // Duration hours
  const durationHours = useMemo(() => {
    const startHour = parseInt(newBooking.startTime.split(':')[0] || '19', 10);
    const endHour = parseInt(newBooking.endTime.split(':')[0] || '21', 10);
    const diff = endHour - startHour;
    return diff > 0 ? diff : 2;
  }, [newBooking.startTime, newBooking.endTime]);

  const calculatedTotal = hourlyRate * durationHours;
  const calculatedRemaining =
    newBooking.paymentStatus === 'DP / Panjar'
      ? Math.max(0, calculatedTotal - (newBooking.dpAmount || 0))
      : newBooking.paymentStatus === 'Belum Bayar'
      ? calculatedTotal
      : 0;

  // Filtered rentals
  const safeRentals = rentals || [];
  const filteredRentals = useMemo(() => {
    return safeRentals.filter((r) => {
      if (filterBuilding !== 'all' && r.buildingId !== filterBuilding) return false;
      if (filterPayment !== 'all' && r.paymentStatus !== filterPayment) return false;
      if (filterPeriod !== 'all' && r.timeSlotPeriod !== filterPeriod) return false;
      return matchesMultiFieldSearch(searchQuery, [
        r.bookingCode,
        r.renterName,
        r.renterPhone,
        r.buildingName,
        r.courtName,
        r.timeSlot,
        r.timeSlotPeriod,
        r.paymentStatus,
        r.paymentMethod,
      ]);
    });
  }, [safeRentals, filterBuilding, filterPayment, filterPeriod, searchQuery]);

  const sortedRentals = useMemo(() => {
    return sortData(filteredRentals, sortKey, sortDirection);
  }, [filteredRentals, sortKey, sortDirection]);

  // Summary statistics
  const totalOmzet = useMemo(() => {
    return safeRentals
      .filter((r) => r.paymentStatus === 'Lunas')
      .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  }, [safeRentals]);

  const totalDP = useMemo(() => {
    return safeRentals
      .filter((r) => r.paymentStatus === 'DP / Panjar')
      .reduce((acc, curr) => acc + (curr.dpAmount || 0), 0);
  }, [safeRentals]);

  const unpaidRentalsCount = useMemo(() => {
    return safeRentals.filter((r) => r.paymentStatus === 'Belum Bayar' || r.paymentStatus === 'DP / Panjar').length;
  }, [safeRentals]);

  const handleSort = (key: keyof CourtRental) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.renterName.trim()) {
      alert('Mohon masukkan nama penyewa.');
      return;
    }

    const court = availableCourts.find((c) => c.id === newBooking.courtId) || availableCourts[0];
    const courtNameStr = court ? court.name : 'Lapangan 1';

    const bookingItem: CourtRental = {
      id: `RENT-${Date.now().toString().slice(-6)}`,
      bookingCode: `SW-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      renterName: newBooking.renterName,
      renterPhone: newBooking.renterPhone,
      rentalType: newBooking.rentalType,
      buildingId: selectedBuilding?.id || 'BLD-01',
      buildingName: selectedBuilding?.name || 'Gedung Utama (GOR Hevindo Pusat)',
      courtId: court ? court.id : 'CRT-01',
      courtName: courtNameStr,
      startDate: newBooking.startDate,
      timeSlotPeriod: calculatedPeriod,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      timeSlot: `${newBooking.startTime} - ${newBooking.endTime} (${calculatedPeriod})`,
      durationHours: durationHours,
      pricePerHour: hourlyRate,
      pricePerUnit: calculatedTotal,
      totalPrice: calculatedTotal,
      status: 'Aktif',
      isWeekend: isWeekend,
      dayType: isWeekend ? 'Akhir Pekan (Sabtu - Minggu)' : 'Hari Kerja (Senin - Jumat)',
      paymentStatus: newBooking.paymentStatus,
      dpAmount: newBooking.paymentStatus === 'DP / Panjar' ? newBooking.dpAmount : undefined,
      remainingAmount: calculatedRemaining,
      paymentMethod: newBooking.paymentMethod,
      notes: newBooking.notes,
    };

    onAddRental(bookingItem);
    setIsAddModalOpen(false);
    // Reset
    setNewBooking({
      renterName: '',
      renterPhone: '',
      rentalType: 'Harian',
      buildingId: selectedBuilding?.id || 'BLD-01',
      courtId: availableCourts[0]?.id || 'CRT-01',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '19:00',
      endTime: '21:00',
      paymentStatus: 'Lunas',
      dpAmount: 0,
      paymentMethod: 'Transfer Bank',
      notes: '',
    });
  };

  const handlePelunasan = (rental: CourtRental) => {
    onUpdateRental({
      ...rental,
      paymentStatus: 'Lunas',
      dpAmount: undefined,
      remainingAmount: 0,
    });
  };

  const handleQuickPaymentStatus = (rental: CourtRental, newStatus: 'Lunas' | 'DP / Panjar' | 'Belum Bayar') => {
    let dp = rental.dpAmount;
    let rem = rental.remainingAmount;
    if (newStatus === 'Lunas') {
      dp = undefined;
      rem = 0;
    } else if (newStatus === 'DP / Panjar') {
      dp = rental.dpAmount || Math.round(rental.totalPrice / 2);
      rem = rental.totalPrice - dp;
    } else {
      dp = 0;
      rem = rental.totalPrice;
    }
    onUpdateRental({
      ...rental,
      paymentStatus: newStatus,
      dpAmount: dp,
      remainingAmount: rem,
    });
  };

  const handleOpenEditRental = (rental: CourtRental) => {
    setEditingRental({ ...rental });
    setIsEditRentalModalOpen(true);
  };

  const handleSaveEditRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRental) return;
    onUpdateRental(editingRental);
    setIsEditRentalModalOpen(false);
    setEditingRental(null);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'rental') {
      onDeleteRental(deleteConfirm.id);
    } else if (deleteConfirm.type === 'building' && onDeleteBuilding) {
      onDeleteBuilding(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, type: 'rental', id: '', title: '', description: '' });
  };

  const handleAddCourtToEditingBuilding = () => {
    if (!editingBuilding) return;
    const courtNumber = (editingBuilding.courts?.length || 0) + 1;
    const newCourt = {
      id: `CRT-${Date.now().toString().slice(-4)}`,
      name: `Lapangan ${courtNumber}`,
      buildingId: editingBuilding.id,
      buildingName: editingBuilding.name,
      surfaceType: 'Karpet Vinyl BWF',
      isActive: true,
    };
    setEditingBuilding({
      ...editingBuilding,
      courts: [...(editingBuilding.courts || []), newCourt],
    });
  };

  const handleRemoveCourtFromEditingBuilding = (courtId: string) => {
    if (!editingBuilding) return;
    setEditingBuilding({
      ...editingBuilding,
      courts: editingBuilding.courts.filter((c) => c.id !== courtId),
    });
  };

  const handleSaveBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding) return;
    if (!editingBuilding.name.trim()) {
      alert('Nama gedung wajib diisi.');
      return;
    }

    const exists = buildings.some((b) => b.id === editingBuilding.id);
    if (exists) {
      onUpdateBuilding(editingBuilding);
    } else {
      onAddBuilding(editingBuilding);
    }
    setIsBuildingModalOpen(false);
    setEditingBuilding(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl text-indigo-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Manajemen Sewa Lapangan & Multi-Gedung
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Sistem Terpisah
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pengelolaan gedung GOR Hevindo, variasi tarif waktu (Pagi, Siang, Malam), booking lapangan & ketersediaan jadwal.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-950/50 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Booking Sewa</span>
            </button>
            <button
              onClick={() =>
                exportToCSV(safeRentals, 'Data_Sewa_Lapangan_Hevindo', {
                  bookingCode: 'Kode Booking',
                  renterName: 'Nama Penyewa',
                  renterPhone: 'No Telepon',
                  buildingName: 'Gedung',
                  courtName: 'Lapangan',
                  startDate: 'Tanggal Sewa',
                  timeSlot: 'Sesi Waktu',
                  totalPrice: 'Total Biaya',
                  paymentStatus: 'Status Pembayaran',
                })
              }
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center space-x-1"
              title="Ekspor CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'bookings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daftar Booking Sewa ({safeRentals.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('buildings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'buildings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Kelola Gedung & Tarif ({buildings.length} Gedung)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Matriks Ketersediaan Lapangan</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DAFTAR BOOKING SEWA */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">Total Booking Sewa</span>
              <span className="text-xl font-black text-white mt-1 block">{safeRentals.length} Transaksi</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Harian, Mingguan & Member</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-emerald-400 font-semibold block">Omzet Sewa Lunas</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">{formatRupiah(totalOmzet)}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Dana masuk terkonfirmasi</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-amber-400 font-semibold block">Total DP / Panjar</span>
              <span className="text-xl font-black text-amber-400 mt-1 block">{formatRupiah(totalDP)}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Uang muka booking aktif</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-rose-400 font-semibold block">Perlu Pelunasan</span>
              <span className="text-xl font-black text-rose-400 mt-1 block">{unpaidRentalsCount} Booking</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Status DP / Belum Bayar</span>
            </div>
          </div>

          {/* Table Controls (Search, Filters, Sort) */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Space-separated live search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari nama penyewa, gedung, lapangan, kode booking (pisahkan dengan spasi)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Building filter */}
              <select
                value={filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
                className="w-full md:w-48 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Semua Gedung</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Sesi waktu filter (Pagi, Siang, Malam) */}
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="w-full md:w-36 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Semua Sesi</option>
                <option value="Pagi">Pagi (06-12)</option>
                <option value="Siang">Siang (12-18)</option>
                <option value="Malam">Malam (18-24)</option>
              </select>

              {/* Payment Status filter */}
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full md:w-36 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Status Bayar</option>
                <option value="Lunas">Lunas</option>
                <option value="DP / Panjar">DP / Panjar</option>
                <option value="Belum Bayar">Belum Bayar</option>
              </select>
            </div>
          </div>

          {/* Booking Rentals Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 select-none">
                  <tr>
                    <th
                      onClick={() => handleSort('bookingCode')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white transition"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Kode Booking</span>
                        {sortKey === 'bookingCode' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-indigo-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('renterName')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white transition"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Penyewa / Kontak</span>
                        {sortKey === 'renterName' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-indigo-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('buildingName')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white transition"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Gedung & Lapangan</span>
                        {sortKey === 'buildingName' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-indigo-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('startDate')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white transition"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Jadwal & Sesi</span>
                        {sortKey === 'startDate' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-indigo-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('totalPrice')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white transition text-right"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Tarif / Total</span>
                        {sortKey === 'totalPrice' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-indigo-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th className="p-3.5 font-bold text-center">Status Pembayaran</th>
                    <th className="p-3.5 font-bold text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {sortedRentals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Tidak ada transaksi sewa lapangan yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    sortedRentals.map((r) => {
                      const period = r.timeSlotPeriod || (r.timeSlot.includes('Malam') ? 'Malam' : r.timeSlot.includes('Pagi') ? 'Pagi' : 'Siang');
                      return (
                        <tr key={r.id} className="hover:bg-slate-850/60 transition">
                          <td className="p-3.5 font-mono text-[11px] text-indigo-400 font-bold">
                            {r.bookingCode}
                            <span className="block text-[10px] text-slate-500 font-normal">
                              Tipe: {r.rentalType}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-white block">{r.renterName}</span>
                            <span className="text-[11px] text-slate-400">{r.renterPhone}</span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-semibold text-slate-200 block">
                              {r.buildingName || 'GOR Hevindo'}
                            </span>
                            <span className="text-[11px] text-indigo-400 font-medium">
                              {r.courtName}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center space-x-1.5 text-white">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{formatIndonesianDate(r.startDate)}</span>
                              {r.isWeekend || r.dayType?.includes('Weekend') ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Weekend
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800 text-slate-400">
                                  Weekday
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                              {period === 'Pagi' ? (
                                <Sunrise className="w-3 h-3 text-amber-400" />
                              ) : period === 'Siang' ? (
                                <Sun className="w-3 h-3 text-yellow-400" />
                              ) : (
                                <Moon className="w-3 h-3 text-indigo-400" />
                              )}
                              <span>{r.timeSlot}</span>
                            </div>
                          </td>

                          <td className="p-3.5 text-right font-mono">
                            <span className="font-bold text-white block">
                              {formatRupiah(r.totalPrice)}
                            </span>
                            {r.pricePerHour && (
                              <span className="text-[10px] text-slate-500 block">
                                @{formatRupiah(r.pricePerHour)}/jam ({r.durationHours} jam)
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center space-y-1">
                              <select
                                value={r.paymentStatus}
                                onChange={(e) =>
                                  handleQuickPaymentStatus(r, e.target.value as 'Lunas' | 'DP / Panjar' | 'Belum Bayar')
                                }
                                className={`text-[10px] font-bold rounded-lg px-2 py-1 bg-slate-900 border cursor-pointer focus:outline-none transition ${
                                  r.paymentStatus === 'Lunas'
                                    ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                                    : r.paymentStatus === 'DP / Panjar'
                                    ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                                    : 'text-rose-300 border-rose-500/40 bg-rose-500/10'
                                }`}
                                title="Ubah status bayar (Langsung tersimpan di Supabase)"
                              >
                                <option value="Lunas">Lunas</option>
                                <option value="DP / Panjar">DP / Panjar</option>
                                <option value="Belum Bayar">Belum Bayar</option>
                              </select>
                              {r.paymentStatus === 'DP / Panjar' && r.remainingAmount ? (
                                <span className="block text-[10px] text-rose-400 font-mono">
                                  Sisa: {formatRupiah(r.remainingAmount)}
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {r.paymentStatus === 'DP / Panjar' && (
                                <button
                                  onClick={() => handlePelunasan(r)}
                                  className="px-2 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-[10px] font-bold transition"
                                  title="Konfirmasi Pelunasan Sisa"
                                >
                                  Lunasi
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditRental(r)}
                                className="p-1.5 bg-slate-800 text-slate-300 hover:text-indigo-300 hover:bg-slate-700 rounded-lg transition"
                                title="Edit Booking Sewa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedRentalForInvoice(r)}
                                className="p-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                                title="Cetak Bukti Sewa / Invoice"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'rental',
                                    id: r.id,
                                    title: 'Batalkan Sewa Lapangan',
                                    description: `Yakin ingin membatalkan & menghapus transaksi sewa ${r.bookingCode} atas nama ${r.renterName}? Data akan dihapus dari Supabase.`,
                                  })
                                }
                                className="p-1.5 bg-slate-800 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition"
                                title="Batalkan / Hapus Booking"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* SUB-TAB 2: KELOLA GEDUNG, LAPANGAN & VARIASI TARIF */}
      {activeSubTab === 'buildings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Daftar Gedung & Skema Tarif Sewa</h2>
              <p className="text-xs text-slate-400">
                Setiap gedung memiliki jumlah lapangan dan tarif sewa jam yang dapat disesuaikan per waktu (Pagi, Siang, Malam).
              </p>
            </div>
            <button
              onClick={() => {
                setEditingBuilding({
                  id: `BLD-${Date.now().toString().slice(-4)}`,
                  name: '',
                  address: '',
                  description: '',
                  rateMorning: 40000,
                  rateAfternoon: 50000,
                  rateEvening: 70000,
                  courts: [
                    {
                      id: `CRT-${Date.now().toString().slice(-4)}`,
                      name: 'Lapangan 1',
                      buildingId: '',
                      buildingName: '',
                      surfaceType: 'Karpet Vinyl BWF',
                      isActive: true,
                    },
                  ],
                });
                setIsBuildingModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Gedung Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buildings.map((bld) => (
              <div
                key={bld.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold block">{bld.id}</span>
                      <h3 className="text-base font-black text-white mt-0.5">{bld.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{bld.address}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingBuilding(bld);
                          setIsBuildingModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                        title="Edit Gedung & Lapangan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteBuilding && (
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              type: 'building',
                              id: bld.id,
                              title: 'Hapus Gedung Olahraga',
                              description: `Apakah Anda yakin ingin menghapus gedung "${bld.name}" berserta ${bld.courts.length} lapangannya? Data akan dihapus dari Supabase.`,
                            })
                          }
                          className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
                          title="Hapus Gedung & Lapangan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{bld.description}</p>

                  {/* Tarif Sesi Waktu: Hari Biasa vs Akhir Pekan */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Variasi Tarif Sewa per Jam:
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                        Weekday & Weekend
                      </span>
                    </div>

                    {/* Skema 1: Hari Kerja / Weekday */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                        <span>💼 Hari Kerja (Senin - Jumat):</span>
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">Pagi (06-12)</span>
                          <span className="font-mono font-bold text-white block">
                            {formatRupiah(bld.rateMorningWeekday ?? bld.rateMorning)}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">Siang (12-18)</span>
                          <span className="font-mono font-bold text-white block">
                            {formatRupiah(bld.rateAfternoonWeekday ?? bld.rateAfternoon)}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">Malam (18-24)</span>
                          <span className="font-mono font-bold text-white block">
                            {formatRupiah(bld.rateEveningWeekday ?? bld.rateEvening)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Skema 2: Akhir Pekan / Weekend */}
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-800/60">
                      <span className="text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                        <span>🎉 Akhir Pekan (Sabtu - Minggu / Libur):</span>
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="p-1.5 rounded bg-amber-950/20 border border-amber-800/40">
                          <span className="text-amber-400/80 block text-[9px]">Pagi (06-12)</span>
                          <span className="font-mono font-bold text-amber-300 block">
                            {formatRupiah(bld.rateMorningWeekend ?? ((bld.rateMorning || 45000) + 10000))}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-amber-950/20 border border-amber-800/40">
                          <span className="text-amber-400/80 block text-[9px]">Siang (12-18)</span>
                          <span className="font-mono font-bold text-amber-300 block">
                            {formatRupiah(bld.rateAfternoonWeekend ?? ((bld.rateAfternoon || 55000) + 15000))}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-amber-950/20 border border-amber-800/40">
                          <span className="text-amber-400/80 block text-[9px]">Malam (18-24)</span>
                          <span className="font-mono font-bold text-amber-300 block">
                            {formatRupiah(bld.rateEveningWeekend ?? ((bld.rateEvening || 80000) + 15000))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daftar Lapangan */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">
                        Daftar Lapangan ({bld.courts.length} Court):
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {bld.courts.map((crt) => (
                        <div
                          key={crt.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-800 text-xs"
                        >
                          <span className="font-semibold text-white">{crt.name}</span>
                          <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                            {crt.surfaceType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Status: <strong className="text-emerald-400">Aktif Beroperasi</strong></span>
                  <span className="font-mono">{bld.courts.length} Lapangan Siap Pakai</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MATRIKS KETERSEDIAAN LAPANGAN */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Papan Jadwal Ketersediaan Lapangan Real-Time</h3>
              <p className="text-xs text-slate-400">
                Pilih gedung dan tanggal untuk meninjau ketersediaan slot jam lapangan.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={filterBuilding === 'all' ? buildings[0]?.id : filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Tersedia</span>
                </span>
                <span className="flex items-center space-x-1 text-rose-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>Terisi Sewa</span>
                </span>
                <span className="flex items-center space-x-1 text-cyan-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                  <span>Latihan Hevindo</span>
                </span>
              </div>
            </div>
          </div>

          {/* Matrix Board */}
          {(() => {
            const activeBld = buildings.find((b) => b.id === (filterBuilding === 'all' ? buildings[0]?.id : filterBuilding)) || buildings[0];
            const hours = [
              '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
              '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
              '19:00', '20:00', '21:00', '22:00', '23:00'
            ];

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-x-auto shadow-xl">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
                  {activeBld?.name} • Matriks Slot Waktu Hari Ini
                </h4>

                <div className="min-w-[700px] space-y-3">
                  {activeBld?.courts.map((court, idx) => (
                    <div key={court.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                            Court {idx + 1}
                          </span>
                          <span>{court.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-500">{court.surfaceType}</span>
                      </div>

                      {/* Hour slots */}
                      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-17 gap-1.5 text-center">
                        {hours.map((hr) => {
                          const hourNum = parseInt(hr.split(':')[0], 10);
                          // Sample mock occupancy based on hour
                          const isBooked = (hourNum >= 19 && hourNum <= 21) || (idx === 0 && hourNum === 8);
                          const isTraining = hourNum >= 14 && hourNum <= 17 && idx === 1;

                          return (
                            <div
                              key={hr}
                              className={`p-1.5 rounded text-[10px] font-mono transition ${
                                isBooked
                                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold'
                                  : isTraining
                                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-emerald-500 hover:text-white cursor-pointer'
                              }`}
                              title={
                                isBooked
                                  ? `Terisi Sewa (${hr})`
                                  : isTraining
                                  ? `Latihan PB Hevindo (${hr})`
                                  : `Tersedia untuk Booking (${hr})`
                              }
                            >
                              <span className="block text-[9px] text-slate-500">{hr}</span>
                              <span className="block text-[10px]">
                                {isBooked ? 'SEWA' : isTraining ? 'PB' : 'FREE'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL: TAMBAH BOOKING SEWA BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Formulir Booking Sewa Lapangan</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Gedung & Lapangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Pilih Gedung</label>
                  <select
                    value={newBooking.buildingId}
                    onChange={(e) => {
                      const bld = buildings.find((b) => b.id === e.target.value);
                      setNewBooking({
                        ...newBooking,
                        buildingId: e.target.value,
                        courtId: bld?.courts[0]?.id || '',
                      });
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Pilih Lapangan</label>
                  <select
                    value={newBooking.courtId}
                    onChange={(e) => setNewBooking({ ...newBooking, courtId: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {availableCourts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.surfaceType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tanggal & Waktu Sewa */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Tanggal Sewa</label>
                    <input
                      type="date"
                      value={newBooking.startDate}
                      onChange={(e) => setNewBooking({ ...newBooking, startDate: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={newBooking.startTime}
                      onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      value={newBooking.endTime}
                      onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      required
                    />
                  </div>
                </div>

                {/* Day of week & Day Type Badge */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="text-slate-300">
                      Hari: <strong className="text-white">{dayNameIndo}</strong>
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isWeekend
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {isWeekend ? '🎉 Akhir Pekan (Weekend)' : '💼 Hari Kerja (Weekday)'}
                  </span>
                </div>
              </div>

              {/* Automatic Calculation Indicator with Weekend/Weekday clarity */}
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-indigo-300 font-bold block uppercase">
                    Kalkulasi Otomatis Tarif:
                  </span>
                  <span className="font-bold text-white block">
                    Sesi {calculatedPeriod} ({durationHours} Jam) • Tarif {isWeekend ? 'Akhir Pekan' : 'Hari Kerja'}: {formatRupiah(hourlyRate)}/jam
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {durationHours} jam × {formatRupiah(hourlyRate)} = {formatRupiah(calculatedTotal)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-300 font-bold block">Total Biaya:</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {formatRupiah(calculatedTotal)}
                  </span>
                </div>
              </div>

              {/* Data Penyewa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Nama Penyewa / Komunitas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk. Kurniawan / PB Sahabat"
                    value={newBooking.renterName}
                    onChange={(e) => setNewBooking({ ...newBooking, renterName: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={newBooking.renterPhone}
                    onChange={(e) => setNewBooking({ ...newBooking, renterPhone: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>
              </div>

              {/* Status Pembayaran & DP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Status Pembayaran</label>
                  <select
                    value={newBooking.paymentStatus}
                    onChange={(e) =>
                      setNewBooking({
                        ...newBooking,
                        paymentStatus: e.target.value as 'Lunas' | 'DP / Panjar' | 'Belum Bayar',
                      })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Lunas">Lunas Penuh</option>
                    <option value="DP / Panjar">DP / Panjar Uang Muka</option>
                    <option value="Belum Bayar">Belum Bayar</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Metode Pembayaran</label>
                  <select
                    value={newBooking.paymentMethod}
                    onChange={(e) =>
                      setNewBooking({
                        ...newBooking,
                        paymentMethod: e.target.value as 'Tunai' | 'Transfer Bank' | 'QRIS',
                      })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS Dinamis</option>
                    <option value="Tunai">Tunai di Kasir</option>
                  </select>
                </div>
              </div>

              {/* If DP selected, input DP amount */}
              {newBooking.paymentStatus === 'DP / Panjar' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-amber-300 block mb-1">
                      Nominal DP yang Dibayar:
                    </label>
                    <input
                      type="number"
                      value={newBooking.dpAmount}
                      onChange={(e) => setNewBooking({ ...newBooking, dpAmount: Number(e.target.value) })}
                      className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Sisa Pelunasan Nanti:</label>
                    <span className="text-sm font-black text-rose-400 font-mono block pt-1">
                      {formatRupiah(calculatedRemaining)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Sparing komunitas, butuh shuttlecock tambahan"
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/50"
                >
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT GEDUNG & TARIF */}
      {isBuildingModalOpen && editingBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Pengaturan Gedung & Variasi Tarif Sewa</h3>
              <button
                onClick={() => setIsBuildingModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBuilding} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Nama Gedung GOR</label>
                <input
                  type="text"
                  value={editingBuilding.name}
                  onChange={(e) => setEditingBuilding({ ...editingBuilding, name: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Alamat Gedung</label>
                <input
                  type="text"
                  value={editingBuilding.address}
                  onChange={(e) => setEditingBuilding({ ...editingBuilding, address: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Deskripsi Fasilitas</label>
                <textarea
                  value={editingBuilding.description}
                  onChange={(e) => setEditingBuilding({ ...editingBuilding, description: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white h-16"
                />
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3.5">
                <span className="text-[10px] font-bold uppercase text-indigo-300 block tracking-wider">
                  Pengaturan Variasi Tarif Sewa per Jam:
                </span>

                {/* Tarif Hari Kerja / Weekday */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 block">
                    💼 Hari Kerja (Senin - Jumat)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Pagi (06-12)</label>
                      <input
                        type="number"
                        value={editingBuilding.rateMorningWeekday ?? editingBuilding.rateMorning}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBuilding({
                            ...editingBuilding,
                            rateMorningWeekday: val,
                            rateMorning: val,
                          });
                        }}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Siang (12-18)</label>
                      <input
                        type="number"
                        value={editingBuilding.rateAfternoonWeekday ?? editingBuilding.rateAfternoon}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBuilding({
                            ...editingBuilding,
                            rateAfternoonWeekday: val,
                            rateAfternoon: val,
                          });
                        }}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Malam (18-24)</label>
                      <input
                        type="number"
                        value={editingBuilding.rateEveningWeekday ?? editingBuilding.rateEvening}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBuilding({
                            ...editingBuilding,
                            rateEveningWeekday: val,
                            rateEvening: val,
                          });
                        }}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarif Akhir Pekan / Weekend */}
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 block">
                    🎉 Akhir Pekan (Sabtu - Minggu / Libur Nasional)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-amber-400/80 block mb-1">Pagi (06-12)</label>
                      <input
                        type="number"
                        value={
                          editingBuilding.rateMorningWeekend ??
                          (editingBuilding.rateMorning ? editingBuilding.rateMorning + 10000 : 55000)
                        }
                        onChange={(e) =>
                          setEditingBuilding({
                            ...editingBuilding,
                            rateMorningWeekend: Number(e.target.value),
                          })
                        }
                        className="w-full p-1.5 bg-slate-950 border border-amber-900/50 rounded text-xs text-amber-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-400/80 block mb-1">Siang (12-18)</label>
                      <input
                        type="number"
                        value={
                          editingBuilding.rateAfternoonWeekend ??
                          (editingBuilding.rateAfternoon ? editingBuilding.rateAfternoon + 15000 : 70000)
                        }
                        onChange={(e) =>
                          setEditingBuilding({
                            ...editingBuilding,
                            rateAfternoonWeekend: Number(e.target.value),
                          })
                        }
                        className="w-full p-1.5 bg-slate-950 border border-amber-900/50 rounded text-xs text-amber-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-400/80 block mb-1">Malam (18-24)</label>
                      <input
                        type="number"
                        value={
                          editingBuilding.rateEveningWeekend ??
                          (editingBuilding.rateEvening ? editingBuilding.rateEvening + 15000 : 95000)
                        }
                        onChange={(e) =>
                          setEditingBuilding({
                            ...editingBuilding,
                            rateEveningWeekend: Number(e.target.value),
                          })
                        }
                        className="w-full p-1.5 bg-slate-950 border border-amber-900/50 rounded text-xs text-amber-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kelola Daftar Lapangan di Gedung Ini */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-300 tracking-wider">
                    Daftar Lapangan ({editingBuilding.courts?.length || 0} Court):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCourtToEditingBuilding}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Lapangan</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {(!editingBuilding.courts || editingBuilding.courts.length === 0) ? (
                    <p className="text-[11px] text-slate-500 italic py-1">Belum ada lapangan di gedung ini.</p>
                  ) : (
                    editingBuilding.courts.map((court, idx) => (
                      <div key={court.id || idx} className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <input
                          type="text"
                          value={court.name}
                          onChange={(e) => {
                            const updatedCourts = [...editingBuilding.courts];
                            updatedCourts[idx] = { ...updatedCourts[idx], name: e.target.value };
                            setEditingBuilding({ ...editingBuilding, courts: updatedCourts });
                          }}
                          placeholder="Nama Lapangan"
                          className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                        <select
                          value={court.surfaceType}
                          onChange={(e) => {
                            const updatedCourts = [...editingBuilding.courts];
                            updatedCourts[idx] = { ...updatedCourts[idx], surfaceType: e.target.value as any };
                            setEditingBuilding({ ...editingBuilding, courts: updatedCourts });
                          }}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        >
                          <option value="Karpet Vinyl BWF">Karpet Vinyl BWF</option>
                          <option value="Parket Kayu Standar BWF">Parket Kayu BWF</option>
                          <option value="Semen Halus">Semen Halus</option>
                          <option value="Interlock Modular">Interlock Modular</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveCourtFromEditingBuilding(court.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          title="Hapus Lapangan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBuildingModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Simpan Pengaturan Gedung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVOICE / BUKTI SEWA */}
      {selectedRentalForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Faktur Bukti Booking Sewa</h3>
              </div>
              <button
                onClick={() => setSelectedRentalForInvoice(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kode Booking:</span>
                  <span className="font-mono font-bold text-indigo-400">{selectedRentalForInvoice.bookingCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penyewa:</span>
                  <span className="font-bold text-white">{selectedRentalForInvoice.renterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kontak:</span>
                  <span className="text-slate-300">{selectedRentalForInvoice.renterPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gedung / Venue:</span>
                  <span className="text-slate-300">{selectedRentalForInvoice.buildingName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lapangan:</span>
                  <span className="font-bold text-white">{selectedRentalForInvoice.courtName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jadwal Sewa:</span>
                  <span className="text-slate-300">{formatIndonesianDate(selectedRentalForInvoice.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sesi Waktu:</span>
                  <span className="text-indigo-300 font-semibold">{selectedRentalForInvoice.timeSlot}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-black">
                  <span className="text-white">Total Tagihan:</span>
                  <span className="text-emerald-400 font-mono">{formatRupiah(selectedRentalForInvoice.totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">Status Bayar:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedRentalForInvoice.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedRentalForInvoice(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Faktur</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: EDIT BOOKING SEWA LAPANGAN */}
      {isEditRentalModalOpen && editingRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Edit Transaksi Booking Sewa</h3>
                <p className="text-xs text-indigo-400 font-mono">{editingRental.bookingCode}</p>
              </div>
              <button
                onClick={() => setIsEditRentalModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditRental} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nama Penyewa *</label>
                  <input
                    type="text"
                    required
                    value={editingRental.renterName}
                    onChange={(e) => setEditingRental({ ...editingRental, renterName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">No. HP / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={editingRental.renterPhone}
                    onChange={(e) => setEditingRental({ ...editingRental, renterPhone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tanggal Sewa</label>
                  <input
                    type="date"
                    required
                    value={editingRental.startDate}
                    onChange={(e) => setEditingRental({ ...editingRental, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Sesi Waktu</label>
                  <input
                    type="text"
                    value={editingRental.timeSlot}
                    onChange={(e) => setEditingRental({ ...editingRental, timeSlot: e.target.value })}
                    placeholder="19:00 - 21:00 (Malam)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Total Tarif (Rp)</label>
                  <input
                    type="number"
                    value={editingRental.totalPrice}
                    onChange={(e) => {
                      const total = Number(e.target.value);
                      const rem = editingRental.paymentStatus === 'Lunas' ? 0 : total - (editingRental.dpAmount || 0);
                      setEditingRental({ ...editingRental, totalPrice: total, remainingAmount: rem });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Status Pembayaran</label>
                  <select
                    value={editingRental.paymentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as 'Lunas' | 'DP / Panjar' | 'Belum Bayar';
                      let dp = editingRental.dpAmount;
                      let rem = editingRental.remainingAmount;
                      if (newStatus === 'Lunas') {
                        dp = undefined;
                        rem = 0;
                      } else if (newStatus === 'DP / Panjar') {
                        dp = editingRental.dpAmount || Math.round(editingRental.totalPrice / 2);
                        rem = editingRental.totalPrice - dp;
                      } else {
                        dp = 0;
                        rem = editingRental.totalPrice;
                      }
                      setEditingRental({
                        ...editingRental,
                        paymentStatus: newStatus,
                        dpAmount: dp,
                        remainingAmount: rem,
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="DP / Panjar">DP / Panjar</option>
                    <option value="Belum Bayar">Belum Bayar</option>
                  </select>
                </div>
              </div>

              {editingRental.paymentStatus === 'DP / Panjar' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div>
                    <label className="block text-amber-300 mb-1 font-semibold">Nominal DP (Rp)</label>
                    <input
                      type="number"
                      value={editingRental.dpAmount || 0}
                      onChange={(e) => {
                        const dp = Number(e.target.value);
                        setEditingRental({
                          ...editingRental,
                          dpAmount: dp,
                          remainingAmount: Math.max(0, editingRental.totalPrice - dp),
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-1 font-semibold">Sisa Pelunasan:</span>
                    <span className="text-sm font-bold text-rose-400 font-mono block pt-2">
                      {formatRupiah(editingRental.remainingAmount || 0)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Catatan</label>
                <input
                  type="text"
                  value={editingRental.notes || ''}
                  onChange={(e) => setEditingRental({ ...editingRental, notes: e.target.value })}
                  placeholder="Catatan sewa lapangan"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditRentalModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Simpan Perubahan ke Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS (RENTAL ATAU GEDUNG) */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-white text-sm">{deleteConfirm.title}</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{deleteConfirm.description}</p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, type: 'rental', id: '', title: '', description: '' })
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
