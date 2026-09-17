import React, { useState, useMemo } from 'react';
import { MonthlyDues, Athlete, TrainingCategory } from '../../types';
import { formatRupiah, getStandardMonthlyFee } from '../../utils/helpers';
import { CreditCard, Calendar, Users, CheckCircle, AlertCircle, X, Check, Layers } from 'lucide-react';

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: Athlete[];
  dues: MonthlyDues[];
  initialSelectedDueIds?: string[];
  initialAthleteId?: string;
  onSaveBulkPayment: (records: MonthlyDues[], description: string) => void;
}

export const BulkPaymentModal: React.FC<BulkPaymentModalProps> = ({
  isOpen,
  onClose,
  athletes = [],
  dues = [],
  initialSelectedDueIds = [],
  initialAthleteId,
  onSaveBulkPayment,
}) => {
  // Sub-tabs: 'multi_month' (1 athlete, several months) vs 'collective_athletes' (multiple athletes)
  const [paymentMode, setPaymentMode] = useState<'multi_month' | 'collective_athletes'>(
    initialSelectedDueIds.length > 0 ? 'collective_athletes' : 'multi_month'
  );

  // Mode 1: Single Athlete Multi-Month State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(
    initialAthleteId || athletes[0]?.id || ''
  );
  const currentAthlete = useMemo(() => {
    return athletes.find((a) => a.id === selectedAthleteId) || athletes[0];
  }, [athletes, selectedAthleteId]);

  // Months available for selected athlete: past unpaid months + current + next 3 months
  const athleteUnpaidDues = useMemo(() => {
    if (!currentAthlete) return [];
    return dues.filter(
      (d) =>
        (d.athleteId === currentAthlete.id || d.athleteName.toLowerCase() === currentAthlete.name.toLowerCase()) &&
        d.status === 'Belum Bayar'
    );
  }, [dues, currentAthlete]);

  // Build candidate months (e.g. 2026-07 to 2026-12)
  const availableMonths = useMemo(() => {
    const list: { monthStr: string; isUnpaid: boolean; label: string }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Past 3 months
    for (let i = 3; i >= 1; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const isUnpaid = athleteUnpaidDues.some((d) => d.periodMonth === mStr);
      list.push({
        monthStr: mStr,
        isUnpaid,
        label: `${mStr} (${i} Bulan Lalu - ${isUnpaid ? 'Menunggak' : 'Sudah Bayar'})`,
      });
    }

    // Current month
    const curStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const curUnpaid = athleteUnpaidDues.some((d) => d.periodMonth === curStr);
    list.push({
      monthStr: curStr,
      isUnpaid: curUnpaid,
      label: `${curStr} (Bulan Berjalan - ${curUnpaid ? 'Belum Bayar' : 'Sudah Bayar'})`,
    });

    // Next 3 months (advance payment)
    for (let i = 1; i <= 3; i++) {
      const d = new Date(currentYear, currentMonth - 1 + i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push({
        monthStr: mStr,
        isUnpaid: false,
        label: `${mStr} (Bulan Ke Depan - Di Muka)`,
      });
    }

    return list;
  }, [athleteUnpaidDues]);

  // Selected months for Mode 1
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    new Date().toISOString().slice(0, 7),
  ]);

  // Mode 2: Collective Multi-Athlete State
  const [selectedDueIdsMode2, setSelectedDueIdsMode2] = useState<Set<string>>(
    new Set(initialSelectedDueIds)
  );
  const [collectivePeriodMonth, setCollectivePeriodMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  // Common payment transaction details
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer Bank' | 'QRIS'>('Transfer Bank');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState<string>('');

  // Class rate for the current athlete (Pembibitan: 350rb, Regular: 450rb, Pusdiklat: 600rb)
  const athleteClassFee = useMemo(() => {
    if (!currentAthlete) return 350000;
    return getStandardMonthlyFee(currentAthlete.trainingCategory);
  }, [currentAthlete]);

  // Total for Mode 1: months count * class fee
  const totalAmountMode1 = selectedMonths.length * athleteClassFee;

  // Total for Mode 2: sum of amounts of all selected dues
  const selectedDuesMode2List = useMemo(() => {
    return dues.filter((d) => selectedDueIdsMode2.has(d.id));
  }, [dues, selectedDueIdsMode2]);

  const totalAmountMode2 = useMemo(() => {
    return selectedDuesMode2List.reduce((acc, curr) => acc + curr.amount, 0);
  }, [selectedDuesMode2List]);

  // Quick preset handlers for Mode 1
  const handleSelectPresetMonths = (monthsCount: number) => {
    const sorted = availableMonths.map((m) => m.monthStr);
    // Prefer unpaid months first if any, or starting from current month
    const unpaidList = athleteUnpaidDues.map((d) => d.periodMonth).sort();
    if (unpaidList.length >= monthsCount) {
      setSelectedMonths(unpaidList.slice(0, monthsCount));
    } else {
      const curMonth = new Date().toISOString().slice(0, 7);
      const curIndex = sorted.indexOf(curMonth);
      const startIndex = Math.max(0, curIndex - (monthsCount - 1));
      setSelectedMonths(sorted.slice(startIndex, startIndex + monthsCount));
    }
  };

  const handleSelectAllUnpaidMonths = () => {
    if (athleteUnpaidDues.length > 0) {
      setSelectedMonths(athleteUnpaidDues.map((d) => d.periodMonth));
    } else {
      setSelectedMonths([new Date().toISOString().slice(0, 7)]);
    }
  };

  const toggleMonth = (mStr: string) => {
    setSelectedMonths((prev) =>
      prev.includes(mStr) ? prev.filter((m) => m !== mStr) : [...prev, mStr]
    );
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMode === 'multi_month') {
      if (!currentAthlete || selectedMonths.length === 0) {
        alert('Pilih minimal 1 bulan yang akan dibayarkan!');
        return;
      }

      const recordsToSave: MonthlyDues[] = selectedMonths.map((mStr, idx) => {
        // Find existing due for this athlete and month or create a new one
        const existing = dues.find(
          (d) =>
            (d.athleteId === currentAthlete.id || d.athleteName.toLowerCase() === currentAthlete.name.toLowerCase()) &&
            d.periodMonth === mStr
        );

        return {
          id: existing ? existing.id : `DUE-${currentAthlete.id}-${mStr}`,
          athleteId: currentAthlete.id,
          athleteName: currentAthlete.name,
          trainingCategory: currentAthlete.trainingCategory,
          periodMonth: mStr,
          amount: athleteClassFee,
          status: 'Sudah Bayar',
          paymentMethod,
          paymentDate,
          invoiceNumber: `${invoiceNumber}-${idx + 1}`,
          notes: notes || `Pembayaran iuran ${selectedMonths.length} bulan (${selectedMonths.join(', ')})`,
        };
      });

      onSaveBulkPayment(
        recordsToSave,
        `Pembayaran iuran ${currentAthlete.name} (${currentAthlete.trainingCategory}) untuk ${selectedMonths.length} bulan: ${selectedMonths.join(', ')} total ${formatRupiah(totalAmountMode1)}`
      );
      onClose();
    } else {
      // Mode 2: Collective Dues
      if (selectedDueIdsMode2.size === 0) {
        alert('Pilih minimal 1 tagihan atlet yang akan dibayarkan!');
        return;
      }

      const updatedRecords: MonthlyDues[] = selectedDuesMode2List.map((d, idx) => ({
        ...d,
        status: 'Sudah Bayar',
        paymentMethod,
        paymentDate,
        invoiceNumber: `${invoiceNumber}-${idx + 1}`,
        notes: notes || `Pembayaran kolektif kasir/bank`,
      }));

      onSaveBulkPayment(
        updatedRecords,
        `Pembayaran kolektif untuk ${updatedRecords.length} atlet pada periode ${collectivePeriodMonth} total ${formatRupiah(totalAmountMode2)}`
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Input Pembayaran Iuran Atlet (Bisa Multi-Bulan & Kolektif)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bayar sekaligus beberapa bulan yang lalu / ke depan untuk 1 atlet, atau bayar kolektif banyak atlet sekaligus.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setPaymentMode('multi_month')}
            className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center space-x-2 ${
              paymentMode === 'multi_month'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bayar Multi-Bulan (1 Atlet, Bayar 2-3 Bulan)</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode('collective_athletes')}
            className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center space-x-2 ${
              paymentMode === 'collective_athletes'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Bayar Kolektif (Banyak Atlet Sekaligus)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* ======================================================== */}
          {/* TAB 1: 1 ATLET BAYAR BANYAK BULAN (TUNGGAKAN ATAU DI MUKA) */}
          {/* ======================================================== */}
          {paymentMode === 'multi_month' && currentAthlete && (
            <div className="space-y-3.5 bg-slate-850/70 p-4 rounded-xl border border-slate-800">
              {/* Athlete Selector */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Pilih Atlet</label>
                <select
                  value={selectedAthleteId}
                  onChange={(e) => setSelectedAthleteId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — Kelas {a.trainingCategory} ({formatRupiah(getStandardMonthlyFee(a.trainingCategory))}/bln)
                    </option>
                  ))}
                </select>
              </div>

              {/* Class & Rate Info Banner */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700/60 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Program Kelas:</span>
                  <span className="text-emerald-400 font-bold">{currentAthlete.trainingCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tarif Standar:</span>
                  <span className="text-white font-mono font-bold">{formatRupiah(athleteClassFee)} / Bulan</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status Tunggakan:</span>
                  <span className={`font-bold ${athleteUnpaidDues.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {athleteUnpaidDues.length > 0
                      ? `${athleteUnpaidDues.length} Bulan Belum Lunas`
                      : 'Semua Bulan Lunas'}
                  </span>
                </div>
              </div>

              {/* Month Selection Presets */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-300 font-semibold">
                    Pilih Bulan Yang Dibayar (Centang Bulan):
                  </label>
                  <div className="flex space-x-1.5">
                    {athleteUnpaidDues.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllUnpaidMonths}
                        className="px-2 py-0.5 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded text-[10px] font-bold"
                      >
                        Lunasi Semua Tunggakan ({athleteUnpaidDues.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectPresetMonths(2)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-medium"
                    >
                      Bayar 2 Bulan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetMonths(3)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-medium"
                    >
                      Bayar 3 Bulan (Triwulan)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableMonths.map((m) => {
                    const isChecked = selectedMonths.includes(m.monthStr);
                    return (
                      <label
                        key={m.monthStr}
                        onClick={() => toggleMonth(m.monthStr)}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by container
                            className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                          />
                          <span className="font-mono">{m.monthStr}</span>
                          {m.isUnpaid && (
                            <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-[9px] font-bold rounded">
                              Tunggakan
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {formatRupiah(athleteClassFee)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Calculation Summary */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-300 block">
                    Perhitungan Otomatis Sesuai Kelas {currentAthlete.trainingCategory}:
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">
                    {selectedMonths.length} Bulan × {formatRupiah(athleteClassFee)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">
                    Total Bayar:
                  </span>
                  <span className="text-lg font-black text-emerald-300 font-mono">
                    {formatRupiah(totalAmountMode1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: BAYAR KOLEKTIF BANYAK ATLET SEKILAS (CHECKLIST ATLET) */}
          {/* ======================================================== */}
          {paymentMode === 'collective_athletes' && (
            <div className="space-y-3.5 bg-slate-850/70 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <label className="text-slate-300 font-semibold">Periode Bulan:</label>
                  <input
                    type="month"
                    value={collectivePeriodMonth}
                    onChange={(e) => setCollectivePeriodMonth(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs"
                  />
                </div>

                <div className="flex space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const periodDues = dues.filter(
                        (d) => d.periodMonth === collectivePeriodMonth && d.status === 'Belum Bayar'
                      );
                      setSelectedDueIdsMode2(new Set(periodDues.map((d) => d.id)));
                    }}
                    className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded text-[11px] font-bold"
                  >
                    Pilih Semua Yang Belum Bayar Bulan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDueIdsMode2(new Set())}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[11px]"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* List of Dues in selected period */}
              <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-lg divide-y divide-slate-800 bg-slate-900/80">
                {dues.filter((d) => d.periodMonth === collectivePeriodMonth).length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    Tidak ada data tagihan pada periode {collectivePeriodMonth}.
                  </div>
                ) : (
                  dues
                    .filter((d) => d.periodMonth === collectivePeriodMonth)
                    .map((due) => {
                      const isChecked = selectedDueIdsMode2.has(due.id);
                      return (
                        <div
                          key={due.id}
                          onClick={() => {
                            setSelectedDueIdsMode2((prev) => {
                              const next = new Set(prev);
                              if (next.has(due.id)) next.delete(due.id);
                              else next.add(due.id);
                              return next;
                            });
                          }}
                          className={`flex items-center justify-between p-2.5 cursor-pointer transition ${
                            isChecked
                              ? 'bg-emerald-950/40 text-white'
                              : 'hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700"
                            />
                            <div>
                              <div className="font-semibold text-white">{due.athleteName}</div>
                              <div className="text-[10px] text-slate-400">
                                {due.trainingCategory} • {due.invoiceNumber}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-bold text-emerald-400">
                              {formatRupiah(due.amount)}
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                due.status === 'Sudah Bayar'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {due.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Total Mode 2 Calculation */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-300 block">Total Tagihan Terpilih:</span>
                  <span className="text-xs text-emerald-400 font-medium">
                    {selectedDueIdsMode2.size} Atlet Tercentang
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">
                    Total Nominal:
                  </span>
                  <span className="text-lg font-black text-emerald-300 font-mono">
                    {formatRupiah(totalAmountMode2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* COMMON PAYMENT DETAILS (CARA BAYAR, TANGGAL, INVOICE) */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-1">
                {(['Cash', 'Transfer Bank', 'QRIS'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-1 text-center rounded-lg border text-[11px] font-bold transition ${
                      paymentMethod === method
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Tanggal Pembayaran</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">No. Invoice / Kwitansi</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Catatan / Bukti Transaksi</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Transfer Mandiri An. Bpk Hendra / Pembayaran langsung di kasir..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <div className="text-slate-400 text-xs">
              Total yang akan diproses:{' '}
              <strong className="text-emerald-400 font-mono text-sm">
                {formatRupiah(paymentMode === 'multi_month' ? totalAmountMode1 : totalAmountMode2)}
              </strong>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Lunasi Pembayaran</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
