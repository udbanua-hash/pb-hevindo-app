import React, { useState } from 'react';
import { AttendanceRecord, Athlete, Coach, UserRole, AttendanceStatus } from '../../types';
import { formatIndonesianDate } from '../../utils/helpers';
import { QrCode, CheckCircle2, UserCheck, Calendar, Filter, Download, Plus, Camera } from 'lucide-react';

interface AttendanceTabProps {
  attendanceRecords: AttendanceRecord[];
  athletes: Athlete[];
  coaches: Coach[];
  onAddAttendance: (record: AttendanceRecord) => void;
  currentRole: UserRole;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  attendanceRecords = [],
  athletes = [],
  coaches = [],
  onAddAttendance,
  currentRole,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeType, setActiveType] = useState<'Atlet' | 'Pelatih'>('Atlet');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scannedAthleteId, setScannedAthleteId] = useState('');
  const [scanSuccessMsg, setScanSuccessMsg] = useState('');

  const safeAttendance = attendanceRecords || [];
  const safeAthletes = athletes || [];
  const safeCoaches = coaches || [];

  const canEdit = currentRole === 'Admin' || currentRole === 'Operator' || currentRole === 'Pelatih';

  const filteredRecords = safeAttendance.filter(
    (r) => r.date === selectedDate && r.personType === activeType
  );

  const handleQuickStatusChange = (
    personId: string,
    personName: string,
    category: any,
    status: AttendanceStatus
  ) => {
    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      personId,
      personName,
      personType: activeType,
      trainingCategory: category || 'Regular',
      date: selectedDate,
      status,
      sessionTime: '14:00 - 17:00 WIB',
      scannedViaQr: false,
    };
    onAddAttendance(newRecord);
  };

  const handleSimulateQrScan = () => {
    const athlete = athletes.find((a) => a.id === scannedAthleteId);
    if (!athlete) {
      alert('Atlet dengan ID / QR ini tidak ditemukan.');
      return;
    }

    const newRecord: AttendanceRecord = {
      id: `ATT-QR-${Date.now()}`,
      personId: athlete.id,
      personName: athlete.name,
      personType: 'Atlet',
      trainingCategory: athlete.trainingCategory,
      date: selectedDate,
      status: 'Hadir',
      sessionTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      scannedViaQr: true,
    };

    onAddAttendance(newRecord);
    setScanSuccessMsg(`✓ Scan Berhasil! ${athlete.name} (${athlete.trainingCategory}) tercatat HADIR.`);
    setTimeout(() => {
      setScanSuccessMsg('');
      setIsQrScannerOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Date & QR Bar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveType('Atlet')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeType === 'Atlet'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Presensi Atlet ({safeAthletes.length})
            </button>
            <button
              onClick={() => setActiveType('Pelatih')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeType === 'Pelatih'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Presensi Pelatih ({safeCoaches.length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs"
            />
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setScannedAthleteId(athletes[0]?.id || '');
              setIsQrScannerOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Presensi Atlet</span>
          </button>
        )}
      </div>

      {/* Roster & Attendance List */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h4 className="font-bold text-white text-sm">
            Daftar Kehadiran Latihan: {formatIndonesianDate(selectedDate)}
          </h4>
          <span className="text-xs text-slate-400">
            {filteredRecords.filter((r) => r.status === 'Hadir').length} Hadir dari {activeType === 'Atlet' ? athletes.length : coaches.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Program / Kategori</th>
                <th className="p-3">Status Terakhir</th>
                <th className="p-3">Metode Scan</th>
                {canEdit && <th className="p-3 text-center">Tandai Status Presensi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(activeType === 'Atlet' ? athletes : coaches).map((person) => {
                const rec = filteredRecords.find((r) => r.personId === person.id);
                const category = 'trainingCategory' in person ? person.trainingCategory : person.category;
                return (
                  <tr key={person.id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-bold text-white">{person.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{person.id}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{category}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          rec?.status === 'Hadir'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : rec?.status === 'Izin'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : rec?.status === 'Sakit'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {rec?.status || 'Belum Presensi'}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400">
                      {rec?.scannedViaQr ? (
                        <span className="flex items-center space-x-1 text-cyan-400">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Scanner</span>
                        </span>
                      ) : rec ? (
                        <span>Manual Admin</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    {canEdit && (
                      <td className="p-3 text-center">
                        <div className="inline-flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                          {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              onClick={() =>
                                handleQuickStatusChange(person.id, person.name, category, st)
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                rec?.status === st
                                  ? 'bg-emerald-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner Simulation Modal */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Pemindai QR Code Presensi Atlet</span>
              </h4>
              <button onClick={() => setIsQrScannerOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* QR Viewport Simulation */}
            <div className="relative w-full h-48 bg-slate-950 rounded-xl border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
              <div className="w-32 h-32 border-2 border-emerald-400 rounded-lg flex items-center justify-center relative">
                <QrCode className="w-20 h-20 text-emerald-400/60" />
                <div className="absolute inset-x-0 h-0.5 bg-emerald-400 animate-pulse top-1/2"></div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Arahkan ID Card Atlet ke Kamera</p>
            </div>

            {scanSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold text-center animate-bounce">
                {scanSuccessMsg}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <label className="block text-slate-300">Pilih ID Card Atlet untuk Disimulasikan:</label>
              <select
                value={scannedAthleteId}
                onChange={(e) => setScannedAthleteId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              >
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.id}] {a.name} ({a.trainingCategory})
                  </option>
                ))}
              </select>

              <button
                onClick={handleSimulateQrScan}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg transition"
              >
                Scan & Verifikasi Hadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
