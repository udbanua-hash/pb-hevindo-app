import React from 'react';
import { MonthlyDues } from '../../types';
import { formatRupiah, formatIndonesianDate } from '../../utils/helpers';
import { Printer, X, CheckCircle, Award } from 'lucide-react';

interface ReceiptModalProps {
  receiptDue: MonthlyDues | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receiptDue, onClose }) => {
  if (!receiptDue) return null;

  return (
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center py-2 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {receiptDue.status === 'Gratis / Reward Juara'
              ? 'SERTIFIKAT BEBAS IURAN'
              : 'KWITANSI RESMI IURAN BULANAN'}
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
            <span className="text-slate-500">Periode Iuran:</span>
            <span className="font-mono font-bold text-slate-800">{receiptDue.periodMonth}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Metode & Tanggal:</span>
            <span>
              {receiptDue.paymentMethod || 'Cash'} •{' '}
              {receiptDue.paymentDate ? formatIndonesianDate(receiptDue.paymentDate) : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Catatan / Referensi:</span>
            <span className="italic">{receiptDue.notes || 'Lunas'}</span>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex justify-between items-center">
          <span className="text-xs font-semibold text-emerald-900">Total Pembayaran:</span>
          <span className="text-base font-mono font-black text-emerald-700">
            {receiptDue.status === 'Gratis / Reward Juara' ? 'GRATIS (REWARD)' : formatRupiah(receiptDue.amount)}
          </span>
        </div>

        <div className="flex justify-between items-end pt-4 text-[11px] text-slate-600">
          <div>
            <p>Pekanbaru, {formatIndonesianDate(new Date().toISOString())}</p>
            <p className="text-emerald-700 font-bold mt-1">STATUS: LUNAS & TERVERIFIKASI</p>
          </div>
          <div className="text-center">
            <p>Petugas Kasir / Bendahara</p>
            <div className="h-10"></div>
            <p className="font-bold underline text-slate-800">Kasir PB HEVINDO</p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kwitansi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
