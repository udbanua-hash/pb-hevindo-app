import React, { useState, useMemo } from 'react';
import { Athlete, PBSIAgeCategory, TrainingCategory, UserRole, AthleteAchievement, ClubTransferHistory } from '../../types';
import {
  matchesMultiFieldSearch,
  sortData,
  calculatePBSICategory,
  formatRupiah,
  formatIndonesianDate,
  exportToCSV,
} from '../../utils/helpers';
import {
  Search,
  Plus,
  ArrowUpDown,
  Download,
  Trash2,
  Edit2,
  QrCode,
  Award,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Filter,
} from 'lucide-react';

interface AthletesTabProps {
  athletes: Athlete[];
  onAddAthlete: (athlete: Athlete) => void;
  onUpdateAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  currentRole: UserRole;
}

export const AthletesTab: React.FC<AthletesTabProps> = ({
  athletes,
  onAddAthlete,
  onUpdateAthlete,
  onDeleteAthlete,
  onBulkDelete,
  currentRole,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPBSICategory, setFilterPBSICategory] = useState<string>('all');
  const [filterTrainingCategory, setFilterTrainingCategory] = useState<string>('all');
  const [filterDuesStatus, setFilterDuesStatus] = useState<string>('all');

  // Sorting state
  const [sortKey, setSortKey] = useState<keyof Athlete>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [activeQRModalAthlete, setActiveQRModalAthlete] = useState<Athlete | null>(null);
  const [activeAchievementModalAthlete, setActiveAchievementModalAthlete] = useState<Athlete | null>(null);
  const [activeTransferModalAthlete, setActiveTransferModalAthlete] = useState<Athlete | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Athlete>>({
    name: '',
    idPb: '',
    nik: '',
    gender: 'Putra',
    birthPlace: 'Pekanbaru',
    birthDate: '2014-01-01',
    trainingCategory: 'Pembibitan',
    clubId: 'CLB-001',
    clubName: 'PB Hevindo',
    parentName: '',
    phoneNumber: '',
    address: '',
    isActive: true,
    duesStatus: 'Belum Bayar',
  });

  // Allow edit for all roles except read-only Publik
  const canEdit = currentRole !== 'Publik';

  // Filter & Search logic using multi-field space separated search
  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) => {
      // Category filters
      if (filterPBSICategory !== 'all' && athlete.ageCategory !== filterPBSICategory) return false;
      if (filterTrainingCategory !== 'all' && athlete.trainingCategory !== filterTrainingCategory) return false;
      if (filterDuesStatus !== 'all' && athlete.duesStatus !== filterDuesStatus) return false;

      // Multi-field search
      return matchesMultiFieldSearch(searchQuery, [
        athlete.id,
        athlete.idPb,
        athlete.nik,
        athlete.name,
        athlete.gender,
        athlete.ageCategory,
        athlete.trainingCategory,
        athlete.clubName,
        athlete.parentName,
        athlete.duesStatus,
        athlete.isActive ? 'aktif' : 'nonaktif',
      ]);
    });
  }, [athletes, searchQuery, filterPBSICategory, filterTrainingCategory, filterDuesStatus]);

  // Sorted
  const sortedAthletes = useMemo(() => {
    return sortData(filteredAthletes, sortKey, sortDirection);
  }, [filteredAthletes, sortKey, sortDirection]);

  // Paginated
  const totalPages = Math.ceil(sortedAthletes.length / pageSize) || 1;
  const paginatedAthletes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAthletes.slice(start, start + pageSize);
  }, [sortedAthletes, currentPage, pageSize]);

  // Handle sort header click
  const handleSort = (key: keyof Athlete) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Selection helpers
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedAthletes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedAthletes.map((a) => a.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultBirth = '2014-05-15';
    const pbsi = calculatePBSICategory(defaultBirth);
    setEditingAthlete(null);
    setFormData({
      id: `ATL-0${athletes.length + 1}`.padStart(7, '0'),
      idPb: `PBSI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      nik: `147101${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      name: '',
      gender: 'Putra',
      birthPlace: 'Pekanbaru',
      birthDate: defaultBirth,
      ageCategory: pbsi.category,
      trainingCategory: 'Pembibitan',
      clubId: 'CLB-001',
      clubName: 'PB Hevindo',
      parentName: '',
      phoneNumber: '',
      address: '',
      isActive: true,
      duesStatus: 'Belum Bayar',
      achievements: [],
      transferHistory: [],
      joinDate: new Date().toISOString().split('T')[0],
      qrCodeToken: `HEV-QR-${Date.now()}`,
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setFormData({ ...athlete });
    setIsFormModalOpen(true);
  };

  // Save Athlete
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate) {
      alert('Nama dan Tanggal Lahir wajib diisi!');
      return;
    }

    const { category } = calculatePBSICategory(formData.birthDate);
    const athletePayload: Athlete = {
      id: editingAthlete ? editingAthlete.id : formData.id || `ATL-${Date.now()}`,
      idPb: formData.idPb || 'PBSI-GEN',
      nik: formData.nik || '-',
      name: formData.name,
      gender: formData.gender as any,
      birthPlace: formData.birthPlace || 'Pekanbaru',
      birthDate: formData.birthDate,
      ageCategory: category,
      trainingCategory: formData.trainingCategory as TrainingCategory,
      clubId: formData.clubId || 'CLB-001',
      clubName: formData.clubName || 'PB Hevindo',
      parentName: formData.parentName || '-',
      phoneNumber: formData.phoneNumber || '-',
      address: formData.address || '-',
      isActive: formData.isActive ?? true,
      duesStatus: formData.duesStatus as any,
      achievements: editingAthlete?.achievements || [],
      transferHistory: editingAthlete?.transferHistory || [],
      joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
      qrCodeToken: editingAthlete?.qrCodeToken || `HEV-QR-${Date.now()}`,
    };

    if (editingAthlete) {
      onUpdateAthlete(athletePayload);
    } else {
      onAddAthlete(athletePayload);
    }
    setIsFormModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    exportToCSV(
      athletes.map((a) => ({
        'ID Atlet': a.id,
        'No PBSI': a.idPb,
        'NIK': a.nik,
        'Nama Lengkap': a.name,
        'Jenis Kelamin': a.gender,
        'Kategori Usia PBSI': a.ageCategory,
        'Kategori Latihan': a.trainingCategory,
        'Klub Asal': a.clubName,
        'Nama Orang Tua': a.parentName,
        'No Telepon': a.phoneNumber,
        'Status Aktif': a.isActive ? 'Aktif' : 'Nonaktif',
        'Status Iuran': a.duesStatus,
        'Total Prestasi': (a.achievements || []).length,
      })),
      'Database_Atlet_HEVINDO_PBSI'
    );
  };

  // Achievement add handler
  const [newAchievement, setNewAchievement] = useState<{
    tournamentName: string;
    year: number;
    category: string;
    position: 'Juara 1' | 'Juara 2' | 'Juara 3 / Semifinalis';
  }>({
    tournamentName: '',
    year: 2026,
    category: 'Tunggal Putra',
    position: 'Juara 1',
  });

  const handleAddAchievement = () => {
    if (!activeAchievementModalAthlete || !newAchievement.tournamentName) return;
    const updated: Athlete = {
      ...activeAchievementModalAthlete,
      achievements: [
        ...activeAchievementModalAthlete.achievements,
        {
          id: `ACH-${Date.now()}`,
          ...newAchievement,
          dateAchieved: new Date().toISOString().split('T')[0],
        },
      ],
    };
    onUpdateAthlete(updated);
    setActiveAchievementModalAthlete(updated);
    setNewAchievement({
      tournamentName: '',
      year: 2026,
      category: 'Tunggal Putra',
      position: 'Juara 1',
    });
  };

  // Transfer club handler
  const [newTransfer, setNewTransfer] = useState<{
    toClub: string;
    type: 'Masuk' | 'Keluar' | 'Pindah Kategori';
    notes: string;
  }>({
    toClub: '',
    type: 'Pindah Kategori',
    notes: '',
  });

  const handleAddTransfer = () => {
    if (!activeTransferModalAthlete || !newTransfer.toClub) return;
    const updated: Athlete = {
      ...activeTransferModalAthlete,
      clubName: newTransfer.type === 'Keluar' ? newTransfer.toClub : activeTransferModalAthlete.clubName,
      transferHistory: [
        ...activeTransferModalAthlete.transferHistory,
        {
          id: `TRF-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          fromClub: activeTransferModalAthlete.clubName,
          toClub: newTransfer.toClub,
          type: newTransfer.type,
          notes: newTransfer.notes,
        },
      ],
    };
    onUpdateAthlete(updated);
    setActiveTransferModalAthlete(updated);
    setNewTransfer({ toClub: '', type: 'Pindah Kategori', notes: '' });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar with Title, Total Count, and "+ Tambah Atlet Baru" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-850 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏸</span>
            <h2 className="text-base font-bold text-white tracking-wide">Data Atlet PB HEVINDO & PBSI</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {athletes.length} Atlet Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data master atlet tersinkronisasi langsung dengan database Supabase (tabel <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">atlet</code>).
          </p>
        </div>

        <button
          id="btn-add-athlete-top"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Atlet Baru</span>
        </button>
      </div>

      {/* Top Toolbar: Search, Filters, Bulk Actions, Add */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Multi-field Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-athletes"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Live search multi-field (misal: budi pemula aktif, pisahkan dengan spasi)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {selectedIds.length > 0 && canEdit && (
              <button
                id="btn-bulk-delete-athletes"
                onClick={() => {
                  if (confirm(`Hapus ${selectedIds.length} atlet terpilih?`)) {
                    onBulkDelete(selectedIds);
                    setSelectedIds([]);
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Terpilih ({selectedIds.length})</span>
              </button>
            )}

            <button
              id="btn-export-athletes-csv"
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
              title="Ekspor Data Atlet ke CSV/Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor Excel/CSV</span>
            </button>

            {canEdit && (
              <button
                id="btn-add-athlete"
                onClick={handleOpenAddModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-900/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Atlet Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-1 text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Cepat:</span>
          </div>

          {/* PBSI Category Filter */}
          <select
            id="filter-pbsi-category"
            value={filterPBSICategory}
            onChange={(e) => {
              setFilterPBSICategory(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Kategori PBSI</option>
            <option value="Usia Dini (U-11)">Usia Dini (U-11)</option>
            <option value="Anak-anak (U-13)">Anak-anak (U-13)</option>
            <option value="Pemula (U-15)">Pemula (U-15)</option>
            <option value="Remaja (U-17)">Remaja (U-17)</option>
            <option value="Taruna (U-19)">Taruna (U-19)</option>
            <option value="Dewasa">Dewasa</option>
          </select>

          {/* Training Category Filter */}
          <select
            id="filter-training-category"
            value={filterTrainingCategory}
            onChange={(e) => {
              setFilterTrainingCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Program Latihan</option>
            <option value="Pembibitan">Pembibitan (Hevindo 1)</option>
            <option value="Regular">Regular (Hevindo 2 & Arena)</option>
            <option value="Pusdiklat">Pusdiklat (Arena Hall)</option>
          </select>

          {/* Dues Status Filter */}
          <select
            id="filter-dues-status"
            value={filterDuesStatus}
            onChange={(e) => {
              setFilterDuesStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Status Iuran</option>
            <option value="Lunas">Lunas</option>
            <option value="Belum Bayar">Belum Bayar</option>
            <option value="Gratis / Reward Juara">Gratis / Reward Juara 🏆</option>
          </select>

          {(filterPBSICategory !== 'all' || filterTrainingCategory !== 'all' || filterDuesStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setFilterPBSICategory('all');
                setFilterTrainingCategory('all');
                setFilterDuesStatus('all');
                setSearchQuery('');
              }}
              className="text-xs text-emerald-400 hover:underline ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Table */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                {canEdit && (
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedAthletes.length > 0 && selectedIds.length === paginatedAthletes.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                  </th>
                )}
                <th
                  onClick={() => handleSort('idPb')}
                  className="p-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>ID PBSI / NIK</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="p-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Nama Atlet</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('ageCategory')}
                  className="p-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Kategori Usia PBSI</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('trainingCategory')}
                  className="p-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Program Hevindo</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Klub & Kontak</th>
                <th
                  onClick={() => handleSort('duesStatus')}
                  className="p-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status Iuran</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Prestasi & Mutasi</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedAthletes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ada atlet yang cocok dengan filter atau pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedAthletes.map((athlete) => {
                  const birthYear = new Date(athlete.birthDate).getFullYear();
                  const currentYear = new Date().getFullYear();
                  const age = currentYear - birthYear;

                  return (
                    <tr
                      key={athlete.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        selectedIds.includes(athlete.id) ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {canEdit && (
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(athlete.id)}
                            onChange={() => toggleSelectRow(athlete.id)}
                            className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="p-3">
                        <div className="font-mono font-medium text-slate-200">{athlete.idPb}</div>
                        <div className="text-[11px] text-slate-400">{athlete.nik}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{athlete.name}</span>
                          {!athlete.isActive && (
                            <span className="bg-red-500/10 text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-500/20">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {athlete.gender} • {athlete.birthPlace}, {formatIndonesianDate(athlete.birthDate)} ({age} thn)
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {athlete.ageCategory}
                        </span>
                      </td>
                      <td className="p-3">
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-semibold text-[11px] ${
                              athlete.trainingCategory === 'Pusdiklat'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : athlete.trainingCategory === 'Pembibitan'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                            }`}
                          >
                            {athlete.trainingCategory}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {athlete.trainingCategory === 'Pembibitan'
                            ? 'Hevindo 1'
                            : athlete.trainingCategory === 'Regular'
                            ? 'Hevindo 2 & Arena'
                            : 'Arena Pusdiklat'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-200">{athlete.clubName}</div>
                        <div className="text-[11px] text-slate-400">
                          Ortu: {athlete.parentName} ({athlete.phoneNumber})
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            athlete.duesStatus === 'Gratis / Reward Juara'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : athlete.duesStatus === 'Lunas'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {athlete.duesStatus === 'Gratis / Reward Juara' && <span>🏆</span>}
                          <span>{athlete.duesStatus}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <button
                            id={`btn-achievements-${athlete.id}`}
                            onClick={() => setActiveAchievementModalAthlete(athlete)}
                            className="flex items-center space-x-1 text-slate-300 hover:text-amber-400 transition"
                            title="Kelola Prestasi Atlet"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>{(athlete.achievements || []).length}</span>
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            id={`btn-transfer-${athlete.id}`}
                            onClick={() => setActiveTransferModalAthlete(athlete)}
                            className="flex items-center space-x-1 text-slate-300 hover:text-cyan-400 transition"
                            title="Riwayat Mutasi Klub / Kategori"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{(athlete.transferHistory || []).length}</span>
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Tombol Edit */}
                          <button
                            id={`btn-edit-${athlete.id}`}
                            onClick={() => handleOpenEditModal(athlete)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                            title={`Edit data atlet ${athlete.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            id={`btn-del-${athlete.id}`}
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus atlet "${athlete.name}" (${athlete.id}) dari database Supabase?`)) {
                                onDeleteAthlete(athlete.id);
                              }
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition"
                            title={`Hapus atlet ${athlete.name} dari database Supabase`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>

                          {/* Kartu / QR Code */}
                          <button
                            id={`btn-qr-${athlete.id}`}
                            onClick={() => setActiveQRModalAthlete(athlete)}
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                            title="Lihat Kartu Anggota & QR Code Absensi"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
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

        {/* Table Footer: Stats & Pagination */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            Menampilkan <span className="font-semibold text-white">{paginatedAthletes.length}</span> dari{' '}
            <span className="font-semibold text-white">{sortedAthletes.length}</span> atlet (Total Sistem: {athletes.length})
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span>Baris per halaman:</span>
              <select
                id="select-page-size-athletes"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-800 text-white rounded px-2 py-0.5 border border-slate-700 text-xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button
                id="btn-prev-page-athletes"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-slate-800 border border-slate-700 text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">
                Hal <span className="text-white font-semibold">{currentPage}</span> / {totalPages}
              </span>
              <button
                id="btn-next-page-athletes"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-slate-800 border border-slate-700 text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add/Edit Athlete */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>🏸</span>
                <span>{editingAthlete ? 'Edit Data Atlet PBSI' : 'Registrasi Atlet Baru HEVINDO'}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nama Lengkap Atlet *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Muhammad Rian Ardianto"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">ID PBSI / SI PBSI</label>
                  <input
                    type="text"
                    value={formData.idPb || ''}
                    onChange={(e) => setFormData({ ...formData, idPb: e.target.value })}
                    placeholder="Contoh: PBSI-2016-0901"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">NIK (Nomor Induk Kependudukan)</label>
                  <input
                    type="text"
                    value={formData.nik || ''}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="16 Digit NIK"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender || 'Putra'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.birthPlace || ''}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    placeholder="Contoh: Pekanbaru"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Kategori Usia PBSI <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={formData.ageCategory || 'Pemula'}
                    onChange={(e) => setFormData({ ...formData, ageCategory: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Usia Dini">Usia Dini (U-11)</option>
                    <option value="Anak-anak">Anak-anak (U-13)</option>
                    <option value="Pemula">Pemula (U-15)</option>
                    <option value="Remaja">Remaja (U-17)</option>
                    <option value="Taruna">Taruna (U-19)</option>
                    <option value="Dewasa">Dewasa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Program Latihan (Kategori Latihan) <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={formData.trainingCategory || 'Pembibitan'}
                    onChange={(e) => setFormData({ ...formData, trainingCategory: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Pembibitan">Pembibitan (Hevindo 1, Sen-Kam 14.00–17.00)</option>
                    <option value="Regular">Regular (Hevindo 2 & Arena, Sen-Sab 14.00–20.00)</option>
                    <option value="Pusdiklat">Pusdiklat (Arena Hall, Jadwal Intensif)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Nomor HP / WhatsApp <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phoneNumber || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="Contoh: 0812-7654-3210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Status Iuran Bulanan <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={formData.duesStatus || 'Belum Bayar'}
                    onChange={(e) => setFormData({ ...formData, duesStatus: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Gratis / Reward Juara">Gratis / Reward Juara 🏆</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate || ''}
                    onChange={(e) => {
                      const newBirth = e.target.value;
                      const { category } = calculatePBSICategory(newBirth);
                      setFormData({
                        ...formData,
                        birthDate: newBirth,
                        ageCategory: category,
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                  />
                  {formData.birthDate && (
                    <p className="mt-1 text-[11px] text-emerald-400">
                      🎯 Rekomendasi PBSI Otomatis: <strong>{calculatePBSICategory(formData.birthDate).category}</strong> ({calculatePBSICategory(formData.birthDate).age} th)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Klub Asal / Afiliasi</label>
                  <input
                    type="text"
                    value={formData.clubName || 'PB Hevindo'}
                    onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                    placeholder="PB Hevindo"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={formData.parentName || ''}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Nama Orang Tua"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Keanggotaan</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="true">Aktif Berlatih</option>
                    <option value="false">Nonaktif / Cuti / Mutasi Keluar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat domisili atlet..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-900/30"
                >
                  Simpan Data Atlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: QR Code & ID Card */}
      {activeQRModalAthlete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kartu Digital Atlet HEVINDO
              </span>
              <button
                onClick={() => setActiveQRModalAthlete(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Visual Badge Card */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 rounded-xl border border-emerald-500/30 shadow-inner text-left relative overflow-hidden">
              <div className="absolute top-2 right-2 text-emerald-400/20 text-4xl font-black">
                HEVINDO
              </div>

              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl font-bold text-emerald-300">
                  {activeQRModalAthlete.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{activeQRModalAthlete.name}</h4>
                  <p className="text-[10px] text-emerald-400 font-mono">{activeQRModalAthlete.idPb}</p>
                </div>
              </div>

              {/* QR Code Canvas Representation */}
              <div className="bg-white p-3 rounded-lg mx-auto w-40 h-40 flex flex-col items-center justify-center shadow-lg my-2">
                <QrCode className="w-32 h-32 text-slate-950" />
                <span className="text-[8px] font-mono text-slate-600 mt-1">
                  {activeQRModalAthlete.qrCodeToken}
                </span>
              </div>

              <div className="text-[11px] space-y-0.5 mt-3 text-slate-300">
                <p>
                  Program: <span className="text-white font-medium">{activeQRModalAthlete.trainingCategory}</span>
                </p>
                <p>
                  Kategori PBSI: <span className="text-cyan-300 font-medium">{activeQRModalAthlete.ageCategory}</span>
                </p>
                <p>
                  Klub: <span className="text-white font-medium">{activeQRModalAthlete.clubName}</span>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Gunakan barcode / QR Code di atas pada scanner gerbang latihan untuk absensi otomatis.
            </p>

            <button
              onClick={() => setActiveQRModalAthlete(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal: Prestasi / Achievements */}
      {activeAchievementModalAthlete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-sm">Prestasi & Gelar Juara</h4>
                <p className="text-xs text-slate-400">{activeAchievementModalAthlete.name} ({activeAchievementModalAthlete.idPb})</p>
              </div>
              <button
                onClick={() => setActiveAchievementModalAthlete(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* List Achievements */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {(activeAchievementModalAthlete.achievements || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Belum ada riwayat prestasi terdaftar.</p>
              ) : (
                (activeAchievementModalAthlete.achievements || []).map((ach) => (
                  <div
                    key={ach.id}
                    className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{ach.tournamentName}</span>
                        <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          {ach.position}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {ach.category} • Tahun {ach.year}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{ach.dateAchieved}</span>
                  </div>
                ))
              )}
            </div>

            {/* Add Achievement Form (if Admin/Operator) */}
            {canEdit && (
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-emerald-400 block">
                  + Tambah Prestasi Baru:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Nama Turnamen"
                    value={newAchievement.tournamentName}
                    onChange={(e) => setNewAchievement({ ...newAchievement, tournamentName: e.target.value })}
                    className="col-span-2 bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Kategori Nomor (misal: Tunggal Putra)"
                    value={newAchievement.category}
                    onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                  />
                  <select
                    value={newAchievement.position}
                    onChange={(e) => setNewAchievement({ ...newAchievement, position: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                  >
                    <option value="Juara 1">Juara 1 (Emas)</option>
                    <option value="Juara 2">Juara 2 (Perak)</option>
                    <option value="Juara 3 / Semifinalis">Juara 3 / Semifinalis</option>
                  </select>
                </div>
                <button
                  onClick={handleAddAchievement}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded transition"
                >
                  Simpan Prestasi
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveAchievementModalAthlete(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal: Mutasi Klub */}
      {activeTransferModalAthlete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-sm">Riwayat Mutasi Atlet</h4>
                <p className="text-xs text-slate-400">{activeTransferModalAthlete.name} (Klub Saat Ini: {activeTransferModalAthlete.clubName})</p>
              </div>
              <button
                onClick={() => setActiveTransferModalAthlete(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* List Mutasi */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {(activeTransferModalAthlete.transferHistory || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Belum ada mutasi klub atau kategori.</p>
              ) : (
                (activeTransferModalAthlete.transferHistory || []).map((trf) => (
                  <div
                    key={trf.id}
                    className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-cyan-300">{trf.type}</span>
                      <span className="text-[10px] text-slate-400">{trf.date}</span>
                    </div>
                    <div className="text-slate-200">
                      {trf.fromClub} ➔ <strong className="text-white">{trf.toClub}</strong>
                    </div>
                    {trf.notes && <p className="text-[11px] text-slate-400 italic">"{trf.notes}"</p>}
                  </div>
                ))
              )}
            </div>

            {/* Add Mutasi Form (if Admin/Operator) */}
            {canEdit && (
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-cyan-400 block">
                  + Catat Mutasi Baru:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={newTransfer.type}
                    onChange={(e) => setNewTransfer({ ...newTransfer, type: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                  >
                    <option value="Pindah Kategori">Pindah Kategori Latihan</option>
                    <option value="Masuk">Masuk dari Klub Lain</option>
                    <option value="Keluar">Keluar / Mutasi ke Klub Luar</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Tujuan (Klub / Kategori)"
                    value={newTransfer.toClub}
                    onChange={(e) => setNewTransfer({ ...newTransfer, toClub: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Catatan / Alasan Mutasi (opsional)"
                    value={newTransfer.notes}
                    onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                    className="col-span-2 bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>
                <button
                  onClick={handleAddTransfer}
                  className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded transition"
                >
                  Proses Mutasi
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveTransferModalAthlete(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
