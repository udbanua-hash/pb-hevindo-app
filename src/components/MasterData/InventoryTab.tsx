import React, { useState, useMemo } from 'react';
import { InventoryItem, InventoryCategory, UserRole } from '../../types';
import { matchesMultiFieldSearch, sortData, formatRupiah, exportToCSV } from '../../utils/helpers';
import {
  Search,
  Plus,
  ArrowUpDown,
  Download,
  Trash2,
  Edit2,
  AlertCircle,
  Package,
  ShoppingBag,
  Coffee,
  Store,
  Layers,
  CalendarCheck,
} from 'lucide-react';

interface InventoryTabProps {
  inventory: InventoryItem[];
  onAddInventory: (item: InventoryItem) => void;
  onUpdateInventory: (item: InventoryItem) => void;
  onDeleteInventory: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  currentRole: UserRole;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  inventory = [],
  onAddInventory,
  onUpdateInventory,
  onDeleteInventory,
  onBulkDelete,
  currentRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortKey, setSortKey] = useState<keyof InventoryItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const canEdit = currentRole === 'Admin' || currentRole === 'Operator' || currentRole === 'Kasir';

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    code: '',
    name: '',
    category: 'Kantin',
    buyPrice: 5000,
    sellPrice: 8000,
    stock: 50,
    unit: 'pcs',
    minStockAlert: 10,
  });

  const filtered = useMemo(() => {
    return (inventory || []).filter((item) => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      return matchesMultiFieldSearch(searchQuery, [
        item.code,
        item.name,
        item.category,
        item.unit,
        item.sellPrice,
      ]);
    });
  }, [inventory, filterCategory, searchQuery]);

  const sorted = useMemo(() => {
    return sortData(filtered, sortKey, sortDirection);
  }, [filtered, sortKey, sortDirection]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const handleSort = (key: keyof InventoryItem) => {
    if (sortKey === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((i) => i.id));
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((item) => item !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: `INV-${Date.now()}`,
      code: `BRG-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'Kantin',
      buyPrice: 5000,
      sellPrice: 8000,
      stock: 50,
      unit: 'pcs',
      minStockAlert: 10,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload: InventoryItem = {
      id: editingItem ? editingItem.id : formData.id || `INV-${Date.now()}`,
      code: formData.code || 'BRG-GEN',
      name: formData.name,
      category: formData.category as InventoryCategory,
      buyPrice: Number(formData.buyPrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      stock: Number(formData.stock) || 0,
      unit: formData.unit || 'pcs',
      minStockAlert: Number(formData.minStockAlert) || 5,
    };

    if (editingItem) onUpdateInventory(payload);
    else onAddInventory(payload);
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    exportToCSV(
      inventory.map((item) => ({
        'Kode': item.code,
        'Nama Barang / Layanan': item.name,
        'Kategori': item.category,
        'Harga Beli': item.buyPrice,
        'Harga Jual': item.sellPrice,
        'Stok': item.stock,
        'Satuan': item.unit,
        'Batas Minimum Stok': item.minStockAlert,
      })),
      'Master_Barang_HEVINDO'
    );
  };

  return (
    <div className="space-y-4">
      {/* Category Pills & Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['Kantin', 'Toko', 'Koperasi', 'Sewa Lapangan'] as InventoryCategory[]).map((cat) => {
          const count = inventory.filter((i) => i.category === cat).length;
          const lowStockCount = inventory.filter((i) => i.category === cat && i.stock <= i.minStockAlert && i.stock > 0).length;
          return (
            <button
              key={cat}
              onClick={() => {
                setFilterCategory(filterCategory === cat ? 'all' : cat);
                setCurrentPage(1);
              }}
              className={`p-3 rounded-xl border text-left transition ${
                filterCategory === cat
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                  : 'bg-slate-850 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  {cat === 'Kantin' && <Coffee className="w-3.5 h-3.5 text-amber-400" />}
                  {cat === 'Toko' && <Store className="w-3.5 h-3.5 text-blue-400" />}
                  {cat === 'Koperasi' && <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />}
                  {cat === 'Sewa Lapangan' && <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{cat}</span>
                </span>
                <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
              {lowStockCount > 0 && cat !== 'Sewa Lapangan' && (
                <div className="mt-1 text-[10px] text-amber-400 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{lowStockCount} item stok menipis</span>
                </div>
              )}
            </button>
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Live search barang (misal: yonex slop, pocari)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {selectedIds.length > 0 && canEdit && (
            <button
              onClick={() => {
                if (confirm(`Hapus ${selectedIds.length} item barang terpilih?`)) {
                  onBulkDelete(selectedIds);
                  setSelectedIds([]);
                }
              }}
              className="flex items-center space-x-1 px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedIds.length})</span>
            </button>
          )}

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
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Master Barang</span>
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
                {canEdit && (
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selectedIds.length === paginated.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 text-emerald-500"
                    />
                  </th>
                )}
                <th onClick={() => handleSort('code')} className="p-3 cursor-pointer hover:text-white">
                  <div className="flex items-center space-x-1">
                    <span>Kode</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('name')} className="p-3 cursor-pointer hover:text-white">
                  <div className="flex items-center space-x-1">
                    <span>Nama Barang / Paket</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('category')} className="p-3 cursor-pointer hover:text-white">
                  <div className="flex items-center space-x-1">
                    <span>Kategori</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('buyPrice')} className="p-3 cursor-pointer hover:text-white">
                  <div className="flex items-center space-x-1">
                    <span>Harga Modal</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('sellPrice')} className="p-3 cursor-pointer hover:text-white">
                  <div className="flex items-center space-x-1">
                    <span>Harga Jual / Tarif</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('stock')} className="p-3 cursor-pointer hover:text-white">
                  <div className="flex items-center space-x-1">
                    <span>Stok / Kapasitas</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada barang yang cocok.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const isLowStock = item.stock <= item.minStockAlert && item.category !== 'Sewa Lapangan';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        selectedIds.includes(item.id) ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {canEdit && (
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelectRow(item.id)}
                            className="rounded border-slate-700 text-emerald-500"
                          />
                        </td>
                      )}
                      <td className="p-3 font-mono font-medium text-slate-300">{item.code}</td>
                      <td className="p-3">
                        <span className="font-semibold text-white block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">Satuan: {item.unit}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            item.category === 'Kantin'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : item.category === 'Toko'
                              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                              : item.category === 'Koperasi'
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{item.buyPrice > 0 ? formatRupiah(item.buyPrice) : '-'}</td>
                      <td className="p-3 font-semibold text-emerald-400">{formatRupiah(item.sellPrice)}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-mono font-bold ${
                              isLowStock ? 'text-red-400' : 'text-slate-200'
                            }`}
                          >
                            {item.stock} {item.unit}
                          </span>
                          {isLowStock && (
                            <span className="bg-red-500/20 text-red-300 text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                              Stok Kritis
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {canEdit && (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400"
                              title="Edit Barang"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus item ${item.name}?`)) onDeleteInventory(item.id);
                              }}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Menampilkan {paginated.length} dari {filtered.length} item
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-slate-800 rounded disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-slate-800 rounded disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">
              {editingItem ? 'Edit Master Barang' : 'Tambah Master Barang Baru'}
            </h4>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Kode Barang</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Kantin">Kantin</option>
                    <option value="Toko">Toko</option>
                    <option value="Koperasi">Koperasi</option>
                    <option value="Sewa Lapangan">Sewa Lapangan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Nama Barang / Deskripsi *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Shuttlecock Yonex Aerosensa 50"
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Harga Beli / Modal (Rp)</label>
                  <input
                    type="number"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Harga Jual / Tarif (Rp)</label>
                  <input
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="botol, slop, jam..."
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Batas Alert Stok</label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
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
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
