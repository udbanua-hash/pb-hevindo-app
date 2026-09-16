import React, { useState } from 'react';
import {
  Tournament,
  TournamentLevel,
  TournamentEventType,
  PBSIAgeCategory,
} from '../../types';
import { Trophy, X, Calendar, MapPin, Youtube, Check } from 'lucide-react';

interface TournamentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tournament: Tournament) => void;
  initialData?: Tournament | null;
}

const ALL_CATEGORIES: PBSIAgeCategory[] = [
  'Usia Dini (U-11)',
  'Anak-anak (U-13)',
  'Pemula (U-15)',
  'Remaja (U-17)',
  'Taruna (U-19)',
  'Dewasa',
];

const ALL_EVENT_TYPES: TournamentEventType[] = [
  'Tunggal Putra (MS)',
  'Tunggal Putri (WS)',
  'Ganda Putra (MD)',
  'Ganda Putri (WD)',
  'Ganda Campuran (XD)',
];

export const TournamentFormModal: React.FC<TournamentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<Tournament>>(() => {
    if (initialData) {
      return { ...initialData };
    }
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    return {
      name: '',
      level: 'Kota / Kabupaten' as TournamentLevel,
      startDate: today,
      endDate: nextWeek,
      location: 'GOR Gelora Hevindo Pekanbaru (6 Lapangan Karpet BWF)',
      description: 'Kejuaraan resmi terbuka untuk seluruh klub bulutangkis PBSI.',
      categories: ['Usia Dini (U-11)', 'Anak-anak (U-13)', 'Pemula (U-15)', 'Remaja (U-17)', 'Taruna (U-19)', 'Dewasa'],
      eventTypes: [
        'Tunggal Putra (MS)',
        'Tunggal Putri (WS)',
        'Ganda Putra (MD)',
        'Ganda Putri (WD)',
        'Ganda Campuran (XD)',
      ],
      rallyPoints: 21,
      gamesPerMatch: 3,
      status: 'Pendaftaran',
      totalParticipants: 0,
      liveStreamYouTubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      liveStreamTikTokUrl: 'https://www.tiktok.com/@pb_hevindo_official/live',
      participantsList: [],
    };
  });

  if (!isOpen) return null;

  const handleToggleCategory = (cat: PBSIAgeCategory) => {
    const current = formData.categories || [];
    if (current.includes(cat)) {
      if (current.length === 1) return; // minimal 1
      setFormData({ ...formData, categories: current.filter((c) => c !== cat) });
    } else {
      setFormData({ ...formData, categories: [...current, cat] });
    }
  };

  const handleToggleEventType = (ev: TournamentEventType) => {
    const current = formData.eventTypes || [];
    if (current.includes(ev)) {
      if (current.length === 1) return; // minimal 1
      setFormData({ ...formData, eventTypes: current.filter((e) => e !== ev) });
    } else {
      setFormData({ ...formData, eventTypes: [...current, ev] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Mohon masukkan nama turnamen.');
      return;
    }

    const tournamentToSave: Tournament = {
      id: initialData?.id || `TRN-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      level: formData.level || 'Kota / Kabupaten',
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || new Date().toISOString().split('T')[0],
      location: formData.location || 'GOR Hevindo Pekanbaru',
      description: formData.description || '',
      categories: formData.categories && formData.categories.length > 0 ? formData.categories : ['Pemula (U-15)'],
      eventTypes: formData.eventTypes && formData.eventTypes.length > 0 ? formData.eventTypes : ['Tunggal Putra (MS)'],
      rallyPoints: formData.rallyPoints || 21,
      gamesPerMatch: formData.gamesPerMatch || 3,
      status: formData.status || 'Pendaftaran',
      totalParticipants: initialData?.totalParticipants || formData.participantsList?.length || 0,
      participantsList: initialData?.participantsList || formData.participantsList || [],
      liveStreamYouTubeUrl: formData.liveStreamYouTubeUrl || '',
      liveStreamTikTokUrl: formData.liveStreamTikTokUrl || '',
    };

    onSubmit(tournamentToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Data Turnamen' : 'Menu Pembuatan Turnamen Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Atur jadwal mulai, venue, kategori usia, jenis pertandingan, dan link live streaming.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nama & Level Turnamen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Nama Turnamen / Kejuaraan <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: HEVINDO JUNIOR OPEN CHAMPIONSHIP 2026"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Level / Tingkatan</label>
              <select
                value={formData.level || 'Kota / Kabupaten'}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as TournamentLevel })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-rose-500"
              >
                <option value="Tingkat Klub">Tingkat Klub / Internal</option>
                <option value="Kota / Kabupaten">Kota / Kabupaten</option>
                <option value="Daerah / Provinsi">Daerah / Provinsi (Kejurda)</option>
                <option value="Nasional">Nasional (Sirnas / Kejurnas)</option>
              </select>
            </div>
          </div>

          {/* Tanggal Mulai & Selesai & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                <Calendar className="w-3 h-3 inline mr-1 text-slate-400" />
                Tanggal Mulai <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                <Calendar className="w-3 h-3 inline mr-1 text-slate-400" />
                Tanggal Selesai <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Status Turnamen</label>
              <select
                value={formData.status || 'Pendaftaran'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'Pendaftaran' | 'Drawing' | 'Berlangsung' | 'Selesai',
                  })
                }
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="Pendaftaran">Pendaftaran Buka</option>
                <option value="Drawing">Proses Drawing / Undian</option>
                <option value="Berlangsung">Sedang Berlangsung</option>
                <option value="Selesai">Turnamen Selesai</option>
              </select>
            </div>
          </div>

          {/* Lokasi & Venue */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              <MapPin className="w-3 h-3 inline mr-1 text-slate-400" />
              Lokasi / Gedung Olahraga (Venue)
            </label>
            <input
              type="text"
              placeholder="Contoh: GOR Gelora Hevindo Pekanbaru (6 Lapangan Karpet)"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          {/* Jenis Pertandingan (Single, Double, Mixed) Checkboxes */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-rose-300 block">
              🏸 Jenis Pertandingan yang Dibuka:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_EVENT_TYPES.map((et) => {
                const isChecked = (formData.eventTypes || []).includes(et);
                return (
                  <label
                    key={et}
                    className={`flex items-center space-x-2 p-2 rounded-lg text-xs cursor-pointer border transition ${
                      isChecked
                        ? 'bg-rose-950/40 border-rose-500/50 text-white font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleEventType(et)}
                      className="rounded text-rose-500 focus:ring-rose-500 bg-slate-950 border-slate-700"
                    />
                    <span>{et}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Kategori Usia PBSI Checkboxes */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-rose-300 block">
              🏅 Kategori Kelompok Usia yang Dipertandingkan:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const isChecked = (formData.categories || []).includes(cat);
                return (
                  <label
                    key={cat}
                    className={`flex items-center space-x-2 p-2 rounded-lg text-xs cursor-pointer border transition ${
                      isChecked
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-white font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCategory(cat)}
                      className="rounded text-indigo-500 focus:ring-indigo-500 bg-slate-950 border-slate-700"
                    />
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Format Skor & Game */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Sistem Poin Reli (Rally Points)
              </label>
              <select
                value={formData.rallyPoints || 21}
                onChange={(e) => setFormData({ ...formData, rallyPoints: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value={21}>21 Ralli Points x 3 Game (Standar BWF / PBSI)</option>
                <option value={15}>15 Ralli Points x 3 Game (Format Cepat / Anak)</option>
                <option value={30}>30 Poin 1 Game (Format Sirkuit Kilat)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Format Game Maksimal
              </label>
              <select
                value={formData.gamesPerMatch || 3}
                onChange={(e) => setFormData({ ...formData, gamesPerMatch: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value={3}>Best of 3 Games (Rubber Game jika 1-1)</option>
                <option value={1}>1 Game Langsung (Sistem Gugur Kilat)</option>
              </select>
            </div>
          </div>

          {/* Link Live Stream YouTube & TikTok */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-rose-300 block">
              📺 Integrasi Link Siaran Langsung (Live View Stream):
            </span>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                <Youtube className="w-3 h-3 inline text-red-500 mr-1" />
                Link Live YouTube (URL Streaming atau ID Video):
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                value={formData.liveStreamYouTubeUrl || ''}
                onChange={(e) => setFormData({ ...formData, liveStreamYouTubeUrl: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                🎵 Link Live TikTok (URL Akun / TikTok Live):
              </label>
              <input
                type="text"
                placeholder="https://www.tiktok.com/@pb_hevindo_official/live"
                value={formData.liveStreamTikTokUrl || ''}
                onChange={(e) => setFormData({ ...formData, liveStreamTikTokUrl: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Deskripsi & Peraturan Tambahan */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Catatan Khusus / Deskripsi Peraturan
            </label>
            <textarea
              rows={2}
              placeholder="Peraturan tambahan, pendaftaran ulang, shuttlecock yang digunakan..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-950/50 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan' : 'Buat Turnamen Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
