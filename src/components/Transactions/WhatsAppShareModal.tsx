import React, { useState } from 'react';
import { formatRupiah } from '../../utils/helpers';
import { Send, Copy, Check, X, Phone, User } from 'lucide-react';

export interface WhatsAppAthleteTarget {
  athleteId: string;
  athleteName: string;
  trainingCategory: string;
  parentName?: string;
  parentPhone?: string;
  unpaidMonths: string[];
  totalAmount: number;
}

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: WhatsAppAthleteTarget[];
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  targets = [],
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const generateMessage = (item: WhatsAppAthleteTarget): string => {
    const months = item.unpaidMonths.join(', ');
    return (
      `*PEMBERITAHUAN IURAN PB HEVINDO*\n\n` +
      `Kepada Yth. Bapak/Ibu Wali dari:\n` +
      `👤 *${item.athleteName}*\n` +
      `🏸 Program: *${item.trainingCategory}*\n\n` +
      `Kami menginformasikan bahwa terdapat kewajiban iuran bulanan yang belum tercatat lunas sebanyak *${item.unpaidMonths.length} Bulan* (${months}) dengan rincian total:\n` +
      `💰 *Total Tagihan: ${formatRupiah(item.totalAmount)}*\n\n` +
      `Pembayaran dapat ditransfer melalui rekening resmi:\n` +
      `🏦 *Bank Mandiri: 108-00-1234567-8*\n` +
      `a/n *PB HEVINDO PEKANBARU*\n` +
      `atau via QRIS Kasir Hall PB Hevindo.\n\n` +
      `Mohon kirimkan bukti transfer setelah pembayaran dilakukan. Terima kasih atas perhatian dan dukungannya demi kemajuan prestasi atlet! 🙏`
    );
  };

  const handleCopy = (item: WhatsAppAthleteTarget) => {
    const text = generateMessage(item);
    navigator.clipboard.writeText(text);
    setCopiedId(item.athleteId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenWA = (item: WhatsAppAthleteTarget) => {
    const text = encodeURIComponent(generateMessage(item));
    const cleanPhone = (item.parentPhone || '').replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-6">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Send className="w-5 h-5 text-emerald-400" />
              <span>Kirim Pengingat Tagihan WhatsApp ({targets.length} Atlet)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pesan otomatis telah disesuaikan dengan program kelas, daftar bulan tunggakan, dan rekening resmi PB Hevindo.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {targets.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Tidak ada atlet yang dipilih.</div>
          ) : (
            targets.map((item) => (
              <div
                key={item.athleteId}
                className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                      <span>{item.athleteName}</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px]">
                        {item.trainingCategory}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Wali: <strong className="text-slate-200">{item.parentName || 'Orang Tua'}</strong> • HP:{' '}
                      <span className="font-mono text-slate-300">{item.parentPhone || '-'}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-red-400 font-bold block">
                      {item.unpaidMonths.length} Bulan Tunggakan
                    </span>
                    <span className="font-mono font-black text-white text-sm">
                      {formatRupiah(item.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-line">
                  {generateMessage(item)}
                </div>

                <div className="flex justify-end items-center space-x-2 pt-1">
                  <button
                    onClick={() => handleCopy(item)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    {copiedId === item.athleteId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Pesan</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenWA(item)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Buka WhatsApp</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
