import React, { useState } from 'react';
import { Coach, Referee, UserRole } from '../../types';
import { formatRupiah } from '../../utils/helpers';
import { UserCheck, ShieldCheck, Plus, Edit2, Trash2, Phone, Mail, Award, Calendar, DollarSign } from 'lucide-react';

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
  const canEdit = currentRole === 'Admin' || currentRole === 'Operator';

  // Coach modal
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [coachForm, setCoachForm] = useState<Partial<Coach>>({
    name: '',
    category: 'Tunggal',
    phone: '',
    email: '',
    honorPerSession: 150000,
    monthlyHonor: 4500000,
    scheduleNotes: '',
    status: 'Aktif',
  });

  // Referee modal
  const [isRefereeModalOpen, setIsRefereeModalOpen] = useState(false);
  const [editingReferee, setEditingReferee] = useState<Referee | null>(null);
  const [refereeForm, setRefereeForm] = useState<Partial<Referee>>({
    name: '',
    certification: 'Sertifikasi PBSI Nasional',
    licenseNumber: '',
    phone: '',
    assignedMatchesCount: 0,
    status: 'Tersedia',
  });

  const handleOpenCoachModal = (coach?: Coach) => {
    if (coach) {
      setEditingCoach(coach);
      setCoachForm({ ...coach });
    } else {
      setEditingCoach(null);
      setCoachForm({
        id: `COA-00${coaches.length + 1}`,
        name: '',
        category: 'Tunggal',
        phone: '',
        email: '',
        honorPerSession: 150000,
        monthlyHonor: 4500000,
        scheduleNotes: '',
        status: 'Aktif',
      });
    }
    setIsCoachModalOpen(true);
  };

  const handleSaveCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachForm.name) return;

    const payload: Coach = {
      id: editingCoach ? editingCoach.id : coachForm.id || `COA-${Date.now()}`,
      name: coachForm.name,
      category: coachForm.category as any,
      phone: coachForm.phone || '-',
      email: coachForm.email || '-',
      honorPerSession: Number(coachForm.honorPerSession) || 0,
      monthlyHonor: Number(coachForm.monthlyHonor) || 0,
      scheduleNotes: coachForm.scheduleNotes || '-',
      status: coachForm.status as any,
    };

    if (editingCoach) onUpdateCoach(payload);
    else onAddCoach(payload);
    setIsCoachModalOpen(false);
  };

  const handleOpenRefereeModal = (ref?: Referee) => {
    if (ref) {
      setEditingReferee(ref);
      setRefereeForm({ ...ref });
    } else {
      setEditingReferee(null);
      setRefereeForm({
        id: `REF-00${referees.length + 1}`,
        name: '',
        certification: 'Sertifikasi PBSI Nasional',
        licenseNumber: `PBSI-WST-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: '',
        assignedMatchesCount: 0,
        status: 'Tersedia',
      });
    }
    setIsRefereeModalOpen(true);
  };

  const handleSaveReferee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refereeForm.name) return;

    const payload: Referee = {
      id: editingReferee ? editingReferee.id : refereeForm.id || `REF-${Date.now()}`,
      name: refereeForm.name,
      certification: refereeForm.certification as any,
      licenseNumber: refereeForm.licenseNumber || '-',
      phone: refereeForm.phone || '-',
      assignedMatchesCount: Number(refereeForm.assignedMatchesCount) || 0,
      status: refereeForm.status as any,
    };

    if (editingReferee) onUpdateReferee(payload);
    else onAddReferee(payload);
    setIsRefereeModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Sub Navigation Switcher */}
      <div className="flex items-center justify-between bg-slate-850 p-2 rounded-xl border border-slate-800">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('coaches')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'coaches'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Data Pelatih & Honorarium ({coaches.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('referees')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'referees'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Data Wasit & Sertifikasi PBSI ({referees.length})</span>
          </button>
        </div>

        {canEdit && (
          <button
            onClick={() =>
              activeSubTab === 'coaches' ? handleOpenCoachModal() : handleOpenRefereeModal()
            }
            className="flex items-center space-x-1 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              Tambah {activeSubTab === 'coaches' ? 'Pelatih' : 'Wasit'}
            </span>
          </button>
        )}
      </div>

      {/* COACHES VIEW */}
      {activeSubTab === 'coaches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className="bg-slate-850 p-5 rounded-xl border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                      {coach.id}
                    </span>
                    <h4 className="font-bold text-white text-base mt-0.5">{coach.name}</h4>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Spesialisasi: {coach.category}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenCoachModal(coach)}
                        className="p-1 text-slate-400 hover:text-blue-400"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus pelatih ${coach.name}?`)) onDeleteCoach(coach.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{coach.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Jadwal: {coach.scheduleNotes}</span>
                  </div>
                </div>
              </div>

              {/* Honorarium Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs bg-slate-900/50 p-2.5 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 block">Honor Per Sesi Latihan</span>
                  <span className="font-bold text-amber-300">{formatRupiah(coach.honorPerSession)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Estimasi Bulanan</span>
                  <span className="font-bold text-emerald-400">{formatRupiah(coach.monthlyHonor)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REFEREES VIEW */}
      {activeSubTab === 'referees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {referees.map((ref) => (
            <div
              key={ref.id}
              className="bg-slate-850 p-5 rounded-xl border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                      {ref.id} • {ref.licenseNumber}
                    </span>
                    <h4 className="font-bold text-white text-base mt-0.5">{ref.name}</h4>
                    <span className="inline-flex items-center space-x-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>{ref.certification}</span>
                    </span>
                  </div>
                  {canEdit && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenRefereeModal(ref)}
                        className="p-1 text-slate-400 hover:text-blue-400"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus wasit ${ref.name}?`)) onDeleteReferee(ref.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ref.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Total Penugasan Turnamen:</span>
                    <span className="font-bold text-white">{ref.assignedMatchesCount} Pertandingan</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Status Penugasan:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    ref.status === 'Bertugas'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {ref.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit Coach */}
      {isCoachModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">
              {editingCoach ? 'Edit Pelatih' : 'Tambah Pelatih Klub'}
            </h4>
            <form onSubmit={handleSaveCoach} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Nama Lengkap Pelatih *</label>
                <input
                  type="text"
                  required
                  value={coachForm.name}
                  onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Kategori Spesialisasi</label>
                  <select
                    value={coachForm.category}
                    onChange={(e) => setCoachForm({ ...coachForm, category: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Tunggal">Tunggal</option>
                    <option value="Ganda">Ganda</option>
                    <option value="Fisik">Fisik & Conditioning</option>
                    <option value="Pembibitan">Pembibitan (Usia Dini)</option>
                    <option value="Pusdiklat Head Coach">Pusdiklat Head Coach</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={coachForm.phone}
                    onChange={(e) => setCoachForm({ ...coachForm, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Honor Per Sesi (Rp)</label>
                  <input
                    type="number"
                    value={coachForm.honorPerSession}
                    onChange={(e) => setCoachForm({ ...coachForm, honorPerSession: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Estimasi Bulanan (Rp)</label>
                  <input
                    type="number"
                    value={coachForm.monthlyHonor}
                    onChange={(e) => setCoachForm({ ...coachForm, monthlyHonor: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Catatan Jadwal</label>
                <input
                  type="text"
                  value={coachForm.scheduleNotes}
                  onChange={(e) => setCoachForm({ ...coachForm, scheduleNotes: e.target.value })}
                  placeholder="Senin–Kamis 14.00–17.00 di Hevindo 1..."
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCoachModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold"
                >
                  Simpan Pelatih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Referee */}
      {isRefereeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">
              {editingReferee ? 'Edit Wasit' : 'Tambah Wasit PBSI'}
            </h4>
            <form onSubmit={handleSaveReferee} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Nama Lengkap Wasit *</label>
                <input
                  type="text"
                  required
                  value={refereeForm.name}
                  onChange={(e) => setRefereeForm({ ...refereeForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Tingkat Sertifikasi PBSI</label>
                <select
                  value={refereeForm.certification}
                  onChange={(e) => setRefereeForm({ ...refereeForm, certification: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                >
                  <option value="Sertifikasi Kota/Kabupaten">Sertifikasi Kota/Kabupaten</option>
                  <option value="Sertifikasi PBSI Provinsi">Sertifikasi PBSI Provinsi</option>
                  <option value="Sertifikasi PBSI Nasional">Sertifikasi PBSI Nasional</option>
                  <option value="BWF Accredited">BWF Accredited</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">No. Lisensi / Sertifikat</label>
                  <input
                    type="text"
                    value={refereeForm.licenseNumber}
                    onChange={(e) => setRefereeForm({ ...refereeForm, licenseNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">No. Kontak / WA</label>
                  <input
                    type="text"
                    value={refereeForm.phone}
                    onChange={(e) => setRefereeForm({ ...refereeForm, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRefereeModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 text-white rounded text-xs font-semibold"
                >
                  Simpan Wasit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
