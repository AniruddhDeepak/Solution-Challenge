import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Box, MapPin, Package, Tag, Activity } from 'lucide-react';

const LOCATIONS = ['Warehouse A', 'Warehouse B', 'Warehouse C', 'Warehouse D'];
const STATUSES = ['In Stock', 'In Transit', 'Low Stock'];
const PRODUCT_TYPES = ['Electronics', 'Raw Materials', 'Consumables', 'Hardware', 'Automotive', 'Other'];

export default function AddItemModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    location: 'Warehouse A',
    status: 'In Stock',
    count: '',
    type: 'Electronics',
    sales: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Item name is required';
    if (!form.count || isNaN(form.count) || Number(form.count) < 0)
      e.count = 'Enter a valid quantity';
    if (!form.sales || isNaN(form.sales) || Number(form.sales) < 0)
      e.sales = 'Enter valid monthly sales';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setSaving(true);
    try {
      await onAdd({ ...form, count: Number(form.count), sales: Number(form.sales) });
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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
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

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1 text-emerald-500" /> Warehouse Location
              </label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:outline-none text-sm font-medium bg-white transition-all"
              >
                {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>

            {/* Status & Quantity row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:outline-none text-sm font-medium bg-white transition-all"
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
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

            {/* Type & Sales row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:outline-none text-sm font-medium bg-white transition-all"
                >
                  {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
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
