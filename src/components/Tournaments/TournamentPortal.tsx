import React, { useState, useMemo } from 'react';
import {
  Tournament,
  TournamentMatch,
  Club,
  Athlete,
  UserRole,
  PBSIAgeCategory,
} from '../../types';
import {
  formatIndonesianDate,
  matchesMultiFieldSearch,
  sortData,
  exportToCSV,
} from '../../utils/helpers';
import {
  Trophy,
  Calendar,
  Users,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Radio,
  Play,
  Share2,
  Shield,
  Medal,
  Activity,
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
  Filter,
  Plus,
  Tv,
} from 'lucide-react';
import { TournamentFormModal } from './TournamentFormModal';
import { TournamentParticipantsTab } from './TournamentParticipantsTab';
import { TournamentBracketView } from './TournamentBracketView';
import { TournamentLiveView } from './TournamentLiveView';
import { TournamentManagementTab } from './TournamentManagementTab';

interface TournamentPortalProps {
  tournaments: Tournament[];
  matches: TournamentMatch[];
  clubs: Club[];
  athletes: Athlete[];
  onUpdateMatch: (match: TournamentMatch) => void;
  onAddMatch: (match: TournamentMatch) => void;
  onDeleteMatch?: (id: string) => void;
  onBatchAddMatches?: (matches: TournamentMatch[]) => void;
  onAddTournament?: (tournament: Tournament) => void;
  onUpdateTournament?: (tournament: Tournament) => void;
  onDeleteTournament?: (id: string) => void;
  currentRole: UserRole;
  onOpenLoginModal: () => void;
}

export const TournamentPortal: React.FC<TournamentPortalProps> = ({
  tournaments = [],
  matches = [],
  clubs = [],
  athletes = [],
  onUpdateMatch,
  onAddMatch,
  onDeleteMatch,
  onBatchAddMatches,
  onAddTournament,
  onUpdateTournament,
  onDeleteTournament,
  currentRole,
  onOpenLoginModal,
}) => {
  // Navigation within Tournament Portal
  const [activeTab, setActiveTab] = useState<
    'schedule' | 'bracket' | 'participants' | 'live_view' | 'tournaments_list' | 'clubs_table'
  >('schedule');

  // Modal for creating/editing tournament
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);

  // Selected tournament
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournaments[0]?.id || 'TRN-001'
  );

  // Age category filter for matches & bracket
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');

  // Schedule filters
  const [matchStatusFilter, setMatchStatusFilter] = useState<string>('Semua');
  const [scheduleSearch, setScheduleSearch] = useState<string>('');

  // Clubs Table search & sort (MODEL TABEL, BUKAN CARD!)
  const [clubSearch, setClubSearch] = useState<string>('');
  const [clubSortKey, setClubSortKey] = useState<keyof Club | 'athleteCount' | 'winCount'>('name');
  const [clubSortDir, setClubSortDir] = useState<'asc' | 'desc'>('asc');

  // Clickable Detail Modals
  const [selectedClubForDetail, setSelectedClubForDetail] = useState<Club | null>(null);
  const [selectedAthleteForDetail, setSelectedAthleteForDetail] = useState<Athlete | null>(null);
  const [selectedMatchForDetail, setSelectedMatchForDetail] = useState<TournamentMatch | null>(null);

  // Live Score Court State (For Referees / Scoring)
  const activeMatch = useMemo(() => {
    return matches.find((m) => m.status === 'Sedang Main') || matches[0];
  }, [matches]);

  const activeTournament = useMemo(() => {
    return tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];
  }, [tournaments, selectedTournamentId]);

  const isPublicViewer = currentRole === 'Publik';
  const canManageMatches = currentRole === 'Wasit / Admin Turnamen' || currentRole === 'Master Admin';

  // Compute club statistics (athlete count, matches won/lost)
  const clubStats = useMemo(() => {
    const stats: Record<string, { athleteCount: number; matchesPlayed: number; won: number; lost: number }> = {};

    clubs.forEach((c) => {
      const athleteList = athletes.filter((a) => a.currentClub === c.name);
      stats[c.name] = {
        athleteCount: athleteList.length,
        matchesPlayed: 0,
        won: 0,
        lost: 0,
      };
    });

    matches.forEach((m) => {
      if (m.status === 'Selesai') {
        if (stats[m.playerAClub]) {
          stats[m.playerAClub].matchesPlayed += 1;
          if (m.winnerId === m.playerAId) stats[m.playerAClub].won += 1;
          else stats[m.playerAClub].lost += 1;
        }
        if (stats[m.playerBClub]) {
          stats[m.playerBClub].matchesPlayed += 1;
          if (m.winnerId === m.playerBId) stats[m.playerBClub].won += 1;
          else stats[m.playerBClub].lost += 1;
        }
      }
    });

    return stats;
  }, [clubs, athletes, matches]);

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (m.tournamentId !== selectedTournamentId) return false;
      if (selectedCategory !== 'Semua Kategori' && m.ageCategory !== selectedCategory) return false;
      if (matchStatusFilter !== 'Semua' && m.status !== matchStatusFilter) return false;
      return matchesMultiFieldSearch(scheduleSearch, [
        m.playerAName,
        m.playerBName,
        m.playerAClub,
        m.playerBClub,
        m.ageCategory,
        m.round,
        m.court,
        m.status,
      ]);
    });
  }, [matches, selectedTournamentId, selectedCategory, matchStatusFilter, scheduleSearch]);

  // Filtered & Sorted Clubs for the requested TABLE format
  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      return matchesMultiFieldSearch(clubSearch, [
        c.id,
        c.name,
        c.city,
        c.contactPerson,
        c.phone,
        c.address,
      ]);
    });
  }, [clubs, clubSearch]);

  const sortedClubs = useMemo(() => {
    return [...filteredClubs].sort((a, b) => {
      let aVal: any = a[clubSortKey as keyof Club];
      let bVal: any = b[clubSortKey as keyof Club];

      if (clubSortKey === 'athleteCount') {
        aVal = clubStats[a.name]?.athleteCount || 0;
        bVal = clubStats[b.name]?.athleteCount || 0;
      } else if (clubSortKey === 'winCount') {
        aVal = clubStats[a.name]?.won || 0;
        bVal = clubStats[b.name]?.won || 0;
      }

      if (typeof aVal === 'string') {
        return clubSortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return clubSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredClubs, clubSortKey, clubSortDir, clubStats]);

  // Compute Head to Head / Match history for an athlete
  const getAthleteMatchHistory = (athleteId: string) => {
    return matches
      .filter((m) => m.playerAId === athleteId || m.playerBId === athleteId)
      .map((m) => {
        const isPlayerA = m.playerAId === athleteId;
        const opponentName = isPlayerA ? m.playerBName : m.playerAName;
        const opponentClub = isPlayerA ? m.playerBClub : m.playerAClub;
        const isWinner = m.winnerId === athleteId;
        const scoreStr = m.scores
          ? `${m.scores.game1PlayerA}-${m.scores.game1PlayerB}, ${m.scores.game2PlayerA}-${m.scores.game2PlayerB}${
              m.scores.game3PlayerA !== undefined ? `, ${m.scores.game3PlayerA}-${m.scores.game3PlayerB}` : ''
            }`
          : 'Belum Main';

        return {
          match: m,
          opponentName,
          opponentClub,
          isWinner,
          scoreStr,
          status: m.status,
        };
      });
  };

  const handleClubSort = (key: keyof Club | 'athleteCount' | 'winCount') => {
    if (clubSortKey === key) {
      setClubSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setClubSortKey(key);
      setClubSortDir('asc');
    }
  };

  // Referees point update
  const handleScorePoint = (player: 'A' | 'B', delta: number) => {
    if (!canManageMatches || !activeMatch || !activeMatch.scores) return;

    const gameKeyA = 'game3PlayerA' in activeMatch.scores ? 'game3PlayerA' : 'game1PlayerA';
    const gameKeyB = 'game3PlayerB' in activeMatch.scores ? 'game3PlayerB' : 'game1PlayerB';

    const updatedScores = { ...activeMatch.scores };
    if (player === 'A') {
      updatedScores[gameKeyA] = Math.max(0, (updatedScores[gameKeyA] || 0) + delta);
    } else {
      updatedScores[gameKeyB] = Math.max(0, (updatedScores[gameKeyB] || 0) + delta);
    }

    onUpdateMatch({
      ...activeMatch,
      scores: updatedScores,
    });
  };

  return (
    <div className="space-y-6">
      {/* Public / Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border border-rose-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-400">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Portal Turnamen Bulutangkis HEVINDO
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Akses Publik Bebas</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Jadwal pertandingan real-time, live score standar BWF, bagan bracket, dan profil klub & atlet peserta.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canManageMatches && (
              <button
                onClick={() => {
                  setTournamentToEdit(null);
                  setIsTournamentModalOpen(true);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-950/50 flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Turnamen Baru</span>
              </button>
            )}

            {isPublicViewer ? (
              <button
                onClick={onOpenLoginModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition border border-slate-700 flex items-center space-x-1.5"
              >
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Login Panitia / Wasit</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-[11px] font-bold text-rose-300 border border-rose-500/30">
                  Mode: {currentRole}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tournament & Category Selector + Info Banner */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 flex-wrap">
            <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">Event Turnamen:</label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl text-xs px-3 py-2 focus:border-rose-500"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.level})
                </option>
              ))}
            </select>

            {activeTournament && (
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 ml-1">
                <span className="flex items-center space-x-1 text-slate-300">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span className="truncate max-w-[200px]">{activeTournament.location}</span>
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{activeTournament.status}</span>
              </div>
            )}
          </div>

          {/* Category Filter Pills (Multi-kategori PBSI) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Kategori:</span>
            {['Semua Kategori', 'Usia Dini (U-11)', 'Anak-anak (U-13)', 'Pemula (U-15)', 'Remaja (U-17)', 'Taruna (U-19)', 'Dewasa'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Tabs Navigation (6 Modul Terstruktur Sesuai Kebutuhan) */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal & Hasil ({filteredMatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'bracket'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bagan & Undian (Bracket)</span>
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'participants'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Peserta & Pendaftaran ({activeTournament?.participantsList?.length || activeTournament?.totalParticipants || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('live_view')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'live_view'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Siaran & Live View</span>
          </button>

          <button
            onClick={() => setActiveTab('tournaments_list')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'tournaments_list'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Kelola Turnamen ({tournaments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clubs_table')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'clubs_table'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Klub Peserta ({clubs.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: JADWAL & HASIL PERTANDINGAN */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama atlet, klub, court, babak (pisahkan spasi)..."
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-rose-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <select
                value={matchStatusFilter}
                onChange={(e) => setMatchStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="Semua">Semua Status</option>
                <option value="Sedang Main">Live Sedang Main</option>
                <option value="Selesai">Selesai</option>
                <option value="Terjadwal">Terjadwal</option>
              </select>
            </div>
          </div>

          {/* Match List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((m) => {
              const isLive = m.status === 'Sedang Main';
              const isFinished = m.status === 'Selesai';

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMatchForDetail(m)}
                  className={`p-4 rounded-2xl border transition cursor-pointer hover:border-rose-500/50 ${
                    isLive
                      ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/30'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-rose-400 font-mono text-[11px]">{m.round}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 font-medium">
                        {m.eventType || 'Tunggal Putra (MS)'} ({m.ageCategory})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isLive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>LIVE</span>
                        </span>
                      )}
                      {isFinished && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Selesai
                        </span>
                      )}
                      {m.status === 'Terjadwal' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Terjadwal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Public Information: Court & Time */}
                  <div className="flex items-center justify-between text-[11px] py-2 px-2.5 my-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                    <div className="flex items-center space-x-1.5 text-slate-200">
                      <span className="text-rose-400 font-bold">🏸 {m.court}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{m.scheduledTime || '09:00 WIB'}</span>
                    </div>
                  </div>

                  {/* Players & Scores */}
                  <div className="py-2 space-y-2.5">
                    {/* Player A */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {m.playerASeed && (
                          <span className="w-4 h-4 rounded bg-slate-800 text-[10px] font-mono text-amber-400 flex items-center justify-center font-bold">
                            [{m.playerASeed}]
                          </span>
                        )}
                        <div>
                          <span
                            className={`text-xs font-bold block ${
                              m.winnerId === m.playerAId ? 'text-emerald-400' : 'text-white'
                            }`}
                          >
                            {m.playerAName}
                          </span>
                          <span className="text-[10px] text-slate-500">{m.playerAClub}</span>
                        </div>
                      </div>

                      {m.scores && (
                        <div className="flex items-center space-x-2 font-mono text-xs font-bold">
                          <span className="w-6 text-center text-slate-300">{m.scores.game1PlayerA}</span>
                          <span className="w-6 text-center text-slate-300">{m.scores.game2PlayerA}</span>
                          {m.scores.game3PlayerA !== undefined && (
                            <span className="w-6 text-center text-rose-400">{m.scores.game3PlayerA}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Player B */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {m.playerBSeed && (
                          <span className="w-4 h-4 rounded bg-slate-800 text-[10px] font-mono text-amber-400 flex items-center justify-center font-bold">
                            [{m.playerBSeed}]
                          </span>
                        )}
                        <div>
                          <span
                            className={`text-xs font-bold block ${
                              m.winnerId === m.playerBId ? 'text-emerald-400' : 'text-white'
                            }`}
                          >
                            {m.playerBName}
                          </span>
                          <span className="text-[10px] text-slate-500">{m.playerBClub}</span>
                        </div>
                      </div>

                      {m.scores && (
                        <div className="flex items-center space-x-2 font-mono text-xs font-bold">
                          <span className="w-6 text-center text-slate-300">{m.scores.game1PlayerB}</span>
                          <span className="w-6 text-center text-slate-300">{m.scores.game2PlayerB}</span>
                          {m.scores.game3PlayerB !== undefined && (
                            <span className="w-6 text-center text-rose-400">{m.scores.game3PlayerB}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Public Information: Referee & Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1 truncate max-w-[200px]">
                      <span className="text-slate-500">🧑‍⚖️ Wasit:</span>
                      <strong className="text-slate-300 font-semibold">{m.refereeName || 'Wasit PBSI'}</strong>
                      {m.refereeCertification && (
                        <span className="text-slate-500 hidden sm:inline">({m.refereeCertification})</span>
                      )}
                    </span>
                    <div className="flex items-center space-x-2">
                      {isLive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('live_view');
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold flex items-center space-x-1"
                        >
                          <Radio className="w-2.5 h-2.5 animate-pulse" />
                          <span>Tonton Live</span>
                        </button>
                      )}
                      <span className="text-rose-400 font-semibold">Skor & H2H →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BAGAN & UNDIAN (BRACKET) DENGAN UNDIAN OTOMATIS */}
      {activeTab === 'bracket' && (
        <TournamentBracketView
          tournament={activeTournament}
          matches={matches}
          onBatchAddMatches={onBatchAddMatches}
          onUpdateMatch={onUpdateMatch}
          currentRole={currentRole}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {/* SUB-TAB 3: PESERTA & PENDAFTARAN TURNAMEN */}
      {activeTab === 'participants' && (
        <TournamentParticipantsTab
          tournament={activeTournament}
          clubs={clubs}
          athletes={athletes}
          onUpdateTournament={onUpdateTournament || (() => {})}
          currentRole={currentRole}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {/* SUB-TAB 4: SIARAN LIVE STREAMING & VIRTUAL COURT */}
      {activeTab === 'live_view' && (
        <TournamentLiveView
          tournament={activeTournament}
          matches={matches}
          onUpdateTournament={onUpdateTournament || (() => {})}
          onUpdateMatch={onUpdateMatch}
          currentRole={currentRole}
        />
      )}

      {/* SUB-TAB 5: DAFTAR & KELOLA TURNAMEN */}
      {activeTab === 'tournaments_list' && (
        <TournamentManagementTab
          tournaments={tournaments}
          onSelectTournament={setSelectedTournamentId}
          selectedTournamentId={selectedTournamentId}
          onOpenCreateModal={() => {
            setTournamentToEdit(null);
            setIsTournamentModalOpen(true);
          }}
          onOpenEditModal={(t) => {
            setTournamentToEdit(t);
            setIsTournamentModalOpen(true);
          }}
          onDeleteTournament={onDeleteTournament}
          currentRole={currentRole}
        />
      )}

      {/* SUB-TAB 4: DAFTAR KLUB PESERTA (MODEL TABEL, BUKAN CARD!) */}
      {activeTab === 'clubs_table' && (
        <div className="space-y-4">
          {/* Information Notice */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Daftar Seluruh Klub Peserta Turnamen (Format Tabel)
              </h3>
              <p className="text-xs text-slate-400">
                Sesuai instruksi, format tabel hemat ruang tampilan. Baris tabel dapat diklik untuk melihat rincian atlet klub, dan nama atlet dapat diklik untuk melihat rekor Head-to-Head.
              </p>
            </div>

            {/* Space-separated live search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari klub, kota, kontak (pisahkan spasi)..."
                value={clubSearch}
                onChange={(e) => setClubSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-rose-500"
              />
            </div>
          </div>

          {/* CLUBS TABLE */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 select-none">
                  <tr>
                    <th
                      onClick={() => handleClubSort('id')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Kode Klub</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleClubSort('name')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Nama Klub Bulutangkis</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleClubSort('city')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Kota / Asal</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th className="p-3.5 font-bold">Penanggung Jawab / Kontak</th>
                    <th
                      onClick={() => handleClubSort('athleteCount')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white text-center"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Jumlah Atlet</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleClubSort('winCount')}
                      className="p-3.5 font-bold cursor-pointer hover:text-white text-center"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Rekor (M - K)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th className="p-3.5 font-bold text-center">Detail Klub</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {sortedClubs.map((club) => {
                    const st = clubStats[club.name] || {
                      athleteCount: 0,
                      matchesPlayed: 0,
                      won: 0,
                      lost: 0,
                    };

                    return (
                      <tr
                        key={club.id}
                        onClick={() => setSelectedClubForDetail(club)}
                        className="hover:bg-slate-850/80 transition cursor-pointer group"
                      >
                        <td className="p-3.5 font-mono text-[11px] text-rose-400 font-bold">
                          {club.id}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-white block group-hover:text-rose-400 transition">
                            {club.name}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate max-w-xs block">
                            {club.address}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {club.city}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-white block">{club.contactPerson}</span>
                          <span className="text-[10px] text-slate-400">{club.phone}</span>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-white">
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
                            {st.athleteCount} Atlet
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          <span className="text-emerald-400 font-bold">{st.won}M</span>
                          <span className="text-slate-500 mx-1">-</span>
                          <span className="text-rose-400 font-bold">{st.lost}K</span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClubForDetail(club);
                            }}
                            className="p-1.5 bg-slate-800 group-hover:bg-rose-600 text-slate-300 group-hover:text-white rounded-lg transition text-xs flex items-center space-x-1 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">Lihat</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DETAIL KLUB (Menampilkan Profil Klub & Tabel Atlet yang BISA DIKLIK) */}
      {selectedClubForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-rose-400 font-bold block">
                    {selectedClubForDetail.id}
                  </span>
                  <h3 className="text-lg font-black text-white">{selectedClubForDetail.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedClubForDetail(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Club Info Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Kota / Domisili:</span>
                  <span className="font-bold text-white">{selectedClubForDetail.city}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Penanggung Jawab:</span>
                  <span className="font-bold text-white">{selectedClubForDetail.contactPerson}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor Telepon:</span>
                  <span className="text-slate-300">{selectedClubForDetail.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email Resmi:</span>
                  <span className="text-slate-300">{selectedClubForDetail.email || '-'}</span>
                </div>
                <div className="col-span-2 border-t border-slate-800 pt-2">
                  <span className="text-slate-500 block">Alamat GOR / Sekretariat:</span>
                  <span className="text-slate-300">{selectedClubForDetail.address}</span>
                </div>
              </div>

              {/* Athletes from this club (CLICKABLE ATHLETE ROW!) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Daftar Atlet Terdaftar dari {selectedClubForDetail.name}</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Klik nama atlet untuk melihat detail & rekor tanding
                  </span>
                </div>

                {(() => {
                  const clubAthletes = athletes.filter(
                    (a) => a.currentClub === selectedClubForDetail.name
                  );

                  if (clubAthletes.length === 0) {
                    return (
                      <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                        Belum ada atlet yang terdaftar dari klub ini.
                      </div>
                    );
                  }

                  return (
                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">ID Atlet</th>
                            <th className="p-2.5">Nama Atlet</th>
                            <th className="p-2.5">Kategori PBSI</th>
                            <th className="p-2.5">Jenis Kelamin</th>
                            <th className="p-2.5 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {clubAthletes.map((atl) => (
                            <tr
                              key={atl.id}
                              onClick={() => {
                                setSelectedAthleteForDetail(atl);
                              }}
                              className="hover:bg-slate-900 transition cursor-pointer"
                            >
                              <td className="p-2.5 font-mono text-[10px] text-rose-400 font-bold">
                                {atl.id}
                              </td>
                              <td className="p-2.5 font-bold text-white hover:text-rose-400">
                                {atl.name}
                              </td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300">
                                  {atl.category}
                                </span>
                              </td>
                              <td className="p-2.5">{atl.gender}</td>
                              <td className="p-2.5 text-center">
                                <span className="text-[10px] text-rose-400 font-bold hover:underline">
                                  Lihat Profil & H2H →
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedClubForDetail(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL ATLET & STATISTIK MENANG / KALAH (HEAD TO HEAD LENGKAP) */}
      {selectedAthleteForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white font-black flex items-center justify-center text-lg shadow-lg">
                  {selectedAthleteForDetail.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-white">{selectedAthleteForDetail.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {selectedAthleteForDetail.category}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Klub: <strong>{selectedAthleteForDetail.currentClub || 'PB Hevindo'}</strong> • No. Registrasi: {selectedAthleteForDetail.pbsiId || selectedAthleteForDetail.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAthleteForDetail(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Prestasi Atlet */}
              {selectedAthleteForDetail.achievements && selectedAthleteForDetail.achievements.length > 0 && (
                <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center space-x-1">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Daftar Prestasi & Juara Resmi:</span>
                  </span>
                  <div className="space-y-1">
                    {selectedAthleteForDetail.achievements.map((ach, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-200">
                        <span className="font-semibold">🏆 {ach.title} ({ach.year})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {ach.rank} • {ach.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Head-to-Head Statistics Summary */}
              {(() => {
                const history = getAthleteMatchHistory(selectedAthleteForDetail.id);
                const totalPlayed = history.length;
                const wonCount = history.filter((h) => h.isWinner).length;
                const lostCount = totalPlayed - wonCount;
                const winRate = totalPlayed > 0 ? Math.round((wonCount / totalPlayed) * 100) : 0;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-3 text-center text-xs">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Total Tanding</span>
                        <span className="text-lg font-black text-white font-mono">{totalPlayed}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-emerald-400 block text-[10px]">Menang</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">{wonCount}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-rose-400 block text-[10px]">Kalah</span>
                        <span className="text-lg font-black text-rose-400 font-mono">{lostCount}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-amber-400 block text-[10px]">Win Rate</span>
                        <span className="text-lg font-black text-amber-400 font-mono">{winRate}%</span>
                      </div>
                    </div>

                    {/* Riwayat Menang Kalah Lawan Siapa Saja */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
                        <Activity className="w-3.5 h-3.5 text-rose-400" />
                        <span>Riwayat Pertandingan (Menang / Kalah Lawan Siapa Saja)</span>
                      </h4>

                      {history.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                          Belum ada catatan pertandingan turnamen untuk atlet ini.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {history.map((h, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedMatchForDetail(h.match)}
                              className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-rose-500/50 transition cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                      h.isWinner
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    }`}
                                  >
                                    {h.isWinner ? 'MENANG' : 'KALAH'}
                                  </span>
                                  <span className="text-slate-400 text-[11px]">{h.match.round}</span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-slate-500 text-[10px]">{h.match.scheduledTime}</span>
                                </div>
                                <div className="text-white font-semibold pt-1">
                                  Lawan: <strong className="text-rose-400">{h.opponentName}</strong> ({h.opponentClub})
                                </div>
                              </div>

                              <div className="text-right font-mono">
                                <span className="text-sm font-black text-white block">{h.scoreStr}</span>
                                <span className="text-[10px] text-slate-500">Klik rincian set →</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center">
              <button
                onClick={() => setSelectedAthleteForDetail(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DETAIL RINCIAN PERTANDINGAN */}
      {selectedMatchForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Rincian Pertandingan Turnamen</h3>
              </div>
              <button
                onClick={() => setSelectedMatchForDetail(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-400">
                  {selectedMatchForDetail.ageCategory} • {selectedMatchForDetail.round}
                </span>

                <div className="grid grid-cols-2 gap-3 items-center py-2">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-white block text-sm">
                      {selectedMatchForDetail.playerAName}
                    </span>
                    <span className="text-[10px] text-slate-400">{selectedMatchForDetail.playerAClub}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-white block text-sm">
                      {selectedMatchForDetail.playerBName}
                    </span>
                    <span className="text-[10px] text-slate-400">{selectedMatchForDetail.playerBClub}</span>
                  </div>
                </div>

                {selectedMatchForDetail.scores && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Set 1:</span>
                      <span className="font-bold">
                        {selectedMatchForDetail.scores.game1PlayerA} - {selectedMatchForDetail.scores.game1PlayerB}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Set 2:</span>
                      <span className="font-bold">
                        {selectedMatchForDetail.scores.game2PlayerA} - {selectedMatchForDetail.scores.game2PlayerB}
                      </span>
                    </div>
                    {selectedMatchForDetail.scores.game3PlayerA !== undefined && (
                      <div className="flex justify-between text-rose-400 font-bold">
                        <span>Set 3 (Rubber):</span>
                        <span>
                          {selectedMatchForDetail.scores.game3PlayerA} - {selectedMatchForDetail.scores.game3PlayerB}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px] pt-1 text-slate-400">
                  <span>Lapangan: {selectedMatchForDetail.court}</span>
                  <span>Wasit: {selectedMatchForDetail.refereeName}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedMatchForDetail(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Form Modal (Create / Edit) */}
      <TournamentFormModal
        isOpen={isTournamentModalOpen}
        onClose={() => {
          setIsTournamentModalOpen(false);
          setTournamentToEdit(null);
        }}
        onSave={(data) => {
          if (tournamentToEdit && onUpdateTournament) {
            onUpdateTournament(data);
          } else if (onAddTournament) {
            onAddTournament(data);
          }
          setIsTournamentModalOpen(false);
          setTournamentToEdit(null);
        }}
        initialData={tournamentToEdit}
      />
    </div>
  );
};
