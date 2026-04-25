import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useInventory } from './hooks/useInventory';
import { useWarehouses } from './hooks/useWarehouses';
import { useShipments } from './hooks/useShipments';
import AddItemModal from './AddItemModal';
import AddWarehouseModal from './AddWarehouseModal';
import DataAnalyzer from './DataAnalyzer';
import { 
  BarChart3, Box, Activity, Map, Globe, Truck, CheckCircle2, 
  Settings, LogOut, Search, Bell, AlertTriangle, FileText,
  ChevronRight, ArrowUpRight, TrendingUp, Database, Terminal, Trash2, Loader2,
  Download, X, ClipboardList, Layers, ChevronDown, Cpu, Flame, Wrench, Car, HelpCircle, Package, Filter,
  Target, MessageCircle, Send, Bot, Clock, PackageCheck, Leaf, Wind, Zap, CalendarClock, TriangleAlert, Plus
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

// Simple Counter component for cool dashboard effect
const Counter = ({ value, suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const target = parseInt(value.toString().replace(/,/g, ""));
  
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [target]);

  return <>{displayValue.toLocaleString()}{suffix}</>;
};

export default function App({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('All');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Hi! I am your ChainHandler AI assistant. How can I help you optimize your supply chain today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  const { items: inventoryItems, loading: inventoryLoading, addItem, deployItem, deleteItem } = useInventory();
  const { warehouses, loading: whLoading, addWarehouse, deleteWarehouse } = useWarehouses();
  const { shipments, loading: shipLoading, addShipment, updateShipmentStatus, deleteShipment } = useShipments();

  // Close notifications and search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = useMemo(() => {
    const alerts = [];
    
    // Out of stock items
    const outOfStockItems = inventoryItems.filter(item => Number(item.count) === 0);
    if (outOfStockItems.length > 0) {
      alerts.push({
        id: 'out-of-stock',
        title: 'Critical: Out of Stock',
        message: `${outOfStockItems.map(i => i.name).join(', ')} are completely out of stock!`,
        icon: AlertTriangle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        time: 'Just now'
      });
    }

    // Low stock items
    const lowStockItems = inventoryItems.filter(item => Number(item.count) > 0 && Number(item.count) <= 10);
    if (lowStockItems.length > 0) {
      alerts.push({
        id: 'low-stock',
        title: 'Low Inventory Alert',
        message: `${lowStockItems.length} items (${lowStockItems.map(i => i.name).join(', ')}) are running low on stock.`,
        icon: Box,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        time: 'Recently'
      });
    }

    // Data analysis: sales outpacing inventory
    const restockItems = inventoryItems.filter(item => {
      const sales = item.sales ? Number(item.sales) : 0;
      return sales > 0 && sales >= Number(item.count);
    });

    if (restockItems.length > 0) {
      alerts.push({
        id: 'restock-analysis',
        title: 'Restock Recommendation',
        message: `Based on sales velocity, ${restockItems.map(i => i.name).join(', ')} require restocking to prevent shortages.`,
        icon: TrendingUp,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        time: 'System Analysis'
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'all-clear',
        title: 'All Systems Normal',
        message: 'No critical alerts or warnings at this time.',
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        time: 'Updated just now'
      });
    }

    return alerts;
  }, [inventoryItems]);

  const networkTraffic = Array.from({ length: 20 }, (_, i) => ({ 
    time: `${i}:00`, 
    volume: Math.floor(Math.random() * 500) + 1200 
  }));

  const emissionsData = [
    { month: 'Jan', emissions: 420 },
    { month: 'Feb', emissions: 380 },
    { month: 'Mar', emissions: 450 },
    { month: 'Apr', emissions: 390 },
    { month: 'May', emissions: 320 },
    { month: 'Jun', emissions: 280 }
  ];

  useEffect(() => {
    setHealthStatus('healthy');
  }, []);

  // Client-side smart chat fallback — mirrors the Python backend logic
  const computeChatFallback = (message, items) => {
    const msg = message.toLowerCase().trim();
    if (!items || items.length === 0)
      return "No inventory data found. Please register some items first.";

    const totalItems = items.length;
    const totalStock = items.reduce((s, i) => s + (Number(i.count) || 0), 0);
    const totalSales = items.reduce((s, i) => s + (Number(i.sales) || 0), 0);
    const outOfStock = items.filter(i => Number(i.count) === 0);
    const lowStock = items.filter(i => Number(i.count) > 0 && Number(i.count) <= 10);
    const topSeller = items.reduce((best, i) => (Number(i.sales) > Number(best?.sales || 0) ? i : best), null);
    const mostStock = items.reduce((best, i) => (Number(i.count) > Number(best?.count || 0) ? i : best), null);

    // Count warehouses query
    if (/how many warehouse|number of warehouse|warehouse count/i.test(msg)) {
      const warehouseSet = new Set(items.map(i => i.location).filter(Boolean));
      return `📦 Based on your inventory, items are distributed across ${warehouseSet.size} unique warehouse location(s): ${[...warehouseSet].join(', ')}.`;
    }

    if (/hello|hi\b|hey|help/i.test(msg))
      return `Hello! I'm ChainHandler AI. You have ${totalItems} items with ${totalStock.toLocaleString()} total units in stock. Ask me about low stock, top sellers, or inventory health!`;

    if (/low stock|running low|restock|replenish|shortage/i.test(msg)) {
      if (lowStock.length > 0) {
        const names = lowStock.slice(0, 5).map(i => i.name).join(', ');
        return `⚠️ ${lowStock.length} item(s) are low on stock: ${names}. Recommend placing restock orders immediately.`;
      }
      return "✅ All items are above the low-stock threshold (>10 units). Inventory looks healthy!";
    }

    if (/out of stock|zero|empty|critical/i.test(msg)) {
      if (outOfStock.length > 0) {
        const names = outOfStock.slice(0, 5).map(i => i.name).join(', ');
        return `🚨 Critical: ${outOfStock.length} item(s) are completely out of stock: ${names}. Urgent restocking required!`;
      }
      return "✅ No items are out of stock. All SKUs have inventory available.";
    }

    if (/top seller|best seller|most sold|highest sales/i.test(msg)) {
      if (topSeller && Number(topSeller.sales) > 0)
        return `📈 Top seller is '${topSeller.name}' with ${Number(topSeller.sales).toLocaleString()} units sold. Ensure sufficient stock levels to meet demand.`;
      return "No sales data recorded yet. Add sales figures to your inventory items for insights.";
    }

    if (/summary|overview|status|health|report/i.test(msg)) {
      const healthLabel = !outOfStock.length && lowStock.length <= 2 ? "🟢 Healthy" : !outOfStock.length ? "🟡 Needs Attention" : "🔴 Critical";
      return `📊 Inventory Summary — ${healthLabel}\n• ${totalItems} SKUs | ${totalStock.toLocaleString()} units | ${totalSales.toLocaleString()} sales\n• ${outOfStock.length} out of stock | ${lowStock.length} low stock\n• Top seller: ${topSeller?.name || 'N/A'}`;
    }

    if (/how many|count|total|quantity|units/i.test(msg))
      return `You have ${totalItems} registered items with ${totalStock.toLocaleString()} total units across all locations. Total recorded sales: ${totalSales.toLocaleString()} units.`;

    if (/most stock|highest stock|largest/i.test(msg) && mostStock)
      return `'${mostStock.name}' has the highest stock with ${Number(mostStock.count).toLocaleString()} units at ${mostStock.location || 'N/A'}.`;

    return `Based on your current inventory of ${totalItems} items with ${totalStock.toLocaleString()} total units and ${totalSales.toLocaleString()} recorded sales, everything is being tracked. Ask me about low stock, top sellers, warehouse count, or inventory health!`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Try the FastAPI backend first (AI-powered when running)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMsg,
          inventory_data: inventoryItems.map(i => ({
            id: i.id || '',
            name: i.name,
            count: Number(i.count) || 0,
            type: i.type || 'General',
            sales: Number(i.sales) || 0,
            status: i.status || 'Normal',
          })),
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.reply || 'No response received.' }]);
    } catch (err) {
      // Backend unavailable — use client-side smart fallback silently
      const reply = computeChatFallback(userMsg, inventoryItems);
      setChatMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', icon: Activity, label: 'Control Center' },
    { id: 'inventory', icon: Box, label: 'Inventory Grid' },
    { id: 'network', icon: Map, label: 'Warehouses' },
    { id: 'analytics', icon: BarChart3, label: 'Data Analytics' },
    { id: 'shipments', icon: Truck, label: 'Shipments' }
  ];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const results = { navigation: [], actions: [], inventory: [] };

    navItems.forEach(item => {
      if (item.label.toLowerCase().includes(query) || item.id.toLowerCase().includes(query)) results.navigation.push(item);
    });

    if ('register new item add inventory'.includes(query)) {
      results.actions.push({ id: 'add-item', label: 'Register New Item', icon: Box, action: () => setShowModal(true) });
    }
    if ('generate report analytics'.includes(query)) {
      results.actions.push({ id: 'gen-report', label: 'Generate Report', icon: TrendingUp, action: () => generateReport() });
    }

    inventoryItems.forEach(item => {
      if (item.name.toLowerCase().includes(query) || item.location.toLowerCase().includes(query) || item.id.toLowerCase().includes(query)) {
        results.inventory.push(item);
      }
    });

    return results;
  }, [searchQuery, inventoryItems]);

  const handleSearchResultClick = (type, item) => {
    if (type === 'navigation') {
      setActiveTab(item.id);
    } else if (type === 'action') {
      item.action();
    } else if (type === 'inventory') {
      setActiveTab('inventory');
      setTimeout(() => setSelectedInventory(item), 100);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Category config with icons and colors
  const CATEGORY_CONFIG = {
    'Electronics': { icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', activeBg: 'bg-blue-600' },
    'Raw Materials': { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', activeBg: 'bg-orange-600' },
    'Consumables': { icon: Package, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', activeBg: 'bg-pink-600' },
    'Hardware': { icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', activeBg: 'bg-slate-600' },
    'Automotive': { icon: Car, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', activeBg: 'bg-violet-600' },
    'Other': { icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', activeBg: 'bg-gray-600' },
  };

  // Default config for dynamically created categories
  const getCategoryConfig = (category) => CATEGORY_CONFIG[category] || {
    icon: Layers, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', activeBg: 'bg-teal-600'
  };

  // Collect all unique categories from existing inventory
  const existingCategories = useMemo(() => {
    const cats = new Set();
    inventoryItems.forEach(item => {
      if (item.type) cats.add(item.type);
    });
    return [...cats];
  }, [inventoryItems]);

  // Group inventory by category (type)
  const groupedInventory = useMemo(() => {
    const groups = {};
    inventoryItems.forEach(item => {
      const type = item.type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
    // Sort categories alphabetically, but keep 'Other' last
    const sorted = Object.keys(groups).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
    return sorted.map(key => ({ category: key, items: groups[key] }));
  }, [inventoryItems]);

  const categoryStats = useMemo(() => {
    return groupedInventory.map(g => ({
      category: g.category,
      count: g.items.length,
      totalUnits: g.items.reduce((s, i) => s + Number(i.count || 0), 0),
    }));
  }, [groupedInventory]);

  // Generate Report logic
  const generateReport = () => {
    setShowReport(true);
  };

  const reportData = useMemo(() => {
    const totalItems = inventoryItems.length;
    const totalUnits = inventoryItems.reduce((sum, i) => sum + Number(i.count || 0), 0);
    const totalSales = inventoryItems.reduce((sum, i) => sum + Number(i.sales || 0), 0);
    const outOfStock = inventoryItems.filter(i => Number(i.count) === 0);
    const lowStock = inventoryItems.filter(i => Number(i.count) > 0 && Number(i.count) <= 10);
    const healthyStock = inventoryItems.filter(i => Number(i.count) > 10);
    const locationMap = {};
    inventoryItems.forEach(i => {
      locationMap[i.location] = (locationMap[i.location] || 0) + 1;
    });
    const topLocations = Object.entries(locationMap).sort((a, b) => b[1] - a[1]);
    return { totalItems, totalUnits, totalSales, outOfStock, lowStock, healthyStock, topLocations };
  }, [inventoryItems]);

  const downloadReport = () => {
    const now = new Date();
    const lines = [
      'ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ',
      '           CHAINHANDLER ΓÇö SUPPLY CHAIN REPORT',
      'ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ',
      `  Generated: ${now.toLocaleString()}`,
      `  Prepared for: ${user?.displayName || 'Admin'}`,
      '',
      'ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ',
      '  EXECUTIVE SUMMARY',
      'ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ',
      `  Total Registered Items:  ${reportData.totalItems}`,
      `  Total Units in Stock:    ${reportData.totalUnits.toLocaleString()}`,
      `  Total Sales Recorded:    ${reportData.totalSales.toLocaleString()}`,
      `  Healthy Stock Items:     ${reportData.healthyStock.length}`,
      `  Low Stock Warnings:      ${reportData.lowStock.length}`,
      `  Out of Stock (Critical): ${reportData.outOfStock.length}`,
      '',
      'ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ',
      '  INVENTORY BREAKDOWN',
      'ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ',
    ];
    inventoryItems.forEach((item, idx) => {
      lines.push(`  ${idx + 1}. ${item.name}`);
      lines.push(`     Location: ${item.location}  |  Qty: ${item.count}  |  Sales: ${item.sales || 0}  |  Status: ${item.status}`);
    });
    if (reportData.topLocations.length > 0) {
      lines.push('');
      lines.push('ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ');
      lines.push('  ITEMS BY LOCATION');
      lines.push('ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ');
      reportData.topLocations.forEach(([loc, count]) => {
        lines.push(`  ${loc}: ${count} item(s)`);
      });
    }
    if (reportData.outOfStock.length > 0) {
      lines.push('');
      lines.push('ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ');
      lines.push('  ΓÜá CRITICAL: OUT OF STOCK');
      lines.push('ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ');
      reportData.outOfStock.forEach(i => lines.push(`  ΓÇó ${i.name} ΓÇö ${i.location}`));
    }
    if (reportData.lowStock.length > 0) {
      lines.push('');
      lines.push('ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ');
      lines.push('  ΓÜá WARNING: LOW STOCK');
      lines.push('ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ');
      reportData.lowStock.forEach(i => lines.push(`  ΓÇó ${i.name} (${i.count} remaining) ΓÇö ${i.location}`));
    }
    lines.push('');
    lines.push('ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ');
    lines.push('                    END OF REPORT');
    lines.push('ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChainHandler_Report_${now.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };




  // Shipment creation state
  const [showAddShipment, setShowAddShipment] = useState(false);
  const [deployToast, setDeployToast] = useState(null);
  const [showShipmentBadge, setShowShipmentBadge] = useState(false);
  const [newShipment, setNewShipment] = useState({ itemName: '', quantity: '', origin: '', destination: '', transportMode: 'truck', etaDays: '3' });
  const handleAddShipment = async (e) => {
    e.preventDefault();
    if (!newShipment.itemName || !newShipment.origin || !newShipment.destination) return;
    const eta = new Date();
    eta.setDate(eta.getDate() + Number(newShipment.etaDays || 3));
    await addShipment({
      itemName: newShipment.itemName,
      quantity: Number(newShipment.quantity) || 1,
      origin: newShipment.origin,
      destination: newShipment.destination,
      transportMode: newShipment.transportMode,
      etaDate: eta.toISOString(),
    });
    setNewShipment({ itemName: '', quantity: '', origin: '', destination: '', transportMode: 'truck', etaDays: '3' });
    setShowAddShipment(false);
  };

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const popIn = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex font-sans overflow-hidden">
      
      {/* VIBRANT GREEN SIDEBAR */}
      <motion.aside 
        initial={{ x: -200 }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 100 }}
        className="w-24 lg:w-72 bg-gradient-to-b from-emerald-600 to-emerald-700 text-white flex flex-col justify-between shrink-0 relative z-20 shadow-xl overflow-hidden"
      >
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[80px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-10 rounded-full blur-[40px] pointer-events-none"></div>

        <div className="relative z-10 w-full">
          <div className="flex items-center justify-center lg:justify-start px-4 lg:px-8 h-24 mb-6 border-b border-white/10">
            <motion.div 
              whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg"
            >
              <Box className="w-6 h-6 text-emerald-600" />
            </motion.div>
            <h1 className="ml-4 font-black text-2xl tracking-tight hidden lg:block text-white">
              ChainHandler
            </h1>
          </div>

          <nav className="space-y-4 px-4 lg:px-6 w-full">
            {navItems.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                  activeTab === item.id 
                    ? 'bg-white text-emerald-700 shadow-[0_10px_25px_rgba(0,0,0,0.15)] font-bold' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white font-medium'
                }`}
              >
                {activeTab === item.id && (
                  <motion.div layoutId="navIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-500 rounded-r-md"></motion.div>
                )}
                <item.icon className={`w-6 h-6 mr-4 transition-colors ${activeTab === item.id ? 'text-emerald-600' : 'text-white/70'}`} />
                <span className="hidden lg:block text-base flex-1">{item.label}</span>
                {item.id === 'shipments' && showShipmentBadge && (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full ml-auto animate-pulse shrink-0" />
                )}
                {activeTab === item.id && item.id !== 'shipments' && <ChevronRight className="w-5 h-5 ml-auto opacity-50" />}
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="p-6 relative z-10">
          <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">System Node</span>
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${healthStatus === 'healthy' ? 'bg-emerald-300' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${healthStatus === 'healthy' ? 'bg-white' : 'bg-red-500'}`}></span>
              </span>
            </div>
            <p className="text-sm font-medium text-white">{healthStatus === 'healthy' ? 'All Systems Operational' : 'Node Disconnected'}</p>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area - PURE WHITE BACKGROUND */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50/50 relative">
        
        {/* Dynamic Abstract Green Splash across the background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[100px] pointer-events-none transition-transform duration-[10s] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Floating particles for cool effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-emerald-400 rounded-full blur-md"
              initial={{ 
                x: Math.random() * 100 + "%", 
                y: Math.random() * 100 + "%", 
                width: Math.random() * 20 + 10, 
                height: Math.random() * 20 + 10,
                opacity: 0.2
              }}
              animate={{ 
                x: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                y: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ 
                duration: Math.random() * 20 + 10, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          ))}
        </div>

        {/* Top Header */}
        <header className="relative h-24 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 z-50 shrink-0 shadow-sm">
          <div className="flex items-center w-full max-w-xl relative group" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500 w-5 h-5 group-hover:scale-110 transition-transform" />
            <input 
              type="text" 
              placeholder="Search active shipments, warehouse nodes, or reports..." 
              className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 text-gray-700 transition-all shadow-inner placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
            />

            {/* Search Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults && (searchResults.navigation.length > 0 || searchResults.actions.length > 0 || searchResults.inventory.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                >
                  {searchResults.navigation.length > 0 && (
                    <div className="p-2 border-b border-gray-100 last:border-0">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">Navigation</div>
                      {searchResults.navigation.map(item => (
                        <div key={item.id} onClick={() => handleSearchResultClick('navigation', item)} className="flex items-center px-3 py-2.5 hover:bg-emerald-50 rounded-xl cursor-pointer group/item transition-colors">
                          <item.icon className="w-5 h-5 text-gray-400 group-hover/item:text-emerald-600 mr-3" />
                          <span className="font-bold text-gray-700 group-hover/item:text-emerald-700">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.actions.length > 0 && (
                    <div className="p-2 border-b border-gray-100 last:border-0">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">Quick Actions</div>
                      {searchResults.actions.map(item => (
                        <div key={item.id} onClick={() => handleSearchResultClick('action', item)} className="flex items-center px-3 py-2.5 hover:bg-emerald-50 rounded-xl cursor-pointer group/item transition-colors">
                          <item.icon className="w-5 h-5 text-gray-400 group-hover/item:text-emerald-600 mr-3" />
                          <span className="font-bold text-gray-700 group-hover/item:text-emerald-700">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.inventory.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">Inventory Items</div>
                      {searchResults.inventory.map(item => (
                        <div key={item.id} onClick={() => handleSearchResultClick('inventory', item)} className="flex items-center px-3 py-2.5 hover:bg-emerald-50 rounded-xl cursor-pointer group/item transition-colors">
                          <Box className="w-5 h-5 text-gray-400 group-hover/item:text-emerald-600 mr-3" />
                          <div>
                            <p className="font-bold text-gray-700 group-hover/item:text-emerald-700">{item.name}</p>
                            <p className="text-xs text-gray-500 font-medium">Loc: {item.location} ΓÇó Qty: {item.count}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative" ref={notificationsRef}>
              <motion.button 
                onClick={() => setShowNotifications(!showNotifications)}
                whileHover={{ scale: 1.1, rotate: 10 }} 
                whileTap={{ scale: 0.9 }} 
                className="relative p-3 bg-white hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-xl shadow-sm border border-gray-100 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {notifications.some(n => n.id !== 'all-clear') && (
                  <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </motion.button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white bg-opacity-100 rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Notifications</h3>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">
                        {notifications.filter(n => n.id !== 'all-clear').length} New
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      {notifications.map(notification => (
                        <div key={notification.id} className="p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer mb-1 last:mb-0">
                          <div className="flex items-start">
                            <div className={`p-2 rounded-xl ${notification.bg} mr-3 shrink-0`}>
                              <notification.icon className={`w-4 h-4 ${notification.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 leading-tight">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1 font-medium">{notification.message}</p>
                              <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-10 w-px bg-gray-200"></div>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-4 cursor-pointer bg-white p-2 rounded-2xl shadow-sm border border-gray-100 px-4">
              <img 
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=10b981&color=fff`} 
                alt="Profile" 
                className="w-10 h-10 rounded-xl border border-gray-100 object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=10b981&color=fff`;
                }}
              />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{user?.displayName || 'User'}</p>
                <p className="text-xs text-emerald-600 font-semibold">Logistics Admin</p>
              </div>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => signOut(auth)}
              className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-100 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </motion.button>
          </div>
        </header>

        {/* Dynamic View Container */}
        <div className="flex-1 overflow-y-auto p-10 scroll-smooth pb-32">
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }}
                className="max-w-[1600px] mx-auto space-y-8"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Overview</h2>
                    <p className="text-gray-500 font-medium mt-2">Monitor your global supply chain telemetry in real-time.</p>
                  </div>
                  <motion.button 
                    onClick={generateReport} 
                    whileHover={{ scale: 1.05, y: -2 }} 
                    whileTap={{ scale: 0.95 }} 
                    className="relative overflow-hidden px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all flex items-center group"
                  >
                    {/* Button Shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                    />
                    <TrendingUp className="mr-2 w-5 h-5 relative z-10" /> 
                    <span className="relative z-10">Generate Report</span>
                  </motion.button>
                </div>
                
                {/* Interactive Metrics Grid — wired to real Firestore data */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                  {[
                    { label: 'Total Shipments', val: shipments.length.toLocaleString(), trend: `${shipments.filter(s=>s.status==='transit').length} in transit`, positive: true, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Active Warehouses', val: warehouses.length.toLocaleString(), trend: warehouses.length > 0 ? 'Operational' : 'None yet', positive: true, icon: Map, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Pending Alerts', val: notifications.filter(n=>n.id!=='all-clear').length.toString(), trend: notifications.some(n=>n.id==='out-of-stock') ? 'Critical' : 'Stable', positive: !notifications.some(n=>n.id==='out-of-stock'), icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Inventory SKUs', val: inventoryItems.length.toLocaleString(), unit: 'items', positive: true, icon: Database, color: 'text-purple-500', bg: 'bg-purple-50' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i} variants={popIn}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col justify-between group cursor-pointer overflow-hidden relative"
                    >
                       {/* Subtle hover gradient */}
                       <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       
                       <div className="relative z-10 flex justify-between items-start mb-6">
                          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                          <div className={`p-3 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                             <stat.icon className={`w-6 h-6 ${stat.color}`} />
                          </div>
                       </div>
                       <div className="relative z-10 flex items-end justify-between">
                          <div className="flex items-baseline space-x-1">
                             <h3 className="text-5xl font-black text-gray-900 tracking-tighter">
                               <Counter value={stat.val} suffix={stat.unit ? "" : ""} />
                             </h3>
                             {stat.unit && <span className="text-base text-gray-500 font-bold">{stat.unit}</span>}
                          </div>
                          {stat.trend && (
                            <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {stat.trend}
                            </span>
                          )}
                       </div>
                    </motion.div>
                  ))}
                </div>

                {/* Main Interactive Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Shipments Volume Chart */}
                  <motion.div variants={popIn} className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-20px_rgba(16,185,129,0.15)] transition-shadow">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                         <h3 className="text-xl font-bold text-gray-900 tracking-tight">Shipment Volume</h3>
                         <p className="text-sm text-gray-500 mt-1 font-medium">Daily logistics throughput across all connected nodes.</p>
                       </div>
                       <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-semibold transition flex items-center">
                          Last 24 Hours <ChevronRight className="w-4 h-4 ml-2" />
                       </button>
                    </div>
                    <div className="h-80 w-full relative">
                      {/* Interactive scan line across the chart */}
                      <motion.div 
                        className="absolute left-0 right-0 h-px bg-emerald-500/10 z-10 pointer-events-none"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                      />
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={networkTraffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colTraffic" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}>
                                <animate attributeName="stop-opacity" values="0.4;0.2;0.4" dur="3s" repeatCount="indefinite" />
                              </stop>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            {/* Animated pattern def for extra detail */}
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.1" />
                            </pattern>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="time" stroke="#9ca3af" tick={{fontFamily: 'Inter', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                          <YAxis stroke="#9ca3af" tick={{fontFamily: 'Inter', fontWeight: 600}} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colTraffic)" activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Recent Activity Window */}
                  <motion.div variants={popIn} className="bg-white p-8 border border-gray-100 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">Recent Activity</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                       {[
                         { time: '10 mins ago', title: 'Shipment Delivered', desc: 'Order #8922 reached destination.', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                         { time: '1 hr ago', title: 'Low Inventory Alert', desc: 'Lithium batteries below threshold.', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                         { time: '3 hrs ago', title: 'Route Optimized', desc: 'Freight path updated for fuel efficiency.', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
                         { time: '5 hrs ago', title: 'New Node Sync', desc: 'Warehouse D successfully connected.', icon: Database, color: 'text-purple-500', bg: 'bg-purple-50' },
                       ].map((log, index) => (
                         <motion.div key={index} whileHover={{ x: 5 }} className="flex items-start group cursor-pointer p-2 -m-2 rounded-2xl hover:bg-gray-50 transition-all">
                            <div className={`p-3 rounded-2xl ${log.bg} mr-4 shrink-0 transition-transform group-hover:scale-110`}>
                               <log.icon className={`w-5 h-5 ${log.color}`} />
                            </div>
                            <div>
                               <p className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{log.title}</p>
                               <p className="text-sm font-medium text-gray-500 mt-1 leading-snug">{log.desc}</p>
                               <p className="text-xs font-bold text-gray-400 mt-2 tracking-wider uppercase">{log.time}</p>
                            </div>
                         </motion.div>
                       ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* INTERACTIVE INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}
                className="max-w-[1600px] mx-auto space-y-8"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Inventory Management</h2>
                    <p className="text-gray-500 font-medium mt-2">Browse products by category. Click any item to deploy.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all"
                  >
                    Register New Item
                  </motion.button>
                </div>

                {/* Category Filter Tabs */}
                {!inventoryLoading && inventoryItems.length > 0 && (
                  <motion.div variants={popIn} className="flex items-center gap-2 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setInventoryCategoryFilter('All')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        inventoryCategoryFilter === 'All'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      <Layers className="w-4 h-4 inline mr-1.5 -mt-0.5" /> All ({inventoryItems.length})
                    </motion.button>
                    {categoryStats.map(cs => {
                      const cfg = getCategoryConfig(cs.category);
                      const CatIcon = cfg.icon;
                      return (
                        <motion.button
                          key={cs.category}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setInventoryCategoryFilter(cs.category)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            inventoryCategoryFilter === cs.category
                              ? `${cfg.activeBg} text-white shadow-md`
                              : `bg-white text-gray-600 border border-gray-200 hover:${cfg.border} hover:${cfg.color}`
                          }`}
                        >
                          <CatIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" /> {cs.category} ({cs.count})
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* Inventory Search Bar */}
                {!inventoryLoading && inventoryItems.length > 0 && (
                  <motion.div variants={popIn} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by product name, ID, location, or quantity range (e.g. 100-500)..."
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 text-gray-700 transition-all placeholder-gray-400"
                    />
                    {inventorySearchQuery && (
                      <button
                        onClick={() => setInventorySearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </motion.div>
                )}

                {inventoryLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    <span className="ml-3 text-gray-500 font-semibold">Loading inventory from Firestore...</span>
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Box className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No inventory items yet</h3>
                    <p className="text-gray-400 mt-2">Click "Register New Item" to add your first item.</p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {groupedInventory
                      .filter(g => inventoryCategoryFilter === 'All' || g.category === inventoryCategoryFilter)
                      .map(group => {
                        const cfg = getCategoryConfig(group.category);
                        const CatIcon = cfg.icon;
                        
                        // Filter items by inventory search query
                        const filteredItems = group.items.filter(item => {
                          if (!inventorySearchQuery.trim()) return true;
                          const q = inventorySearchQuery.toLowerCase().trim();
                          
                          // Check for range query (e.g. "100-500")
                          const rangeMatch = q.match(/^(\d+)\s*-\s*(\d+)$/);
                          if (rangeMatch) {
                            const min = Number(rangeMatch[1]);
                            const max = Number(rangeMatch[2]);
                            const count = Number(item.count || 0);
                            return count >= min && count <= max;
                          }
                          
                          // Text-based search: name, id, location, type, status
                          return (
                            item.name.toLowerCase().includes(q) ||
                            item.id.toLowerCase().includes(q) ||
                            item.location.toLowerCase().includes(q) ||
                            (item.type || '').toLowerCase().includes(q) ||
                            item.status.toLowerCase().includes(q) ||
                            String(item.count).includes(q)
                          );
                        });

                        if (filteredItems.length === 0) return null;

                        const totalUnits = filteredItems.reduce((s, i) => s + Number(i.count || 0), 0);
                        return (
                          <motion.div key={group.category} variants={popIn}>
                            {/* Category Header */}
                            <div className={`flex items-center justify-between mb-5 p-4 rounded-2xl ${cfg.bg} border ${cfg.border}`}>
                              <div className="flex items-center">
                                <div className={`p-2.5 rounded-xl bg-white/80 mr-3`}>
                                  <CatIcon className={`w-5 h-5 ${cfg.color}`} />
                                </div>
                                <div>
                                  <h3 className="text-lg font-black text-gray-900">{group.category}</h3>
                                  <p className="text-xs font-medium text-gray-500">{filteredItems.length} product{filteredItems.length !== 1 ? 's' : ''} ΓÇó {totalUnits.toLocaleString()} total units</p>
                                </div>
                              </div>
                            </div>

                            {/* Items Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {filteredItems.map((item) => (
                                <motion.div 
                                  key={item.id}
                                  whileHover={{ y: -6, scale: 1.02 }}
                                  onClick={() => setSelectedInventory(item)}
                                  className={`bg-white rounded-3xl border-2 ${selectedInventory?.id === item.id ? 'border-emerald-500 shadow-[0_15px_40px_rgba(16,185,129,0.2)]' : 'border-gray-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:border-emerald-200'} p-6 cursor-pointer transition-all flex flex-col justify-between h-[230px] relative overflow-hidden group`}
                                >
                                  <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div>
                                      <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        <CatIcon className={`w-4 h-4 ${cfg.color}`} />
                                      </div>
                                      <h3 className="text-xl font-bold text-gray-900 leading-tight">{item.name}</h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                        item.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                                        item.status === 'Low Stock' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {item.status}
                                      </span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); if(selectedInventory?.id === item.id) setSelectedInventory(null); }}
                                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="relative z-10">
                                    <div className="flex justify-between items-end">
                                      <div>
                                        <p className="text-xs font-semibold text-gray-400 mb-0.5">ID: {item.id.slice(0,8)}...</p>
                                        <p className="text-xs font-semibold text-gray-500 flex items-center"><Map className="w-3.5 h-3.5 mr-1"/> {item.location}</p>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-0.5">Quantity</span>
                                        <span className="text-3xl font-black text-emerald-600">{Number(item.count).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    {/* No search results message */}
                    {inventorySearchQuery.trim() && groupedInventory
                      .filter(g => inventoryCategoryFilter === 'All' || g.category === inventoryCategoryFilter)
                      .every(group => {
                        const q = inventorySearchQuery.toLowerCase().trim();
                        const rangeMatch = q.match(/^(\d+)\s*-\s*(\d+)$/);
                        return group.items.filter(item => {
                          if (rangeMatch) {
                            const count = Number(item.count || 0);
                            return count >= Number(rangeMatch[1]) && count <= Number(rangeMatch[2]);
                          }
                          return item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || (item.type || '').toLowerCase().includes(q) || item.status.toLowerCase().includes(q) || String(item.count).includes(q);
                        }).length === 0;
                      }) && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <Search className="w-12 h-12 text-gray-300 mb-3" />
                          <h3 className="text-lg font-bold text-gray-400">No items match "{inventorySearchQuery}"</h3>
                          <p className="text-sm text-gray-400 mt-1">Try a different name, ID, location, or quantity range (e.g. 50-200)</p>
                          <button onClick={() => setInventorySearchQuery('')} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-colors text-sm">
                            Clear Search
                          </button>
                        </div>
                      )}
                  </div>
                )}

                <AnimatePresence>
                   {selectedInventory && (
                     <motion.div
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                       onClick={() => setSelectedInventory(null)}
                     >
                       <motion.div
                         initial={{ opacity: 0, scale: 0.9, y: 20 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.9, y: 20 }}
                         transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                         className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-10 relative overflow-hidden"
                         onClick={e => e.stopPropagation()}
                       >
                         {/* Decorative background icon */}
                         <div className="absolute right-[-8%] top-[-10%] opacity-5 pointer-events-none">
                           <Box className="w-64 h-64 text-emerald-600" />
                         </div>

                         {/* Close button */}
                         <button
                           onClick={() => setSelectedInventory(null)}
                           className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                         >
                           <X className="w-5 h-5" />
                         </button>

                         <div className="relative z-10">
                           <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                             <ArrowUpRight className="w-7 h-7 text-emerald-600" />
                           </div>
                           <h3 className="text-3xl font-black text-gray-900 mb-2">Deploy {selectedInventory.name}</h3>
                           <p className="text-gray-500 font-medium text-base mb-2">
                             📍 {selectedInventory.location}
                           </p>
                           <p className="text-gray-600 font-medium text-base mb-8">
                             Confirm logistics routing for <span className="font-black text-emerald-600">{selectedInventory.count} units</span>. This will deduct 10 units and integrate with the global bandwidth tracker.
                           </p>
                           <div className="flex space-x-3">
                             <motion.button
                               whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                               onClick={async () => {
                                 const deployed = Math.max(0, selectedInventory.count - 10);
                                 await deployItem(selectedInventory.id, deployed);
                                 await addShipment({ itemName: selectedInventory.name, quantity: 10, origin: selectedInventory.location, destination: 'Pending Assignment', transportMode: 'truck', etaDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() });
                                 setDeployToast(selectedInventory.name);
                                 setTimeout(() => setDeployToast(null), 3500);
                                 setShowShipmentBadge(true);
                                 setTimeout(() => setShowShipmentBadge(false), 10000);
                                 setSelectedInventory(null);
                               }}
                               className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-700 transition flex items-center justify-center"
                             >
                               <ArrowUpRight className="mr-2 w-5 h-5" /> Confirm Deploy (−10 units)
                             </motion.button>
                             <motion.button
                               whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                               onClick={() => setSelectedInventory(null)}
                               className="px-6 py-4 bg-gray-50 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition"
                             >
                               Cancel
                             </motion.button>
                           </div>
                         </div>
                       </motion.div>
                     </motion.div>
                   )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ADD ITEM MODAL */}
            {showModal && (
              <AddItemModal
                onClose={() => setShowModal(false)}
                onAdd={addItem}
                existingCategories={existingCategories}
              />
            )}

            {/* GLOBAL NETWORK TAB */}
            {activeTab === 'network' && (
              <motion.div key="network" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }} className="max-w-[1600px] mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Warehouses</h2>
                    <p className="text-gray-500 font-medium mt-2">Manage physical infrastructure across your supply network.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowWarehouseModal(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-all flex items-center shrink-0">
                    <Plus className="mr-2 w-5 h-5" /> Add Warehouse
                  </motion.button>
                </div>

                {/* Two-column layout: portrait India map on left, warehouse cards on right */}
                <div className="flex gap-6 items-start">

                  {/* Portrait India Map — 380px wide so zoom 4 shows all of India */}
                  <motion.div variants={popIn} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden shrink-0 relative z-0" style={{width:'50%', minWidth:'420px', height:'750px'}}>
                    <MapContainer
                      center={[23, 80]}
                      zoom={4.5}
                      minZoom={4}
                      maxZoom={12}
                      maxBounds={[[5.0, 65.0], [40.5, 98.0]]}
                      maxBoundsViscosity={1.0}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {warehouses.map((wh, idx) => {
                        const cityCoords = {
                          'mumbai': [19.076, 72.877], 'delhi': [28.6139, 77.209], 'bangalore': [12.9716, 77.5946],
                          'bengaluru': [12.9716, 77.5946], 'chennai': [13.0827, 80.2707], 'kolkata': [22.5726, 88.3639],
                          'hyderabad': [17.385, 78.4867], 'pune': [18.5204, 73.8567], 'ahmedabad': [23.0225, 72.5714],
                          'jaipur': [26.9124, 75.7873], 'surat': [21.1702, 72.8311], 'lucknow': [26.8467, 80.9462],
                          'kanpur': [26.4499, 80.3319], 'nagpur': [21.1458, 79.0882], 'indore': [22.7196, 75.8577],
                          'bhopal': [23.2599, 77.4126], 'patna': [25.5941, 85.1376], 'vadodara': [22.3072, 73.1812],
                          'coimbatore': [11.0168, 76.9558], 'agra': [27.1767, 78.0081], 'visakhapatnam': [17.6868, 83.2185],
                          'kochi': [9.9312, 76.2673], 'guwahati': [26.1445, 91.7362], 'chandigarh': [30.7333, 76.7794],
                          'bhubaneswar': [20.2961, 85.8245], 'amritsar': [31.634, 74.8723],
                        };
                        const key = (wh.city || wh.region || wh.name || '').toLowerCase();
                        let coords = null;
                        for (const city in cityCoords) {
                          if (key.includes(city)) { coords = cityCoords[city]; break; }
                        }
                        if (!coords) coords = [20 + (idx % 4) * 3.5, 73 + (idx % 5) * 4];
                        const icon = L.divIcon({
                          className: '',
                          html: `<div style="background:#2563eb;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;box-shadow:0 4px 16px rgba(37,99,235,0.5);border:3px solid white">${idx+1}</div>`,
                          iconSize: [32, 32],
                          iconAnchor: [16, 16],
                        });
                        return (
                          <Marker key={wh.id} position={coords} icon={icon}>
                            <Popup>
                              <div style={{fontFamily:'Inter,sans-serif',minWidth:'150px'}}>
                                <p style={{fontWeight:900,fontSize:'15px',marginBottom:'4px'}}>{wh.name}</p>
                                <p style={{color:'#6b7280',fontSize:'12px',fontWeight:600}}>{wh.city || wh.region}</p>
                                <p style={{color:'#2563eb',fontWeight:800,fontSize:'13px',marginTop:'6px'}}>Capacity: {Number(wh.capacity).toLocaleString()} units</p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </motion.div>

                  {/* Warehouse Cards — scrollable on the right */}
                  <div className="flex-1 min-w-0" style={{maxHeight:'750px', overflowY:'auto'}}>
                    {whLoading ? (
                      <div className="flex items-center justify-center py-16"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /><span className="ml-3 text-gray-500 font-semibold">Syncing...</span></div>
                    ) : warehouses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center bg-white rounded-3xl border border-gray-100" style={{minHeight:'300px'}}>
                        <Map className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">No warehouses yet</h3>
                        <p className="text-gray-400 mt-2 text-sm">Click "Add Warehouse" to pin your first location.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {warehouses.map((wh, idx) => (
                          <motion.div key={wh.id} variants={popIn} whileHover={{ y: -4 }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">{idx+1}</div>
                                <div>
                                  <h3 className="text-base font-black text-gray-900 leading-tight">{wh.name}</h3>
                                  <p className="text-xs font-semibold text-gray-500 flex items-center mt-0.5"><Globe className="w-3 h-3 mr-1" />{wh.city || wh.region}</p>
                                </div>
                              </div>
                              <button onClick={() => deleteWarehouse(wh.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Capacity</span>
                              <span className="text-xl font-black text-blue-600">{Number(wh.capacity).toLocaleString()}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}
            {showWarehouseModal && <AddWarehouseModal onClose={() => setShowWarehouseModal(false)} onAdd={addWarehouse} />}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }} className="max-w-[1600px] mx-auto">
                <DataAnalyzer items={inventoryItems} />
              </motion.div>
            )}

            {/* ACTIVE SHIPMENTS TAB */}
            {activeTab === 'shipments' && (
              <motion.div key="shipments" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }} className="max-w-[1600px] mx-auto space-y-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Active Shipments</h2>
                    <p className="text-gray-500 font-medium mt-2">Track real-time logistics and dispatch status across your zones.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddShipment(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-all flex items-center">
                    <Plus className="mr-2 w-5 h-5" /> New Shipment
                  </motion.button>
                </div>

                {/* Add Shipment Form */}
                <AnimatePresence>
                  {showAddShipment && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-blue-50 border border-blue-100 rounded-3xl p-8 mb-2 overflow-hidden">
                      <h3 className="text-xl font-black text-gray-900 mb-6">Create New Shipment</h3>
                      <form onSubmit={handleAddShipment} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="col-span-2 md:col-span-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Item Name</label>
                          <input required value={newShipment.itemName} onChange={e => setNewShipment(p => ({...p, itemName: e.target.value}))} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400" placeholder="e.g. Steel Beams" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Quantity</label>
                          <input type="number" value={newShipment.quantity} onChange={e => setNewShipment(p => ({...p, quantity: e.target.value}))} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400" placeholder="e.g. 50" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Origin</label>
                          <input required value={newShipment.origin} onChange={e => setNewShipment(p => ({...p, origin: e.target.value}))} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400" placeholder="e.g. Warehouse A" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Destination</label>
                          <input required value={newShipment.destination} onChange={e => setNewShipment(p => ({...p, destination: e.target.value}))} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400" placeholder="e.g. Regional Distributor" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Transport Mode</label>
                          <select value={newShipment.transportMode} onChange={e => setNewShipment(p => ({...p, transportMode: e.target.value}))} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400">
                            <option value="truck">🚛 Truck</option>
                            <option value="air">✈️ Air</option>
                            <option value="sea">🚢 Sea</option>
                            <option value="rail">🚂 Rail</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">ETA (days)</label>
                          <input type="number" min="1" value={newShipment.etaDays} onChange={e => setNewShipment(p => ({...p, etaDays: e.target.value}))} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400" />
                        </div>
                        <div className="col-span-2 md:col-span-3 flex gap-3">
                          <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">Create Shipment</button>
                          <button type="button" onClick={() => setShowAddShipment(false)} className="px-8 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition">Cancel</button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-700 flex items-center"><Clock className="w-5 h-5 mr-2 text-amber-500" /> Pending Dispatch</h3>
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{shipments.filter(s => s.status === 'pending').length}</span>
                    </div>
                    <div className="space-y-4">
                      {shipments.filter(s => s.status === 'pending').map(s => (
                        <motion.div key={s.id} layoutId={s.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-black text-gray-900">{s.itemName}</h4>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">QTY: {s.quantity}</span>
                                <button onClick={() => deleteShipment(s.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-colors border border-red-100"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-gray-500 mb-4">{s.origin} → {s.destination}</p>
                            <button onClick={() => updateShipmentStatus(s.id, 'transit')} className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-sm transition-all border border-blue-200/50">Dispatch Shipment</button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-700 flex items-center"><Truck className="w-5 h-5 mr-2 text-blue-500" /> In Transit</h3>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{shipments.filter(s => s.status === 'transit').length}</span>
                    </div>
                    <div className="space-y-4">
                      {shipments.filter(s => s.status === 'transit').map(s => {
                        const isDelayed = s.etaDate && new Date() > new Date(s.etaDate);
                        return (
                          <motion.div key={s.id} layoutId={s.id} className={`bg-white p-5 rounded-2xl shadow-sm border ${isDelayed ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-black text-gray-900">{s.itemName}</h4>
                                <div className="flex flex-col items-end gap-1">
                                   <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">QTY: {s.quantity}</span>
                                    <button onClick={() => deleteShipment(s.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-colors border border-red-100"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                  {isDelayed && <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-md flex items-center"><TriangleAlert className="w-3 h-3 mr-1" />DELAYED</span>}
                                </div>
                              </div>
                              <p className="text-xs font-bold text-gray-500 mb-1">{s.origin} → {s.destination}</p>
                              {s.etaDate && <p className="text-[10px] font-bold text-gray-400 mb-3 flex items-center"><CalendarClock className="w-3 h-3 mr-1" />ETA: {new Date(s.etaDate).toLocaleDateString()}</p>}
                              {s.transportMode && <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">{s.transportMode === 'truck' ? '🚛' : s.transportMode === 'air' ? '✈️' : s.transportMode === 'sea' ? '🚢' : '🚂'} {s.transportMode}</p>}
                              <button onClick={() => updateShipmentStatus(s.id, 'delivered')} className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-sm transition-all border border-emerald-200/50">Mark Delivered</button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-700 flex items-center"><PackageCheck className="w-5 h-5 mr-2 text-emerald-500" /> Delivered</h3>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">{shipments.filter(s => s.status === 'delivered').length}</span>
                    </div>
                    <div className="space-y-4">
                      {shipments.filter(s => s.status === 'delivered').map(s => (
                        <motion.div key={s.id} layoutId={s.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 opacity-80">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-black text-gray-900">{s.itemName}</h4>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">QTY: {s.quantity}</span>
                                <button onClick={() => deleteShipment(s.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-colors border border-red-100"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-gray-500 mb-3">{s.origin} → {s.destination}</p>
                            <div className="w-full py-2 text-emerald-600 font-black text-xs text-center flex items-center justify-center border-t border-emerald-50 pt-3"><CheckCircle2 className="w-4 h-4 mr-1" /> Delivery Confirmed</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CARBON FOOTPRINT TAB */}
            {activeTab === 'carbon' && (
              <motion.div key="carbon" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }} className="max-w-[1600px] mx-auto space-y-8">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-4xl font-black text-gray-900 tracking-tight">Carbon Footprint</h2>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black rounded-full uppercase tracking-wider">SDG 13</span>
                    </div>
                    <p className="text-gray-500 font-medium mt-2">Track CO₂ emissions per shipment and optimize for a greener supply chain.</p>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total CO₂ Emitted', value: `${carbonData.totalCO2} t`, icon: Wind, color: 'text-slate-600', bg: 'bg-slate-50', sub: 'tonnes this period' },
                    { label: 'Avg per Shipment', value: `${carbonData.avgCO2} t`, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'tonnes CO₂' },
                    { label: 'Green Shipments', value: carbonData.greenShipments, icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: '< 0.5t CO₂ each' },
                    { label: 'High Emitters', value: carbonData.highEmitters.length, icon: Zap, color: 'text-red-500', bg: 'bg-red-50', sub: '> 2t CO₂ each' },
                  ].map((stat, i) => (
                    <motion.div key={i} variants={popIn} whileHover={{ y: -6 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <div className={`w-10 h-10 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-gray-400 font-medium mt-1">{stat.sub}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Monthly Trend Chart */}
                  <motion.div variants={popIn} className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Monthly CO₂ Trend</h3>
                    <p className="text-sm text-gray-500 mb-6 font-medium">Emissions trajectory — targeting net reduction quarter-over-quarter.</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={carbonData.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colCarbon" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="month" stroke="#9ca3af" axisLine={false} tickLine={false} dy={10} tick={{fontFamily:'Inter', fontWeight:600}} />
                          <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tick={{fontFamily:'Inter', fontWeight:600}} />
                          <Tooltip contentStyle={{ borderRadius:'12px', border:'none', boxShadow:'0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight:'bold' }} />
                          <Area type="monotone" dataKey="co2" name="CO₂ (tonnes)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colCarbon)" activeDot={{ r:7, fill:'#10b981', stroke:'#fff', strokeWidth:3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Per-Shipment Breakdown */}
                  <motion.div variants={popIn} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex items-center mb-6">
                      <Leaf className="w-5 h-5 text-emerald-600 mr-2" />
                      <h3 className="text-xl font-bold text-gray-900">Shipment Emissions</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {carbonData.withCO2.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                          <Truck className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                          <p className="font-bold">No shipments yet</p>
                          <p className="text-sm">Create shipments to see emissions.</p>
                        </div>
                      )}
                      {carbonData.withCO2.slice(0, 8).map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{s.itemName}</p>
                            <p className="text-xs text-gray-500 font-medium">{s.origin} → {s.destination}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-black ${s.co2 > 2 ? 'text-red-500' : s.co2 < 0.5 ? 'text-emerald-600' : 'text-amber-500'}`}>{s.co2}t</span>
                            <p className="text-[10px] text-gray-400 font-medium">{s.distance} km</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* SDG 13 Banner */}
                <motion.div variants={popIn} className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">🌍</span>
                      <div>
                        <h3 className="text-2xl font-black">SDG 13 — Climate Action</h3>
                        <p className="text-emerald-100 font-medium">ChainHandler tracks and reduces logistics carbon emissions at scale.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {['Real-time CO₂ calculation', 'Transport mode optimization', 'Emission trend analytics', 'Green shipment scoring'].map(t => (
                        <span key={t} className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">{t}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* GENERATE REPORT MODAL */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowReport(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-100 rounded-2xl mr-4">
                    <ClipboardList className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Supply Chain Report</h2>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={downloadReport}
                    className="flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download
                  </motion.button>
                  <button onClick={() => setShowReport(false)} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Items', value: reportData.totalItems, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'Total Units', value: reportData.totalUnits.toLocaleString(), color: 'text-blue-700', bg: 'bg-blue-50' },
                    { label: 'Total Sales', value: reportData.totalSales.toLocaleString(), color: 'text-purple-700', bg: 'bg-purple-50' },
                    { label: 'Healthy Stock', value: reportData.healthyStock.length, color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Low Stock', value: reportData.lowStock.length, color: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Out of Stock', value: reportData.outOfStock.length, color: 'text-red-700', bg: 'bg-red-50' },
                  ].map((card, i) => (
                    <div key={i} className={`${card.bg} p-4 rounded-2xl`}>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                      <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Alerts Section */}
                {(reportData.outOfStock.length > 0 || reportData.lowStock.length > 0) && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Alerts & Warnings</h3>
                    {reportData.outOfStock.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-sm font-bold text-red-700">Critical: Out of Stock ({reportData.outOfStock.length})</span>
                        </div>
                        <p className="text-sm text-red-600 font-medium">{reportData.outOfStock.map(i => i.name).join(', ')}</p>
                      </div>
                    )}
                    {reportData.lowStock.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                          <span className="text-sm font-bold text-amber-700">Warning: Low Stock ({reportData.lowStock.length})</span>
                        </div>
                        <p className="text-sm text-amber-600 font-medium">{reportData.lowStock.map(i => `${i.name} (${i.count})`).join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Inventory Table */}
                {inventoryItems.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Inventory Breakdown</h3>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left">
                            <th className="px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-xs">#</th>
                            <th className="px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-xs">Item</th>
                            <th className="px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-xs">Location</th>
                            <th className="px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-xs text-right">Qty</th>
                            <th className="px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-xs text-right">Sales</th>
                            <th className="px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-xs text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryItems.map((item, idx) => (
                            <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-gray-400">{idx + 1}</td>
                              <td className="px-4 py-3 font-bold text-gray-800">{item.name}</td>
                              <td className="px-4 py-3 text-gray-500 font-medium">{item.location}</td>
                              <td className="px-4 py-3 font-bold text-gray-800 text-right">{Number(item.count).toLocaleString()}</td>
                              <td className="px-4 py-3 font-bold text-gray-800 text-right">{Number(item.sales || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  item.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                                  item.status === 'Low Stock' ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>{item.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Box className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-bold text-lg">No inventory data</p>
                    <p className="text-sm">Register items to see them in the report.</p>
                  </div>
                )}

                {/* Locations Breakdown */}
                {reportData.topLocations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Items by Location</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {reportData.topLocations.map(([loc, count]) => (
                        <div key={loc} className="bg-gray-50 rounded-xl p-3 flex items-center">
                          <Map className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-gray-800 truncate">{loc}</p>
                            <p className="text-xs text-gray-500 font-medium">{count} item{count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Chat Widget */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="bg-white w-80 sm:w-96 rounded-3xl shadow-2xl mb-4 border border-emerald-100 overflow-hidden flex flex-col h-[500px]">
              <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2"><Bot className="w-6 h-6 text-emerald-100" /><h3 className="font-bold">ChainHandler AI</h3></div>
                <button onClick={() => setIsChatOpen(false)} className="text-emerald-200 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-none'}`}>{msg.text}</div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 shadow-sm p-3 rounded-2xl rounded-bl-none flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input type="text" placeholder="Ask about inventory..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                  <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white p-2 rounded-xl transition flex items-center justify-center shrink-0"><Send className="w-5 h-5" /></button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          onClick={() => setIsChatOpen(!isChatOpen)} 
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 relative ${isChatOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {/* Pulsing ring */}
          {!isChatOpen && (
            <motion.span 
              className="absolute inset-0 rounded-full bg-emerald-400 opacity-20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          {isChatOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
        </motion.button>
      </div>

      {/* Deploy Toast Notification */}
      <AnimatePresence>
        {deployToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-8 left-8 z-[200] flex items-center bg-gray-900 text-white px-5 py-4 rounded-2xl shadow-2xl gap-3 max-w-sm"
          >
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black">Deployment Queued!</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5"><span className="text-emerald-400 font-bold">{deployToast}</span> added to Active Shipments → Pending Dispatch</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
