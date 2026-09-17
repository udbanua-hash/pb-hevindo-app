import React, { useState, useMemo } from 'react';
import { MonthlyDues, Athlete } from '../../types';
import { formatRupiah, formatIndonesianDate } from '../../utils/helpers';
import { Printer, Download, X, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DuesPrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dues: MonthlyDues[];
  athletes: Athlete[];
  initialType?: 'unpaid' | 'paid' | 'arrears_recap' | 'all';
}

export const DuesPrintReportModal: React.FC<DuesPrintReportModalProps> = ({
  isOpen,
  onClose,
  dues = [],
  athletes = [],
  initialType = 'unpaid',
}) => {
  const [reportType, setReportType] = useState<'unpaid' | 'paid' | 'arrears_recap' | 'all'>(initialType);
  const [filterMonth, setFilterMonth] = useState<string>('2026-09');
  const [includeAllMonths, setIncludeAllMonths] = useState<boolean>(false);

  // Arrears recap calculation
  const arrearsRecap = useMemo(() => {
    const map = new Map<
      string,
      {
        athleteId: string;
        athleteName: string;
        trainingCategory: string;
        parentPhone?: string;
        unpaidMonths: string[];
        totalUnpaidAmount: number;
      }
    >();

    athletes.forEach((ath) => {
      const athleteUnpaid = dues.filter(
        (d) =>
          (d.athleteId === ath.id || d.athleteName.toLowerCase() === ath.name.toLowerCase()) &&
          d.status === 'Belum Bayar'
      );
      if (athleteUnpaid.length > 0) {
        map.set(ath.id, {
          athleteId: ath.id,
          athleteName: ath.name,
          trainingCategory: ath.trainingCategory,
          parentPhone: (ath as any).parentPhone || ath.phoneNumber || '-',
          unpaidMonths: athleteUnpaid.map((d) => d.periodMonth).sort(),
          totalUnpaidAmount: athleteUnpaid.reduce((acc, curr) => acc + curr.amount, 0),
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.unpaidMonths.length - a.unpaidMonths.length || b.totalUnpaidAmount - a.totalUnpaidAmount
    );
  }, [dues, athletes]);

  // Filtered Dues based on report type
  const reportData = useMemo(() => {
    return dues.filter((d) => {
      if (!includeAllMonths && d.periodMonth !== filterMonth) return false;
      if (reportType === 'unpaid') return d.status === 'Belum Bayar';
      if (reportType === 'paid') return d.status === 'Sudah Bayar';
      return true;
    });
  }, [dues, reportType, filterMonth, includeAllMonths]);

  // Statistics
  const totalAmount = useMemo(() => {
    if (reportType === 'arrears_recap') {
      return arrearsRecap.reduce((acc, curr) => acc + curr.totalUnpaidAmount, 0);
    }
    return reportData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [reportData, reportType, arrearsRecap]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl my-6 print:m-0 print:p-0 print:border-none print:shadow-none">
        {/* Controls Header (Hidden when printing) */}
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-3 print:hidden">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Cetak / Ekspor Laporan Resmi Iuran PB HEVINDO</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Format siap cetak atau simpan sebagai PDF dengan kop resmi, tanda tangan, dan tabel rekapitulasi.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls (Hidden when printing) */}
        <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Jenis Laporan:</span>
            <button
              onClick={() => setReportType('unpaid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                reportType === 'unpaid'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-slate-900 text-red-400 hover:text-white border border-slate-800'
              }`}
            >
              Tagihan Belum Lunas (Tunggakan)
            </button>
            <button
              onClick={() => setReportType('paid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                reportType === 'paid'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-emerald-400 hover:text-white border border-slate-800'
              }`}
            >
              Penerimaan Sudah Lunas
            </button>
            <button
              onClick={() => setReportType('arrears_recap')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                reportType === 'arrears_recap'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-900 text-amber-400 hover:text-white border border-slate-800'
              }`}
            >
              Rekap Akumulasi Tunggakan Per Atlet
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAllMonths}
                onChange={(e) => setIncludeAllMonths(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 bg-slate-900 border-slate-700"
              />
              <span>Semua Periode</span>
            </label>

            {!includeAllMonths && (
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-mono"
              />
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* PRINTABLE OFFICIAL LETTERHEAD DOCUMENT SHEET */}
        {/* ======================================================== */}
        <div
          id="official-print-document"
          className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-inner max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:border-none"
        >
          {/* Official Letterhead (KOP SURAT) */}
          <div className="border-b-2 border-slate-900 pb-3 mb-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-black text-xl tracking-wider shadow">
                HEV
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  KLUB BULUTANGKIS HEVINDO (PB HEVINDO)
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Sekretariat & Hall: Jl. Riau No. 88, Payung Sekaki, Pekanbaru, Riau 28292
                </p>
                <p className="text-[11px] text-slate-500">
                  Telp/WhatsApp: 0812-7654-3210 • Email: official@pbhevindo.com
                </p>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                PBSI PEKANBARU
              </span>
              <p className="mt-1 font-mono">Doc: HEV-REP-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>

          {/* Document Title & Period */}
          <div className="text-center mb-5">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              {reportType === 'unpaid'
                ? 'LAPORAN DAFTAR TAGIHAN IURAN BELUM LUNAS (TUNGGAKAN)'
                : reportType === 'paid'
                ? 'LAPORAN REALISASI PENERIMAAN IURAN LUNAS'
                : reportType === 'arrears_recap'
                ? 'REKAPITULASI AKUMULASI TUNGGAKAN BULANAN ATLET'
                : 'LAPORAN REKAPITULASI IURAN ANGGOTA'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Periode:{' '}
              <strong className="text-slate-800">
                {includeAllMonths ? 'Seluruh Bulan / Kumulatif' : `Bulan ${filterMonth}`}
              </strong>{' '}
              • Tanggal Cetak:{' '}
              <strong className="text-slate-800">{formatIndonesianDate(new Date().toISOString())}</strong>
            </p>
          </div>

          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs">
            <div>
              <span className="text-slate-500 block">Total Data Terdaftar:</span>
              <strong className="text-slate-900 text-sm">
                {reportType === 'arrears_recap' ? arrearsRecap.length : reportData.length} Atlet / Item
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Status Laporan:</span>
              <strong
                className={`text-sm ${
                  reportType === 'unpaid' || reportType === 'arrears_recap'
                    ? 'text-red-600'
                    : 'text-emerald-700'
                }`}
              >
                {reportType === 'unpaid'
                  ? 'Kewajiban Belum Dibayar'
                  : reportType === 'paid'
                  ? 'Sudah Dilunasi'
                  : 'Total Akumulasi Tunggakan'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Total Akumulasi Nominal:</span>
              <strong className="text-slate-900 text-sm font-mono font-black">
                {formatRupiah(totalAmount)}
              </strong>
            </div>
          </div>

          {/* Table Data */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            {reportType === 'arrears_recap' ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 text-center w-10">No</th>
                    <th className="p-2 border-r border-slate-200">Nama Atlet</th>
                    <th className="p-2 border-r border-slate-200">Program Kelas</th>
                    <th className="p-2 border-r border-slate-200 text-center">Jml Bulan</th>
                    <th className="p-2 border-r border-slate-200">Rincian Bulan Menunggak</th>
                    <th className="p-2 border-r border-slate-200 text-right">Total Tunggakan</th>
                    <th className="p-2">Kontak Wali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {arrearsRecap.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400">
                        Tidak ada atlet yang memiliki tunggakan.
                      </td>
                    </tr>
                  ) : (
                    arrearsRecap.map((item, idx) => (
                      <tr key={item.athleteId} className="even:bg-slate-50/50">
                        <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                          {item.athleteName}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-medium">{item.trainingCategory}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-red-600">
                          {item.unpaidMonths.length} Bulan
                        </td>
                        <td className="p-2 border-r border-slate-200 font-mono text-[11px] text-slate-700">
                          {item.unpaidMonths.join(', ')}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(item.totalUnpaidAmount)}
                        </td>
                        <td className="p-2 text-slate-600 text-[11px]">{item.parentPhone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 text-center w-10">No</th>
                    <th className="p-2 border-r border-slate-200">No. Invoice</th>
                    <th className="p-2 border-r border-slate-200">Nama Atlet</th>
                    <th className="p-2 border-r border-slate-200">Kelas</th>
                    <th className="p-2 border-r border-slate-200 text-center">Periode</th>
                    <th className="p-2 border-r border-slate-200 text-right">Nominal</th>
                    <th className="p-2 border-r border-slate-200 text-center">Status</th>
                    <th className="p-2 text-center">Metode & Tgl</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-400">
                        Tidak ada data yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((d, idx) => (
                      <tr key={d.id} className="even:bg-slate-50/50">
                        <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-medium text-slate-700">
                          {d.invoiceNumber}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{d.athleteName}</td>
                        <td className="p-2 border-r border-slate-200">{d.trainingCategory}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono">{d.periodMonth}</td>
                        <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(d.amount)}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          <span
                            className={`font-semibold ${
                              d.status === 'Sudah Bayar'
                                ? 'text-emerald-700'
                                : d.status === 'Gratis / Reward Juara'
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="p-2 text-center text-slate-600 text-[11px]">
                          {d.status === 'Sudah Bayar' ? `${d.paymentMethod || 'Cash'} • ${d.paymentDate || '-'}` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Formal Signature Footer */}
          <div className="flex justify-between pt-6 text-xs text-slate-700">
            <div className="text-center w-56">
              <p>Mengetahui,</p>
              <p className="font-semibold text-slate-900">Ketua Umum PB HEVINDO</p>
              <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                (Tanda Tangan Resmi)
              </div>
              <p className="font-bold border-t border-slate-400 pt-1 text-slate-900">H. Hendra Wijaya, S.E.</p>
            </div>

            <div className="text-center w-56">
              <p>Pekanbaru, {formatIndonesianDate(new Date().toISOString())}</p>
              <p className="font-semibold text-slate-900">Bendahara / Bagian Kasir</p>
              <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                (Tanda Tangan Resmi)
              </div>
              <p className="font-bold border-t border-slate-400 pt-1 text-slate-900">Nurul Anisa, A.Md.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
