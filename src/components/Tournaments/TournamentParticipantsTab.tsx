import React, { useState, useMemo } from 'react';
import {
  Tournament,
  TournamentParticipant,
  TournamentEventType,
  PBSIAgeCategory,
  Club,
  Athlete,
  UserRole,
} from '../../types';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  X,
  Phone,
  Shield,
  Medal,
} from 'lucide-react';
import { matchesMultiFieldSearch } from '../../utils/helpers';

interface TournamentParticipantsTabProps {
  tournament: Tournament;
  clubs: Club[];
  athletes: Athlete[];
  onUpdateTournament: (updated: Tournament) => void;
  currentRole: UserRole;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

const ALL_EVENT_TYPES: TournamentEventType[] = [
  'Tunggal Putra (MS)',
  'Tunggal Putri (WS)',
  'Ganda Putra (MD)',
  'Ganda Putri (WD)',
  'Ganda Campuran (XD)',
];

export const TournamentParticipantsTab: React.FC<TournamentParticipantsTabProps> = ({
  tournament,
  clubs,
  athletes,
  onUpdateTournament,
  currentRole,
  selectedCategory,
  onSelectCategory,
}) => {
  const [selectedEventType, setSelectedEventType] = useState<string>('Semua Jenis');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State for new participant
  const [newParticipant, setNewParticipant] = useState<Partial<TournamentParticipant>>({
    eventType: 'Tunggal Putra (MS)',
    ageCategory: 'Pemula (U-15)',
    player1Name: '',
    player1Club: 'PB Hevindo',
    player2Name: '',
    player2Club: '',
    seed: undefined,
    paymentStatus: 'Lunas',
    contactPhone: '',
    notes: '',
  });

  const canManage = currentRole === 'Wasit / Admin Turnamen' || currentRole === 'Master Admin';

  const participantsList = useMemo(() => {
    return tournament.participantsList || [];
  }, [tournament.participantsList]);

  const isDoubles = (type?: TournamentEventType) => {
    return type?.includes('Ganda') || false;
  };

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    return participantsList.filter((p) => {
      if (selectedCategory !== 'Semua Kategori' && p.ageCategory !== selectedCategory) {
        return false;
      }
      if (selectedEventType !== 'Semua Jenis' && p.eventType !== selectedEventType) {
        return false;
      }
      return matchesMultiFieldSearch(searchTerm, [
        p.player1Name,
        p.player1Club,
        p.player2Name || '',
        p.player2Club || '',
        p.ageCategory,
        p.eventType,
        p.contactPhone || '',
      ]);
    });
  }, [participantsList, selectedCategory, selectedEventType, searchTerm]);

  // Handle Add Participant
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant.player1Name?.trim()) {
      alert('Mohon masukkan nama Pemain 1.');
      return;
    }

    if (isDoubles(newParticipant.eventType) && !newParticipant.player2Name?.trim()) {
      alert('Untuk nomor ganda, nama Pemain 2 wajib diisi.');
      return;
    }

    const participantToAdd: TournamentParticipant = {
      id: `PART-${Date.now().toString().slice(-5)}`,
      tournamentId: tournament.id,
      eventType: newParticipant.eventType || 'Tunggal Putra (MS)',
      ageCategory: newParticipant.ageCategory || 'Pemula (U-15)',
      player1Name: newParticipant.player1Name.trim(),
      player1Club: newParticipant.player1Club || 'PB Hevindo',
      player2Name: isDoubles(newParticipant.eventType) ? newParticipant.player2Name?.trim() : undefined,
      player2Club: isDoubles(newParticipant.eventType) ? (newParticipant.player2Club || newParticipant.player1Club) : undefined,
      seed: newParticipant.seed ? Number(newParticipant.seed) : undefined,
      registrationDate: new Date().toISOString().split('T')[0],
      paymentStatus: newParticipant.paymentStatus || 'Lunas',
      contactPhone: newParticipant.contactPhone || '',
      notes: newParticipant.notes || '',
    };

    const updatedList = [participantToAdd, ...participantsList];
    onUpdateTournament({
      ...tournament,
      totalParticipants: updatedList.length,
      participantsList: updatedList,
    });

    setIsAddModalOpen(false);
    setNewParticipant({
      eventType: 'Tunggal Putra (MS)',
      ageCategory: 'Pemula (U-15)',
      player1Name: '',
      player1Club: 'PB Hevindo',
      player2Name: '',
      player2Club: '',
      seed: undefined,
      paymentStatus: 'Lunas',
      contactPhone: '',
      notes: '',
    });
  };

  // Handle Delete
  const handleDeleteParticipant = (id: string) => {
    if (!confirm('Hapus peserta ini dari turnamen?')) return;
    const updatedList = participantsList.filter((p) => p.id !== id);
    onUpdateTournament({
      ...tournament,
      totalParticipants: updatedList.length,
      participantsList: updatedList,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Kategori Usia',
      'Jenis Pertandingan',
      'Pemain 1',
      'Klub Pemain 1',
      'Pemain 2',
      'Klub Pemain 2',
      'Seed / Unggulan',
      'Status Bayar',
      'Kontak WA',
    ];

    const rows = filteredParticipants.map((p) => [
      p.id,
      p.ageCategory,
      p.eventType,
      p.player1Name,
      p.player1Club,
      p.player2Name || '-',
      p.player2Club || '-',
      p.seed ? `[${p.seed}]` : 'Non-Seed',
      p.paymentStatus,
      p.contactPhone || '-',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Peserta_${tournament.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari atlet, klub, no kontak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-rose-500"
            />
          </div>

          {/* Event Type Filter */}
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          >
            <option value="Semua Jenis">Semua Nomor Tanding</option>
            {ALL_EVENT_TYPES.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>

          {/* Age Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          >
            <option value="Semua Kategori">Semua Kategori Usia</option>
            {[
              'Usia Dini (U-11)',
              'Anak-anak (U-13)',
              'Pemula (U-15)',
              'Remaja (U-17)',
              'Taruna (U-19)',
              'Dewasa',
            ].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center space-x-1.5"
            title="Download CSV Peserta"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-950/50 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Daftarkan Peserta</span>
            </button>
          )}
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Daftar Peserta Terdaftar ({filteredParticipants.length} Peserta)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Turnamen: <strong className="text-rose-400">{tournament.name}</strong>
          </span>
        </div>

        {filteredParticipants.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs">Belum ada peserta yang terdaftar untuk filter ini.</p>
            {canManage && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-3 px-3 py-1.5 bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold hover:bg-rose-600 hover:text-white transition"
              >
                + Daftarkan Atlet Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 select-none">
                <tr>
                  <th className="p-3.5 font-bold">No / Seed</th>
                  <th className="p-3.5 font-bold">Nama Atlet / Pasangan Ganda</th>
                  <th className="p-3.5 font-bold">Klub Asal</th>
                  <th className="p-3.5 font-bold">Kategori & Nomor Tanding</th>
                  <th className="p-3.5 font-bold">Kontak Atlet</th>
                  <th className="p-3.5 font-bold text-center">Biaya Registrasi</th>
                  {canManage && <th className="p-3.5 font-bold text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredParticipants.map((p, idx) => {
                  const doubles = isDoubles(p.eventType);
                  return (
                    <tr key={p.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-500">#{idx + 1}</span>
                          {p.seed ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center space-x-1">
                              <Medal className="w-3 h-3 text-amber-400" />
                              <span>[{p.seed}]</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Non-Seed</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block text-xs">
                            {p.player1Name}
                          </span>
                          {doubles && p.player2Name && (
                            <span className="font-bold text-rose-300 block text-xs">
                              & {p.player2Name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="text-slate-200 block font-semibold">
                            {p.player1Club}
                          </span>
                          {doubles && p.player2Club && p.player2Club !== p.player1Club && (
                            <span className="text-slate-400 block text-[10px]">
                              & {p.player2Club}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 font-bold text-[11px] block w-fit mb-1">
                          {p.eventType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {p.ageCategory}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-400">
                        {p.contactPhone ? (
                          <span className="flex items-center space-x-1 font-mono text-[11px] text-slate-300">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{p.contactPhone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.paymentStatus === 'Lunas'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>

                      {canManage && (
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleDeleteParticipant(p.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition rounded"
                            title="Hapus Peserta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: DAFTARKAN PESERTA BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Formulir Pendaftaran Peserta Turnamen
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Event Type & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Jenis Pertandingan <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={newParticipant.eventType}
                    onChange={(e) =>
                      setNewParticipant({
                        ...newParticipant,
                        eventType: e.target.value as TournamentEventType,
                      })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {ALL_EVENT_TYPES.map((et) => (
                      <option key={et} value={et}>
                        {et}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Kelompok Usia <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={newParticipant.ageCategory}
                    onChange={(e) =>
                      setNewParticipant({
                        ...newParticipant,
                        ageCategory: e.target.value as PBSIAgeCategory,
                      })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {[
                      'Usia Dini (U-11)',
                      'Anak-anak (U-13)',
                      'Pemula (U-15)',
                      'Remaja (U-17)',
                      'Taruna (U-19)',
                      'Dewasa',
                    ].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pemain 1 & Klub */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-white block">
                  🏸 Data Pemain 1 (Utama):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Nama Lengkap Atlet <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={newParticipant.player1Name || ''}
                      onChange={(e) =>
                        setNewParticipant({ ...newParticipant, player1Name: e.target.value })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Klub Asal</label>
                    <input
                      type="text"
                      placeholder="PB Hevindo"
                      value={newParticipant.player1Club || ''}
                      onChange={(e) =>
                        setNewParticipant({ ...newParticipant, player1Club: e.target.value })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Pemain 2 & Klub (Jika Ganda) */}
              {isDoubles(newParticipant.eventType) && (
                <div className="p-3 bg-rose-950/20 rounded-xl border border-rose-500/30 space-y-3">
                  <span className="text-[11px] font-bold text-rose-300 block">
                    🏸 Data Pemain 2 (Pasangan Ganda):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Nama Lengkap Pasangan <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Hendra Setiawan"
                        value={newParticipant.player2Name || ''}
                        onChange={(e) =>
                          setNewParticipant({ ...newParticipant, player2Name: e.target.value })
                        }
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Klub Pemain 2</label>
                      <input
                        type="text"
                        placeholder="PB Hevindo"
                        value={newParticipant.player2Club || ''}
                        onChange={(e) =>
                          setNewParticipant({ ...newParticipant, player2Club: e.target.value })
                        }
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Unggulan / Seed, Kontak, dan Pembayaran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Unggulan (Seed)
                  </label>
                  <select
                    value={newParticipant.seed || ''}
                    onChange={(e) =>
                      setNewParticipant({
                        ...newParticipant,
                        seed: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="">Non-Unggulan</option>
                    <option value="1">Seed [1] (Unggulan 1)</option>
                    <option value="2">Seed [2] (Unggulan 2)</option>
                    <option value="3">Seed [3] (Unggulan 3)</option>
                    <option value="4">Seed [4] (Unggulan 4)</option>
                    <option value="5">Seed [5]</option>
                    <option value="6">Seed [6]</option>
                    <option value="7">Seed [7]</option>
                    <option value="8">Seed [8]</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={newParticipant.contactPhone || ''}
                    onChange={(e) =>
                      setNewParticipant({ ...newParticipant, contactPhone: e.target.value })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Status Bayar
                  </label>
                  <select
                    value={newParticipant.paymentStatus || 'Lunas'}
                    onChange={(e) =>
                      setNewParticipant({
                        ...newParticipant,
                        paymentStatus: e.target.value as 'Lunas' | 'Belum Bayar',
                      })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Belum Bayar">Belum Bayar</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/40"
                >
                  Daftarkan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
