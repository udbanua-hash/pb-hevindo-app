import React, { useState } from 'react';
import { MonthlyDues, POSSale, CourtRental, Athlete, UserRole } from '../../types';
import { formatRupiah, exportToCSV } from '../../utils/helpers';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  PieChart,
  ShoppingBag,
  CalendarCheck,
  Award,
} from 'lucide-react';

interface ReportsTabProps {
  dues: MonthlyDues[];
  posSales: POSSale[];
  rentals: CourtRental[];
  athletes: Athlete[];
  currentRole: UserRole;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  dues = [],
  posSales = [],
  rentals = [],
  athletes = [],
  currentRole,
}) => {
  const [reportType, setReportType] = useState<
    'financial' | 'pos' | 'rentals' | 'athletes'
  >('financial');

  // Revenue calculations
  const totalDuesPaid = (dues || [])
    .filter((d) => d.status === 'Sudah Bayar')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDuesReward = (dues || [])
    .filter((d) => d.status === 'Gratis / Reward Juara')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPosRevenue = (posSales || []).reduce((acc, curr) => acc + curr.totalAmount, 0);

  const totalRentalRevenue = (rentals || [])
    .filter((r) => r.paymentStatus === 'Lunas')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  const grandTotalRevenue = totalDuesPaid + totalPosRevenue + totalRentalRevenue;

  const handleExportCurrentReport = () => {
    if (reportType === 'financial') {
      exportToCSV(
        (dues || []).map((d) => ({
          'Invoice': d.invoiceNumber,
          'Atlet': d.athleteName,
          'Kategori': d.trainingCategory,
          'Periode': d.periodMonth,
          'Nominal': d.amount,
          'Status': d.status,
          'Metode': d.paymentMethod || '-',
          'Tanggal': d.paymentDate || '-',
        })),
        'Laporan_Keuangan_Iuran_HEVINDO'
      );
    } else if (reportType === 'pos') {
      exportToCSV(
        (posSales || []).map((s) => ({
          'No Faktur': s.invoiceNo,
          'Tanggal': s.date,
          'Waktu': s.time,
          'Pelanggan': s.customerName,
          'Tipe': s.customerType,
          'Metode': s.paymentMethod,
          'Total': s.totalAmount,
          'Kasir': s.cashierName,
        })),
        'Laporan_Penjualan_Kantin_Toko_HEVINDO'
      );
    } else if (reportType === 'rentals') {
      exportToCSV(
        (rentals || []).map((r) => ({
          'Kode': r.bookingCode,
          'Penyewa': r.renterName,
          'Paket': r.rentalType,
          'Lapangan': r.courtName,
          'Tanggal': r.startDate,
          'Jam': r.timeSlot,
          'Biaya': r.totalPrice,
          'Status Bayar': r.paymentStatus,
        })),
        'Laporan_Sewa_Lapangan_HEVINDO'
      );
    } else {
      exportToCSV(
        (athletes || []).map((a) => {
          const achievements = a.achievements || [];
          const mutations = a.transferHistory || [];
          return {
            'ID': a.id,
            'Nama': a.name,
            'Kategori Usia': a.ageCategory || '-',
            'Program': a.trainingCategory,
            'Klub Asal': a.clubName,
            'Status Iuran': a.duesStatus,
            'Prestasi': achievements.length > 0
              ? achievements.map((ac) => `${ac.tournamentName || (ac as any).title || 'Prestasi'} (${ac.year})`).join('; ')
              : '-',
            'Riwayat Mutasi': mutations.length > 0
              ? mutations.map((m) => `${m.fromClub}->${m.toClub}`).join('; ')
              : 'Atlet Asli HEVINDO',
          };
        }),
        'Rekap_Data_Atlet_HEVINDO'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-850 p-5 rounded-2xl border border-emerald-500/40 shadow-xl">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Total Kas & Pendapatan Masuk
          </span>
          <span className="text-2xl font-black text-white mt-1 block font-mono">
            {formatRupiah(grandTotalRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Iuran + Kantin/Toko + Sewa Lapangan
          </span>
        </div>

        <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold">Iuran Bulanan Atlet</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 mt-1 block font-mono">
            {formatRupiah(totalDuesPaid)}
          </span>
          <span className="text-[10px] text-amber-300 mt-1 block">
            Subsidi Reward: {formatRupiah(totalDuesReward)}
          </span>
        </div>

        <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold">Omset Kantin & Toko</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-amber-400 mt-1 block font-mono">
            {formatRupiah(totalPosRevenue)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {posSales.length} total transaksi
          </span>
        </div>

        <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold">Sewa Lapangan GOR</span>
            <CalendarCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-cyan-400 mt-1 block font-mono">
            {formatRupiah(totalRentalRevenue)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {rentals.length} paket booking
          </span>
        </div>
      </div>

      {/* Report Generator Controls */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Pilih Laporan:</span>
          {(
            [
              { key: 'financial', label: 'Laporan Iuran Bulanan' },
              { key: 'pos', label: 'Penjualan Kantin & Toko' },
              { key: 'rentals', label: 'Sewa Lapangan' },
              { key: 'athletes', label: 'Prestasi & Mutasi Atlet' },
            ] as const
          ).map((rep) => (
            <button
              key={rep.key}
              onClick={() => setReportType(rep.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                reportType === rep.key
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {rep.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCurrentReport}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unduh Excel / CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-slate-850 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h4 className="font-bold text-white text-sm">
          Pratinjau Data: {reportType === 'financial' ? 'Iuran' : reportType === 'pos' ? 'POS Kantin' : reportType === 'rentals' ? 'Sewa Lapangan' : 'Data Atlet'}
        </h4>

        <div className="overflow-x-auto">
          {reportType === 'financial' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-2.5">No Invoice</th>
                  <th className="p-2.5">Atlet</th>
                  <th className="p-2.5">Kategori</th>
                  <th className="p-2.5">Periode</th>
                  <th className="p-2.5">Nominal</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dues.map((d) => (
                  <tr key={d.id}>
                    <td className="p-2.5 font-mono">{d.invoiceNumber}</td>
                    <td className="p-2.5 font-bold text-white">{d.athleteName}</td>
                    <td className="p-2.5">{d.trainingCategory}</td>
                    <td className="p-2.5">{d.periodMonth}</td>
                    <td className="p-2.5 text-emerald-400 font-bold">{formatRupiah(d.amount)}</td>
                    <td className="p-2.5">{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'pos' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-2.5">No Faktur</th>
                  <th className="p-2.5">Waktu</th>
                  <th className="p-2.5">Pelanggan</th>
                  <th className="p-2.5">Item Barang</th>
                  <th className="p-2.5">Total Belanja</th>
                  <th className="p-2.5">Metode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {posSales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2.5 font-mono">{s.invoiceNo}</td>
                    <td className="p-2.5">{s.date} {s.time}</td>
                    <td className="p-2.5 font-bold text-white">{s.customerName}</td>
                    <td className="p-2.5">{s.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}</td>
                    <td className="p-2.5 text-emerald-400 font-bold">{formatRupiah(s.totalAmount)}</td>
                    <td className="p-2.5">{s.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'rentals' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Kode Booking</th>
                  <th className="p-2.5">Penyewa</th>
                  <th className="p-2.5">Paket</th>
                  <th className="p-2.5">Lapangan</th>
                  <th className="p-2.5">Jadwal</th>
                  <th className="p-2.5">Tarif Sewa</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rentals.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2.5 font-mono text-emerald-400">{r.bookingCode}</td>
                    <td className="p-2.5 font-bold text-white">{r.renterName}</td>
                    <td className="p-2.5">{r.rentalType}</td>
                    <td className="p-2.5">{r.courtName}</td>
                    <td className="p-2.5">{r.startDate} ({r.timeSlot})</td>
                    <td className="p-2.5 font-bold text-emerald-400">{formatRupiah(r.totalPrice)}</td>
                    <td className="p-2.5">{r.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'athletes' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-2.5">ID Atlet</th>
                  <th className="p-2.5">Nama</th>
                  <th className="p-2.5">Kategori PBSI</th>
                  <th className="p-2.5">Program</th>
                  <th className="p-2.5">Prestasi Kejuaraan</th>
                  <th className="p-2.5">Riwayat Mutasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(athletes || []).map((a) => {
                  const achievements = a.achievements || [];
                  const mutations = a.transferHistory || [];
                  return (
                    <tr key={a.id}>
                      <td className="p-2.5 font-mono">{a.id}</td>
                      <td className="p-2.5 font-bold text-white">{a.name}</td>
                      <td className="p-2.5">{a.ageCategory || '-'}</td>
                      <td className="p-2.5">{a.trainingCategory}</td>
                      <td className="p-2.5">
                        {achievements.length > 0
                          ? achievements.map((ac) => `${ac.tournamentName || (ac as any).title || 'Prestasi'} (${ac.year})`).join(', ')
                          : '-'}
                      </td>
                      <td className="p-2.5">
                        {mutations.length > 0
                          ? mutations.map((m) => `${m.fromClub} ➔ ${m.toClub}`).join(', ')
                          : 'Atlet Asli HEVINDO'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
