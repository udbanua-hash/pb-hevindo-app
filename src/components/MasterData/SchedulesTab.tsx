import React, { useState } from 'react';
import { TrainingSchedule, TrainingCategory, UserRole, Coach, Building } from '../../types';
import { formatRupiah, getStandardMonthlyFee } from '../../utils/helpers';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Info,
  Copy,
  User,
  Shield,
  Search,
} from 'lucide-react';

interface SchedulesTabProps {
  schedules: TrainingSchedule[];
  coaches?: Coach[];
  buildings?: Building[];
  onAddSchedule: (schedule: TrainingSchedule) => void;
  onUpdateSchedule: (schedule: TrainingSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  currentRole: UserRole;
}

export const SchedulesTab: React.FC<SchedulesTabProps> = ({
  schedules = [],
  coaches = [],
  buildings = [],
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  currentRole,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterVenue, setFilterVenue] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [searchCoach, setSearchCoach] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TrainingSchedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<TrainingSchedule | null>(null);

  const canEdit = currentRole === 'Admin' || currentRole === 'Operator' || currentRole === 'Pelatih';

  const [formData, setFormData] = useState<Partial<TrainingSchedule>>({
    trainingCategory: 'Pembibitan',
    venue: 'Hevindo 1',
    day: 'Senin',
    startTime: '14:00',
    endTime: '17:00',
    coachName: 'Coach Hermawan Susanto',
    coachId: 'COA-003',
    courtNumbers: 'Court 1 & 2',
    monthlyFee: 350000,
  });

  const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const filtered = (schedules || []).filter((s) => {
    if (filterCategory !== 'all' && s.trainingCategory !== filterCategory) return false;
    if (filterVenue !== 'all' && s.venue !== filterVenue) return false;
    if (filterDay !== 'all' && s.day !== filterDay) return false;
    if (
      searchCoach &&
      !s.coachName.toLowerCase().includes(searchCoach.toLowerCase()) &&
      !String(s.courtNumbers).toLowerCase().includes(searchCoach.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    const defaultCoach = coaches[0]?.name || 'Coach Hermawan Susanto';
    const defaultCoachId = coaches[0]?.id || 'COA-001';
    const defaultVenue = buildings[0]?.name || 'Hevindo 1';

    setFormData({
      id: `SCH-${Date.now()}`,
      trainingCategory: 'Pembibitan',
      venue: defaultVenue as any,
      day: 'Senin',
      startTime: '14:00',
      endTime: '17:00',
      coachName: defaultCoach,
      coachId: defaultCoachId,
      courtNumbers: 'Court 1 & 2',
      monthlyFee: 350000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sched: TrainingSchedule) => {
    setEditingSchedule(sched);
    setFormData({ ...sched });
    setIsModalOpen(true);
  };

  const handleDuplicate = (sched: TrainingSchedule) => {
    const nextDays: Record<string, string> = {
      Senin: 'Rabu',
      Selasa: 'Kamis',
      Rabu: 'Jumat',
      Kamis: 'Sabtu',
      Jumat: 'Minggu',
      Sabtu: 'Minggu',
      Minggu: 'Senin',
    };
    const duplicated: TrainingSchedule = {
      ...sched,
      id: `SCH-${Date.now()}`,
      day: (nextDays[sched.day] || 'Selasa') as any,
    };
    onAddSchedule(duplicated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: TrainingSchedule = {
      id: editingSchedule ? editingSchedule.id : formData.id || `SCH-${Date.now()}`,
      trainingCategory: (formData.trainingCategory as TrainingCategory) || 'Pembibitan',
      venue: formData.venue as any,
      day: formData.day as any,
      startTime: formData.startTime || '14:00',
      endTime: formData.endTime || '17:00',
      coachName: formData.coachName || '-',
      coachId: formData.coachId || 'COA-GEN',
      courtNumbers: formData.courtNumbers || 'Court 1',
      monthlyFee: Number(formData.monthlyFee) || getStandardMonthlyFee(formData.trainingCategory as any),
    };

    if (editingSchedule) {
      onUpdateSchedule(payload);
    } else {
      onAddSchedule(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* HEVINDO Business Logic Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/40 p-4 rounded-xl border border-emerald-500/20 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-bold text-white text-sm">
                Pengaturan Jadwal Sesi Latihan & Pembagian Lapangan PB HEVINDO
              </h4>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-semibold self-start sm:self-auto">
                Total {schedules.length} Sesi Terjadwal
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Atur waktu mulai, selesai, hari latihan, venue/gor, penugasan pelatih, dan tarif iuran bulanan untuk tiap program latihan.
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchCoach}
              onChange={(e) => setSearchCoach(e.target.value)}
              placeholder="Cari pelatih / court..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 text-slate-200 border border-slate-700 rounded-lg text-xs placeholder-slate-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
          >
            <option value="all">Semua Program</option>
            <option value="Pembibitan">Pembibitan (Rp 350rb)</option>
            <option value="Regular">Regular (Rp 450rb)</option>
            <option value="Pusdiklat">Pusdiklat (Rp 600rb)</option>
          </select>

          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
          >
            <option value="all">Semua Hari</option>
            {daysList.map((d) => (
              <option key={d} value={d}>
                Hari {d}
              </option>
            ))}
          </select>

          <select
            value={filterVenue}
            onChange={(e) => setFilterVenue(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
          >
            <option value="all">Semua Hall / Venue</option>
            <option value="Hevindo 1">Hevindo 1</option>
            <option value="Hevindo 2">Hevindo 2</option>
            <option value="Arena Badminton Hall">Arena Badminton Hall</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-md w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah & Atur Jadwal</span>
          </button>
        )}
      </div>

      {/* Schedule Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-850 p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
          Tidak ada jadwal latihan yang sesuai dengan filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sched) => (
            <div
              key={sched.id}
              className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition relative group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                        sched.trainingCategory === 'Pusdiklat'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : sched.trainingCategory === 'Pembibitan'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {sched.trainingCategory}
                    </span>
                    <h4 className="font-bold text-white text-base mt-1.5 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Setiap {sched.day}</span>
                    </h4>
                  </div>
                  {canEdit && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDuplicate(sched)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                        title="Salin/Duplikasi Jadwal ke Hari Lain"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(sched)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition"
                        title="Edit & Atur Jadwal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setScheduleToDelete(sched)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 transition"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-400">
                      {sched.startTime} – {sched.endTime} WIB
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      <strong className="text-white">{sched.venue}</strong> • {sched.courtNumbers}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Pelatih: <strong className="text-white">{sched.coachName}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Biaya Iuran Program:</span>
                <span className="font-extrabold text-amber-400">{formatRupiah(sched.monthlyFee)} / bln</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>{editingSchedule ? 'Edit & Atur Jadwal Latihan' : 'Tambah Jadwal Latihan Baru'}</span>
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Program Latihan</label>
                  <select
                    value={formData.trainingCategory}
                    onChange={(e) => {
                      const cat = e.target.value as TrainingCategory;
                      setFormData({
                        ...formData,
                        trainingCategory: cat,
                        monthlyFee: getStandardMonthlyFee(cat),
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="Pembibitan">🌱 Pembibitan (Rp 350.000)</option>
                    <option value="Regular">⚡ Regular (Rp 450.000)</option>
                    <option value="Pusdiklat">🥇 Pusdiklat (Rp 600.000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Hari Latihan</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    {daysList.map((d) => (
                      <option key={d} value={d}>
                        Hari {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Lokasi Hall / GOR</label>
                  <select
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="Hevindo 1">Hevindo 1</option>
                    <option value="Hevindo 2">Hevindo 2</option>
                    <option value="Arena Badminton Hall">Arena Badminton Hall</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nomor Lapangan</label>
                  <input
                    type="text"
                    value={formData.courtNumbers}
                    onChange={(e) => setFormData({ ...formData, courtNumbers: e.target.value })}
                    placeholder="Contoh: Court 1 & 2 / Lapangan 1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Jam Mulai Sesi</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Jam Selesai Sesi</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Pelatih Penanggung Jawab</label>
                {coaches && coaches.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={formData.coachName}
                      onChange={(e) => {
                        const sel = coaches.find((c) => c.name === e.target.value);
                        setFormData({
                          ...formData,
                          coachName: e.target.value,
                          coachId: sel ? sel.id : formData.coachId,
                        });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    >
                      {coaches.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.role || 'Pelatih'} - {c.category || 'Spesialis'})
                        </option>
                      ))}
                      <option value="Custom">Ketik Pelatih Lainnya...</option>
                    </select>
                    {formData.coachName === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Masukkan nama pelatih..."
                        onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white mt-1"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.coachName}
                    onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                    placeholder="Nama Pelatih"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Besaran Iuran Bulanan (Rp)</label>
                <input
                  type="number"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Standar Hevindo: Pembibitan Rp 350.000, Regular Rp 450.000, Pusdiklat Rp 600.000
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Simpan Perubahan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {scheduleToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm text-red-400 flex items-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Konfirmasi Hapus Jadwal</span>
            </h4>
            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menghapus jadwal latihan program{' '}
              <strong className="text-white">{scheduleToDelete.trainingCategory}</strong> pada hari{' '}
              <strong className="text-emerald-400">{scheduleToDelete.day}</strong> ({scheduleToDelete.startTime} - {scheduleToDelete.endTime})?
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setScheduleToDelete(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteSchedule(scheduleToDelete.id);
                  setScheduleToDelete(null);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
              >
                Hapus Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
