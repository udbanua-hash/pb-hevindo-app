import React, { useState, useMemo } from 'react';
import { Athlete, InventoryItem, POSSale, POSSaleItem, UserRole } from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  matchesMultiFieldSearch,
  sortData,
  exportToCSV,
} from '../../utils/helpers';
import {
  Coffee,
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  FileText,
  DollarSign,
  AlertTriangle,
  User,
  CheckCircle,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShoppingBag as StoreIcon,
  Tag,
  Receipt,
  Package,
} from 'lucide-react';

interface KantinPortalProps {
  inventory: InventoryItem[];
  posSales: POSSale[];
  athletes: Athlete[];
  onCompleteSale?: (sale: POSSale) => void;
  onAddSale?: (sale: POSSale) => void;
  onUpdateInventory?: (itemOrItems: any) => void;
  onAddInventory?: (item: InventoryItem) => void;
  onDeleteInventory?: (id: string) => void;
  currentRole: UserRole;
}

export const KantinPortal: React.FC<KantinPortalProps> = ({
  inventory = [],
  posSales = [],
  athletes = [],
  onCompleteSale,
  onAddSale,
  onUpdateInventory,
  currentRole,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'inventory' | 'history'>('pos');

  // POS State
  const [customerType, setCustomerType] = useState<'Atlet' | 'Wali Atlet' | 'Pengunjung Umum' | 'Member'>('Atlet');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Debit'>('Tunai');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [searchCatalog, setSearchCatalog] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Inventory Table states
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('Semua');
  const [inventorySortKey, setInventorySortKey] = useState<keyof InventoryItem>('name');
  const [inventorySortDir, setInventorySortDir] = useState<'asc' | 'desc'>('asc');

  // History Table states
  const [historySearch, setHistorySearch] = useState('');
  const [historySortKey, setHistorySortKey] = useState<keyof POSSale>('date');
  const [historySortDir, setHistorySortDir] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<POSSale | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<{
    name: string;
    category: 'Kantin' | 'Toko' | 'Koperasi' | 'Sewa Lapangan';
    stock: number;
    unit: string;
    price: number;
    minStockAlert: number;
  }>({
    name: '',
    category: 'Kantin',
    stock: 20,
    unit: 'Pcs',
    price: 10000,
    minStockAlert: 5,
  });

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((acc, c) => acc + c.item.price * c.quantity, 0);
  }, [cart]);

  const cashChange = useMemo(() => {
    if (paymentMethod !== 'Tunai') return 0;
    return Math.max(0, cashTendered - cartTotal);
  }, [cashTendered, cartTotal, paymentMethod]);

  // Selected customer name
  const effectiveCustomerName = useMemo(() => {
    if (customerType === 'Atlet') {
      const atl = athletes.find((a) => a.id === selectedAthleteId);
      return atl ? `${atl.name} (Atlet - ${atl.category})` : 'Atlet Hevindo';
    }
    return customCustomerName.trim() || 'Pengunjung Umum';
  }, [customerType, selectedAthleteId, customCustomerName, athletes]);

  // Catalog filtered
  const filteredCatalog = useMemo(() => {
    return inventory.filter((item) => {
      if (selectedCategory !== 'Semua' && item.category !== selectedCategory) return false;
      return matchesMultiFieldSearch(searchCatalog, [item.name, item.category, item.unit]);
    });
  }, [inventory, selectedCategory, searchCatalog]);

  // Cart operations
  const handleAddToCart = (item: InventoryItem) => {
    if (item.stock <= 0) {
      alert(`Stok ${item.name} telah habis!`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          alert(`Jumlah di keranjang melebihi stok yang ada (${item.stock}).`);
          return prev;
        }
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: Math.min(nextQty, c.item.stock) } : null;
          }
          return c;
        })
        .filter(Boolean) as { item: InventoryItem; quantity: number }[]
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }
    if (customerType === 'Atlet' && !selectedAthleteId) {
      alert('Silakan pilih nama atlet PB Hevindo yang berbelanja.');
      return;
    }
    if (paymentMethod === 'Tunai' && cashTendered < cartTotal) {
      alert(`Uang tunai yang diterima (${formatRupiah(cashTendered)}) kurang dari total belanja (${formatRupiah(cartTotal)}).`);
      return;
    }

    const now = new Date();
    const saleItems: POSSaleItem[] = cart.map((c) => ({
      itemId: c.item.id,
      itemName: c.item.name,
      price: c.item.price,
      quantity: c.quantity,
      subtotal: c.item.price * c.quantity,
    }));

    const newSale: POSSale = {
      id: `POS-${now.getTime().toString().slice(-6)}`,
      receiptNumber: `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5) + ' WIB',
      customerName: effectiveCustomerName,
      customerType: customerType,
      items: saleItems,
      totalAmount: cartTotal,
      cashierName: currentRole === 'Bagian Kasir' ? 'Dewi Lestari (Kasir)' : 'Petugas Kasir',
      paymentMethod: paymentMethod,
    };

    // Trigger sale completion and stock deduction
    if (onCompleteSale) {
      onCompleteSale(newSale);
    } else if (onAddSale) {
      onAddSale(newSale);
      if (onUpdateInventory) {
        const updatedInventory = inventory.map((inv) => {
          const cartMatch = cart.find((c) => c.item.id === inv.id);
          if (cartMatch) {
            return { ...inv, stock: Math.max(0, inv.stock - cartMatch.quantity) };
          }
          return inv;
        });
        onUpdateInventory(updatedInventory);
      }
    }

    setSelectedSaleForReceipt(newSale);

    // Reset cart
    setCart([]);
    setCashTendered(0);
    setCustomCustomerName('');
  };

  const handlePrintReceipt = (sale: POSSale) => {
    try {
      const printWindow = window.open('', '_blank', 'width=380,height=600');
      if (printWindow) {
        const itemsHtml = sale.items
          .map(
            (it) => `
          <tr style="border-bottom: 1px dashed #ddd;">
            <td style="padding: 4px 0;">${it.itemName}<br><small style="color: #666;">${it.quantity} x Rp ${it.price.toLocaleString('id-ID')}</small></td>
            <td style="text-align: right; padding: 4px 0; vertical-align: bottom;">Rp ${it.subtotal.toLocaleString('id-ID')}</td>
          </tr>`
          )
          .join('');

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Struk_${sale.receiptNumber || sale.id}</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 15px; color: #000; background: #fff; }
              .center { text-align: center; }
              .divider { border-top: 1px dashed #444; margin: 8px 0; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              .total { font-weight: bold; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="center">
              <h3 style="margin: 0; font-size: 14px;">KANTIN & TOKO PB HEVINDO</h3>
              <p style="margin: 2px 0; font-size: 10px;">Jl. Riau No. 88, Pekanbaru</p>
              <p style="margin: 2px 0; font-weight: bold; font-size: 11px;">${sale.receiptNumber || sale.id}</p>
            </div>
            <div class="divider"></div>
            <div>
              <div>Tanggal: ${sale.date} ${sale.time}</div>
              <div>Pembeli: <strong>${sale.customerName}</strong> (${sale.customerType})</div>
              <div>Kasir  : ${sale.cashierName}</div>
            </div>
            <div class="divider"></div>
            <table>
              <thead>
                <tr style="border-bottom: 1px dashed #000; text-align: left;">
                  <th>Item</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="divider"></div>
            <table>
              <tr class="total">
                <td>TOTAL:</td>
                <td style="text-align: right;">Rp ${sale.totalAmount.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td>Metode:</td>
                <td style="text-align: right;">${sale.paymentMethod}</td>
              </tr>
            </table>
            <div class="divider"></div>
            <div class="center" style="font-size: 10px; margin-top: 10px;">
              Terima Kasih Atas Kunjungan Anda!<br>
              Salam Olahraga Badminton PB Hevindo
            </div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch (e) {
      window.print();
    }
  };

  // Inventory Table filtering & sorting
  const safeInventory = inventory || [];
  const filteredInventory = useMemo(() => {
    return safeInventory.filter((item) => {
      if (inventoryCategoryFilter !== 'Semua' && item.category !== inventoryCategoryFilter) return false;
      return matchesMultiFieldSearch(inventorySearch, [item.name, item.category, item.unit, item.price, item.stock]);
    });
  }, [safeInventory, inventoryCategoryFilter, inventorySearch]);

  const sortedInventory = useMemo(() => {
    return sortData(filteredInventory, inventorySortKey, inventorySortDir);
  }, [filteredInventory, inventorySortKey, inventorySortDir]);

  // History Table filtering & sorting
  const safeSales = posSales || [];
  const filteredSales = useMemo(() => {
    return safeSales.filter((sale) => {
      return matchesMultiFieldSearch(historySearch, [
        sale.receiptNumber,
        sale.customerName,
        sale.customerType,
        sale.paymentMethod,
        sale.cashierName,
        sale.date,
        sale.totalAmount,
      ]);
    });
  }, [safeSales, historySearch]);

  const sortedSales = useMemo(() => {
    return sortData(filteredSales, historySortKey, historySortDir);
  }, [filteredSales, historySortKey, historySortDir]);

  // Summary Metrics
  const totalSalesRevenue = useMemo(() => {
    return safeSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [safeSales]);

  const lowStockCount = useMemo(() => {
    return safeInventory.filter((i) => i.stock <= i.minStockAlert).length;
  }, [safeInventory]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-900 border border-cyan-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400">
              <Coffee className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Kantin & Toko Perlengkapan PB HEVINDO
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Menu Terpisah
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Point of Sale terintegrasi: Makanan, minuman bernutrisi, shuttlecock & alat raket dengan pencatatan nama atlet.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-950/50 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Master Barang</span>
            </button>
            <button
              onClick={() =>
                exportToCSV(safeSales, 'Penjualan_Kantin_Hevindo', {
                  receiptNumber: 'Nomor Struk',
                  date: 'Tanggal',
                  time: 'Waktu',
                  customerName: 'Nama Pembeli',
                  customerType: 'Tipe Pelanggan',
                  totalAmount: 'Total Belanja',
                  paymentMethod: 'Metode Pembayaran',
                  cashierName: 'Kasir',
                })
              }
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center space-x-1"
              title="Ekspor CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Ekspor Riwayat</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSubTab('pos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'pos'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Kasir / POS ({cart.length > 0 ? `${cart.length} Item di Keranjang` : 'Siap'})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'inventory'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Master Barang & Stok ({safeInventory.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'history'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Riwayat Penjualan Kasir ({safeSales.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: KASIR / POS */}
      {activeSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Product Catalog */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Category Pills */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari barang kantin, minuman, shuttlecock, grip, senar (pisahkan spasi)..."
                  value={searchCatalog}
                  onChange={(e) => setSearchCatalog(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                {['Semua', 'Kantin', 'Toko', 'Koperasi', 'Sewa Lapangan'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredCatalog.map((item) => {
                const inCart = cart.find((c) => c.item.id === item.id);
                const isOutOfStock = item.stock <= 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isOutOfStock && handleAddToCart(item)}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between cursor-pointer ${
                      isOutOfStock
                        ? 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                        : inCart
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400">
                          {item.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            item.stock <= item.minStockAlert ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          Sisa: {item.stock}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-2 line-clamp-2">{item.name}</h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-xs font-black text-cyan-400 font-mono">
                        {formatRupiah(item.price)}
                      </span>
                      {inCart && (
                        <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Checkout & Athlete Selection */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl h-fit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Keranjang & Pembeli</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[10px] text-slate-500 hover:text-rose-400 transition"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Identitas Pembeli (Atlet / Wali / Umum) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">Tipe Pembeli:</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(['Atlet', 'Wali Atlet', 'Pengunjung Umum', 'Member'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCustomerType(t)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition text-center ${
                      customerType === t
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* If Atlet, choose from Hevindo athletes list */}
              {customerType === 'Atlet' ? (
                <div className="mt-2 space-y-1">
                  <label className="text-[10px] text-cyan-400 font-semibold block">
                    Pilih Atlet PB Hevindo (Tercatat di Sistem):
                  </label>
                  <select
                    value={selectedAthleteId}
                    onChange={(e) => setSelectedAthleteId(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500"
                  >
                    <option value="">-- Pilih Atlet --</option>
                    {athletes
                      .filter((a) => a.currentClub === 'PB Hevindo' || !a.currentClub)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.category} • {a.status})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold block">Nama Pembeli:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ibu Rina (Wali Rian) / Pengunjung"
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 border-t border-slate-800 pt-3 max-h-56 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Keranjang masih kosong. Klik barang di katalog untuk menambahkan.
                </div>
              ) : (
                cart.map((c) => (
                  <div
                    key={c.item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-bold text-white block truncate">{c.item.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatRupiah(c.item.price)} × {c.quantity}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleUpdateCartQty(c.item.id, -1)}
                        className="p-1 bg-slate-800 text-slate-300 hover:text-white rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-white w-5 text-center text-xs">{c.quantity}</span>
                      <button
                        onClick={() => handleUpdateCartQty(c.item.id, 1)}
                        className="p-1 bg-slate-800 text-slate-300 hover:text-white rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromCart(c.item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Calculation */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Belanja:</span>
                <span className="text-base font-black text-cyan-400 font-mono">
                  {formatRupiah(cartTotal)}
                </span>
              </div>

              {/* Payment Method */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-400 block">Metode Pembayaran:</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Tunai', 'QRIS', 'Debit'] as const).map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-1 rounded text-xs font-semibold ${
                        paymentMethod === pm
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash payment quick change */}
              {paymentMethod === 'Tunai' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Uang Diterima:</span>
                    <input
                      type="number"
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      placeholder={cartTotal.toString()}
                      className="w-28 p-1 text-right bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                    />
                  </div>
                  {/* Quick cash pills */}
                  <div className="flex items-center justify-end space-x-1 text-[10px]">
                    {[cartTotal, 20000, 50000, 100000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashTendered(val)}
                        className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-white"
                      >
                        {formatRupiah(val)}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Kembalian:</span>
                    <span className="font-bold font-mono text-emerald-400">
                      {formatRupiah(cashChange)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Selesaikan & Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MASTER BARANG & STOK */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">Total Item Master</span>
              <span className="text-xl font-black text-white mt-1 block">{safeInventory.length} SKU</span>
              <span className="text-[10px] text-slate-500 block">Makanan, Minuman, Raket & Senar</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-amber-400 font-semibold block">Stok Menipis</span>
              <span className="text-xl font-black text-amber-400 mt-1 block">{lowStockCount} Item</span>
              <span className="text-[10px] text-slate-500 block">Di bawah batas minimum</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-emerald-400 font-semibold block">Total Omzet Kasir</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">{formatRupiah(totalSalesRevenue)}</span>
              <span className="text-[10px] text-slate-500 block">Dari seluruh riwayat POS</span>
            </div>
          </div>

          {/* Table Controls */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama barang, kategori, satuan (pisahkan spasi)..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500"
              />
            </div>

            <select
              value={inventoryCategoryFilter}
              onChange={(e) => setInventoryCategoryFilter(e.target.value)}
              className="w-full md:w-48 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Kantin">Kantin</option>
              <option value="Toko">Toko</option>
              <option value="Koperasi">Koperasi</option>
              <option value="Sewa Lapangan">Sewa Lapangan</option>
            </select>
          </div>

          {/* Inventory Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 select-none">
                  <tr>
                    <th
                      onClick={() => {
                        if (inventorySortKey === 'id') setInventorySortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                        else {
                          setInventorySortKey('id');
                          setInventorySortDir('asc');
                        }
                      }}
                      className="p-3.5 font-bold cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Kode</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (inventorySortKey === 'name') setInventorySortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                        else {
                          setInventorySortKey('name');
                          setInventorySortDir('asc');
                        }
                      }}
                      className="p-3.5 font-bold cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Nama Barang</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th className="p-3.5 font-bold">Kategori</th>
                    <th
                      onClick={() => {
                        if (inventorySortKey === 'stock') setInventorySortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                        else {
                          setInventorySortKey('stock');
                          setInventorySortDir('desc');
                        }
                      }}
                      className="p-3.5 font-bold cursor-pointer hover:text-white text-center"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Stok Tersedia</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (inventorySortKey === 'price') setInventorySortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
                        else {
                          setInventorySortKey('price');
                          setInventorySortDir('asc');
                        }
                      }}
                      className="p-3.5 font-bold cursor-pointer hover:text-white text-right"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Harga Satuan</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th className="p-3.5 font-bold text-center">Status Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {sortedInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-850/60 transition">
                      <td className="p-3.5 font-mono text-[11px] text-cyan-400 font-bold">{item.id}</td>
                      <td className="p-3.5 font-semibold text-white">{item.name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold font-mono">
                        {item.stock} {item.unit}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        {formatRupiah(item.price)}
                      </td>
                      <td className="p-3.5 text-center">
                        {item.stock <= 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Habis
                          </span>
                        ) : item.stock <= item.minStockAlert ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Menipis ({item.stock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RIWAYAT PENJUALAN KASIR */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nomor struk, nama pembeli, kasir, metode bayar (spasi)..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 select-none">
                  <tr>
                    <th className="p-3.5 font-bold">No. Faktur / Struk</th>
                    <th className="p-3.5 font-bold">Tanggal & Waktu</th>
                    <th className="p-3.5 font-bold">Nama Pembeli</th>
                    <th className="p-3.5 font-bold">Rincian Item</th>
                    <th className="p-3.5 font-bold text-right">Total Transaksi</th>
                    <th className="p-3.5 font-bold text-center">Metode</th>
                    <th className="p-3.5 font-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {sortedSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Belum ada riwayat transaksi kasir.
                      </td>
                    </tr>
                  ) : (
                    sortedSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-850/60 transition">
                        <td className="p-3.5 font-mono text-[11px] text-cyan-400 font-bold">
                          {sale.receiptNumber}
                        </td>
                        <td className="p-3.5">
                          <span className="text-white block">{formatIndonesianDate(sale.date)}</span>
                          <span className="text-[10px] text-slate-500">{sale.time}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{sale.customerName}</span>
                          <span className="text-[10px] text-cyan-300">Tipe: {sale.customerType}</span>
                        </td>
                        <td className="p-3.5">
                          <div className="text-[11px] text-slate-300 line-clamp-2">
                            {sale.items.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatRupiah(sale.totalAmount)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setSelectedSaleForReceipt(sale)}
                            className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                            title="Cetak Struk Transaksi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MASTER BARANG */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Tambah Master Barang Kantin / Toko</h3>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newItem.name.trim()) return;

                const itemObj: InventoryItem = {
                  id: `INV-${Date.now().toString().slice(-4)}`,
                  name: newItem.name,
                  category: newItem.category,
                  stock: newItem.stock,
                  unit: newItem.unit,
                  price: newItem.price,
                  minStockAlert: newItem.minStockAlert,
                  status: 'Tersedia',
                };
                onUpdateInventory([...inventory, itemObj]);
                setIsAddItemModalOpen(false);
                setNewItem({
                  name: '',
                  category: 'Kantin',
                  stock: 20,
                  unit: 'Pcs',
                  price: 10000,
                  minStockAlert: 5,
                });
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Nama Barang</label>
                <input
                  type="text"
                  placeholder="Contoh: Pocari Sweat 500ml / Yonex AC102EX"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Kategori</label>
                  <select
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        category: e.target.value as 'Kantin' | 'Toko' | 'Koperasi' | 'Sewa Lapangan',
                      })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Kantin">Kantin</option>
                    <option value="Toko">Toko</option>
                    <option value="Koperasi">Koperasi</option>
                    <option value="Sewa Lapangan">Sewa Lapangan</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="Pcs / Botol / Slop"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STRUK / RECEIPT POS */}
      {selectedSaleForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Struk Transaksi Kasir</h3>
              </div>
              <button
                onClick={() => setSelectedSaleForReceipt(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="text-center pb-3 border-b border-dashed border-slate-800">
                <h4 className="font-black text-white text-sm">KANTIN & TOKO PB HEVINDO</h4>
                <p className="text-[10px] text-slate-400">Jl. Riau No. 88, Pekanbaru</p>
                <p className="text-[10px] text-cyan-400 font-mono mt-1">{selectedSaleForReceipt.receiptNumber}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span className="text-slate-300">
                    {formatIndonesianDate(selectedSaleForReceipt.date)} {selectedSaleForReceipt.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pembeli:</span>
                  <span className="font-bold text-white">{selectedSaleForReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kasir:</span>
                  <span className="text-slate-300">{selectedSaleForReceipt.cashierName}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-800 py-2 space-y-1.5">
                {selectedSaleForReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-semibold text-white block">{it.itemName}</span>
                      <span className="text-[9px] text-slate-500">
                        {it.quantity} x {formatRupiah(it.price)}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between font-bold text-white text-sm">
                  <span>Total:</span>
                  <span className="text-cyan-400 font-mono">
                    {formatRupiah(selectedSaleForReceipt.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Metode:</span>
                  <span>{selectedSaleForReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-500 italic">
                Terima kasih atas kunjungan Anda di PB HEVINDO!
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedSaleForReceipt(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Tutup
              </button>
              <button
                onClick={() => handlePrintReceipt(selectedSaleForReceipt)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk (POS)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
