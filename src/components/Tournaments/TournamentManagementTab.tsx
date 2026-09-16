import React, { useState } from 'react';
import {
  Tournament,
  UserRole,
} from '../../types';
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  ExternalLink,
  Youtube,
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/helpers';

interface TournamentManagementTabProps {
  tournaments: Tournament[];
  onSelectTournament: (id: string) => void;
  selectedTournamentId: string;
  onOpenCreateModal: () => void;
  onOpenEditModal: (tournament: Tournament) => void;
  onDeleteTournament?: (id: string) => void;
  currentRole: UserRole;
}

export const TournamentManagementTab: React.FC<TournamentManagementTabProps> = ({
  tournaments,
  onSelectTournament,
  selectedTournamentId,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteTournament,
  currentRole,
}) => {
  const canManage = currentRole === 'Wasit / Admin Turnamen' || currentRole === 'Master Admin';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Berlangsung':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Pendaftaran':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Drawing':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Selesai':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Create Button */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-rose-400" />
            <span>Manajemen & Daftar Seluruh Kejuaraan Turnamen</span>
          </h3>
          <p className="text-xs text-slate-400">
            Daftar event turnamen yang diselenggarakan oleh PB Hevindo Pekanbaru.
          </p>
        </div>

        {canManage && (
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-950/50 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Turnamen Baru</span>
          </button>
        )}
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournaments.map((trn) => {
          const isSelected = trn.id === selectedTournamentId;
          const participantsCount = trn.participantsList?.length || trn.totalParticipants || 0;

          return (
            <div
              key={trn.id}
              className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-rose-500 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono text-rose-400 font-bold">
                    {trn.id} • {trn.level}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                      trn.status
                    )}`}
                  >
                    {trn.status}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white leading-tight mb-2">
                  {trn.name}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {trn.description || 'Kejuaraan resmi PBSI Pekanbaru terbuka.'}
                </p>

                {/* Metadata */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {formatIndonesianDate(trn.startDate)} - {formatIndonesianDate(trn.endDate)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{trn.location}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Total Peserta: <strong className="text-white">{participantsCount} Atlet/Pasangan</strong>
                    </span>
                  </div>

                  {trn.liveStreamYouTubeUrl && (
                    <div className="flex items-center space-x-2 text-red-400">
                      <Youtube className="w-3.5 h-3.5" />
                      <span className="text-[11px] truncate">YouTube Live Stream Aktif</span>
                    </div>
                  )}
                </div>

                {/* Categories & Event Types pills */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1">
                  {(trn.categories || []).map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded bg-slate-950 text-[10px] text-slate-400 border border-slate-800"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onSelectTournament(trn.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Turnamen Aktif' : 'Pilih Turnamen Ini'}</span>
                </button>

                {canManage && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onOpenEditModal(trn)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition"
                      title="Edit Data Turnamen"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteTournament && (
                      <button
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus turnamen "${trn.name}"?`)) {
                            onDeleteTournament(trn.id);
                          }
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg text-xs transition"
                        title="Hapus Turnamen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
