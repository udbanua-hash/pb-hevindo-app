import React, { useState } from 'react';
import { Coach, Referee, UserRole } from '../../types';
import { formatRupiah } from '../../utils/helpers';
import {
  UserCheck,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Award,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface CoachesRefereesTabProps {
  coaches: Coach[];
  referees: Referee[];
  onAddCoach: (coach: Coach) => void;
  onUpdateCoach: (coach: Coach) => void;
  onDeleteCoach: (id: string) => void;
  onAddReferee: (referee: Referee) => void;
  onUpdateReferee: (referee: Referee) => void;
  onDeleteReferee: (id: string) => void;
  currentRole: UserRole;
}

export const CoachesRefereesTab: React.FC<CoachesRefereesTabProps> = ({
  coaches = [],
  referees = [],
  onAddCoach,
  onUpdateCoach,
  onDeleteCoach,
  onAddReferee,
  onUpdateReferee,
  onDeleteReferee,
  currentRole,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'coaches' | 'referees'>('coaches');

  const canEdit =
    currentRole === 'Master Admin' ||
    currentRole === 'Admin PB Hevindo' ||
    currentRole === 'Admin' ||
    currentRole === 'Operator';

  // Unified Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields per specification:
  // Nama, Peran [Pelatih/Wasit], Spesialisasi/Kategori, Lisensi, No. HP, Honor Per Sesi, Honor Bulanan
  const [formData, setFormData] = useState({
    name: '',
    role: 'Pelatih' as 'Pelatih' | 'Wasit',
    category: 'Tunggal',
    license: 'BWF Level 1',
    phone: '',
    honorPerSession: 150000,
    monthlyHonor: 4500000,
    scheduleNotes: '',
    status: 'Aktif',
  });

  // Delete Confirmation Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    role: 'Pelatih' | 'Wasit';
  }>({
    isOpen: false,
    id: '',
    name: '',
    role: 'Pelatih',
  });

  const handleOpenAddModal = (defaultRole?: 'Pelatih' | 'Wasit') => {
    const role = defaultRole || (activeSubTab === 'coaches' ? 'Pelatih' : 'Wasit');
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      role: role,
      category: role === 'Pelatih' ? 'Tunggal' : 'Sertifikasi Wasit',
      license: role === 'Pelatih' ? 'BWF Level 1' : 'Sertifikasi PBSI Nasional',
      phone: '',
      honorPerSession: role === 'Pelatih' ? 150000 : 200000,
      monthlyHonor: role === 'Pelatih' ? 4500000 : 0,
      scheduleNotes: '',
      status: role === 'Pelatih' ? 'Aktif' : 'Tersedia',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditCoach = (coach: Coach) => {
    setIsEditing(true);
    setEditingId(coach.id);
    setFormData({
      name: coach.name,
      role: 'Pelatih',
      category: coach.category,
      license: 'BWF Level 1',
      phone: coach.phone || '',
      honorPerSession: coach.honorPerSession || 0,
      monthlyHonor: coach.monthlyHonor || 0,
      scheduleNotes: coach.scheduleNotes || '',
      status: coach.status || 'Aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditReferee = (ref: Referee) => {
    setIsEditing(true);
    setEditingId(ref.id);
    setFormData({
      name: ref.name,
      role: 'Wasit',
      category: 'Sertifikasi Wasit',
      license: ref.certification || 'Sertifikasi PBSI Nasional',
      phone: ref.phone || '',
      honorPerSession: 200000,
      monthlyHonor: 0,
      scheduleNotes: `Total ${ref.assignedMatchesCount || 0} Pertandingan`,
      status: ref.status || 'Tersedia',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (formData.role === 'Pelatih') {
      const payload: Coach = {
        id: isEditing && editingId ? editingId : `COA-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        category: formData.category as any,
        phone: formData.phone.trim() || '-',
        email: `${formData.name.toLowerCase().replace(/\s+/g, '.')}@pbhevindo.com`,
        honorPerSession: Number(formData.honorPerSession) || 0,
        monthlyHonor: Number(formData.monthlyHonor) || 0,
        scheduleNotes: formData.scheduleNotes || 'Jadwal Reguler PB Hevindo',
        status: (formData.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif') as any,
      };

      if (isEditing) {
        onUpdateCoach(payload);
      } else {
        onAddCoach(payload);
      }
    } else {
      const payload: Referee = {
        id: isEditing && editingId ? editingId : `REF-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        certification: formData.license as any,
        licenseNumber: `PBSI-WST-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: formData.phone.trim() || '-',
        assignedMatchesCount: 0,
        status: (formData.status === 'Bertugas' ? 'Bertugas' : formData.status === 'Nonaktif' ? 'Nonaktif' : 'Tersedia') as any,
      };

      if (isEditing) {
        onUpdateReferee(payload);
      } else {
        onAddReferee(payload);
      }
    }

    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteConfirm.role === 'Pelatih') {
      onDeleteCoach(deleteConfirm.id);
    } else {
      onDeleteReferee(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, id: '', name: '', role: 'Pelatih' });
  };

  return (
    <div className="space-y-5">
      {/* Action Header & Sub Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="tab-coaches-list"
            onClick={() => setActiveSubTab('coaches')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'coaches'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Data Pelatih & Honor ({coaches.length})</span>
          </button>

          <button
            id="tab-referees-list"
            onClick={() => setActiveSubTab('referees')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'referees'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Data Wasit & Lisensi PBSI ({referees.length})</span>
          </button>
        </div>

        {canEdit && (
          <button
            id="btn-add-coach-referee"
            onClick={() => handleOpenAddModal()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/40 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelatih / Wasit</span>
          </button>
        )}
      </div>

      {/* COACHES SUB-TAB */}
      {activeSubTab === 'coaches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Daftar Pelatih Resmi PB HEVINDO</span>
              <span className="text-xs font-normal text-slate-400">
                (Sinkron Realtime ke Tabel Supabase pelatih_wasit)
              </span>
            </h3>
          </div>

          {coaches.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
              <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Belum ada data pelatih di database Supabase.</p>
              {canEdit && (
                <button
                  onClick={() => handleOpenAddModal('Pelatih')}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  + Tambah Pelatih Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  id={`card-coach-${coach.id}`}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition rounded-2xl p-5 flex flex-col justify-between shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                          {coach.id}
                        </span>
                        <h4 className="font-black text-white text-base mt-0.5">{coach.name}</h4>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Spesialisasi: {coach.category}
                        </span>
                      </div>

                      {canEdit && (
                        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
                          <button
                            onClick={() => handleOpenEditCoach(coach)}
                            className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-700 rounded transition"
                            title="Edit Data Pelatih"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: coach.id,
                                name: coach.name,
                                role: 'Pelatih',
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                            title="Hapus Pelatih"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-white font-mono">{coach.phone || '-'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{coach.scheduleNotes || 'Reguler PB Hevindo'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Honorarium Details */}
                  <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Honor Per Sesi</span>
                      <span className="font-bold text-amber-300 font-mono">
                        {formatRupiah(coach.honorPerSession)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Honor Bulanan</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatRupiah(coach.monthlyHonor)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REFEREES SUB-TAB */}
      {activeSubTab === 'referees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Daftar Wasit Resmi PBSI / Turnamen</span>
              <span className="text-xs font-normal text-slate-400">
                (Sinkron Realtime ke Tabel Supabase pelatih_wasit)
              </span>
            </h3>
          </div>

          {referees.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Belum ada data wasit di database Supabase.</p>
              {canEdit && (
                <button
                  onClick={() => handleOpenAddModal('Wasit')}
                  className="mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold"
                >
                  + Tambah Wasit Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {referees.map((ref) => (
                <div
                  key={ref.id}
                  id={`card-referee-${ref.id}`}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition rounded-2xl p-5 flex flex-col justify-between shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                          {ref.id} • {ref.licenseNumber}
                        </span>
                        <h4 className="font-black text-white text-base mt-0.5">{ref.name}</h4>
                        <span className="inline-flex items-center space-x-1 mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          <Award className="w-3 h-3 text-cyan-400" />
                          <span>{ref.certification}</span>
                        </span>
                      </div>

                      {canEdit && (
                        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
                          <button
                            onClick={() => handleOpenEditReferee(ref)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-700 rounded transition"
                            title="Edit Data Wasit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: ref.id,
                                name: ref.name,
                                role: 'Wasit',
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                            title="Hapus Wasit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-white font-mono">{ref.phone || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl">
                        <span>Total Penugasan Turnamen:</span>
                        <span className="font-bold text-white font-mono">
                          {ref.assignedMatchesCount || 0} Pertandingan
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Status Penugasan:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        ref.status === 'Bertugas'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {ref.status || 'Tersedia'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UNIFIED MODAL FORM: Tambah / Edit Pelatih & Wasit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-white text-base">
                  {isEditing ? `Edit Record ${formData.role}` : 'Tambah Pelatih / Wasit Baru'}
                </h4>
                <p className="text-xs text-slate-400">
                  Data otomatis disimpan dan di-update ke Supabase tabel <code className="text-emerald-400 font-mono">pelatih_wasit</code>.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Input: Peran [Pelatih / Wasit] */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Peran *</label>
                  <select
                    value={formData.role}
                    disabled={isEditing}
                    onChange={(e) => {
                      const newRole = e.target.value as 'Pelatih' | 'Wasit';
                      setFormData({
                        ...formData,
                        role: newRole,
                        category: newRole === 'Pelatih' ? 'Tunggal' : 'Sertifikasi Wasit',
                        license: newRole === 'Pelatih' ? 'BWF Level 1' : 'Sertifikasi PBSI Nasional',
                        honorPerSession: newRole === 'Pelatih' ? 150000 : 200000,
                        monthlyHonor: newRole === 'Pelatih' ? 4500000 : 0,
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Pelatih">Pelatih (Coach)</option>
                    <option value="Wasit">Wasit (Referee / Umpire)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Status Record</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Aktif">Aktif / Tersedia</option>
                    <option value="Bertugas">Bertugas di Pertandingan</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Input: Nama */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Coach Hendra Setiawan / Wasit Bambang..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Input: Spesialisasi / Kategori & Lisensi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    {formData.role === 'Pelatih' ? 'Spesialisasi / Kategori' : 'Kategori Wasit'}
                  </label>
                  {formData.role === 'Pelatih' ? (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Tunggal">Tunggal (Singles)</option>
                      <option value="Ganda">Ganda (Doubles)</option>
                      <option value="Fisik">Fisik & Stamina</option>
                      <option value="Pembibitan">Pembibitan (Usia Dini)</option>
                      <option value="Pusdiklat Head Coach">Pusdiklat Head Coach</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Wasit PBSI Utama"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Lisensi / Sertifikat</label>
                  {formData.role === 'Pelatih' ? (
                    <select
                      value={formData.license}
                      onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="BWF Level 1">BWF Level 1</option>
                      <option value="BWF Level 2">BWF Level 2</option>
                      <option value="Pelatih PBSI Daerah">Pelatih PBSI Daerah</option>
                      <option value="Pelatih PBSI Nasional">Pelatih PBSI Nasional</option>
                      <option value="Mantan Atlet Nasional">Mantan Atlet Nasional</option>
                    </select>
                  ) : (
                    <select
                      value={formData.license}
                      onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Sertifikasi Kota/Kabupaten">Sertifikasi Kota/Kabupaten</option>
                      <option value="Sertifikasi PBSI Provinsi">Sertifikasi PBSI Provinsi</option>
                      <option value="Sertifikasi PBSI Nasional">Sertifikasi PBSI Nasional</option>
                      <option value="BWF Accredited">BWF Accredited</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Input: No. HP */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">No. HP / WhatsApp *</label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Input: Honor Per Sesi & Honor Bulanan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Honor Per Sesi (Rp)</label>
                  <input
                    type="number"
                    value={formData.honorPerSession}
                    onChange={(e) => setFormData({ ...formData, honorPerSession: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Honor Bulanan (Rp)</label>
                  <input
                    type="number"
                    value={formData.monthlyHonor}
                    onChange={(e) => setFormData({ ...formData, monthlyHonor: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Catatan / Jadwal */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Catatan Tambahan / Jadwal</label>
                <input
                  type="text"
                  placeholder="Contoh: Bertugas sesi pagi di GOR Hevindo 1..."
                  value={formData.scheduleNotes}
                  onChange={(e) => setFormData({ ...formData, scheduleNotes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-900/40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Simpan Perubahan ke Supabase' : 'Tambahkan ke Supabase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-white text-sm">Konfirmasi Hapus Record</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus {deleteConfirm.role}{' '}
              <strong className="text-white">"{deleteConfirm.name}"</strong>?
              Data akan dihapus secara permanen dari Supabase.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, id: '', name: '', role: 'Pelatih' })}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition"
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
