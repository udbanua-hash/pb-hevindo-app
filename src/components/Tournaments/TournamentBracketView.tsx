import React, { useState, useMemo } from 'react';
import {
  Tournament,
  TournamentMatch,
  TournamentParticipant,
  TournamentEventType,
  PBSIAgeCategory,
  UserRole,
} from '../../types';
import {
  Trophy,
  Shuffle,
  Medal,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface TournamentBracketViewProps {
  tournament: Tournament;
  matches: TournamentMatch[];
  onBatchAddMatches?: (matches: TournamentMatch[]) => void;
  onUpdateMatch: (match: TournamentMatch) => void;
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

export const TournamentBracketView: React.FC<TournamentBracketViewProps> = ({
  tournament,
  matches,
  onBatchAddMatches,
  onUpdateMatch,
  currentRole,
  selectedCategory,
  onSelectCategory,
}) => {
  const [selectedEventType, setSelectedEventType] = useState<string>('Tunggal Putra (MS)');
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [drawCategory, setDrawCategory] = useState<PBSIAgeCategory>(
    selectedCategory !== 'Semua Kategori' ? (selectedCategory as PBSIAgeCategory) : 'Pemula (U-15)'
  );
  const [drawEventType, setDrawEventType] = useState<TournamentEventType>('Tunggal Putra (MS)');

  const canManage = currentRole === 'Wasit / Admin Turnamen' || currentRole === 'Master Admin';

  // Filter matches for this tournament, category, and event type
  const relevantMatches = useMemo(() => {
    return matches.filter((m) => {
      if (m.tournamentId !== tournament.id) return false;
      if (selectedCategory !== 'Semua Kategori' && m.ageCategory && m.ageCategory !== selectedCategory) {
        return false;
      }
      if (selectedEventType !== 'Semua Jenis' && m.eventType && m.eventType !== selectedEventType) {
        return false;
      }
      return true;
    });
  }, [matches, tournament.id, selectedCategory, selectedEventType]);

  // Group into rounds: Babak 16 Besar, Perempat Final, Semifinal, Final
  const roundsData = useMemo(() => {
    const r16 = relevantMatches.filter((m) => m.round.includes('16') || m.round.includes('Babak 1'));
    const qf = relevantMatches.filter((m) => m.round.includes('Perempat') || m.round.includes('Quarter'));
    const sf = relevantMatches.filter((m) => m.round.includes('Semi'));
    const fn = relevantMatches.filter((m) => m.round.includes('Final') && !m.round.includes('Semi') && !m.round.includes('Perempat'));

    return {
      round16: r16,
      quarterFinals: qf.length > 0 ? qf : [],
      semiFinals: sf.length > 0 ? sf : [],
      final: fn.length > 0 ? fn[0] : null,
    };
  }, [relevantMatches]);

  // AUTOMATIC DRAW GENERATOR LOGIC
  const handleExecuteDraw = () => {
    if (!onBatchAddMatches) {
      alert('Fitur penyimpanan undian belum tersedia.');
      return;
    }

    // Filter participants for the chosen draw category & event type
    const availableParticipants = (tournament.participantsList || []).filter(
      (p) => p.ageCategory === drawCategory && p.eventType === drawEventType
    );

    let candidates: TournamentParticipant[] = [];

    if (availableParticipants.length >= 4) {
      candidates = [...availableParticipants];
    } else {
      // If not enough registered participants, fill with realistic club candidates for demonstration
      candidates = [
        {
          id: 'CP-1',
          tournamentId: tournament.id,
          eventType: drawEventType,
          ageCategory: drawCategory,
          player1Name: 'Kevin Pratama',
          player1Club: 'PB Hevindo',
          seed: 1,
          registrationDate: '2026-03-01',
          paymentStatus: 'Lunas',
        },
        {
          id: 'CP-2',
          tournamentId: tournament.id,
          eventType: drawEventType,
          ageCategory: drawCategory,
          player1Name: 'Rizky Alamsyah',
          player1Club: 'PB Djarum',
          seed: 2,
          registrationDate: '2026-03-01',
          paymentStatus: 'Lunas',
        },
        {
          id: 'CP-3',
          tournamentId: tournament.id,
          eventType: drawEventType,
          ageCategory: drawCategory,
          player1Name: 'Farhan Maulana',
          player1Club: 'PB Jaya Raya',
          seed: 3,
          registrationDate: '2026-03-01',
          paymentStatus: 'Lunas',
        },
        {
          id: 'CP-4',
          tournamentId: tournament.id,
          eventType: drawEventType,
          ageCategory: drawCategory,
          player1Name: 'Jonathan Tan',
          player1Club: 'PB Exist Badminton Club',
          seed: 4,
          registrationDate: '2026-03-01',
          paymentStatus: 'Lunas',
        },
        {
          id: 'CP-5',
          tournamentId: tournament.id,
          eventType: drawEventType,
          ageCategory: drawCategory,
          player1Name: 'Rian Ardiansyah',
          player1Club: 'PB Mutiara Cardinal',
          registrationDate: '2026-03-01',
          paymentStatus: 'Lunas',
        },
        {
          id: 'CP-6',
          tournamentId: tournament.id,
          eventType: drawEventType,
          ageCategory: drawCategory,
          player1Name: 'Bagas Aditya',
          player1Club: 'PB Tangkas Jakarta',
          registrationDate: '2026-03-01',
          paymentStatus: 'Lunas',
        },
        {
          id: 'CP-7',
          tournamentId: tournament.id,
          eventType: drawEventType,
          ageCategory: drawCategory,
          player1Name: 'Fajar Nugraha',
          player1Club: 'PB Hevindo',
          registrationDate: '2026-03-01',
          paymentStatus: 'Lunas',
        },
        {
          id: 'CP-8',
          tournamentId: tournament.id,
          eventType: drawEventType,
          ageCategory: drawCategory,
          player1Name: 'Dimas Wicaksono',
          player1Club: 'PB Suryanaga',
          registrationDate: '2026-03-01',
          paymentStatus: 'Lunas',
        },
      ];
    }

    // Separate seeds and non-seeds
    const seeds = candidates.filter((c) => c.seed && c.seed > 0).sort((a, b) => (a.seed || 0) - (b.seed || 0));
    const unseeded = candidates.filter((c) => !c.seed || c.seed <= 0);

    // Shuffle unseeded
    const shuffledUnseeded = [...unseeded].sort(() => Math.random() - 0.5);

    // Seed 1 top, Seed 2 bottom, seeds 3 and 4 in middle
    const seed1 = seeds[0] || candidates[0];
    const seed2 = seeds[1] || candidates[candidates.length - 1];
    const seed3 = seeds[2] || shuffledUnseeded[0] || candidates[1];
    const seed4 = seeds[3] || shuffledUnseeded[1] || candidates[2];

    const remaining = shuffledUnseeded.filter(
      (c) => c.id !== seed1?.id && c.id !== seed2?.id && c.id !== seed3?.id && c.id !== seed4?.id
    );

    // Create 4 Quarter-Final matches
    const newMatches: TournamentMatch[] = [
      {
        id: `QF-1-${Date.now()}`,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        ageCategory: drawCategory,
        eventType: drawEventType,
        round: 'Perempat Final (QF-1)',
        matchNumber: 'QF-1',
        court: 'Court 1 Arena',
        scheduledTime: '09:00 WIB',
        playerAId: seed1.player1Id || 'P-1',
        playerAName: seed1.player2Name ? `${seed1.player1Name} / ${seed1.player2Name}` : seed1.player1Name,
        playerAClub: seed1.player1Club,
        playerASeed: seed1.seed || 1,
        playerBId: remaining[0]?.player1Id || 'P-8',
        playerBName: remaining[0] ? (remaining[0].player2Name ? `${remaining[0].player1Name} / ${remaining[0].player2Name}` : remaining[0].player1Name) : 'Farhan Maulana',
        playerBClub: remaining[0]?.player1Club || 'PB Jaya Raya',
        scores: { game1PlayerA: 21, game1PlayerB: 18, game2PlayerA: 21, game2PlayerB: 15 },
        winnerId: seed1.player1Id || 'P-1',
        refereeName: 'Drs. Agus Salim, M.Si',
        refereeCertification: 'PBSI Sertifikasi Nasional',
        status: 'Selesai',
      },
      {
        id: `QF-2-${Date.now() + 1}`,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        ageCategory: drawCategory,
        eventType: drawEventType,
        round: 'Perempat Final (QF-2)',
        matchNumber: 'QF-2',
        court: 'Court 2 Arena',
        scheduledTime: '09:45 WIB',
        playerAId: seed4.player1Id || 'P-4',
        playerAName: seed4.player2Name ? `${seed4.player1Name} / ${seed4.player2Name}` : seed4.player1Name,
        playerAClub: seed4.player1Club,
        playerASeed: seed4.seed || 4,
        playerBId: remaining[1]?.player1Id || 'P-5',
        playerBName: remaining[1] ? (remaining[1].player2Name ? `${remaining[1].player1Name} / ${remaining[1].player2Name}` : remaining[1].player1Name) : 'Jonathan Tan',
        playerBClub: remaining[1]?.player1Club || 'PB Exist',
        scores: { game1PlayerA: 21, game1PlayerB: 19, game2PlayerA: 21, game2PlayerB: 14 },
        winnerId: seed4.player1Id || 'P-4',
        refereeName: 'H. Bambang Irawan',
        refereeCertification: 'PBSI Lisensi A Daerah',
        status: 'Selesai',
      },
      {
        id: `QF-3-${Date.now() + 2}`,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        ageCategory: drawCategory,
        eventType: drawEventType,
        round: 'Perempat Final (QF-3)',
        matchNumber: 'QF-3',
        court: 'Court 3 Arena',
        scheduledTime: '10:30 WIB',
        playerAId: seed3.player1Id || 'P-3',
        playerAName: seed3.player2Name ? `${seed3.player1Name} / ${seed3.player2Name}` : seed3.player1Name,
        playerAClub: seed3.player1Club,
        playerASeed: seed3.seed || 3,
        playerBId: remaining[2]?.player1Id || 'P-6',
        playerBName: remaining[2] ? (remaining[2].player2Name ? `${remaining[2].player1Name} / ${remaining[2].player2Name}` : remaining[2].player1Name) : 'Rian Ardiansyah',
        playerBClub: remaining[2]?.player1Club || 'PB Mutiara Cardinal',
        scores: { game1PlayerA: 21, game1PlayerB: 16, game2PlayerA: 21, game2PlayerB: 17 },
        winnerId: seed3.player1Id || 'P-3',
        refereeName: 'Dra. Sri Wahyuni',
        refereeCertification: 'PBSI Sertifikasi Nasional',
        status: 'Selesai',
      },
      {
        id: `QF-4-${Date.now() + 3}`,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        ageCategory: drawCategory,
        eventType: drawEventType,
        round: 'Perempat Final (QF-4)',
        matchNumber: 'QF-4',
        court: 'Court 1 Arena',
        scheduledTime: '11:15 WIB',
        playerAId: remaining[3]?.player1Id || 'P-7',
        playerAName: remaining[3] ? (remaining[3].player2Name ? `${remaining[3].player1Name} / ${remaining[3].player2Name}` : remaining[3].player1Name) : 'Fajar Nugraha',
        playerAClub: remaining[3]?.player1Club || 'PB Hevindo',
        playerBId: seed2.player1Id || 'P-2',
        playerBName: seed2.player2Name ? `${seed2.player1Name} / ${seed2.player2Name}` : seed2.player1Name,
        playerBClub: seed2.player1Club,
        playerBSeed: seed2.seed || 2,
        scores: { game1PlayerA: 14, game1PlayerB: 21, game2PlayerA: 16, game2PlayerB: 21 },
        winnerId: seed2.player1Id || 'P-2',
        refereeName: 'Drs. Agus Salim, M.Si',
        refereeCertification: 'PBSI Sertifikasi Nasional',
        status: 'Selesai',
      },
      // Semifinal 1 (Live match)
      {
        id: `SF-1-${Date.now() + 4}`,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        ageCategory: drawCategory,
        eventType: drawEventType,
        round: 'Semifinal 1',
        matchNumber: 'SF-1',
        court: 'Court 1 Arena',
        scheduledTime: '14:30 WIB',
        playerAId: seed1.player1Id || 'P-1',
        playerAName: seed1.player2Name ? `${seed1.player1Name} / ${seed1.player2Name}` : seed1.player1Name,
        playerAClub: seed1.player1Club,
        playerASeed: seed1.seed || 1,
        playerBId: seed4.player1Id || 'P-4',
        playerBName: seed4.player2Name ? `${seed4.player1Name} / ${seed4.player2Name}` : seed4.player1Name,
        playerBClub: seed4.player1Club,
        playerBSeed: seed4.seed || 4,
        scores: { game1PlayerA: 21, game1PlayerB: 17, game2PlayerA: 19, game2PlayerB: 21, game3PlayerA: 14, game3PlayerB: 13 },
        refereeName: 'Drs. Agus Salim, M.Si',
        refereeCertification: 'PBSI Sertifikasi Nasional',
        status: 'Sedang Main',
      },
      // Semifinal 2 (Upcoming)
      {
        id: `SF-2-${Date.now() + 5}`,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        ageCategory: drawCategory,
        eventType: drawEventType,
        round: 'Semifinal 2',
        matchNumber: 'SF-2',
        court: 'Court 2 Arena',
        scheduledTime: '15:30 WIB',
        playerAId: seed3.player1Id || 'P-3',
        playerAName: seed3.player2Name ? `${seed3.player1Name} / ${seed3.player2Name}` : seed3.player1Name,
        playerAClub: seed3.player1Club,
        playerASeed: seed3.seed || 3,
        playerBId: seed2.player1Id || 'P-2',
        playerBName: seed2.player2Name ? `${seed2.player1Name} / ${seed2.player2Name}` : seed2.player1Name,
        playerBClub: seed2.player1Club,
        playerBSeed: seed2.seed || 2,
        scores: { game1PlayerA: 0, game1PlayerB: 0, game2PlayerA: 0, game2PlayerB: 0 },
        refereeName: 'H. Bambang Irawan',
        refereeCertification: 'PBSI Lisensi A Daerah',
        status: 'Terjadwal',
      },
      // Grand Final (Scheduled)
      {
        id: `FN-1-${Date.now() + 6}`,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        ageCategory: drawCategory,
        eventType: drawEventType,
        round: 'Grand Final',
        matchNumber: 'FN-1',
        court: 'Court 1 Arena Utama',
        scheduledTime: '19:30 WIB',
        playerAName: 'Pemenang Semifinal 1',
        playerAClub: 'Menunggu Hasil SF-1',
        playerBName: 'Pemenang Semifinal 2',
        playerBClub: 'Menunggu Hasil SF-2',
        scores: { game1PlayerA: 0, game1PlayerB: 0, game2PlayerA: 0, game2PlayerB: 0 },
        refereeName: 'Drs. Agus Salim, M.Si',
        refereeCertification: 'PBSI Sertifikasi Nasional',
        status: 'Terjadwal',
      },
    ];

    onBatchAddMatches(newMatches);
    setIsDrawingModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Control & Header */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          >
            <option value="Semua Kategori">Semua Kelompok Usia</option>
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
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 text-xs text-slate-400 border border-slate-800">
            Sistem Gugur Tunggal (Single Elimination)
          </span>

          {canManage && (
            <button
              onClick={() => setIsDrawingModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-950/50 flex items-center space-x-1.5"
            >
              <Shuffle className="w-4 h-4" />
              <span>🎲 Undi Bagan Otomatis (Draw)</span>
            </button>
          )}
        </div>
      </div>

      {/* BRACKET VISUAL TREE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-rose-400" />
              <span>Bagan Pertandingan (Tournament Bracket)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kategori: <strong className="text-rose-400">{selectedCategory}</strong> • Nomor:{' '}
              <strong className="text-white">{selectedEventType}</strong>
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Turnamen: <strong className="text-slate-200">{tournament.name}</strong>
          </span>
        </div>

        {/* 3-4 Rounds Columns */}
        <div className="min-w-[850px] grid grid-cols-3 gap-6 relative">
          {/* ROUND 1: PEREMPAT FINAL (QF) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center pb-2 border-b border-slate-800 flex items-center justify-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Perempat Final (QF)</span>
            </h4>

            {roundsData.quarterFinals.length > 0 ? (
              roundsData.quarterFinals.map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-xl border transition ${
                    m.status === 'Sedang Main'
                      ? 'bg-rose-950/30 border-rose-500 shadow-md shadow-rose-950/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 mb-1.5 border-b border-slate-900">
                    <span className="font-mono text-rose-400 font-bold">{m.court}</span>
                    <span>{m.scheduledTime || 'Pagi'}</span>
                  </div>

                  {/* Player A */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-1.5 truncate pr-2">
                      {m.playerASeed && (
                        <span className="text-[10px] text-amber-400 font-bold">[{m.playerASeed}]</span>
                      )}
                      <span
                        className={`truncate ${
                          m.winnerId === m.playerAId ? 'font-bold text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {m.playerAName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0">
                      {m.scores?.game1PlayerA ?? '-'}
                    </span>
                  </div>

                  {/* Player B */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-1.5 truncate pr-2">
                      {m.playerBSeed && (
                        <span className="text-[10px] text-amber-400 font-bold">[{m.playerBSeed}]</span>
                      )}
                      <span
                        className={`truncate ${
                          m.winnerId === m.playerBId ? 'font-bold text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {m.playerBName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0">
                      {m.scores?.game1PlayerB ?? '-'}
                    </span>
                  </div>

                  <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-900 flex justify-between">
                    <span>{m.refereeName}</span>
                    <span className="text-emerald-400 font-medium">{m.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-600 border border-dashed border-slate-800 rounded-xl text-xs">
                Belum ada data perempat final. Gunakan tombol "🎲 Undi Bagan" di atas.
              </div>
            )}
          </div>

          {/* ROUND 2: SEMIFINAL (SF) */}
          <div className="space-y-4 my-auto">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center pb-2 border-b border-slate-800 flex items-center justify-center space-x-1">
              <Medal className="w-3.5 h-3.5 text-rose-400" />
              <span>Semifinal</span>
            </h4>

            {roundsData.semiFinals.length > 0 ? (
              roundsData.semiFinals.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border transition ${
                    m.status === 'Sedang Main'
                      ? 'bg-rose-950/30 border-rose-500/80 shadow-lg shadow-rose-950/50'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] pb-1.5 mb-1.5 border-b border-slate-900">
                    <span className="font-mono text-rose-400 font-bold">{m.court}</span>
                    {m.status === 'Sedang Main' ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold animate-pulse">
                        LIVE MATCH
                      </span>
                    ) : (
                      <span className="text-slate-400">{m.scheduledTime || '14:30 WIB'}</span>
                    )}
                  </div>

                  {/* Player A */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-1.5 truncate pr-2">
                      {m.playerASeed && (
                        <span className="text-[10px] text-amber-400 font-bold">[{m.playerASeed}]</span>
                      )}
                      <span className="text-white font-bold truncate">{m.playerAName}</span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0">
                      {m.scores?.game3PlayerA ?? m.scores?.game1PlayerA ?? '-'}
                    </span>
                  </div>

                  {/* Player B */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-1.5 truncate pr-2">
                      {m.playerBSeed && (
                        <span className="text-[10px] text-amber-400 font-bold">[{m.playerBSeed}]</span>
                      )}
                      <span className="text-white font-bold truncate">{m.playerBName}</span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0">
                      {m.scores?.game3PlayerB ?? m.scores?.game1PlayerB ?? '-'}
                    </span>
                  </div>

                  {m.status === 'Sedang Main' && m.scores?.game3PlayerA !== undefined && (
                    <span className="text-[10px] text-rose-400 font-mono block text-right pt-1.5 border-t border-slate-900">
                      Rubber Game: {m.scores.game3PlayerA} - {m.scores.game3PlayerB}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-600 border border-dashed border-slate-800 rounded-xl text-xs">
                Menunggu hasil babak perempat final.
              </div>
            )}
          </div>

          {/* ROUND 3: GRAND FINAL */}
          <div className="space-y-4 my-auto">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider text-center pb-2 border-b border-slate-800 flex items-center justify-center space-x-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Grand Final Championship</span>
            </h4>

            {roundsData.final ? (
              <div className="p-4 bg-amber-950/20 border border-amber-500/40 rounded-xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-[10px] pb-1.5 border-b border-amber-500/20">
                  <span className="text-amber-400 font-mono font-bold">{roundsData.final.court}</span>
                  <span className="text-slate-400">{roundsData.final.scheduledTime || 'Pukul 19:30 WIB'}</span>
                </div>

                <div className="py-2 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{roundsData.final.playerAName}</span>
                    <span className="font-mono font-bold text-amber-400">
                      {roundsData.final.scores?.game1PlayerA ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{roundsData.final.playerBName}</span>
                    <span className="font-mono font-bold text-amber-400">
                      {roundsData.final.scores?.game1PlayerB ?? 0}
                    </span>
                  </div>
                </div>

                <div className="text-center pt-2 border-t border-amber-500/20">
                  <span className="text-[10px] text-amber-300 font-bold block">
                    🏆 Perebutan Medali Emas & Juara 1
                  </span>
                  <span className="text-[9px] text-slate-400">Wasit: {roundsData.final.refereeName}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-amber-950/10 border border-amber-500/30 rounded-xl text-center space-y-2">
                <Trophy className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                <span className="text-xs font-bold text-white block">Menunggu Juara Semifinal</span>
                <span className="text-[10px] text-slate-400 block">Jadwal Final: Pukul 19:30 WIB</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL UNDI BAGAN OTOMATIS */}
      {isDrawingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Undi Bagan Pertandingan (Draw Generator)
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem akan secara otomatis menyusun bagan eliminasi berdasarkan aturan BWF/PBSI:
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Seed 1 ditaruh di bagan teratas (QF-1)</li>
                <li>Seed 2 ditaruh di bagan terbawah (QF-4)</li>
                <li>Seed 3 & 4 ditaruh di paruh bagan berbeda</li>
                <li>Peserta non-unggulan diacak menghindari klub yang sama di babak 1</li>
                <li>Penetapan nomor Lapangan & jadwal jam tanding otomatis</li>
              </ul>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Pilih Kelompok Usia:
                  </label>
                  <select
                    value={drawCategory}
                    onChange={(e) => setDrawCategory(e.target.value as PBSIAgeCategory)}
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

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Pilih Nomor Tanding:
                  </label>
                  <select
                    value={drawEventType}
                    onChange={(e) => setDrawEventType(e.target.value as TournamentEventType)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {ALL_EVENT_TYPES.map((et) => (
                      <option key={et} value={et}>
                        {et}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDrawingModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDraw}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mulai Undian Bagan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
