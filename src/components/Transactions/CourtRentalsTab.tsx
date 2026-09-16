import React, { useState, useMemo } from 'react';
import { CourtRental, UserRole } from '../../types';
import { formatRupiah, matchesMultiFieldSearch, exportToCSV } from '../../utils/helpers';
import { CalendarCheck, Plus, Search, Filter, Phone, Clock, Download, CheckCircle, Trash2, Edit2 } from 'lucide-react';

interface CourtRentalsTabProps {
  rentals: CourtRental[];
  onAddRental: (rental: CourtRental) => void;
  onUpdateRental: (rental: CourtRental) => void;
  onDeleteRental: (id: string) => void;
  currentRole: UserRole;
}

export const CourtRentalsTab: React.FC<CourtRentalsTabProps> = ({
  rentals = [],
  onAddRental,
  onUpdateRental,
  onDeleteRental,
  currentRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<CourtRental | null>(null);

  const canEdit = currentRole === 'Admin' || currentRole === 'Operator' || currentRole === 'Kasir';

  const [formData, setFormData] = useState<Partial<CourtRental>>({
    bookingCode: '',
    renterName: '',
    renterPhone: '',
    rentalType: 'Harian',
    courtName: 'Court 1 Hevindo 1',
    courtId: 'CRT-01',
    startDate: new Date().toISOString().split('T')[0],
    timeSlot: '19:00 - 21:00',
    durationHours: 2,
    pricePerUnit: 60000,
    totalPrice: 120000,
    status: 'Aktif',
    paymentStatus: 'Lunas',
  });

  const filteredRentals = useMemo(() => {
    return (rentals || []).filter((r) => {
      if (filterType !== 'all' && r.rentalType !== filterType) return false;
      return matchesMultiFieldSearch(searchQuery, [
        r.bookingCode,
        r.renterName,
        r.renterPhone,
        r.courtName,
        r.rentalType,
        r.paymentStatus,
      ]);
    });
  }, [rentals, filterType, searchQuery]);

  const handleOpenAdd = () => {
    setEditingRental(null);
    setFormData({
      id: `RENT-${Date.now()}`,
      bookingCode: `SW-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(10 + Math.random() * 90)}`,
      renterName: '',
      renterPhone: '',
      rentalType: 'Harian',
      courtName: 'Court 1 Hevindo 1',
      courtId: 'CRT-01',
      startDate: new Date().toISOString().split('T')[0],
      timeSlot: '19:00 - 21:00',
      durationHours: 2,
      pricePerUnit: 60000,
      totalPrice: 120000,
      status: 'Aktif',
      paymentStatus: 'Lunas',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: CourtRental) => {
    setEditingRental(r);
    setFormData({ ...r });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.renterName) return;

    const payload: CourtRental = {
      id: editingRental ? editingRental.id : formData.id || `RENT-${Date.now()}`,
      bookingCode: formData.bookingCode || `SW-${Date.now()}`,
      renterName: formData.renterName,
      renterPhone: formData.renterPhone || '-',
      rentalType: formData.rentalType as any,
      courtId: formData.courtId || 'CRT-01',
      courtName: formData.courtName || 'Court 1 Hevindo 1',
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate,
      timeSlot: formData.timeSlot || '19:00 - 21:00',
      durationHours: Number(formData.durationHours) || 2,
      pricePerUnit: Number(formData.pricePerUnit) || 60000,
      totalPrice: Number(formData.totalPrice) || 120000,
      status: formData.status as any,
      paymentStatus: formData.paymentStatus as any,
    };

    if (editingRental) onUpdateRental(payload);
    else onAddRental(payload);
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    exportToCSV(
      rentals.map((r) => ({
        'Kode Booking': r.bookingCode,
        'Nama Penyewa': r.renterName,
        'Kontak / WA': r.renterPhone,
        'Paket Sewa': r.rentalType,
        'Lapangan': r.courtName,
        'Tanggal Mulai': r.startDate,
        'Slot Jam': r.timeSlot,
        'Total Biaya': r.totalPrice,
        'Status Bayar': r.paymentStatus,
        'Status Sewa': r.status,
      })),
      'Data_Sewa_Lapangan_HEVINDO'
    );
  };

  return (
    <div className="space-y-4">
      {/* Types Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['Harian', 'Mingguan', 'Bulanan', 'Tahunan'] as const).map((type) => {
          const count = rentals.filter((r) => r.rentalType === type).length;
          const totalRev = rentals.filter((r) => r.rentalType === type).reduce((acc, c) => acc + c.totalPrice, 0);
          return (
            <div
              key={type}
              onClick={() => setFilterType(filterType === type ? 'all' : type)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                filterType === type
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                  : 'bg-slate-850 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Sewa {type}</span>
                <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full">
                  {count} Booking
                </span>
              </div>
              <p className="font-bold text-emerald-400 text-sm mt-1">{formatRupiah(totalRev)}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari booking (kode booking, penyewa, court, telepon)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Booking Lapangan Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Kode Booking</th>
                <th className="p-3">Penyewa & Kontak</th>
                <th className="p-3">Paket Sewa</th>
                <th className="p-3">Lapangan (Court)</th>
                <th className="p-3">Jadwal & Waktu</th>
                <th className="p-3">Tarif / Total</th>
                <th className="p-3">Status Pembayaran</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data booking lapangan.
                  </td>
                </tr>
              ) : (
                filteredRentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-mono font-medium text-emerald-400">{rental.bookingCode}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{rental.renterName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{rental.renterPhone}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {rental.rentalType}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{rental.courtName}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-200">{rental.startDate}</div>
                      <div className="text-[11px] text-slate-400">{rental.timeSlot}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-emerald-400">{formatRupiah(rental.totalPrice)}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          rental.paymentStatus === 'Lunas'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {rental.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {canEdit && (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(rental)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400"
                            title="Edit Booking"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus booking ${rental.bookingCode}?`)) onDeleteRental(rental.id);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400"
                            title="Hapus Booking"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">
              {editingRental ? 'Edit Booking Sewa Lapangan' : 'Reservasi Sewa Lapangan HEVINDO'}
            </h4>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Nama Penyewa / Instansi *</label>
                  <input
                    type="text"
                    required
                    value={formData.renterName}
                    onChange={(e) => setFormData({ ...formData, renterName: e.target.value })}
                    placeholder="Contoh: PB Surya / Bpk. Rudi"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={formData.renterPhone}
                    onChange={(e) => setFormData({ ...formData, renterPhone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Fleksibilitas Sewa</label>
                  <select
                    value={formData.rentalType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      let price = 60000;
                      if (type === 'Harian') price = 120000;
                      else if (type === 'Mingguan') price = 220000;
                      else if (type === 'Bulanan') price = 750000;
                      else if (type === 'Tahunan') price = 7500000;
                      setFormData({ ...formData, rentalType: type, totalPrice: price });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Harian">Harian (per sesi jam)</option>
                    <option value="Mingguan">Mingguan (Paket 4 jam)</option>
                    <option value="Bulanan">Bulanan (Member Rutin)</option>
                    <option value="Tahunan">Tahunan (Instansi / Korporat)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Pilih Lapangan</label>
                  <select
                    value={formData.courtName}
                    onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Court 1 Hevindo 1">Court 1 Hevindo 1</option>
                    <option value="Court 2 Hevindo 1">Court 2 Hevindo 1</option>
                    <option value="Court 3 Hevindo 2">Court 3 Hevindo 2</option>
                    <option value="Court 4 Arena VIP">Court 4 Arena VIP (Mat BWF)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Slot Waktu Main</label>
                  <input
                    type="text"
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    placeholder="19:00 - 21:00 WIB"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Total Biaya Sewa (Rp)</label>
                  <input
                    type="number"
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Status Pembayaran</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="DP / Panjar">DP / Panjar</option>
                    <option value="Belum Bayar">Belum Bayar</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold"
                >
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
