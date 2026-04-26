import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  LineChart, Line, Legend, ComposedChart
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Lightbulb, Activity, Globe, MessageSquare, 
  DollarSign, ShoppingCart, Zap, Package, Sparkles, RefreshCw
} from 'lucide-react';
import { auth } from './firebase';

const PRODUCT_TYPES = ['Electronics', 'Raw Materials', 'Consumables', 'Hardware', 'Automotive', 'Other'];
const API_URL = 'https://chainhandler-api-558261279032.us-central1.run.app';

// Deterministic random number generator based on string
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

// Simple Counter for DataAnalyzer
const CounterValue = ({ value, suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const target = typeof value === 'string' ? parseInt(value.replace(/,/g, "")) : value;
  
  useEffect(() => {
    if (isNaN(target)) return;
    let start = 0;
    const duration = 800;
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

  return <>{isNaN(target) ? value : displayValue.toLocaleString()}{suffix}</>;
};

export default function DataAnalyzer({ items }) {
  const [aiData, setAiData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const iconMap = {
    MessageSquare,
    Globe,
    DollarSign,
    ShoppingCart
  };

  const fetchAIAnalysis = async () => {
    if (items.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${API_URL}/api/ai-analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) throw new Error('AI Analysis failed');
      const data = await response.json();
      setAiData(data);
    } catch (err) {
      console.error(err);
      setError("AI analysis unavailable. Check API connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIAnalysis();
  }, [items]); // Refresh when items data changes

  // 1. Process and normalize inventory data for charts
  const processedData = useMemo(() => {
    return items.map((item, idx) => ({
      ...item,
      sales: item.sales !== undefined && item.sales !== '' ? Number(item.sales) : 0,
      count: Number(item.count)
    }));
  }, [items]);

  // 2. Aggregate Data for Charts (Sales vs Stock by Type)
  const aggregatedByType = useMemo(() => {
    const map = {};
    PRODUCT_TYPES.forEach(t => map[t] = { type: t, stock: 0, sales: 0 });
    
    processedData.forEach(item => {
      if (map[item.type]) {
        map[item.type].stock += item.count;
        map[item.type].sales += item.sales;
      }
    });
    
    return Object.values(map).filter(d => d.stock > 0 || d.sales > 0);
  }, [processedData]);

  // 3. Fallback insights if AI is loading or fails
  const insights = useMemo(() => {
    if (aiData) return {
      topSeller: aiData.topSeller,
      restockItems: aiData.restockNeeded,
      overstockedItems: aiData.efficiencyTips
    };

    if (processedData.length === 0) return null;

    const topSeller = [...processedData].sort((a, b) => b.sales - a.sales)[0];
    const restockItems = processedData.filter(item => item.count < 10).map(i => ({ name: i.name, count: i.count }));
    return { topSeller, restockItems, overstockedItems: [] };
  }, [processedData, aiData]);

  // 4. Market Intelligence Feed
  const marketIntelligence = useMemo(() => {
    if (aiData?.marketIntelligence) {
      return aiData.marketIntelligence.map(item => ({
        ...item,
        icon: iconMap[item.icon] || Globe
      }));
    }
    return [];
  }, [aiData]);

  const popIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  if (processedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <Activity className="w-16 h-16 text-gray-200 mb-4" />
        <h3 className="text-xl font-bold text-gray-400">Insufficient Data</h3>
        <p className="text-gray-400 mt-2">Add inventory items to view advanced analytics.</p>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
      
      {/* 1. Top Bar: Header & Top Insights */}
      <div className="flex justify-between items-end mb-4">
        <div>
           <div className="flex items-center space-x-3 mb-1">
             <div className="relative">
               <h2 className="text-4xl font-black text-gray-900 tracking-tight">AI Strategic Engine</h2>
               <motion.div 
                 animate={{ opacity: [0, 1, 0] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute -right-6 top-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
               />
             </div>
             {isLoading && (
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="text-indigo-500"
               >
                 <RefreshCw className="w-6 h-6" />
               </motion.div>
             )}
           </div>
           <p className="text-gray-500 font-medium">Real-time Gemini AI analysis of your supply chain ecosystem.</p>
        </div>
        <button 
          onClick={fetchAIAnalysis}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? 'Analyzing...' : 'Refresh AI'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 font-bold flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {/* 2. Market Intelligence Feed */}
      <motion.div variants={popIn} className="relative overflow-hidden bg-white p-8 rounded-3xl border-2 border-gray-300 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.1)] transition-all">
        {/* Subtle mesh background */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'radial-gradient(circle, #818cf8 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center"
            >
              <div className="flex flex-col items-center">
                <div className="flex space-x-2 mb-4">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className="w-3 h-3 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
                <p className="font-bold text-indigo-600 animate-pulse">Analysing data...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center mb-6">
          <Globe className="w-6 h-6 text-indigo-500 mr-3" />
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Live Market Intelligence</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(marketIntelligence.length > 0 ? marketIntelligence : [1,2,3,4]).map((item, idx) => (
            <motion.div 
              key={item.id || idx} 
              whileHover={{ y: -5, scale: 1.02 }}
              className={`p-6 rounded-3xl border-2 border-gray-300 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(17,24,39,0.15)] bg-gray-50 group cursor-default relative overflow-hidden transition-all hover:bg-white ${!aiData ? 'animate-pulse' : ''}`}
            >
              {/* Shimmer on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.8 }}
              />
              <div className={`w-12 h-12 rounded-2xl ${item.bg || 'bg-gray-100'} border border-gray-200 flex items-center justify-center mb-5 transition-transform group-hover:scale-110 shadow-sm`}>
                {item.icon ? <item.icon className={`w-6 h-6 ${item.color}`} /> : <Activity className="w-6 h-6 text-gray-300" />}
              </div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{item.title || 'Loading...'}</h4>
              <p className={`text-4xl font-black mb-3 ${item.color || 'text-gray-400'}`}>
                {aiData ? <CounterValue value={item.value} /> : '---'}
              </p>
              <p className="text-sm text-gray-600 font-bold leading-relaxed">{item.desc || 'Waiting for AI processing...'}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. Trend Analysis Chart */}
        <motion.div variants={popIn} className="lg:col-span-2 bg-white p-8 rounded-3xl border-2 border-gray-300 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(17,24,39,0.15)] transition-all">
          <div className="flex justify-between items-center mb-8">
             <div>
               <h3 className="text-2xl font-black text-gray-900 tracking-tight">Category Trend Analysis</h3>
               <p className="text-sm text-gray-500 mt-1 font-bold">Monthly Sales Velocity vs Current Inventory Stock.</p>
             </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={aggregatedByType} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="type" stroke="#9ca3af" tick={{fontFamily: 'Inter', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" stroke="#9ca3af" tick={{fontFamily: 'Inter', fontWeight: 600}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" tick={{fontFamily: 'Inter', fontWeight: 600}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                <Legend iconType="circle" wrapperStyle={{ fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="stock" name="Current Stock" fill="#e5e7eb" radius={[6, 6, 0, 0]} maxBarSize={50} />
                <Line yAxisId="right" type="monotone" dataKey="sales" name="Monthly Sales" stroke="#10b981" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }} activeDot={{ r: 8 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 4. Actionable Suggestions */}
        <motion.div variants={popIn} className="bg-white p-8 rounded-3xl border-2 border-gray-300 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(17,24,39,0.15)] transition-all flex flex-col h-full">
          <div className="flex items-center mb-8">
            <Zap className="w-7 h-7 text-amber-500 mr-3" />
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Actionable Insights</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            
            {/* High Demand Insight */}
            {insights?.topSeller && (
              <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-gray-300 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.1)] flex items-start">
                <TrendingUp className="w-6 h-6 text-emerald-600 mr-3 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-black text-emerald-900">Surging Demand</h4>
                  <p className="text-sm text-emerald-800 mt-1 font-bold">
                    <span className="font-black text-emerald-900">{insights.topSeller.name}</span> is moving extremely fast ({insights.topSeller.sales}/mo). 
                    Ensure fulfillment nodes prioritize this item.
                  </p>
                </div>
              </div>
            )}

            {/* Restock Alerts */}
            {insights?.restockItems.length > 0 && (
              <div className="p-5 bg-rose-50 rounded-2xl border-2 border-gray-300 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.1)] flex items-start">
                <AlertTriangle className="w-6 h-6 text-rose-600 mr-3 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-black text-rose-900">Restock Required Soon</h4>
                  <p className="text-sm text-rose-800 mt-1 font-bold">
                    The following items have sales outpacing inventory:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {insights.restockItems.map((item, idx) => (
                      <li key={idx} className="text-xs font-bold text-rose-800 flex justify-between">
                        <span>{item.name}</span>
                        <span>{item.count} left</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Efficiency Improvements */}
            {insights?.overstockedItems?.length > 0 && (
              <div className="p-5 bg-blue-50 rounded-2xl border-2 border-gray-300 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.1)] flex items-start">
                <Lightbulb className="w-6 h-6 text-blue-600 mr-3 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-black text-blue-900">Capital Efficiency</h4>
                  <p className="text-sm text-blue-800 mt-1 font-bold">
                    AI suggestions for inventory optimization:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {insights.overstockedItems.map((item, idx) => (
                      <li key={idx} className="text-xs font-bold text-blue-800 flex flex-col mb-2">
                        <div className="flex justify-between">
                          <span>{item.name}</span>
                          <span>{item.units} units</span>
                        </div>
                        <span className="font-medium text-[10px] text-blue-600 italic mt-0.5">{item.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {(!insights?.restockItems.length && !insights?.overstockedItems.length) && (
              <div className="p-6 bg-gray-50 rounded-2xl border-2 border-gray-300 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.1)] text-center">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-base font-black text-gray-700">Supply Chain is Perfectly Balanced</p>
              </div>
            )}

          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
