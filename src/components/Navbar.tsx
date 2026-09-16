import React, { useState, useEffect } from 'react';
import { UserRole, PortalType, NotificationItem, AuditLog } from '../types';
import {
  Bell,
  Clock,
  History,
  Radio,
  Users,
  Building2,
  GraduationCap,
  CalendarDays,
  CreditCard,
  UserCheck,
  FileSpreadsheet,
  CheckCheck,
  ShoppingBag,
  CalendarCheck,
  Trophy,
  LogIn,
  Layers,
  ChevronDown,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Database,
  RefreshCw,
} from 'lucide-react';

export interface NavbarProps {
  activePortal: PortalType;
  setActivePortal: (portal: PortalType) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  onOpenLoginModal: () => void;
  notifications?: NotificationItem[];
  onMarkAllAsRead?: () => void;
  auditLogs?: AuditLog[];
  onOpenAuditLogs?: () => void;
  supabaseStatus?: {
    configured: boolean;
    syncing: boolean;
    lastSynced?: string;
    message?: string;
  };
  onSyncSupabase?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePortal,
  setActivePortal,
  activeTab,
  setActiveTab,
  currentRole,
  onOpenLoginModal,
  notifications = [],
  onMarkAllAsRead,
  auditLogs = [],
  onOpenAuditLogs,
  supabaseStatus,
  onSyncSupabase,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [copiedCurrentUrl, setCopiedCurrentUrl] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const safeNotifications = notifications || [];
  const safeAuditLogs = auditLogs || [];
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

  // PB HEVINDO Internal Menu (strictly training, athletes, coaches, dues, schedules, attendance, clubs, reports)
  const hevindoNavItems = [
    { id: 'athletes', label: 'Data Atlet', icon: Users },
    { id: 'coaches', label: 'Pelatih & Wasit', icon: GraduationCap },
    { id: 'schedules', label: 'Jadwal Latihan', icon: CalendarDays },
    { id: 'dues', label: 'Iuran Bulanan & Reward', icon: CreditCard },
    { id: 'attendance', label: 'Presensi QR', icon: UserCheck },
    { id: 'clubs', label: 'Relasi Klub PBSI', icon: Building2 },
    { id: 'reports', label: 'Laporan Pelatihan', icon: FileSpreadsheet },
  ];

  // Portal metadata for custom isolated headers
  const getPortalInfo = () => {
    switch (activePortal) {
      case 'kantin':
        return {
          title: 'HEVINDO POS',
          subtitle: 'Kantin & Toko Perlengkapan Badminton',
          path: '/#/kantin',
          badge: 'Sistem Kasir & Stok',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          themeColor: 'from-amber-500 to-orange-500',
          icon: ShoppingBag,
        };
      case 'lapangan':
        return {
          title: 'HEVINDO ARENA',
          subtitle: 'Sistem Booking Sewa Lapangan Multi-Gedung',
          path: '/#/sewa-lapangan',
          badge: 'Sistem Reservasi GOR',
          badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          themeColor: 'from-blue-500 to-indigo-500',
          icon: CalendarCheck,
        };
      case 'turnamen':
        return {
          title: 'PORTAL TURNAMEN & LIVE SCORE BWF',
          subtitle: 'Jadwal Pertandingan, Bracket & Papan Skor Realtime',
          path: '/#/turnamen',
          badge: 'Akses Terbuka Publik',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          themeColor: 'from-rose-500 to-red-600',
          icon: Trophy,
        };
      case 'audit':
        return {
          title: 'HEVINDO SECURITY',
          subtitle: 'Audit Log & Riwayat Aktivitas Seluruh Sistem',
          path: '/#/audit',
          badge: 'Pusat Keamanan',
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          themeColor: 'from-purple-500 to-violet-600',
          icon: History,
        };
      case 'hevindo':
      default:
        return {
          title: 'PB HEVINDO',
          subtitle: 'Sistem Database & Akademi Bulutangkis PBSI',
          path: '/#/pb-hevindo',
          badge: 'Pelatihan & Database',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          themeColor: 'from-emerald-500 via-teal-500 to-amber-400',
          icon: Users,
        };
    }
  };

  const portalInfo = getPortalInfo();

  const handleCopyUrl = () => {
    const fullUrl = `${window.location.origin}${window.location.pathname}${portalInfo.path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCurrentUrl(true);
    setTimeout(() => setCopiedCurrentUrl(false), 2000);
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
      {/* Top Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* LEFT: Either Brand (if on Welcome) or Back Button + Dedicated Portal Brand */}
          <div className="flex items-center space-x-3">
            {activePortal !== 'welcome' ? (
              <button
                id="btn-back-to-welcome-portal"
                onClick={() => setActivePortal('welcome')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition group shadow-sm"
                title="Kembali ke Layar Pilihan Portal (Welcome Screen)"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400 transition-transform group-hover:-translate-x-1" />
                <span className="hidden sm:inline">Pilihan Portal</span>
              </button>
            ) : null}

            {/* Portal Title & Branding */}
            <div
              className="flex items-center space-x-3 cursor-pointer select-none"
              onClick={() => setActivePortal(activePortal === 'welcome' ? 'welcome' : activePortal)}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${portalInfo.themeColor} p-0.5 shadow-lg flex items-center justify-center`}
              >
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-white text-base">
                  {activePortal === 'kantin' && '☕'}
                  {activePortal === 'lapangan' && '🏟️'}
                  {activePortal === 'turnamen' && '🏆'}
                  {activePortal === 'audit' && '🛡️'}
                  {(activePortal === 'hevindo' || activePortal === 'welcome') && '🏸'}
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black tracking-tight text-white text-base sm:text-lg">
                    {activePortal === 'welcome' ? 'PB HEVINDO' : portalInfo.title}
                  </span>
                  <span
                    className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      activePortal === 'welcome'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : portalInfo.badgeColor
                    }`}
                  >
                    {activePortal === 'welcome' ? 'Pusat Portal Terpadu' : portalInfo.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                  {activePortal === 'welcome'
                    ? 'Sistem Terpisah: Pelatihan, Kantin, Sewa Lapangan & Turnamen'
                    : portalInfo.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* MIDDLE: Dedicated URL Pill (When inside a portal) */}
          {activePortal !== 'welcome' && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">Alamat URL:</span>
              <code className="font-mono text-emerald-400 font-semibold text-[11px]">
                {portalInfo.path}
              </code>
              <button
                onClick={handleCopyUrl}
                title="Salin tautan langsung portal ini"
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                {copiedCurrentUrl ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* RIGHT: Clock, Audit, Notifications, Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Supabase Cloud Connection Status */}
            {supabaseStatus && (
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                  supabaseStatus.configured
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                }`}
                title={
                  supabaseStatus.configured
                    ? `Supabase DB Cloud Terhubung (atlet, kantin_transaksi, sewa_lapangan). Terakhir disinkron: ${supabaseStatus.lastSynced || 'Baru saja'}`
                    : 'Supabase belum terhubung. Konfigurasi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di environment.'
                }
              >
                <Database className={`w-3.5 h-3.5 ${supabaseStatus.configured ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className={`w-1.5 h-1.5 rounded-full ${supabaseStatus.configured ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="font-semibold">
                  {supabaseStatus.configured ? 'Supabase (On)' : 'Supabase (Off)'}
                </span>
                {supabaseStatus.configured && onSyncSupabase && (
                  <button
                    onClick={onSyncSupabase}
                    disabled={supabaseStatus.syncing}
                    className="ml-1 p-0.5 hover:text-white transition"
                    title="Sinkronkan data dengan Supabase sekarang"
                  >
                    <RefreshCw className={`w-3 h-3 ${supabaseStatus.syncing ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                )}
              </div>
            )}

            {/* Live Clock */}
            <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg text-xs font-mono text-slate-300 border border-slate-700/60">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{currentTime}</span>
            </div>

            {/* Audit Log Button */}
            <button
              id="btn-audit-log-toggle"
              onClick={() => {
                if (onOpenAuditLogs) onOpenAuditLogs();
                else setActivePortal('audit');
              }}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activePortal === 'audit'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Lihat Log Audit Aktivitas Seluruh Sistem"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Audit</span>
              <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 rounded-full font-mono">
                {safeAuditLogs.length}
              </span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Notifikasi Sistem"
              >
                <Bell className="w-4 h-4 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-850 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-sm text-white">Notifikasi Sistem</span>
                    </div>
                    {unreadCount > 0 && onMarkAllAsRead && (
                      <button
                        onClick={onMarkAllAsRead}
                        className="flex items-center space-x-1 text-xs text-emerald-400 hover:underline"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Tandai Semua Dibaca</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {safeNotifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-400 text-center">Tidak ada notifikasi baru.</p>
                    ) : (
                      safeNotifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors ${
                            n.isRead ? 'bg-slate-900/40 opacity-70' : 'bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-slate-200">{n.title}</span>
                            <span className="text-[10px] text-slate-400 ml-2">{n.timestamp}</span>
                          </div>
                          <p className="text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Login & Role Switcher Modal Trigger */}
            <button
              id="btn-trigger-login-role"
              onClick={onOpenLoginModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition"
              title="Ganti Hak Akses / Login Multi-Role"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block leading-none">Role:</span>
                <span className="text-xs font-bold text-white block leading-none mt-0.5">
                  {currentRole}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Sub-Tabs (ONLY rendered when inside PB HEVINDO Portal) */}
      {activePortal === 'hevindo' && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-1.5 min-w-max">
            <div className="flex items-center space-x-1">
              {hevindoNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center space-x-2 text-[11px] text-slate-400 pl-4 border-l border-slate-800">
              <span>Modul: <strong className="text-emerald-400">Akademi PB Hevindo</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner inside other portals showing quick portal switch & address */}
      {activePortal !== 'welcome' && activePortal !== 'hevindo' && (
        <div className="border-t border-slate-800/60 bg-slate-950/40 px-4 py-1.5 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span>Sistem Terpisah:</span>
              <strong className="text-slate-200">{portalInfo.title}</strong>
              <span className="text-slate-400">•</span>
              <span className="font-mono text-emerald-400">{portalInfo.path}</span>
            </div>
            <button
              onClick={() => setActivePortal('welcome')}
              className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>Ganti ke Sistem Lain (Welcome Screen)</span>
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

