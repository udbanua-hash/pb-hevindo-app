import React, { useState } from 'react';
import { InventoryItem, POSSale, POSSaleItem, UserRole } from '../../types';
import { formatRupiah, formatIndonesianDate } from '../../utils/helpers';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  Receipt,
  CheckCircle2,
  Coffee,
  Store,
  CreditCard,
  Banknote,
  Search,
  Package,
} from 'lucide-react';

interface POSTabProps {
  inventory: InventoryItem[];
  posSales: POSSale[];
  onCompleteSale: (sale: POSSale) => void;
  currentRole: UserRole;
}

export const POSTab: React.FC<POSTabProps> = ({
  inventory = [],
  posSales = [],
  onCompleteSale,
  currentRole,
}) => {
  // Current Cart / Order Items (Fast table input)
  const [cartItems, setCartItems] = useState<POSSaleItem[]>([
    {
      itemId: inventory[0]?.id || '',
      itemName: inventory[0]?.name || '',
      category: inventory[0]?.category || 'Kantin',
      unitPrice: inventory[0]?.sellPrice || 0,
      quantity: 1,
      subtotal: inventory[0]?.sellPrice || 0,
    },
  ]);

  const [customerName, setCustomerName] = useState('Pelanggan Atlet Hevindo');
  const [customerType, setCustomerType] = useState<'Atlet' | 'Wali Atlet' | 'Pengunjung Umum' | 'Member'>('Atlet');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Debit'>('QRIS');
  const [cashierName, setCashierName] = useState('Kasir GOR Hevindo');

  // Modal receipt
  const [recentReceipt, setRecentReceipt] = useState<POSSale | null>(null);

  // Available goods (Kantin, Toko, Koperasi)
  const sellableItems = inventory.filter((i) => i.category !== 'Sewa Lapangan');

  const handleSelectItem = (index: number, itemId: string) => {
    const item = sellableItems.find((i) => i.id === itemId);
    if (!item) return;

    const newCart = [...cartItems];
    newCart[index] = {
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      unitPrice: item.sellPrice,
      quantity: newCart[index]?.quantity || 1,
      subtotal: (newCart[index]?.quantity || 1) * item.sellPrice,
    };
    setCartItems(newCart);
  };

  const handleChangeQty = (index: number, qty: number) => {
    if (qty < 1) return;
    const newCart = [...cartItems];
    newCart[index].quantity = qty;
    newCart[index].subtotal = qty * newCart[index].unitPrice;
    setCartItems(newCart);
  };

  const handleAddCartRow = () => {
    const first = sellableItems[0];
    if (!first) return;
    setCartItems([
      ...cartItems,
      {
        itemId: first.id,
        itemName: first.name,
        category: first.category,
        unitPrice: first.sellPrice,
        quantity: 1,
        subtotal: first.sellPrice,
      },
    ]);
  };

  const handleRemoveCartRow = (index: number) => {
    if (cartItems.length <= 1) {
      alert('Minimal 1 baris transaksi.');
      return;
    }
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const totalCartAmount = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleProcessTransaction = () => {
    if (cartItems.length === 0 || totalCartAmount === 0) {
      alert('Keranjang belanja kosong.');
      return;
    }

    // Check stock
    for (const item of cartItems) {
      const dbItem = inventory.find((i) => i.id === item.itemId);
      if (dbItem && dbItem.stock < item.quantity) {
        alert(`Stok tidak mencukupi untuk "${item.itemName}". Tersisa: ${dbItem.stock}`);
        return;
      }
    }

    const newSale: POSSale = {
      id: `POS-${Date.now()}`,
      invoiceNo: `TRX/POS/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      customerName: customerName || 'Pelanggan Umum',
      customerType,
      items: [...cartItems],
      totalAmount: totalCartAmount,
      cashierName,
      paymentMethod,
    };

    onCompleteSale(newSale);
    setRecentReceipt(newSale);

    // Reset cart to 1 fresh item
    const first = sellableItems[0];
    setCartItems([
      {
        itemId: first.id,
        itemName: first.name,
        category: first.category,
        unitPrice: first.sellPrice,
        quantity: 1,
        subtotal: first.sellPrice,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quick Table Input POS Register */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Kasir Cepat Kantin & Toko Hevindo</h3>
                  <p className="text-xs text-slate-400">Input transaksi cepat dengan tabel interaktif & dropdown master barang</p>
                </div>
              </div>

              <button
                id="btn-add-pos-row"
                onClick={handleAddCartRow}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            {/* Customer Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Pembeli</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama pembeli / atlet..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tipe Pelanggan</label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Atlet">Atlet Klub Hevindo</option>
                  <option value="Wali Atlet">Orang Tua / Wali Atlet</option>
                  <option value="Member">Member Sewa Lapangan</option>
                  <option value="Pengunjung Umum">Pengunjung Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Petugas Kasir</label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            {/* Fast Input Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-10">#</th>
                    <th className="p-3">Pilih Master Barang (Dropdown)</th>
                    <th className="p-3 w-28">Harga Satuan</th>
                    <th className="p-3 w-24">Jumlah (Qty)</th>
                    <th className="p-3 w-32">Subtotal</th>
                    <th className="p-3 w-12 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-850">
                  {cartItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <select
                          value={item.itemId}
                          onChange={(e) => handleSelectItem(idx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-emerald-500"
                        >
                          {sellableItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              [{inv.category}] {inv.name} — {formatRupiah(inv.sellPrice)} (Stok: {inv.stock} {inv.unit})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 font-semibold text-white">
                        {formatRupiah(item.unitPrice)}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleChangeQty(idx, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white font-bold"
                        />
                      </td>
                      <td className="p-3 font-bold text-emerald-400">
                        {formatRupiah(item.subtotal)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveCartRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-400 transition"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Mode & Complete Checkout */}
            <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold text-slate-300">Metode Bayar:</span>
                {(['Tunai', 'QRIS', 'Debit'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      paymentMethod === method
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Transaksi</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {formatRupiah(totalCartAmount)}
                  </span>
                </div>

                <button
                  id="btn-process-checkout"
                  onClick={handleProcessTransaction}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-950/40 flex items-center space-x-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Proses & Cetak Struk</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Transactions Log */}
        <div className="space-y-4">
          <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2 mb-3">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Riwayat Transaksi Terakhir</span>
            </h4>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {posSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1.5 hover:border-slate-700 transition cursor-pointer"
                  onClick={() => setRecentReceipt(sale)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-300">{sale.invoiceNo}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                      {sale.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>{sale.customerName}</span>
                    <span>{sale.time}</span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    {sale.items.map((it) => `${it.quantity}x ${it.itemName}`).join(', ')}
                  </div>

                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between font-bold">
                    <span className="text-slate-400 text-[10px]">Total:</span>
                    <span className="text-emerald-400 font-mono">{formatRupiah(sale.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* POS Receipt Modal (Struk Belanja Thermal Printer Preview) */}
      {recentReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl font-mono text-xs">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-black text-base text-slate-900 tracking-tight">
                KANTIN & TOKO HEVINDO
              </h3>
              <p className="text-[10px] text-slate-600">
                Arena Badminton Hall Hevindo Pekanbaru
              </p>
              <p className="text-[10px] text-slate-500">Telp: 0812-7654-3210</p>
            </div>

            <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold">{recentReceipt.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{recentReceipt.date} {recentReceipt.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{recentReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{recentReceipt.cashierName}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
              {recentReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="flex-1 pr-2">
                    <p className="font-bold">{item.itemName}</p>
                    <p className="text-slate-600 text-[10px]">
                      {item.quantity} x {formatRupiah(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-bold text-right">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-black text-sm">
                <span>TOTAL:</span>
                <span>{formatRupiah(recentReceipt.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Bayar ({recentReceipt.paymentMethod}):</span>
                <span>{formatRupiah(recentReceipt.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Kembalian:</span>
                <span>Rp 0</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              <p>Terima Kasih Atas Kunjungan Anda!</p>
              <p className="font-bold text-slate-700">Maju Terus Bulutangkis Indonesia 🏸</p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk Thermal</span>
              </button>
              <button
                onClick={() => setRecentReceipt(null)}
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
