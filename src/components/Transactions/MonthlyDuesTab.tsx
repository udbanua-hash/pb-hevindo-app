import React, { useState, useMemo } from 'react';
import { MonthlyDues, Athlete, UserRole, TrainingCategory } from '../../types';
import { formatRupiah, formatIndonesianDate, matchesMultiFieldSearch, sortData, exportToCSV } from '../../utils/helpers';
import {
  DollarSign,
  Search,
  CheckCircle,
  Clock,
  Award,
  CreditCard,
  Printer,
  Download,
  Send,
  Filter,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface MonthlyDuesTabProps {
  dues: MonthlyDues[];
  athletes: Athlete[];
  onPayDue: (dueId: string, paymentMethod: 'Cash' | 'Transfer Bank' | 'QRIS', notes?: string) => void;
  onApplyRewardFree: (dueId: string, tournamentTitle: string) => void;
  currentRole: UserRole;
}

export const MonthlyDuesTab: React.FC<MonthlyDuesTabProps> = ({
  dues = [],
  athletes = [],
  onPayDue,
  onApplyRewardFree,
  currentRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('2026-09');
  const [sortKey, setSortKey] = useState<keyof MonthlyDues>('athleteName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal payment
  const [selectedDueToPay, setSelectedDueToPay] = useState<MonthlyDues | null>(null);
  const [payMethod, setPayMethod] = useState<'Cash' | 'Transfer Bank' | 'QRIS'>('Transfer Bank');
  const [payNotes, setPayNotes] = useState('');

  // Kwitansi / Receipt Modal
  const [receiptDue, setReceiptDue] = useState<MonthlyDues | null>(null);

  const canEdit = currentRole === 'Admin' || currentRole === 'Operator' || currentRole === 'Kasir';

  const safeDues = dues || [];

  const filteredDues = useMemo(() => {
    return safeDues.filter((d) => {
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (filterMonth && d.periodMonth !== filterMonth) return false;
      return matchesMultiFieldSearch(searchQuery, [
        d.invoiceNumber,
        d.athleteName,
        d.trainingCategory,
        d.status,
        d.paymentMethod,
      ]);
    });
  }, [safeDues, filterStatus, filterMonth, searchQuery]);

  const sortedDues = useMemo(() => {
    return sortData(filteredDues, sortKey, sortDirection);
  }, [filteredDues, sortKey, sortDirection]);

  // Statistics
  const totalAmount = safeDues.filter((d) => d.periodMonth === filterMonth).reduce((acc, curr) => acc + curr.amount, 0);
  const paidAmount = safeDues
    .filter((d) => d.periodMonth === filterMonth && d.status === 'Sudah Bayar')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const unpaidCount = safeDues.filter((d) => d.periodMonth === filterMonth && d.status === 'Belum Bayar').length;
  const rewardCount = safeDues.filter((d) => d.periodMonth === filterMonth && d.status === 'Gratis / Reward Juara').length;

  const handleConfirmPay = () => {
    if (!selectedDueToPay) return;
    onPayDue(selectedDueToPay.id, payMethod, payNotes);
    setSelectedDueToPay(null);
    setPayNotes('');
  };

  const handleExportCSV = () => {
    exportToCSV(
      dues.map((d) => ({
        'No Tagihan': d.invoiceNumber,
        'Nama Atlet': d.athleteName,
        'Kategori Latihan': d.trainingCategory,
        'Periode': d.periodMonth,
        'Nominal': d.amount,
        'Status': d.status,
        'Metode Bayar': d.paymentMethod || '-',
        'Tanggal Bayar': d.paymentDate || '-',
        'Catatan': d.notes || '-',
      })),
      `Laporan_Iuran_HEVINDO_${filterMonth}`
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Total Tagihan ({filterMonth})</span>
          <span className="text-xl font-bold text-white mt-1 block">{formatRupiah(totalAmount)}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Seluruh atlet terdaftar</span>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-emerald-500/30">
          <span className="text-[11px] text-emerald-400 block font-medium">Realisasi Terbayar</span>
          <span className="text-xl font-bold text-emerald-300 mt-1 block">{formatRupiah(paidAmount)}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Lunas via Bank/QRIS/Cash</span>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-amber-500/30">
          <span className="text-[11px] text-amber-400 block font-medium">Bebas Iuran (Reward Juara)</span>
          <span className="text-xl font-bold text-amber-300 mt-1 block">{rewardCount} Atlet</span>
          <span className="text-[10px] text-slate-400 mt-1 block">🏆 Otomatis Juara Turnamen</span>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-red-500/30">
          <span className="text-[11px] text-red-400 block font-medium">Tunggakan / Belum Bayar</span>
          <span className="text-xl font-bold text-red-400 mt-1 block">{unpaidCount} Atlet</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Perlu tindak lanjut kasir</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tagihan (nama atlet, no invoice, kategori)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
          />

          {/* Status selector */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
          >
            <option value="all">Semua Status</option>
            <option value="Sudah Bayar">Sudah Bayar</option>
            <option value="Belum Bayar">Belum Bayar</option>
            <option value="Gratis / Reward Juara">Gratis / Reward Juara 🏆</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">No. Invoice</th>
                <th className="p-3">Nama Atlet</th>
                <th className="p-3">Kategori Latihan & Tarif</th>
                <th className="p-3">Status Iuran</th>
                <th className="p-3">Metode & Tanggal Bayar</th>
                <th className="p-3">Catatan / Reward</th>
                <th className="p-3 text-center">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedDues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada data iuran pada periode ini.
                  </td>
                </tr>
              ) : (
                sortedDues.map((due) => (
                  <tr key={due.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-mono font-medium text-slate-200">{due.invoiceNumber}</td>
                    <td className="p-3 font-semibold text-white">{due.athleteName}</td>
                    <td className="p-3">
                      <span className="font-medium text-slate-200 block">{due.trainingCategory}</span>
                      <span className="text-emerald-400 font-bold text-[11px]">{formatRupiah(due.amount)}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          due.status === 'Gratis / Reward Juara'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : due.status === 'Sudah Bayar'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {due.status === 'Gratis / Reward Juara' && <span>🏆</span>}
                        <span>{due.status}</span>
                      </span>
                    </td>
                    <td className="p-3 text-[11px]">
                      {due.status === 'Sudah Bayar' ? (
                        <>
                          <div className="font-semibold text-white">{due.paymentMethod}</div>
                          <div className="text-slate-400">{due.paymentDate}</div>
                        </>
                      ) : due.status === 'Gratis / Reward Juara' ? (
                        <span className="text-amber-300 font-medium">Bebas Iuran Juara</span>
                      ) : (
                        <span className="text-red-400">Menunggu Pembayaran</span>
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-slate-400 max-w-xs truncate">
                      {due.notes || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {due.status === 'Belum Bayar' && canEdit && (
                          <button
                            id={`btn-pay-${due.id}`}
                            onClick={() => setSelectedDueToPay(due)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition"
                          >
                            Bayar Kasir
                          </button>
                        )}
                        {due.status === 'Sudah Bayar' && (
                          <button
                            id={`btn-receipt-${due.id}`}
                            onClick={() => setReceiptDue(due)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Cetak Kwitansi Pembayaran"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                        )}
                        {due.status === 'Gratis / Reward Juara' && (
                          <button
                            id={`btn-reward-cert-${due.id}`}
                            onClick={() => setReceiptDue(due)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Cetak Sertifikat Bebas Iuran Reward"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Process Payment */}
      {selectedDueToPay && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-base flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Proses Pembayaran Iuran Atlet</span>
            </h4>

            <div className="p-3 bg-slate-800/80 rounded-xl space-y-1 text-xs text-slate-300">
              <p>
                Atlet: <strong className="text-white">{selectedDueToPay.athleteName}</strong>
              </p>
              <p>
                Program: <strong className="text-cyan-300">{selectedDueToPay.trainingCategory}</strong>
              </p>
              <p>
                Periode: <strong className="text-white">{selectedDueToPay.periodMonth}</strong>
              </p>
              <p className="text-sm font-bold text-emerald-400 mt-2">
                Nominal: {formatRupiah(selectedDueToPay.amount)}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Pilih Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Transfer Bank', 'QRIS', 'Cash'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayMethod(method)}
                      className={`py-2 px-3 rounded-lg border text-center font-semibold transition ${
                        payMethod === method
                          ? 'bg-emerald-600/30 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Catatan Bukti Pembayaran</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Contoh: Transfer via Mandiri an Orang Tua..."
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedDueToPay(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPay}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Konfirmasi & Terbitkan Kwitansi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kwitansi / Nota Print Modal */}
      {receiptDue && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-extrabold text-base tracking-tight text-emerald-800">
                  KLUB BULUTANGKIS HEVINDO
                </h4>
                <p className="text-[11px] text-slate-500">
                  Jl. Riau No. 88, Payung Sekaki, Pekanbaru • Telp: 0812-7654-3210
                </p>
              </div>
              <button onClick={() => setReceiptDue(null)} className="text-slate-400 hover:text-slate-900 font-bold">
                ✕
              </button>
            </div>

            <div className="text-center py-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {receiptDue.status === 'Gratis / Reward Juara' ? 'SERTIFIKAT BEBAS IURAN' : 'KWITANSI RESMI IURAN BULANAN'}
              </span>
              <p className="font-mono text-xs font-bold text-slate-800">{receiptDue.invoiceNumber}</p>
            </div>

            <div className="space-y-2 text-xs border-y border-dashed border-slate-300 py-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Diterima dari:</span>
                <span className="font-bold">{receiptDue.athleteName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Program Pembinaan:</span>
                <span className="font-semibold">{receiptDue.trainingCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Untuk Iuran Bulan:</span>
                <span className="font-semibold">{receiptDue.periodMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Bayar:</span>
                <span className="font-semibold">{receiptDue.paymentMethod || 'Reward Otomatis'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Transaksi:</span>
                <span>{receiptDue.paymentDate || new Date().toISOString().split('T')[0]}</span>
              </div>
              {receiptDue.notes && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Keterangan:</span>
                  <span className="italic text-slate-700">{receiptDue.notes}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="font-bold text-xs text-emerald-900">JUMLAH DIBAYAR:</span>
              <span className="font-mono font-black text-base text-emerald-800">
                {receiptDue.status === 'Gratis / Reward Juara' ? 'GRATIS (REWARD JUARA)' : formatRupiah(receiptDue.amount)}
              </span>
            </div>

            <div className="flex justify-between pt-4 text-[10px] text-slate-500">
              <div>
                <p>Status: LUNAS VALID</p>
                <p>Dicetak Otomatis Sistem Hevindo</p>
              </div>
              <div className="text-right">
                <p>Pekanbaru, {formatIndonesianDate(new Date().toISOString())}</p>
                <p className="mt-8 font-bold text-slate-800">Bendahara / Kasir HEVINDO</p>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Kwitansi (Print)</span>
              </button>
              <button
                onClick={() => setReceiptDue(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
