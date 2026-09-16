import React, { useState } from 'react';
import { PortalType, UserRole } from '../types';
import {
  Trophy,
  ShoppingBag,
  CalendarCheck,
  Users,
  Copy,
  Check,
  ExternalLink,
  Shield,
  ArrowRight,
  Clock,
  Building2,
  Sparkles,
  Info,
  Radio,
  FileSpreadsheet,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface WelcomePortalSelectorProps {
  onSelectPortal: (portal: PortalType) => void;
  currentRole: UserRole;
  onOpenLoginModal: () => void;
}

export const WelcomePortalSelector: React.FC<WelcomePortalSelectorProps> = ({
  onSelectPortal,
  currentRole,
  onOpenLoginModal,
}) => {
  const [copiedPortal, setCopiedPortal] = useState<string | null>(null);

  // Generate full shareable URL based on window.location
  const getPortalUrl = (hashPath: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#${hashPath}`;
  };

  const handleCopyUrl = (e: React.MouseEvent, hashPath: string, portalTitle: string) => {
    e.stopPropagation();
    const fullUrl = getPortalUrl(hashPath);
    navigator.clipboard.writeText(fullUrl);
    setCopiedPortal(portalTitle);
    setTimeout(() => {
      setCopiedPortal(null);
    }, 2500);
  };

  const portals = [
    {
      id: 'hevindo' as PortalType,
      hashPath: '/pb-hevindo',
      title: 'PB HEVINDO',
      subtitle: 'Akademi & Pelatihan Bulutangkis PBSI',
      badge: 'Database & Akademi',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      borderColor: 'hover:border-emerald-500/60 border-slate-800',
      accentBg: 'from-emerald-950/40 via-slate-900 to-slate-900',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      icon: Users,
      buttonColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50',
      description:
        'Sistem khusus internal PB Hevindo: data atlet resmi PBSI, verifikasi berkas (akta/KK/rapor), pelatih & wasit lisensi, jadwal sesi latihan, iuran bulanan + reward juara otomatis, presensi QR code, dan laporan.',
      features: [
        'Master Atlet PBSI & Kategori Usia (U-11 s/d Dewasa)',
        'Verifikasi Berkas Lengkap (Akta, KK, Rapor, Foto)',
        'Iuran Bulanan & Reward Otomatis Bebas Iuran Juara',
        'Presensi Latihan dengan Barcode / QR Scan',
      ],
      userRoles: 'Pengurus Klub • Tim Pelatih • Admin PB Hevindo • Wali Atlet',
    },
    {
      id: 'kantin' as PortalType,
      hashPath: '/kantin',
      title: 'KANTIN & TOKO POS',
      subtitle: 'Kasir Point of Sale & Inventaris Olahraga',
      badge: 'Kasir & Stok Toko',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      borderColor: 'hover:border-amber-500/60 border-slate-800',
      accentBg: 'from-amber-950/40 via-slate-900 to-slate-900',
      iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      icon: ShoppingBag,
      buttonColor: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50',
      description:
        'Aplikasi kasir kasir mandiri terpisah untuk kantin dan toko perlengkapan badminton (raket, shuttlecock, senar, grip, makanan & minuman). Terintegrasi dengan pencatatan pembeli dari atlet Hevindo.',
      features: [
        'Kasir Cepat POS dengan Kalkulasi Total Otomatis',
        'Manajemen Inventaris Stok & Peringatan Stok Menipis',
        'Tercatat Riwayat Pembelian per Atlet & Umum',
        'Cetak Struk & Pembayaran Tunai, QRIS, Transfer',
      ],
      userRoles: 'Petugas Kasir • Pengelola Toko • Bagian Inventaris',
    },
    {
      id: 'lapangan' as PortalType,
      hashPath: '/sewa-lapangan',
      title: 'SEWA LAPANGAN & GOR',
      subtitle: 'Reservasi Multi-Gedung & Pengaturan Tarif Waktu',
      badge: 'Booking & Lapangan',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      borderColor: 'hover:border-blue-500/60 border-slate-800',
      accentBg: 'from-blue-950/40 via-slate-900 to-slate-900',
      iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      icon: CalendarCheck,
      buttonColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/50',
      description:
        'Sistem booking mandiri untuk pengelolaan lapangan bulutangkis antar gedung (GOR Utama & Gedung Annex). Dilengkapi tarif dinamis yang berbeda antara pagi, siang, dan malam serta paket harian hingga tahunan.',
      features: [
        'Multi-Gedung GOR dengan Lapangan Tersendiri',
        'Tarif Fleksibel: Pagi, Siang, dan Malam per Gedung',
        'Pilihan Sewa: Harian, Mingguan, Bulanan, Tahunan',
        'Kalender Jadwal Booking & Status Lapangan Terisi',
      ],
      userRoles: 'Pengelola GOR • Petugas Booking • Penyewa Umum / Komunitas',
    },
    {
      id: 'turnamen' as PortalType,
      hashPath: '/turnamen',
      title: 'TURNAMEN & LIVE SCORE',
      subtitle: 'Portal Pertandingan BWF, Bagan Bracket & Klub',
      badge: 'Akses Publik Bebas',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      borderColor: 'hover:border-rose-500/60 border-slate-800',
      accentBg: 'from-rose-950/40 via-slate-900 to-slate-900',
      iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      icon: Trophy,
      buttonColor: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50',
      description:
        'Portal publik independen tanpa login untuk memantau jadwal pertandingan turnamen, live score court standar BWF real-time, bagan eliminasi (bracket), daftar seluruh klub peserta model tabel, dan rekor head-to-head atlet.',
      features: [
        'Akses Terbuka untuk Penonton & Peserta Tanpa Login',
        'Live Score Wasit Standar BWF Rally Point',
        'Bagan Eliminasi Knockout Otomatis Seeded',
        'Daftar Klub Model Tabel & Rincian Head-to-Head Atlet',
      ],
      userRoles: 'Publik / Penonton Bebas • Atlet Peserta • Wasit (Login Khusus)',
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Toast notification for link copy */}
      {copiedPortal && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Alamat Web Berhasil Disalin!</p>
            <p className="text-[11px] text-slate-400">
              Tautan langsung portal <strong className="text-emerald-400">{copiedPortal}</strong> siap dibagikan.
            </p>
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pusat Portal Terintegrasi PB HEVINDO Pekanbaru</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Selamat Datang di Portal Terpisah Sistem Klub Bulutangkis HEVINDO
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Setiap sistem telah dipisahkan ke dalam alamat tautan (URL) dan antarmuka mandiri.
            Silakan pilih portal yang ingin Anda buka, atau salin tautan langsungnya untuk dibagikan ke petugas kasir, admin pelatihan, maupun publik.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>
                Status Akses Anda: <strong className="text-white">{currentRole}</strong>
              </span>
            </div>

            <button
              onClick={onOpenLoginModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center space-x-1.5"
            >
              <span>Ganti Akun / Role</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info notice about direct addresses */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">Tips Alamat URL Mandiri:</strong> Masing-masing modul di bawah memiliki tautan khusus (misalnya <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">/#/pb-hevindo</code>, <code className="text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">/#/kantin</code>, <code className="text-blue-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">/#/sewa-lapangan</code>, <code className="text-rose-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">/#/turnamen</code>). Anda dapat mem-bookmark atau memberikan link spesifik kepada pengelola masing-masing agar langsung masuk tanpa membuka sistem lainnya.
        </p>
      </div>

      {/* 4 PORTALS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {portals.map((portal) => {
          const Icon = portal.icon;
          const directUrl = getPortalUrl(portal.hashPath);

          return (
            <div
              key={portal.id}
              onClick={() => onSelectPortal(portal.id)}
              className={`group relative rounded-3xl bg-gradient-to-br ${portal.accentBg} border ${portal.borderColor} p-6 sm:p-7 shadow-xl transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col justify-between`}
            >
              <div>
                {/* Header Row: Badge & Direct Link Pill */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2.5 rounded-2xl ${portal.iconBg}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${portal.badgeColor}`}>
                        {portal.badge}
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white mt-1 group-hover:text-emerald-400 transition">
                        {portal.title}
                      </h2>
                    </div>
                  </div>

                  {/* Copy URL Button */}
                  <button
                    onClick={(e) => handleCopyUrl(e, portal.hashPath, portal.title)}
                    title={`Salin tautan web langsung: ${directUrl}`}
                    className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition flex items-center space-x-1.5 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline font-mono text-[10px]">Salin URL</span>
                  </button>
                </div>

                {/* Subtitle & Address Path */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{portal.subtitle}</span>
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {portal.hashPath}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                  {portal.description}
                </p>

                {/* Features List */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Fitur Unggulan Sistem:
                  </span>
                  {portal.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Row: Target User Info & Enter Action */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  <span className="block text-slate-400 text-[10px]">Hak Akses / Pengguna:</span>
                  <span className="font-medium text-slate-300">{portal.userRoles}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPortal(portal.id);
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg flex items-center justify-center space-x-2 ${portal.buttonColor}`}
                >
                  <span>Buka Sistem</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
