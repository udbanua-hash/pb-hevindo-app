import React, { useState } from 'react';
import { UserRole, PortalType } from '../types';
import { Shield, UserCheck, Coffee, Calendar, Trophy, Globe, Lock, Key, Check } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onSwitchPortal?: (portal: PortalType) => void;
}

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  borderHover: string;
  bgBadge: string;
  defaultPortal: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'Master Admin',
    title: 'Master Admin (Pimpinan / Owner)',
    description: 'Akses penuh ke seluruh portal: PB Hevindo, Kantin POS, Sewa Lapangan, Turnamen, Laporan & Audit.',
    icon: Shield,
    color: 'text-amber-400',
    borderHover: 'hover:border-amber-500/60',
    bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    defaultPortal: 'PB Hevindo & Semua Portal',
  },
  {
    role: 'Admin PB Hevindo',
    title: 'Admin PB Hevindo (Akademi & Pelatihan)',
    description: 'Khusus manajemen akademi: Master Atlet, Data Pelatih, Jadwal Latihan, Iuran Atlet & Presensi QR.',
    icon: UserCheck,
    color: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/60',
    bgBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    defaultPortal: 'PB HEVINDO Saja',
  },
  {
    role: 'Bagian Kasir',
    title: 'Bagian Kasir (Kantin & Toko)',
    description: 'Khusus operasional Point of Sale: Transaksi kasir, cetak struk, stok barang kantin & peralatan raket.',
    icon: Coffee,
    color: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/60',
    bgBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    defaultPortal: 'Kantin & Toko POS Saja',
  },
  {
    role: 'Bagian Lapangan',
    title: 'Bagian Lapangan (Pengelola GOR & Venue)',
    description: 'Khusus persewaan lapangan: Kelola gedung, variasi tarif Pagi/Siang/Malam, booking lapangan & jadwal.',
    icon: Calendar,
    color: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500/60',
    bgBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    defaultPortal: 'Sewa Lapangan Saja',
  },
  {
    role: 'Wasit / Admin Turnamen',
    title: 'Wasit & Panitia Turnamen',
    description: 'Khusus turnamen: Live scoring standar BWF, input kartu wasit, drawing bagan seeded, dan rekap juara.',
    icon: Trophy,
    color: 'text-rose-400',
    borderHover: 'hover:border-rose-500/60',
    bgBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    defaultPortal: 'Portal Turnamen',
  },
  {
    role: 'Publik',
    title: 'Publik / Penonton (Akses Bebas Tanpa Login)',
    description: 'Melihat jadwal & hasil pertandingan, bagan bracket, live score BWF court, dan detail club & atlet peserta.',
    icon: Globe,
    color: 'text-blue-400',
    borderHover: 'hover:border-blue-500/60',
    bgBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    defaultPortal: 'Portal Turnamen Publik',
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  onSwitchPortal,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [pinCode, setPinCode] = useState<string>('1234');

  if (!isOpen) return null;

  const handleApplyRole = (role: UserRole) => {
    onSelectRole(role);
    if (onSwitchPortal) {
      if (role === 'Bagian Kasir') onSwitchPortal('kantin');
      else if (role === 'Bagian Lapangan') onSwitchPortal('lapangan');
      else if (role === 'Wasit / Admin Turnamen' || role === 'Publik') onSwitchPortal('turnamen');
      else if (role === 'Admin PB Hevindo') onSwitchPortal('hevindo');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Login Menu & Pemisahan Hak Akses</h3>
              <p className="text-xs text-slate-400">
                Pilih peran petugas atau beralih ke mode penonton / publik tanpa login.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Roles List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isCurrent = currentRole === opt.role;
            const isSelected = selectedRole === opt.role;

            return (
              <div
                key={opt.role}
                onClick={() => setSelectedRole(opt.role)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start space-x-4 ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-slate-850 border-slate-800 hover:bg-slate-800/50 ' + opt.borderHover
                }`}
              >
                <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 ${opt.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white truncate">{opt.title}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Aktif Saat Ini
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{opt.description}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-[11px] text-slate-500">Lingkup Akses:</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${opt.bgBadge}`}>
                      {opt.defaultPortal}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-full">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <Key className="w-4 h-4 text-slate-500" />
            <span>PIN Akses Otentikasi:</span>
            <input
              type="password"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="w-20 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-center text-white text-xs font-mono"
            />
            <span className="text-[10px] text-slate-500">(Auto-Verified)</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              onClick={() => handleApplyRole(selectedRole)}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Masuk Sebagai {selectedRole}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
