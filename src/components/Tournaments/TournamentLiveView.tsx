import React, { useState, useEffect } from 'react';
import {
  Tournament,
  TournamentMatch,
  UserRole,
} from '../../types';
import {
  Youtube,
  Radio,
  ExternalLink,
  Edit2,
  Tv,
  Check,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Award,
} from 'lucide-react';

interface TournamentLiveViewProps {
  tournament: Tournament;
  matches: TournamentMatch[];
  onUpdateTournament: (updated: Tournament) => void;
  onUpdateMatch: (match: TournamentMatch) => void;
  currentRole: UserRole;
}

export const TournamentLiveView: React.FC<TournamentLiveViewProps> = ({
  tournament,
  matches,
  onUpdateTournament,
  onUpdateMatch,
  currentRole,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    matches.find((m) => m.status === 'Sedang Main')?.id || matches[0]?.id || ''
  );

  // Editable Stream Links state
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [ytUrl, setYtUrl] = useState(tournament.liveStreamYouTubeUrl || '');
  const [ttUrl, setTtUrl] = useState(tournament.liveStreamTikTokUrl || '');

  // Sound effect state (toggle)
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active match for 2D Court
  const currentMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  // In-app 2D Virtual Court state
  const [matchLogs, setMatchLogs] = useState<Array<{ id: string; time: string; text: string; type: 'point' | 'smash' | 'foul' | 'info' }>>([
    { id: '1', time: '14:20', text: 'Pertandingan dimulai. Wasit memimpin toss koin.', type: 'info' },
    { id: '2', time: '14:22', text: 'Smash silang tajam menghasilkan poin pertama.', type: 'smash' },
    { id: '3', time: '14:25', text: 'Reli panjang 24 pukulan dimenangkan dengan netting tipis.', type: 'point' },
  ]);

  // Serving side tracking ('A' or 'B')
  const [servingPlayer, setServingPlayer] = useState<'A' | 'B'>('A');

  // Active score numbers
  const pAScore = currentMatch?.scores?.game3PlayerA ?? currentMatch?.scores?.game1PlayerA ?? 14;
  const pBScore = currentMatch?.scores?.game3PlayerB ?? currentMatch?.scores?.game1PlayerB ?? 12;

  // Derive service court box (even = right, odd = left in badminton)
  const isRightServiceBox = servingPlayer === 'A' ? pAScore % 2 === 0 : pBScore % 2 === 0;

  const canManage = currentRole === 'Wasit / Admin Turnamen' || currentRole === 'Master Admin';

  // Extract YouTube Embed URL or ID
  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
      // standard watch?v=ID
      if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0`;
      }
      // youtu.be/ID
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0`;
      }
      // already embed URL
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
      // plain video ID
      if (url.length === 11) {
        return `https://www.youtube-nocookie.com/embed/${url}?autoplay=0`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const ytEmbedSrc = getEmbedUrl(tournament.liveStreamYouTubeUrl);

  const handleSaveLinks = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTournament({
      ...tournament,
      liveStreamYouTubeUrl: ytUrl.trim(),
      liveStreamTikTokUrl: ttUrl.trim(),
    });
    setIsEditingLinks(false);
  };

  const handleAddPoint = (player: 'A' | 'B') => {
    if (!currentMatch) return;
    const scores = currentMatch.scores || { game1PlayerA: 0, game1PlayerB: 0 };
    const key = 'game3PlayerA' in scores ? 'game3' : 'game1';
    const keyA = `${key}PlayerA` as keyof typeof scores;
    const keyB = `${key}PlayerB` as keyof typeof scores;

    const newScores = { ...scores };
    if (player === 'A') {
      newScores[keyA] = (newScores[keyA] || 0) + 1;
      setServingPlayer('A');
      setMatchLogs((prev) => [
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString('id-ID', { minute: '2-digit', second: '2-digit' }),
          text: `Poin untuk ${currentMatch.playerAName} (${newScores[keyA]} - ${newScores[keyB]}). Pukulan akurat!`,
          type: 'point',
        },
        ...prev.slice(0, 8),
      ]);
    } else {
      newScores[keyB] = (newScores[keyB] || 0) + 1;
      setServingPlayer('B');
      setMatchLogs((prev) => [
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString('id-ID', { minute: '2-digit', second: '2-digit' }),
          text: `Poin untuk ${currentMatch.playerBName} (${newScores[keyA]} - ${newScores[keyB]}). Pertahanan solid!`,
          type: 'point',
        },
        ...prev.slice(0, 8),
      ]);
    }

    onUpdateMatch({
      ...currentMatch,
      scores: newScores,
    });
  };

  // Mock auto live spectator count
  const [viewers, setViewers] = useState(384);
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers((v) => v + Math.floor(Math.random() * 5) - 2);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stream Links Configuration Bar */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">
                Siaran Langsung & Live View Pertandingan
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center space-x-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>ON AIR</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tersedia Siaran YouTube Live, TikTok Live PB Hevindo, dan Visualisasi Lapangan 2D Virtual Court.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono font-bold text-white">{viewers}</span>
            <span className="text-slate-400">Penonton Aktif</span>
          </span>

          {canManage && !isEditingLinks && (
            <button
              onClick={() => {
                setYtUrl(tournament.liveStreamYouTubeUrl || '');
                setTtUrl(tournament.liveStreamTikTokUrl || '');
                setIsEditingLinks(true);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
              title="Ubah URL YouTube & TikTok Live"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Atur Link Live</span>
            </button>
          )}
        </div>
      </div>

      {/* Edit Links Modal Form */}
      {isEditingLinks && (
        <div className="p-4 bg-slate-900 border border-rose-500/40 rounded-2xl shadow-lg space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white flex items-center space-x-2">
              <Radio className="w-4 h-4 text-rose-400" />
              <span>Pengaturan Link Siaran Langsung (YouTube & TikTok)</span>
            </span>
            <button
              onClick={() => setIsEditingLinks(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveLinks} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                <Youtube className="w-3.5 h-3.5 inline text-red-500 mr-1" />
                URL YouTube Live Stream (atau Video ID):
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                🎵 URL TikTok Live Streaming PB Hevindo:
              </label>
              <input
                type="text"
                placeholder="https://www.tiktok.com/@pb_hevindo_official/live"
                value={ttUrl}
                onChange={(e) => setTtUrl(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingLinks(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Link Stream</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: YouTube Live Player + TikTok Live Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* YOUTUBE LIVE STREAM EMBED */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <span className="text-xs font-bold text-white">
                Siaran YouTube Live PB Hevindo
              </span>
            </div>
            {tournament.liveStreamYouTubeUrl && (
              <a
                href={tournament.liveStreamYouTubeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-rose-400 hover:underline flex items-center space-x-1"
              >
                <span>Buka di YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="relative aspect-video bg-black flex items-center justify-center">
            {ytEmbedSrc ? (
              <iframe
                src={ytEmbedSrc}
                title="YouTube Live Stream"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-3">
                <Tv className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
                <div>
                  <p className="text-sm font-bold text-slate-300">Siaran YouTube Belum Terhubung</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Panitia dapat memasukkan URL siaran YouTube Live pada menu "Atur Link Live" di atas.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300">Feed Video Resolusi 1080p BWF Standard</span>
            </div>
            <span className="text-slate-500 font-mono">Audio: Stereo 48kHz</span>
          </div>
        </div>

        {/* TIKTOK LIVE CARD & SOCIAL BANNER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-cyan-400 flex items-center justify-center font-black text-white text-sm">
                d
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  TikTok Live Streaming
                </h4>
                <span className="text-[10px] text-slate-400">@pb_hevindo_official</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ikuti siaran live vertikal interaktif melalui TikTok resmi kami dengan live komentar penonton, gift shuttlecock virtual, dan wawancara atlet pasca laga!
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Status TikTok:</span>
                <span className="text-rose-400 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Siaran Aktif</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Host / Komentator:</span>
                <span className="text-white font-medium">Coach Kurniawan</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <a
              href={tournament.liveStreamTikTokUrl || 'https://www.tiktok.com'}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-rose-950/60 flex items-center justify-center space-x-2 text-center"
            >
              <span>🔴 Buka TikTok Live PB Hevindo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-[10px] text-slate-500 text-center block">
              Bisa ditonton di aplikasi ponsel TikTok atau browser web
            </span>
          </div>
        </div>
      </div>

      {/* IN-APP 2D VIRTUAL COURT LIVE VIEW (Fitur Live View Internal Aplikasi) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                In-App Live View: Virtual Court 2D BWF Arena
              </h3>
              <p className="text-xs text-slate-400">
                Visualisasi posisi pemain, penunjuk servis ganjil/genap, skor real-time, dan live commentary per pukulan.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Match Selector */}
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl text-xs px-3 py-2"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.court}: {m.playerAName} vs {m.playerBName} ({m.status})
                </option>
              ))}
            </select>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              title="Toggle Audio Shuttlecock"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Digital Big Scoreboard Banner */}
        {currentMatch && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 items-center">
            {/* Player A */}
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="text-xs font-bold text-emerald-400">{currentMatch.playerAClub}</span>
                {servingPlayer === 'A' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    🏸 Servis
                  </span>
                )}
              </div>
              <h4 className="text-lg font-black text-white mt-1">{currentMatch.playerAName}</h4>
              <span className="text-[11px] text-slate-400">{currentMatch.ageCategory} • {currentMatch.round}</span>
            </div>

            {/* Middle Scoreboard */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-3 px-5 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-4xl font-black font-mono text-white">{pAScore}</span>
                <span className="text-2xl font-black font-mono text-rose-500">-</span>
                <span className="text-4xl font-black font-mono text-white">{pBScore}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-1.5 uppercase">
                {currentMatch.court} • Wasit: {currentMatch.refereeName}
              </span>
            </div>

            {/* Player B */}
            <div className="text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-end space-x-2">
                {servingPlayer === 'B' && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40">
                    🏸 Servis
                  </span>
                )}
                <span className="text-xs font-bold text-rose-400">{currentMatch.playerBClub}</span>
              </div>
              <h4 className="text-lg font-black text-white mt-1">{currentMatch.playerBName}</h4>
              <span className="text-[11px] text-slate-400">{currentMatch.eventType || 'Tunggal Putra (MS)'}</span>
            </div>
          </div>
        )}

        {/* 2D VIRTUAL BADMINTON COURT CANVAS / SVG */}
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl relative overflow-hidden shadow-inner">
          <div className="max-w-3xl mx-auto">
            {/* Visual Top-Down Badminton Court */}
            <div className="relative aspect-[2/1] bg-emerald-800 rounded-xl border-4 border-white shadow-2xl flex">
              {/* Left Half (Player A) */}
              <div className="w-1/2 h-full border-r-2 border-white relative flex flex-col justify-between p-2">
                {/* Singles Side Tramline (Top) */}
                <div className="absolute top-[8%] left-0 right-0 h-[1px] bg-white/70" />
                {/* Doubles Back Service Line */}
                <div className="absolute top-0 bottom-0 left-[8%] w-[1px] bg-white/70" />
                {/* Center Service Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white" />
                {/* Short Service Line */}
                <div className="absolute top-0 bottom-0 right-[25%] w-[2px] bg-white" />
                {/* Singles Side Tramline (Bottom) */}
                <div className="absolute bottom-[8%] left-0 right-0 h-[1px] bg-white/70" />

                {/* Player A Position Badge */}
                <div
                  className={`absolute z-10 transition-all duration-300 p-2 rounded-xl bg-slate-950/90 border-2 text-white font-bold text-xs shadow-lg flex items-center space-x-1.5 ${
                    servingPlayer === 'A'
                      ? isRightServiceBox
                        ? 'bottom-[20%] left-[30%] border-emerald-400 ring-2 ring-emerald-500/50'
                        : 'top-[20%] left-[30%] border-emerald-400 ring-2 ring-emerald-500/50'
                      : 'top-1/2 -translate-y-1/2 left-[20%] border-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] truncate max-w-[120px]">{currentMatch?.playerAName?.split(' ')[0] || 'Player A'}</span>
                  {servingPlayer === 'A' && (
                    <span className="text-amber-400 text-xs animate-bounce">🏸</span>
                  )}
                </div>

                <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase m-1">
                  KOTAK SERVIS KIRI / KANAN (A)
                </span>
              </div>

              {/* NET IN THE MIDDLE */}
              <div className="w-[8px] bg-slate-900 border-x-2 border-white/80 z-20 relative flex items-center justify-center shadow-lg">
                <div className="h-full w-[2px] bg-white/90" />
              </div>

              {/* Right Half (Player B) */}
              <div className="w-1/2 h-full border-l-2 border-white relative flex flex-col justify-between p-2">
                {/* Singles Side Tramline (Top) */}
                <div className="absolute top-[8%] left-0 right-0 h-[1px] bg-white/70" />
                {/* Short Service Line */}
                <div className="absolute top-0 bottom-0 left-[25%] w-[2px] bg-white" />
                {/* Center Service Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white" />
                {/* Doubles Back Service Line */}
                <div className="absolute top-0 bottom-0 right-[8%] w-[1px] bg-white/70" />
                {/* Singles Side Tramline (Bottom) */}
                <div className="absolute bottom-[8%] left-0 right-0 h-[1px] bg-white/70" />

                {/* Player B Position Badge */}
                <div
                  className={`absolute z-10 transition-all duration-300 p-2 rounded-xl bg-slate-950/90 border-2 text-white font-bold text-xs shadow-lg flex items-center space-x-1.5 ${
                    servingPlayer === 'B'
                      ? isRightServiceBox
                        ? 'top-[20%] right-[30%] border-rose-400 ring-2 ring-rose-500/50'
                        : 'bottom-[20%] right-[30%] border-rose-400 ring-2 ring-rose-500/50'
                      : 'top-1/2 -translate-y-1/2 right-[20%] border-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-[11px] truncate max-w-[120px]">{currentMatch?.playerBName?.split(' ')[0] || 'Player B'}</span>
                  {servingPlayer === 'B' && (
                    <span className="text-amber-400 text-xs animate-bounce">🏸</span>
                  )}
                </div>

                <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase m-1 text-right">
                  KOTAK SERVIS KANAN / KIRI (B)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Referee Point Simulation Buttons */}
          {canManage && (
            <div className="mt-4 pt-3 border-t border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5" />
                <span>Panel Wasit Virtual Court:</span>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAddPoint('A')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow"
                >
                  +1 Poin {currentMatch?.playerAName?.split(' ')[0]}
                </button>

                <button
                  onClick={() => setServingPlayer((prev) => (prev === 'A' ? 'B' : 'A'))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
                >
                  Pindah Servis
                </button>

                <button
                  onClick={() => handleAddPoint('B')}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow"
                >
                  +1 Poin {currentMatch?.playerBName?.split(' ')[0]}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Commentary Log */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Komentar & Catatan Poin Pertandingan (Live Feed)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">BWF Live Ticker v2.4</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
            {matchLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 text-slate-300 py-1 border-b border-slate-900/60">
                <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">[{log.time}]</span>
                <span className="leading-snug">{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
