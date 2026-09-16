import React, { useState } from 'react';
import { AuditLog, UserRole } from '../../types';
import { Shield, Search, Lock, User, Clock } from 'lucide-react';

interface AuditLogsTabProps {
  logs: AuditLog[];
  currentRole: UserRole;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ logs = [], currentRole }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const safeLogs = logs || [];
  const q = searchQuery.toLowerCase();

  const filteredLogs = safeLogs.filter(
    (l) =>
      (l.action || '').toLowerCase().includes(q) ||
      (l.performedBy || l.userName || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      (l.targetEntity || l.entity || '').toLowerCase().includes(q)
  );

  return (
    <div className="space-y-4">
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Jejak Audit Keamanan & Log Aktivitas Sistem</h4>
            <p className="text-xs text-slate-400">Pencatatan real-time seluruh mutasi data, transaksi, dan scoring turnamen</p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari audit log..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400"
          />
        </div>
      </div>

      <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Waktu & Tanggal</th>
                <th className="p-3">Pengguna & Role</th>
                <th className="p-3">Aksi Sistem</th>
                <th className="p-3">Modul Entitas</th>
                <th className="p-3">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-white font-sans block">{log.performedBy}</span>
                    <span className="text-[10px] text-emerald-400 font-sans">Role: {log.role}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-sans font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-sans font-medium">{log.targetEntity}</td>
                  <td className="p-3 text-slate-400 font-sans text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
