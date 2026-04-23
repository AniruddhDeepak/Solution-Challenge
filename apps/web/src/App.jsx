import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { useInventory } from './hooks/useInventory';
import { useWarehouses } from './hooks/useWarehouses';
import { useShipments } from './hooks/useShipments';
import AddItemModal from './AddItemModal';
import AddWarehouseModal from './AddWarehouseModal';
import DataAnalyzer from './DataAnalyzer';
import { 
  BarChart3, Box, Activity, Map, Globe, Truck, CheckCircle2, 
  Settings, LogOut, Search, Bell, AlertTriangle, FileText,
  ChevronRight, ArrowUpRight, TrendingUp, Database, Terminal, Trash2, Loader2, Target, Leaf,
  MessageCircle, Send, Bot, User, X, Clock, PackageCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function App({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Hi! I am your ChainHandler AI assistant. How can I help you optimize your supply chain today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const { items: inventoryItems, loading: inventoryLoading, addItem, deployItem, deleteItem } = useInventory();
  const { warehouses, loading: whLoading, addWarehouse, deleteWarehouse } = useWarehouses();
  const { shipments, loading: shipLoading, addShipment, updateShipmentStatus } = useShipments();

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, inventory_data: inventoryItems })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to the network right now.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', icon: Activity, label: 'Control Center' },
    { id: 'inventory', icon: Box, label: 'Inventory Grid' },
    { id: 'network', icon: Map, label: 'Warehouses' },
    { id: 'analytics', icon: BarChart3, label: 'Data Analytics' },
    { id: 'shipments', icon: Truck, label: 'Active Shipments' }
  ];



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
            {navItems.map((item) => (
              <motion.button
                key={item.id}
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
                <span className="hidden lg:block text-base">{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-5 h-5 ml-auto opacity-50" />}
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

        {/* Top Header */}
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 z-10 shrink-0 shadow-sm">
          <div className="flex items-center w-full max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500 w-5 h-5 group-hover:scale-110 transition-transform" />
            <input 
              type="text" 
              placeholder="Search active shipments, warehouse nodes, or reports..." 
              className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 text-gray-700 transition-all shadow-inner placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-6">
            <motion.button whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }} className="relative p-3 bg-white hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-xl shadow-sm border border-gray-100 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </motion.button>
            <div className="h-10 w-px bg-gray-200"></div>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-4 cursor-pointer bg-white p-2 rounded-2xl shadow-sm border border-gray-100 px-4">
              <img src={user?.photoURL || 'https://i.pravatar.cc/150?img=47'} alt="Profile" className="w-10 h-10 rounded-xl border border-gray-100" />
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
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Overview Setup</h2>
                    <p className="text-gray-500 font-medium mt-2">Monitor your regional supply chain telemetry in real-time.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all flex items-center">
                    <TrendingUp className="mr-2 w-5 h-5" /> Generate Report
                  </motion.button>
                </div>
                
                {/* Interactive Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'Total Shipments', val: '1,248', trend: '+12%', positive: true, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Active Warehouses', val: '24', trend: 'Stable', positive: true, icon: Map, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Pending Alerts', val: '3', trend: '-2', positive: true, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Active Zones', val: '12', unit: 'Districts', positive: true, icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50' }
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
                             <h3 className="text-5xl font-black text-gray-900 tracking-tighter">{stat.val}</h3>
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
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={networkTraffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colTraffic" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
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

                {/* SDG Impact Section */}
                <motion.div variants={popIn} className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-8 rounded-3xl shadow-[0_15px_40px_-10px_rgba(16,185,129,0.4)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                  {/* Decorative Elements */}
                  <div className="absolute top-[-50%] left-[-10%] w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                  <div className="absolute bottom-[-50%] right-[-10%] w-[300px] h-[300px] bg-emerald-400/20 rounded-full blur-[60px] pointer-events-none"></div>

                  <div className="relative z-10 md:w-2/3 mb-6 md:mb-0 md:pr-8">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
                        <Target className="w-6 h-6 text-emerald-300" />
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Sustainable Development Goals</h3>
                    </div>
                    <p className="text-emerald-100 font-medium text-lg leading-relaxed">
                      ChainHandler's AI directly optimizes regional logistics for Tier 2 and Tier 3 manufacturers, aligning with the United Nations SDGs. 
                      By reducing empty miles and optimizing inventory placement, we are building a greener and more efficient local ecosystem.
                    </p>
                  </div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-inner">
                        9
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1">Industry & Innovation</p>
                        <p className="text-white font-bold leading-tight">Resilient<br/>Infrastructure</p>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-inner">
                        12
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1">Responsible Prod.</p>
                        <p className="text-white font-bold leading-tight">Optimized<br/>Consumption</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* INTERACTIVE INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}
                className="max-w-[1600px] mx-auto space-y-8"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Inventory Management</h2>
                    <p className="text-gray-500 font-medium mt-2">Click on any inventory item below to view detailed deploy actions.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all"
                  >
                    Register New Item
                  </motion.button>
                </div>

                {inventoryLoading ? (
                  <div className="col-span-3 flex items-center justify-center py-24">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    <span className="ml-3 text-gray-500 font-semibold">Loading inventory from Firestore...</span>
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
                    <Box className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No inventory items yet</h3>
                    <p className="text-gray-400 mt-2">Click "Register New Item" to add your first item.</p>
                  </div>
                ) : inventoryItems.map((item) => (
                   <motion.div 
                     key={item.id} variants={popIn}
                     whileHover={{ y: -8, scale: 1.02 }}
                     onClick={() => setSelectedInventory(item)}
                     className={`bg-white rounded-3xl border-2 ${selectedInventory?.id === item.id ? 'border-emerald-500 shadow-[0_15px_40px_rgba(16,185,129,0.2)]' : 'border-gray-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:border-emerald-200'} p-8 cursor-pointer transition-all flex flex-col justify-between h-[250px] relative overflow-hidden group`}
                   >
                      <div className="flex justify-between items-start mb-4 relative z-10">
                         <div>
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                               <Box className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 leading-tight">{item.name}</h3>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                           <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
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
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                      <div className="relative z-10">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-sm font-semibold text-gray-400 mb-1">ID: {item.id.slice(0,8)}...</p>
                               <p className="text-sm font-semibold text-gray-500 flex items-center"><Map className="w-4 h-4 mr-1"/> {item.location}</p>
                            </div>
                            <div className="text-right">
                               <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">Quantity</span>
                               <span className="text-4xl font-black text-emerald-600">{Number(item.count).toLocaleString()}</span>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                ))}

                <AnimatePresence>
                   {selectedInventory && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '2rem' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="bg-emerald-50 border border-emerald-200 p-10 rounded-3xl shadow-inner relative overflow-hidden"
                      >
                         <div className="absolute right-[-5%] top-[-10%] opacity-10">
                            <Box className="w-64 h-64 text-emerald-600" />
                         </div>
                         <div className="relative z-10">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Deploy {selectedInventory.name}</h3>
                            <p className="text-emerald-700 font-medium text-lg mb-8 max-w-2xl">
                               Confirm logistics routing for {selectedInventory.count} units originating from {selectedInventory.location}. This action integrates directly into the regional bandwidth tracker.
                            </p>
                            <div className="flex space-x-4">
                               <motion.button
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={async () => {
                                    const deployed = Math.max(0, selectedInventory.count - 10);
                                    await deployItem(selectedInventory.id, deployed);
                                    await addShipment({
                                      itemName: selectedInventory.name,
                                      quantity: 10,
                                      origin: selectedInventory.location,
                                      destination: 'Regional Distributor'
                                    });
                                    setSelectedInventory(null);
                                  }}
                                  className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-700 transition flex items-center"
                               >
                                  <ArrowUpRight className="mr-2 w-5 h-5" /> Confirm Deployment (-10 units)
                               </motion.button>
                               <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedInventory(null)} className="px-8 py-4 bg-white border border-emerald-200 text-emerald-600 font-bold rounded-xl hover:bg-gray-50 transition">
                                  Cancel
                               </motion.button>
                            </div>
                         </div>
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
              />
            )}

            {/* GLOBAL NETWORK TAB */}
            {activeTab === 'network' && (
              <motion.div 
                key="network"
                variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}
                className="max-w-[1600px] mx-auto space-y-8"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Warehouses</h2>
                    <p className="text-gray-500 font-medium mt-2">Manage physical infrastructure across your Tier 2 and Tier 3 network.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowWarehouseModal(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-all flex items-center"
                  >
                    <Globe className="mr-2 w-5 h-5" /> Add Regional Warehouse
                  </motion.button>
                </div>

                {whLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <span className="ml-3 text-gray-500 font-semibold">Syncing network nodes...</span>
                  </div>
                ) : warehouses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Map className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No active nodes</h3>
                    <p className="text-gray-400 mt-2">Click "Add Regional Warehouse" to expand your supply network.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {warehouses.map((wh) => (
                      <motion.div 
                        key={wh.id} variants={popIn}
                        whileHover={{ y: -8 }}
                        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-blue-200 transition-all flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                              <Map className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 leading-tight">{wh.name}</h3>
                            <p className="text-sm font-semibold text-gray-500 mt-1 flex items-center">
                              <Globe className="w-4 h-4 mr-1" /> {wh.region}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteWarehouse(wh.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-xl transition-colors"
                            title="Delete Node"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Capacity</span>
                          <span className="text-3xl font-black text-blue-600">{Number(wh.capacity).toLocaleString()}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ADD WAREHOUSE MODAL */}
            {showWarehouseModal && (
              <AddWarehouseModal
                onClose={() => setShowWarehouseModal(false)}
                onAdd={addWarehouse}
              />
            )}

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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* PENDING */}
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-700 flex items-center"><Clock className="w-5 h-5 mr-2 text-amber-500" /> Pending Dispatch</h3>
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{shipments.filter(s => s.status === 'pending').length}</span>
                    </div>
                    <div className="space-y-4">
                      {shipments.filter(s => s.status === 'pending').map(s => (
                        <motion.div key={s.id} layoutId={s.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{s.itemName}</h4>
                            <span className="text-xs font-bold text-gray-400">QTY: {s.quantity}</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-500 mb-4">{s.origin} → {s.destination}</p>
                          <button onClick={() => updateShipmentStatus(s.id, 'transit')} className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-sm transition-colors">
                            Dispatch Shipment
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* IN TRANSIT */}
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-700 flex items-center"><Truck className="w-5 h-5 mr-2 text-blue-500" /> In Transit</h3>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{shipments.filter(s => s.status === 'transit').length}</span>
                    </div>
                    <div className="space-y-4">
                      {shipments.filter(s => s.status === 'transit').map(s => (
                        <motion.div key={s.id} layoutId={s.id} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{s.itemName}</h4>
                            <span className="text-xs font-bold text-gray-400">QTY: {s.quantity}</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-500 mb-4">{s.origin} → {s.destination}</p>
                          <button onClick={() => updateShipmentStatus(s.id, 'delivered')} className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-xl text-sm transition-colors">
                            Mark Delivered
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* DELIVERED */}
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-700 flex items-center"><PackageCheck className="w-5 h-5 mr-2 text-emerald-500" /> Delivered</h3>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">{shipments.filter(s => s.status === 'delivered').length}</span>
                    </div>
                    <div className="space-y-4">
                      {shipments.filter(s => s.status === 'delivered').map(s => (
                        <motion.div key={s.id} layoutId={s.id} className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow opacity-75">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900 line-through decoration-gray-300">{s.itemName}</h4>
                            <span className="text-xs font-bold text-gray-400">QTY: {s.quantity}</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-500">{s.origin} → {s.destination}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Floating AI Chat Widget */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-white w-80 sm:w-96 rounded-3xl shadow-2xl mb-4 border border-emerald-100 overflow-hidden flex flex-col h-[500px]"
            >
              <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Bot className="w-6 h-6 text-emerald-100" />
                  <h3 className="font-bold">ChainHandler AI</h3>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-emerald-200 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 shadow-sm text-gray-800 p-3 rounded-2xl rounded-bl-none flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Ask about inventory..." 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={isChatLoading || !chatInput.trim()} 
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white p-2 rounded-xl transition flex items-center justify-center shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-colors duration-300 ${isChatOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {isChatOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
        </motion.button>
      </div>

    </div>
  );
}
