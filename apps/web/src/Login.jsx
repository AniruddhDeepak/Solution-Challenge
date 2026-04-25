import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, provider } from './firebase';
import { Box, Truck, Globe, BarChart3, ArrowRight, Package, Zap, Shield, Activity } from 'lucide-react';

// Animated dot-grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(52,211,153,0.15) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        className="absolute inset-0 opacity-60"
      />
      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// Small orbiting icon badge
function OrbitBadge({ icon: Icon, label, angle, radius = 200, delay = 0 }) {
  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1 pointer-events-none"
      style={{
        left: '50%', top: '50%',
        x: Math.cos((angle * Math.PI) / 180) * radius - 22,
        y: Math.sin((angle * Math.PI) / 180) * radius - 22,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: [
          Math.sin((angle * Math.PI) / 180) * radius - 22 - 8, 
          Math.sin((angle * Math.PI) / 180) * radius - 22 + 8, 
          Math.sin((angle * Math.PI) / 180) * radius - 22 - 8
        ] 
      }}
      transition={{ 
        opacity: { duration: 0.5, delay }, 
        scale: { duration: 0.5, delay }, 
        y: { duration: 3 + delay, repeat: Infinity, ease: 'easeInOut' } 
      }}
    >
      <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-lg">
        <Icon className="w-5 h-5 text-emerald-200" />
      </div>
      <span className="text-[9px] font-bold text-emerald-300/70 uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}

export default function Login() {
  const [savedUser, setSavedUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('chainhandler_last_user');
    if (saved) {
      try {
        setSavedUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleGoogleSignIn = async (emailHint = null) => {
    setIsAuthenticating(true);
    try {
      if (emailHint) {
        provider.setCustomParameters({ login_hint: emailHint });
      } else {
        provider.setCustomParameters({ prompt: 'select_account' });
      }
      
      await setPersistence(auth, stayLoggedIn ? browserLocalPersistence : browserSessionPersistence);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-b from-emerald-600 to-emerald-800 text-white flex-col justify-between p-16 relative overflow-hidden">
        {/* Animated dot grid */}
        <GridBackground />
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full blur-[60px]"></div>
        
        {/* Animated shimmer bar at top */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <div className="flex items-center mb-16">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg"
            >
              <Box className="w-6 h-6 text-emerald-600" />
            </motion.div>
            <h1 className="ml-4 font-black text-2xl tracking-tight">ChainHandler</h1>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ml-3 w-2 h-2 rounded-full bg-emerald-300"
            />
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h2 className="text-5xl font-black leading-tight mb-6">
              Supply Chain<br />Intelligence<br />Platform
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed max-w-md">
              Manage global inventory, track shipments, and harness AI-powered insights — all from one unified dashboard.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 flex flex-wrap gap-2">
            <span className="text-xs font-bold text-white/70 uppercase tracking-widest w-full mb-1">🌐 UN SDG Alignment</span>
            {[
              { num: '9', label: 'Industry & Innovation', color: 'bg-orange-500/30 border-orange-400/40' },
              { num: '12', label: 'Responsible Production', color: 'bg-yellow-500/30 border-yellow-400/40' },
              { num: '13', label: 'Climate Action', color: 'bg-teal-500/30 border-teal-400/40' },
              { num: '8', label: 'Decent Work', color: 'bg-red-500/30 border-red-400/40' },
            ].map(sdg => (
              <span key={sdg.num} className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-bold text-white ${sdg.color}`}>
                SDG {sdg.num} · {sdg.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { icon: Truck,    label: 'Live Shipment Tracking', sub: 'Real-time Kanban board' },
            { icon: Globe,    label: 'Global Warehouses',      sub: 'Multi-node management' },
            { icon: BarChart3,label: 'Gemini AI Analytics',    sub: 'Demand forecasting' },
            { icon: Box,      label: 'Carbon Tracker',         sub: 'SDG 13 emissions monitor' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.18)' }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center cursor-default relative overflow-hidden group"
            >
              {/* Shimmer on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.6 }}
              />
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mr-3 shrink-0">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white/90 block">{f.label}</span>
                <span className="text-xs text-white/60 font-medium">{f.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Panel - Sign In or Loading */}
      <div className="flex-1 flex items-center justify-center p-8 relative bg-gradient-to-br from-white via-gray-50 to-emerald-50/30">
        {/* Subtle animated emerald orb */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-400 blur-[120px] pointer-events-none"
        />
        
        {isAuthenticating ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="relative w-32 h-32 mb-8">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200"
              />
              <motion.div 
                animate={{ rotate: -360 }} 
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-2 rounded-full border-[3px] border-emerald-500 border-t-transparent"
              />
              <motion.div 
                animate={{ scale: [0.9, 1.1, 0.9] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center bg-emerald-50 rounded-full m-6 shadow-inner"
              >
                <Box className="w-8 h-8 text-emerald-600" />
              </motion.div>
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Authenticating</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              Establishing secure connection to your supply chain network...
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="flex items-center mb-10 lg:hidden">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <h1 className="ml-3 font-black text-xl text-gray-900">ChainHandler</h1>
            </div>

            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-gray-500 font-medium mb-10">Sign in to access your supply chain dashboard.</p>

            {savedUser ? (
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGoogleSignIn(savedUser.email)}
                  className="w-full flex items-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-200 transition-all text-left relative overflow-hidden group shadow-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>
                  
                  <img src={savedUser.photoURL} alt="" className="w-12 h-12 rounded-full mr-4 shadow-sm" />
                  <div className="flex-1 relative z-10">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Welcome back</p>
                    <p className="text-lg font-black text-gray-900 group-hover:text-emerald-700 transition-colors">{savedUser.displayName}</p>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">{savedUser.email}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </motion.button>
                <button
                  onClick={() => handleGoogleSignIn()}
                  className="w-full text-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors"
                >
                  Use a different account
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGoogleSignIn()}
                className="w-full flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
              >
                <svg className="w-6 h-6 mr-3 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-base font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">Continue with Google</span>
              </motion.button>
            )}

            <div className="mt-6 flex items-center justify-center">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={stayLoggedIn}
                    onChange={(e) => setStayLoggedIn(e.target.checked)}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${stayLoggedIn ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${stayLoggedIn ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className="ml-3 text-sm font-bold text-gray-600 group-hover:text-emerald-700 transition-colors">Stay logged in</span>
              </label>
            </div>

            <div className="mt-8 p-5 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 w-1 h-full bg-emerald-500"
                animate={{ height: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                🔒 Your account is secured by <strong className="text-gray-700">Firebase Authentication</strong>.
                Only authorised users can access supply chain data.
              </p>
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-8 font-medium">
              ChainHandler © 2026 · Supply Chain Intelligence Platform
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
