import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Box, MapPin, Package, Tag, Activity, Globe, Building2, Map, Plus, Layers } from 'lucide-react';

const DEFAULT_TYPES = ['Electronics', 'Raw Materials', 'Consumables', 'Hardware', 'Automotive', 'Other'];
const STATUSES = ['In Stock', 'In Transit', 'Low Stock'];

export default function AddItemModal({ onClose, onAdd, existingCategories = [], warehouses = [] }) {
  // Merge default types with any custom categories from existing inventory
  const allCategories = useMemo(() => {
    const merged = new Set([...DEFAULT_TYPES, ...existingCategories]);
    return [...merged];
  }, [existingCategories]);

  const [form, setForm] = useState({
    name: '',
    warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
    status: 'In Stock',
    count: '',
    type: allCategories[0] || 'Electronics',
    sales: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Item name is required';
    if (!form.warehouseId && warehouses.length > 0) e.warehouseId = 'Please select a warehouse';
    else if (warehouses.length === 0) e.warehouseId = 'Please add a warehouse first from the Network tab';
    if (!form.count || isNaN(form.count) || Number(form.count) < 0)
      e.count = 'Enter a valid quantity';
    if (!form.sales || isNaN(form.sales) || Number(form.sales) < 0)
      e.sales = 'Enter valid monthly sales';
    if (showNewCategory && !newCategoryName.trim())
      e.newCategory = 'Enter a category name';
    return e;
  };

  const handleTypeChange = (value) => {
    if (value === '__new__') {
      setShowNewCategory(true);
      setForm({ ...form, type: '' });
    } else {
      setShowNewCategory(false);
      setNewCategoryName('');
      setForm({ ...form, type: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setSaving(true);
    try {
      // Get warehouse details
      const selectedWh = warehouses.find(w => w.id === form.warehouseId);
      const location = selectedWh ? `${selectedWh.name} (${selectedWh.city || selectedWh.region})` : 'Unknown Warehouse';

      // Determine final type
      const finalType = showNewCategory ? newCategoryName.trim() : form.type;

      await onAdd({
        name: form.name,
        location,
        status: form.status,
        count: Number(form.count),
        type: finalType,
        sales: Number(form.sales),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mr-3">
                <Box className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Register New Item</h2>
                <p className="text-sm text-gray-500 font-medium">Add to Firestore inventory</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                <Tag className="w-4 h-4 inline mr-1 text-emerald-500" /> Item Name
              </label>
              <input
                type="text"
                placeholder="e.g. Solar Panels (Pallet)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-400'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs font-semibold mt-1">{errors.name}</p>}
            </div>

            {/* Warehouse Location */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1 text-emerald-500" /> Storage Warehouse *
              </label>
              {warehouses.length === 0 ? (
                <div className="text-sm font-semibold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                  <Map className="w-4 h-4 inline mr-1" /> No warehouses available. Please add a warehouse first.
                </div>
              ) : (
                <select
                  value={form.warehouseId}
                  onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:outline-none text-sm font-medium bg-white transition-all"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} — {wh.city || wh.region}
                    </option>
                  ))}
                </select>
              )}
              {errors.warehouseId && <p className="text-red-500 text-xs font-semibold mt-1.5">{errors.warehouseId}</p>}
            </div>

            {/* Status & Quantity row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:outline-none text-sm font-medium bg-white transition-all"
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  <Package className="w-4 h-4 inline mr-1 text-emerald-500" /> Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={form.count}
                  onChange={(e) => setForm({ ...form, count: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                    errors.count ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-400'
                  }`}
                />
                {errors.count && <p className="text-red-500 text-xs font-semibold mt-1">{errors.count}</p>}
              </div>
            </div>

            {/* Product Type with Create New option */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                <Layers className="w-4 h-4 inline mr-1 text-emerald-500" /> Product Category
              </label>
              {!showNewCategory ? (
                <div className="flex gap-2">
                  <select
                    value={form.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:outline-none text-sm font-medium bg-white transition-all"
                  >
                    {allCategories.map((t) => <option key={t} value={t}>{t}</option>)}
                    <option value="__new__">+ Create New Category</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                      errors.newCategory ? 'border-red-300 bg-red-50' : 'border-emerald-300 focus:border-emerald-400 bg-emerald-50/30'
                    }`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(''); setForm({ ...form, type: allCategories[0] }); }}
                    className="px-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {errors.newCategory && <p className="text-red-500 text-xs font-semibold mt-1">{errors.newCategory}</p>}
              {showNewCategory && (
                <p className="text-xs text-emerald-600 font-medium mt-1.5">
                  <Plus className="w-3 h-3 inline mr-0.5" /> This will create a new product category
                </p>
              )}
            </div>

            {/* Monthly Sales */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                <Activity className="w-4 h-4 inline mr-1 text-emerald-500" /> Monthly Sales
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 150"
                value={form.sales}
                onChange={(e) => setForm({ ...form, sales: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                  errors.sales ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-400'
                }`}
              />
              {errors.sales && <p className="text-red-500 text-xs font-semibold mt-1">{errors.sales}</p>}
            </div>

            {/* Submit */}
            <div className="flex space-x-3 pt-2">
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all"
              >
                {saving ? 'Saving...' : 'Add to Inventory'}
              </motion.button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
