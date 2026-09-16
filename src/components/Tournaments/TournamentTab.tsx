import React, { useState, useMemo } from 'react';
import {
  Tournament,
  Match,
  Athlete,
  Club,
  UserRole,
  TournamentLevel,
  AgeCategory,
  MatchCardEvent,
} from '../../types';
import { generateSeededDraw, formatIndonesianDate } from '../../utils/helpers';
import {
  Trophy,
  Shuffle,
  Tv,
  Calendar,
  Award,
  Play,
  CheckCircle,
  Share2,
  Printer,
  Plus,
  AlertTriangle,
  RotateCcw,
  Zap,
  Globe,
} from 'lucide-react';

interface TournamentTabProps {
  tournaments: Tournament[];
  matches: Match[];
  athletes: Athlete[];
  clubs: Club[];
  onAddTournament: (tournament: Tournament) => void;
  onUpdateMatchScore: (match: Match) => void;
  onChampionDeclared: (athleteName: string, tournamentTitle: string) => void;
  currentRole: UserRole;
  publicLiveMode?: boolean;
}

export const TournamentTab: React.FC<TournamentTabProps> = ({
  tournaments,
  matches,
  athletes,
  clubs,
  onAddTournament,
  onUpdateMatchScore,
  onChampionDeclared,
  currentRole,
  publicLiveMode = false,
}) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournaments[0]?.id || ''
  );
  const [activeView, setActiveView] = useState<'bracket' | 'scoreboard' | 'matches'>(
    'bracket'
  );
  const [selectedMatchForScoring, setSelectedMatchForScoring] = useState<Match | null>(null);
  const [isCopiedPublicLink, setIsCopiedPublicLink] = useState(false);

  // Active tournament
  const currentTournament = tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];

  // Matches for this tournament
  const currentMatches = useMemo(() => {
    return matches.filter((m) => m.tournamentId === currentTournament?.id);
  }, [matches, currentTournament]);

  // Group matches by round
  const round1Matches = currentMatches.filter((m) => m.round === 'Semifinal' || m.round === 'Babak 1');
  const finalMatches = currentMatches.filter((m) => m.round === 'Final');

  // Seeded Draw Generator
  const handleAutoDraw = () => {
    if (!currentTournament) return;
    const participants = (currentTournament.participants && currentTournament.participants.length >= 2)
      ? currentTournament.participants
      : athletes.slice(0, 4);
    if (participants.length < 2) {
      alert('Peserta minimal 2 atlet untuk undian.');
      return;
    }

    const pairs = generateSeededDraw(participants);
    pairs.forEach((pair, idx) => {
      const matchObj: Match = {
        id: `MTC-${currentTournament.id}-${idx + 1}`,
        tournamentId: currentTournament.id,
        tournamentName: currentTournament.name || currentTournament.title || 'Turnamen HEVINDO',
        ageCategory: currentTournament.categories?.[0] || 'Pemula (U-15)',
        round: 'Semifinal',
        matchNumber: pair.matchNumber,
        court: `Court ${idx + 1} Hevindo`,
        scheduledTime: '14:00 WIB',
        player1Id: pair.playerA.id,
        player1Name: pair.playerA.name,
        player1Club: pair.playerA.clubName,
        player1Score1: 0,
        player1Score2: 0,
        player1Score3: 0,
        player2Id: pair.playerB.id,
        player2Name: pair.playerB.name,
        player2Club: pair.playerB.clubName,
        player2Score1: 0,
        player2Score2: 0,
        player2Score3: 0,
        currentSet: 1,
        courtSwitchedSet3: false,
        cardEvents: [],
        refereeName: 'Wasit Bertugas PBSI',
        status: 'Sedang Main',
      };
      onUpdateMatchScore(matchObj);
    });

    alert('Bagan Undian Seeded Berhasil Dibuat! Aturan pemisahan atlet sesama klub di babak awal diterapkan.');
  };

  // Live Score BWF controls
  const handleScorePoint = (player: 1 | 2) => {
    if (!selectedMatchForScoring) return;
    const m = { ...selectedMatchForScoring };

    if (m.currentSet === 1) {
      if (player === 1) m.player1Score1 += 1;
      else m.player2Score1 += 1;

      // Check win set 1 (Standard 21 point BWF)
      if (
        (m.player1Score1 >= 21 && m.player1Score1 - m.player2Score1 >= 2) ||
        m.player1Score1 === 30
      ) {
        m.currentSet = 2;
      } else if (
        (m.player2Score1 >= 21 && m.player2Score1 - m.player1Score1 >= 2) ||
        m.player2Score1 === 30
      ) {
        m.currentSet = 2;
      }
    } else if (m.currentSet === 2) {
      if (player === 1) m.player1Score2 += 1;
      else m.player2Score2 += 1;

      if (
        (m.player1Score2 >= 21 && m.player1Score2 - m.player2Score2 >= 2) ||
        m.player1Score2 === 30
      ) {
        // Did player 1 win both set 1 & 2?
        const p1WonSet1 = m.player1Score1 > m.player2Score1;
        if (p1WonSet1) {
          m.status = 'Selesai';
          m.winnerId = m.player1Id;
          m.winnerName = m.player1Name;
        } else {
          m.currentSet = 3;
        }
      } else if (
        (m.player2Score2 >= 21 && m.player2Score2 - m.player1Score2 >= 2) ||
        m.player2Score2 === 30
      ) {
        const p2WonSet1 = m.player2Score1 > m.player1Score1;
        if (p2WonSet1) {
          m.status = 'Selesai';
          m.winnerId = m.player2Id;
          m.winnerName = m.player2Name;
        } else {
          m.currentSet = 3;
        }
      }
    } else if (m.currentSet === 3) {
      if (player === 1) m.player1Score3 += 1;
      else m.player2Score3 += 1;

      // Switch court at 11 in set 3
      if (
        (m.player1Score3 === 11 || m.player2Score3 === 11) &&
        !m.courtSwitchedSet3
      ) {
        m.courtSwitchedSet3 = true;
      }

      if (
        (m.player1Score3 >= 21 && m.player1Score3 - m.player2Score3 >= 2) ||
        m.player1Score3 === 30
      ) {
        m.status = 'Selesai';
        m.winnerId = m.player1Id;
        m.winnerName = m.player1Name;
      } else if (
        (m.player2Score3 >= 21 && m.player2Score3 - m.player1Score3 >= 2) ||
        m.player2Score3 === 30
      ) {
        m.status = 'Selesai';
        m.winnerId = m.player2Id;
        m.winnerName = m.player2Name;
      }
    }

    // Check if tournament final won by HEVINDO athlete => Reward automatic free dues!
    if (m.round === 'Final' && m.status === 'Selesai' && m.winnerName) {
      onChampionDeclared(m.winnerName, currentTournament.title);
    }

    setSelectedMatchForScoring(m);
    onUpdateMatchScore(m);
  };

  const handleCardPenalty = (
    playerNum: 1 | 2,
    cardType: 'Kuning' | 'Merah' | 'Hitam'
  ) => {
    if (!selectedMatchForScoring) return;
    const m = { ...selectedMatchForScoring };
    const playerName = playerNum === 1 ? m.player1Name : m.player2Name;

    const event: MatchCardEvent = {
      id: `CRD-${Date.now()}`,
      matchId: m.id,
      playerNumber: playerNum,
      playerName,
      cardType,
      reason:
        cardType === 'Hitam'
          ? 'Diskualifikasi Pelanggaran Berat'
          : cardType === 'Merah'
          ? 'Penalti Poin Lawan (Fault/Delay)'
          : 'Peringatan Wasit (Unsportsmanlike Conduct)',
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };

    if (!m.cardEvents) m.cardEvents = [];
    m.cardEvents.push(event);

    // In BWF, Red card gives 1 point to opponent
    if (cardType === 'Merah') {
      if (playerNum === 1) handleScorePoint(2);
      else handleScorePoint(1);
    }

    // Black card = disqualification
    if (cardType === 'Hitam') {
      m.status = 'Selesai';
      if (playerNum === 1) {
        m.winnerId = m.player2Id;
        m.winnerName = m.player2Name;
      } else {
        m.winnerId = m.player1Id;
        m.winnerName = m.player1Name;
      }
    }

    setSelectedMatchForScoring(m);
    onUpdateMatchScore(m);
  };

  const copyPublicLiveLink = () => {
    const url = `${window.location.origin}/?tab=tournament&live=${currentTournament?.id}`;
    navigator.clipboard.writeText(url);
    setIsCopiedPublicLink(true);
    setTimeout(() => setIsCopiedPublicLink(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Tournament Selector & Live Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 p-5 rounded-2xl border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950">
              {currentTournament?.level}
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block"></span>
              <span>LIVE MATCH SCOREBOARD</span>
            </span>
          </div>

          <h2 className="text-lg md:text-xl font-black text-white">
            {currentTournament?.title}
          </h2>

          <p className="text-xs text-slate-300">
            Kategori: <strong className="text-emerald-300">{currentTournament?.category}</strong> • Venue: {currentTournament?.location} • {currentTournament?.startDate} s/d {currentTournament?.endDate}
          </p>
        </div>

        {/* Public Live Link & Draw Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={copyPublicLiveLink}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
            title="Salin Live Link Publik untuk Penonton & Suporter (Tanpa Login)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isCopiedPublicLink ? '✓ Link Publik Disalin!' : 'Live Link Publik'}</span>
          </button>

          <button
            onClick={handleAutoDraw}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950/30 transition"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Undian Seeded Otomatis</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Cetak Bagan PDF</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Bagan Pertandingan vs Live Scoreboard BWF */}
      <div className="flex items-center justify-between bg-slate-850 p-2 rounded-xl border border-slate-800">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('bracket')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeView === 'bracket'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Bagan Pertandingan & Seeded Draw</span>
          </button>

          <button
            onClick={() => setActiveView('scoreboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeView === 'scoreboard'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Live Scoreboard Standar BWF</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Rule: Tidak mempertemukan atlet satu klub di babak awal
        </span>
      </div>

      {/* VIEW 1: TOURNAMENT BRACKET (Bagan Interaktif) */}
      {activeView === 'bracket' && (
        <div className="space-y-6">
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 overflow-x-auto">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Bagan Eliminasi Turnamen: {currentTournament?.title}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-w-[700px]">
              {/* Semifinal Column */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  Semifinal (Babak 4 Besar)
                </div>

                <div className="space-y-4">
                  {round1Matches.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl border transition ${
                        m.status === 'Berlangsung'
                          ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-950/40'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pb-2 mb-2 border-b border-slate-800">
                        <span>{m.matchNumber} • {m.court}</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            m.status === 'Berlangsung'
                              ? 'bg-red-500/20 text-red-400 animate-pulse'
                              : m.status === 'Selesai'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>

                      {/* Player 1 */}
                      <div
                        className={`flex justify-between items-center py-1 text-xs ${
                          m.winnerId === m.player1Id ? 'text-emerald-400 font-bold' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          {m.player1Seed && (
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                              {m.player1Seed}
                            </span>
                          )}
                          <span>{m.player1Name}</span>
                          <span className="text-[10px] text-slate-500">({m.player1Club})</span>
                        </div>
                        <div className="font-mono font-bold space-x-1">
                          <span>{m.player1Score1}</span>
                          <span>-</span>
                          <span>{m.player1Score2}</span>
                          {m.currentSet === 3 && <span>-{m.player1Score3}</span>}
                        </div>
                      </div>

                      {/* Player 2 */}
                      <div
                        className={`flex justify-between items-center py-1 text-xs ${
                          m.winnerId === m.player2Id ? 'text-emerald-400 font-bold' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          {m.player2Seed && (
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                              {m.player2Seed}
                            </span>
                          )}
                          <span>{m.player2Name}</span>
                          <span className="text-[10px] text-slate-500">({m.player2Club})</span>
                        </div>
                        <div className="font-mono font-bold space-x-1">
                          <span>{m.player2Score1}</span>
                          <span>-</span>
                          <span>{m.player2Score2}</span>
                          {m.currentSet === 3 && <span>-{m.player2Score3}</span>}
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400">Wasit: {m.refereeName}</span>
                        <button
                          onClick={() => {
                            setSelectedMatchForScoring(m);
                            setActiveView('scoreboard');
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-semibold transition"
                        >
                          Scoring Wasit 🏸
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Column */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2 flex items-center space-x-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Grand Final (Penentuan Juara 🏆)</span>
                </div>

                <div className="space-y-4">
                  {finalMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border-2 border-amber-500/40 shadow-xl shadow-amber-950/20"
                    >
                      <div className="flex justify-between items-center text-[10px] text-amber-300 pb-2 mb-3 border-b border-amber-500/20">
                        <span className="font-bold">PARTAI FINAL EMAS • {m.court}</span>
                        <span className="px-2 py-0.5 bg-amber-500/20 rounded font-black">
                          {m.status}
                        </span>
                      </div>

                      <div
                        className={`flex justify-between items-center py-2 text-sm ${
                          m.winnerId === m.player1Id ? 'text-amber-300 font-extrabold' : 'text-white'
                        }`}
                      >
                        <div>
                          <p className="font-bold flex items-center space-x-1">
                            {m.winnerId === m.player1Id && <span>👑</span>}
                            <span>{m.player1Name}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">{m.player1Club}</p>
                        </div>
                        <div className="font-mono text-base font-black text-amber-400 space-x-2">
                          <span>{m.player1Score1}</span>
                          <span>{m.player1Score2}</span>
                          {m.currentSet === 3 && <span>{m.player1Score3}</span>}
                        </div>
                      </div>

                      <div
                        className={`flex justify-between items-center py-2 text-sm border-t border-slate-800 ${
                          m.winnerId === m.player2Id ? 'text-amber-300 font-extrabold' : 'text-white'
                        }`}
                      >
                        <div>
                          <p className="font-bold flex items-center space-x-1">
                            {m.winnerId === m.player2Id && <span>👑</span>}
                            <span>{m.player2Name}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">{m.player2Club}</p>
                        </div>
                        <div className="font-mono text-base font-black text-amber-400 space-x-2">
                          <span>{m.player2Score1}</span>
                          <span>{m.player2Score2}</span>
                          {m.currentSet === 3 && <span>{m.player2Score3}</span>}
                        </div>
                      </div>

                      {m.winnerName && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-center">
                          <span className="text-[10px] uppercase font-bold text-amber-300 block">
                            JUARA 1 TURNAMEN
                          </span>
                          <span className="font-black text-sm text-white">{m.winnerName}</span>
                          <p className="text-[10px] text-emerald-300 mt-1 font-semibold">
                            🏆 Otomatis Memperoleh Bebas Iuran Bulanan HEVINDO!
                          </p>
                        </div>
                      )}

                      <div className="mt-4 pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedMatchForScoring(m);
                            setActiveView('scoreboard');
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-950/40 flex items-center space-x-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Mulai / Lanjutkan Scoring Final</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE SCOREBOARD STANDAR BWF */}
      {activeView === 'scoreboard' && (
        <div className="space-y-6">
          {/* Match Picker Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-850 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Pilih Partai Pertandingan:</span>
            {currentMatches.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMatchForScoring(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  (selectedMatchForScoring?.id || currentMatches[0]?.id) === m.id
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {m.round}: {m.player1Name.split(' ')[0]} vs {m.player2Name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Digital BWF Scoreboard Display (Broadcast Ready) */}
          {(() => {
            const match = selectedMatchForScoring || currentMatches[0];
            if (!match) return <div className="text-white p-4">Belum ada partai.</div>;

            const p1Score =
              match.currentSet === 1
                ? match.player1Score1
                : match.currentSet === 2
                ? match.player1Score2
                : match.player1Score3;

            const p2Score =
              match.currentSet === 1
                ? match.player2Score1
                : match.currentSet === 2
                ? match.player2Score2
                : match.player2Score3;

            return (
              <div className="space-y-4">
                {/* Court Switch Notification */}
                {match.courtSwitchedSet3 && match.currentSet === 3 && (
                  <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs text-center font-bold animate-pulse">
                    ⚡ INTERVAL SET 3 POIN 11: PERPINDAHAN TEMPAT / PINDAH LAPANGAN (SWITCH COURT)!
                  </div>
                )}

                {/* Scoreboard Board */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                        OFFICIAL BWF SCORING SYSTEM • {match.court}
                      </span>
                      <h3 className="text-white font-black text-base md:text-lg">
                        {currentTournament?.title} ({match.round})
                      </h3>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-red-600/30 border border-red-500/40 text-red-300 rounded-full text-xs font-bold">
                        SET {match.currentSet} / 3
                      </span>
                      <span className="text-xs text-slate-400">Wasit: {match.refereeName}</span>
                    </div>
                  </div>

                  {/* Two Competitors Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    {/* Player 1 Box */}
                    <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between items-center text-center space-y-4">
                      <div>
                        {match.player1Seed && (
                          <span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full mb-1">
                            Unggulan [{match.player1Seed}]
                          </span>
                        )}
                        <h4 className="text-lg md:text-xl font-black text-white">{match.player1Name}</h4>
                        <p className="text-xs text-emerald-400 font-semibold">{match.player1Club}</p>
                      </div>

                      {/* Giant LED Score */}
                      <div className="w-36 h-28 bg-slate-950 rounded-2xl border-2 border-emerald-500/40 flex items-center justify-center shadow-inner">
                        <span className="font-mono text-6xl md:text-7xl font-black text-emerald-400 tracking-tighter">
                          {p1Score}
                        </span>
                      </div>

                      {/* Set History */}
                      <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                        <span>Set 1: <strong className="text-white">{match.player1Score1}</strong></span>
                        <span>Set 2: <strong className="text-white">{match.player1Score2}</strong></span>
                        <span>Set 3: <strong className="text-white">{match.player1Score3}</strong></span>
                      </div>

                      {/* Scorer Buttons */}
                      <div className="flex items-center space-x-2 w-full pt-2">
                        <button
                          onClick={() => handleScorePoint(1)}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-xl text-sm transition shadow-lg shadow-emerald-950/50"
                        >
                          +1 Poin
                        </button>
                      </div>

                      {/* BWF Penalties Cards */}
                      <div className="flex items-center justify-center space-x-2 pt-2 border-t border-slate-800 w-full">
                        <button
                          onClick={() => handleCardPenalty(1, 'Kuning')}
                          className="px-2 py-1 bg-yellow-400 text-slate-950 font-bold rounded text-[10px] hover:brightness-110"
                          title="Kartu Kuning: Peringatan"
                        >
                          Kartu Kuning
                        </button>
                        <button
                          onClick={() => handleCardPenalty(1, 'Merah')}
                          className="px-2 py-1 bg-red-600 text-white font-bold rounded text-[10px] hover:brightness-110"
                          title="Kartu Merah: Poin Lawan Bertambah"
                        >
                          Kartu Merah
                        </button>
                        <button
                          onClick={() => handleCardPenalty(1, 'Hitam')}
                          className="px-2 py-1 bg-slate-900 text-white border border-slate-700 font-bold rounded text-[10px] hover:bg-black"
                          title="Kartu Hitam: Diskualifikasi"
                        >
                          Kartu Hitam
                        </button>
                      </div>
                    </div>

                    {/* Player 2 Box */}
                    <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between items-center text-center space-y-4">
                      <div>
                        {match.player2Seed && (
                          <span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full mb-1">
                            Unggulan [{match.player2Seed}]
                          </span>
                        )}
                        <h4 className="text-lg md:text-xl font-black text-white">{match.player2Name}</h4>
                        <p className="text-xs text-emerald-400 font-semibold">{match.player2Club}</p>
                      </div>

                      {/* Giant LED Score */}
                      <div className="w-36 h-28 bg-slate-950 rounded-2xl border-2 border-emerald-500/40 flex items-center justify-center shadow-inner">
                        <span className="font-mono text-6xl md:text-7xl font-black text-emerald-400 tracking-tighter">
                          {p2Score}
                        </span>
                      </div>

                      {/* Set History */}
                      <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                        <span>Set 1: <strong className="text-white">{match.player2Score1}</strong></span>
                        <span>Set 2: <strong className="text-white">{match.player2Score2}</strong></span>
                        <span>Set 3: <strong className="text-white">{match.player2Score3}</strong></span>
                      </div>

                      {/* Scorer Buttons */}
                      <div className="flex items-center space-x-2 w-full pt-2">
                        <button
                          onClick={() => handleScorePoint(2)}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-xl text-sm transition shadow-lg shadow-emerald-950/50"
                        >
                          +1 Poin
                        </button>
                      </div>

                      {/* BWF Penalties Cards */}
                      <div className="flex items-center justify-center space-x-2 pt-2 border-t border-slate-800 w-full">
                        <button
                          onClick={() => handleCardPenalty(2, 'Kuning')}
                          className="px-2 py-1 bg-yellow-400 text-slate-950 font-bold rounded text-[10px] hover:brightness-110"
                          title="Kartu Kuning: Peringatan"
                        >
                          Kartu Kuning
                        </button>
                        <button
                          onClick={() => handleCardPenalty(2, 'Merah')}
                          className="px-2 py-1 bg-red-600 text-white font-bold rounded text-[10px] hover:brightness-110"
                          title="Kartu Merah: Poin Lawan Bertambah"
                        >
                          Kartu Merah
                        </button>
                        <button
                          onClick={() => handleCardPenalty(2, 'Hitam')}
                          className="px-2 py-1 bg-slate-900 text-white border border-slate-700 font-bold rounded text-[10px] hover:bg-black"
                          title="Kartu Hitam: Diskualifikasi"
                        >
                          Kartu Hitam
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Event History Log */}
                  {match.cardEvents && match.cardEvents.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-800 text-xs">
                      <span className="font-bold text-slate-400 block mb-2">
                        Catatan Pelanggaran Kartu Wasit:
                      </span>
                      <div className="space-y-1">
                        {match.cardEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-[11px]"
                          >
                            <span className="flex items-center space-x-2">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                  evt.cardType === 'Kuning'
                                    ? 'bg-yellow-400 text-slate-950'
                                    : evt.cardType === 'Merah'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-black text-white border border-slate-700'
                                }`}
                              >
                                {evt.cardType}
                              </span>
                              <strong className="text-white">{evt.playerName}</strong>
                              <span className="text-slate-400">- {evt.reason}</span>
                            </span>
                            <span className="text-slate-500 font-mono">{evt.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
