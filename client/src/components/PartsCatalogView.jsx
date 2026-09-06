import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, Plus, AlertTriangle, CheckCircle, Search, 
  MapPin, DollarSign, PackageCheck, Layers, Filter 
} from 'lucide-react';

export const PartsCatalogView = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [parts, setParts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Add Part Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPart, setNewPart] = useState({
    part_number: '',
    name: '',
    description: '',
    category: 'Cutting Consumable',
    quantity_on_hand: 10,
    min_stock_level: 5,
    reorder_point: 8,
    unit_cost: 0,
    storage_bin: 'Bin A-01',
    preferred_vendor_id: '',
  });
  const [addError, setAddError] = useState('');

  const fetchParts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/parts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setParts(data.parts);
      }
    } catch (e) {
      console.error('Failed to load parts', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors);
      }
    } catch (e) {
      console.error('Failed to load vendors', e);
    }
  };

  useEffect(() => {
    fetchParts();
    fetchVendors();
  }, []);

  const handleCreatePart = async (e) => {
    e.preventDefault();
    setAddError('');
    try {
      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPart),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create part');

      setShowAddModal(false);
      setNewPart({
        part_number: '',
        name: '',
        description: '',
        category: 'Cutting Consumable',
        quantity_on_hand: 10,
        min_stock_level: 5,
        reorder_point: 8,
        unit_cost: 0,
        storage_bin: 'Bin A-01',
        preferred_vendor_id: '',
      });
      fetchParts();
    } catch (err) {
      setAddError(err.message);
    }
  };

  const categories = ['ALL', ...new Set(parts.map((p) => p.category))];

  const filteredParts = parts.filter((p) => {
    const matchesSearch =
      p.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.storage_bin && p.storage_bin.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wrench size={24} className="text-emerald-400" />
            {t('catalog.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t('catalog.subtitle')}
          </p>
        </div>

        {['admin', 'manager'].includes(user?.role) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md transition"
          >
            <Plus size={16} />
            {t('catalog.add_part_btn')}
          </button>
        )}
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search parts by number, description, or bin location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Parts Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">{t('common.loading')}</div>
      ) : filteredParts.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-sm">
          {t('catalog.no_parts')}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">{t('catalog.part_number')}</th>
                  <th className="px-4 py-3.5">{t('catalog.name')}</th>
                  <th className="px-4 py-3.5">{t('catalog.category')}</th>
                  <th className="px-4 py-3.5">{t('catalog.stock')}</th>
                  <th className="px-4 py-3.5">{t('catalog.bin')}</th>
                  <th className="px-4 py-3.5">{t('catalog.cost')}</th>
                  <th className="px-4 py-3.5">{t('catalog.vendor')}</th>
                  <th className="px-4 py-3.5 text-right">{t('catalog.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredParts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                      {p.part_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">{p.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 font-medium">
                      {p.category}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-sm font-bold text-slate-100">
                        {p.quantity_on_hand}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Min: {p.min_stock_level} • Reorder: {p.reorder_point}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        <MapPin size={11} className="text-slate-400" />
                        {p.storage_bin || 'Warehouse'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      ${Number(p.unit_cost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {p.preferred_vendor_name || 'Generic Supply'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 animate-pulse">
                          <AlertTriangle size={11} /> {t('catalog.low_stock_tag')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle size={11} /> {t('catalog.healthy_stock_tag')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Part Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-emerald-400" />
                {t('catalog.add_part_btn')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {addError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-300">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreatePart} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Part Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BY-SCRIBE-01"
                    value={newPart.part_number}
                    onChange={(e) => setNewPart({ ...newPart, part_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cutting, Pneumatic"
                    value={newPart.category}
                    onChange={(e) => setNewPart({ ...newPart, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Part Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diamond Scoring Wheel 135 deg"
                  value={newPart.name}
                  onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Quantity on Hand</label>
                  <input
                    type="number"
                    min="0"
                    value={newPart.quantity_on_hand}
                    onChange={(e) => setNewPart({ ...newPart, quantity_on_hand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Min Level</label>
                  <input
                    type="number"
                    min="0"
                    value={newPart.min_stock_level}
                    onChange={(e) => setNewPart({ ...newPart, min_stock_level: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Reorder Point</label>
                  <input
                    type="number"
                    min="0"
                    value={newPart.reorder_point}
                    onChange={(e) => setNewPart({ ...newPart, reorder_point: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="45.00"
                    value={newPart.unit_cost}
                    onChange={(e) => setNewPart({ ...newPart, unit_cost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Storage Bin</label>
                  <input
                    type="text"
                    placeholder="e.g. Bin B-04"
                    value={newPart.storage_bin}
                    onChange={(e) => setNewPart({ ...newPart, storage_bin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Preferred Vendor</label>
                <select
                  value={newPart.preferred_vendor_id}
                  onChange={(e) => setNewPart({ ...newPart, preferred_vendor_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="">-- None / Unknown --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium shadow"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
