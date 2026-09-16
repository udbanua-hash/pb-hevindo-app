import React, { useState } from 'react';
import { TrainingSchedule, TrainingCategory, UserRole } from '../../types';
import { formatRupiah, getStandardMonthlyFee } from '../../utils/helpers';
import { Calendar, Clock, MapPin, Plus, Edit2, Trash2, CheckCircle, Info } from 'lucide-react';

interface SchedulesTabProps {
  schedules: TrainingSchedule[];
  onAddSchedule: (schedule: TrainingSchedule) => void;
  onUpdateSchedule: (schedule: TrainingSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  currentRole: UserRole;
}

export const SchedulesTab: React.FC<SchedulesTabProps> = ({
  schedules = [],
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  currentRole,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterVenue, setFilterVenue] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TrainingSchedule | null>(null);

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

  const filtered = (schedules || []).filter((s) => {
    if (filterCategory !== 'all' && s.trainingCategory !== filterCategory) return false;
    if (filterVenue !== 'all' && s.venue !== filterVenue) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData({
      id: `SCH-${Date.now()}`,
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sched: TrainingSchedule) => {
    setEditingSchedule(sched);
    setFormData({ ...sched });
    setIsModalOpen(true);
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

    if (editingSchedule) onUpdateSchedule(payload);
    else onAddSchedule(payload);
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
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-white text-sm">
              Logika Bisnis & Struktur Kategori Latihan Klub HEVINDO
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-slate-300">
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <span className="font-bold text-emerald-400 block">🌱 1. Pembibitan</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Venue: <strong>Hevindo 1</strong> (Senin–Kamis 14.00–17.00). Biaya: <strong>Rp 350.000 / bln</strong>
                </p>
              </div>
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <span className="font-bold text-blue-400 block">⚡ 2. Regular</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Venue: <strong>Hevindo 2 & Arena</strong> (Senin–Sabtu 14.00–17.00 & 17.00–20.00). Biaya: <strong>Rp 450.000 / bln</strong>
                </p>
              </div>
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <span className="font-bold text-amber-400 block">🥇 3. Pusdiklat</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Venue: <strong>Arena Badminton Hall</strong> (Jadwal Intensif Fleksibel). Biaya: <strong>Rp 600.000 / bln</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Filter Jadwal:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-md px-2.5 py-1 text-xs"
          >
            <option value="all">Semua Program</option>
            <option value="Pembibitan">Pembibitan</option>
            <option value="Regular">Regular</option>
            <option value="Pusdiklat">Pusdiklat</option>
          </select>

          <select
            value={filterVenue}
            onChange={(e) => setFilterVenue(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-md px-2.5 py-1 text-xs"
          >
            <option value="all">Semua Hall / Venue</option>
            <option value="Hevindo 1">Hevindo 1</option>
            <option value="Hevindo 2">Hevindo 2</option>
            <option value="Arena Badminton Hall">Arena Badminton Hall</option>
          </select>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Jadwal Dinamis</span>
          </button>
        )}
      </div>

      {/* Schedule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sched) => (
          <div
            key={sched.id}
            className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      sched.trainingCategory === 'Pusdiklat'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : sched.trainingCategory === 'Pembibitan'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {sched.trainingCategory}
                  </span>
                  <h4 className="font-bold text-white text-sm mt-1 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Setiap Hari {sched.day}</span>
                  </h4>
                </div>
                {canEdit && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(sched)}
                      className="p-1 text-slate-400 hover:text-blue-400"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus jadwal ini?`)) onDeleteSchedule(sched.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-emerald-400">
                    {sched.startTime} - {sched.endTime} WIB
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {sched.venue} ({sched.courtNumbers})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Pelatih: <strong className="text-white">{sched.coachName}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Biaya Iuran:</span>
              <span className="font-bold text-amber-400">{formatRupiah(sched.monthlyFee)} / bln</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">
              {editingSchedule ? 'Edit Jadwal Latihan' : 'Tambah Jadwal Latihan Baru'}
            </h4>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Kategori Program Latihan</label>
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
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                >
                  <option value="Pembibitan">Pembibitan (Rp 350.000)</option>
                  <option value="Regular">Regular (Rp 450.000)</option>
                  <option value="Pusdiklat">Pusdiklat (Rp 600.000)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Hari Latihan</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                    <option value="Minggu">Minggu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Lokasi Hall / Venue</label>
                  <select
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Hevindo 1">Hevindo 1</option>
                    <option value="Hevindo 2">Hevindo 2</option>
                    <option value="Arena Badminton Hall">Arena Badminton Hall</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Jam Mulai (HH:mm)</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Jam Selesai (HH:mm)</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Nomor Lapangan</label>
                  <input
                    type="text"
                    value={formData.courtNumbers}
                    onChange={(e) => setFormData({ ...formData, courtNumbers: e.target.value })}
                    placeholder="Contoh: Court 1 & 2"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Pelatih Penanggung Jawab</label>
                  <input
                    type="text"
                    value={formData.coachName}
                    onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                    placeholder="Nama Pelatih"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Iuran Bulanan (Rp)</label>
                <input
                  type="number"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
