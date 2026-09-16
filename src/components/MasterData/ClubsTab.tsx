import React, { useState, useMemo } from 'react';
import { Club, UserRole } from '../../types';
import { matchesMultiFieldSearch, sortData } from '../../utils/helpers';
import { Search, Plus, ArrowUpDown, Edit2, Trash2, Building2, Phone, Mail, MapPin, Users } from 'lucide-react';

interface ClubsTabProps {
  clubs: Club[];
  onAddClub: (club: Club) => void;
  onUpdateClub: (club: Club) => void;
  onDeleteClub: (id: string) => void;
  currentRole: UserRole;
}

export const ClubsTab: React.FC<ClubsTabProps> = ({
  clubs = [],
  onAddClub,
  onUpdateClub,
  onDeleteClub,
  currentRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof Club>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);

  const [formData, setFormData] = useState<Partial<Club>>({
    name: '',
    city: 'Pekanbaru',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    totalAthletes: 0,
  });

  const canEdit = currentRole === 'Admin' || currentRole === 'Operator';

  const filteredClubs = useMemo(() => {
    return (clubs || []).filter((c) =>
      matchesMultiFieldSearch(searchQuery, [c.id, c.name, c.city, c.address, c.contactPerson, c.phone, c.email])
    );
  }, [clubs, searchQuery]);

  const sortedClubs = useMemo(() => {
    return sortData(filteredClubs, sortKey, sortDirection);
  }, [filteredClubs, sortKey, sortDirection]);

  const handleSort = (key: keyof Club) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleOpenAdd = () => {
    setEditingClub(null);
    setFormData({
      id: `CLB-00${clubs.length + 1}`,
      name: '',
      city: 'Pekanbaru',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
      totalAthletes: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({ ...club });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload: Club = {
      id: editingClub ? editingClub.id : formData.id || `CLB-${Date.now()}`,
      name: formData.name,
      city: formData.city || 'Pekanbaru',
      address: formData.address || '',
      contactPerson: formData.contactPerson || '-',
      phone: formData.phone || '-',
      email: formData.email || '-',
      totalAthletes: Number(formData.totalAthletes) || 0,
    };

    if (editingClub) {
      onUpdateClub(payload);
    } else {
      onAddClub(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari klub (nama, kota, penanggung jawab, kontak)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {canEdit && (
          <button
            id="btn-add-club"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition whitespace-nowrap shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Klub Anggota</span>
          </button>
        )}
      </div>

      {/* Grid of Club Cards & Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedClubs.map((club) => {
          const isHome = club.name.toLowerCase().includes('hevindo');
          return (
            <div
              key={club.id}
              className={`p-5 rounded-xl border transition relative flex flex-col justify-between ${
                isHome
                  ? 'bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-850 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                      {club.id} • {club.city}
                    </span>
                    <h4 className="font-bold text-base text-white mt-0.5 flex items-center space-x-1.5">
                      <span>{club.name}</span>
                      {isHome && (
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Tuan Rumah
                        </span>
                      )}
                    </h4>
                  </div>
                  {canEdit && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(club)}
                        className="p-1 text-slate-400 hover:text-blue-400"
                        title="Edit Klub"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isHome && (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus klub ${club.name}?`)) onDeleteClub(club.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Hapus Klub"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{club.address || '-'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Penanggung Jawab: <strong className="text-white">{club.contactPerson}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{club.phone}</span>
                  </div>
                  {club.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{club.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Atlet Terdaftar:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                  {club.totalAthletes} Atlet
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Club */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm">
                {editingClub ? 'Edit Data Klub' : 'Tambah Klub Afiliasi / Peserta'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Klub *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: PB Jaya Raya"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Kota / Domisili</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Contoh: Pekanbaru / Jakarta"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alamat Lengkap GOR / Klub</label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat GOR latihan..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Penanggung Jawab / Pengurus</label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Nama PIC"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Total Atlet</label>
                  <input
                    type="number"
                    value={formData.totalAthletes || 0}
                    onChange={(e) => setFormData({ ...formData, totalAthletes: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="klub@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Klub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
