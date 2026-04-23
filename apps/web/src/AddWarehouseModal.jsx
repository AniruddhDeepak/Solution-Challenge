import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, Globe, ShieldCheck } from 'lucide-react';

export default function AddWarehouseModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    region: 'North America',
    capacity: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const REGIONS = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central District', 'Industrial Park A', 'Industrial Park B'];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Warehouse name is required';
    if (!form.capacity || isNaN(form.capacity) || Number(form.capacity) <= 0)
      e.capacity = 'Enter a valid capacity';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setSaving(true);
    try {
      await onAdd({ ...form, capacity: Number(form.capacity) });
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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-3">
                <Map className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Add Regional Warehouse</h2>
                <p className="text-sm text-gray-500 font-medium">Expand local supply network</p>
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
            {/* Warehouse Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <ShieldCheck className="w-4 h-4 inline mr-1 text-blue-500" /> Facility Name
              </label>
              <input
                type="text"
                placeholder="e.g. Frankfurt Distribution Center"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs font-semibold mt-1">{errors.name}</p>}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1 text-blue-500" /> Operating Zone
              </label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm font-medium bg-white transition-all"
              >
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                 Max Storage Capacity (Units)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 50000"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400'
                }`}
              />
              {errors.capacity && <p className="text-red-500 text-xs font-semibold mt-1">{errors.capacity}</p>}
            </div>

            {/* Submit */}
            <div className="flex space-x-3 pt-2">
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-all"
              >
                {saving ? 'Registering Node...' : 'Add Warehouse'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
