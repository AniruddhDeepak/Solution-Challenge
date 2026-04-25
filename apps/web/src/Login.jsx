import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from './firebase';
import { Box, Truck, Globe, BarChart3, ArrowRight } from 'lucide-react';

export default function Login() {
  const [savedUser, setSavedUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
      await signInWithPopup(auth, provider);
      // We don't set isAuthenticating to false here because main.jsx will unmount this component on success
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsAuthenticating(false);
    }
  };



  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-b from-emerald-600 to-emerald-800 text-white flex-col justify-between p-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full blur-[60px]"></div>

        <div className="relative z-10">
          <div className="flex items-center mb-16">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Box className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="ml-4 font-black text-2xl tracking-tight">ChainHandler</h1>
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
            { icon: Truck, label: 'Live Shipment Tracking', sub: 'Real-time Kanban board' },
            { icon: Globe, label: 'Global Warehouses', sub: 'Multi-node management' },
            { icon: BarChart3, label: 'Gemini AI Analytics', sub: 'Demand forecasting' },
            { icon: Box, label: 'Carbon Tracker', sub: 'SDG 13 emissions monitor' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center"
            >
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
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {isAuthenticating ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="relative w-32 h-32 mb-8">
              {/* Outer spinning dashed ring */}
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200"
              />
              {/* Inner fast spinning solid ring */}
              <motion.div 
                animate={{ rotate: -360 }} 
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-2 rounded-full border-[3px] border-emerald-500 border-t-transparent"
              />
              {/* Center pulsing logo */}
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
                  className="w-full flex items-center p-4 bg-gradient-to-br from-white to-gray-50 border-2 border-transparent hover:border-emerald-200 rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_50px_-15px_rgba(16,185,129,0.2)] transition-all duration-300 text-left group relative overflow-hidden"
                >
                  {/* Subtle shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-60 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 pointer-events-none"></div>
                  
                  <div className="relative z-10 flex items-center w-full">
                    <img 
                      src={savedUser.photoURL || 'https://i.pravatar.cc/150'} 
                      alt="Profile" 
                      className="w-14 h-14 rounded-full mr-5 shadow-md ring-4 ring-white group-hover:ring-emerald-50 transition-all duration-300" 
                    />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Welcome back</p>
                      <p className="text-xl font-black text-gray-900 group-hover:text-emerald-700 transition-colors">{savedUser.displayName}</p>
                      <p className="text-sm font-medium text-gray-500 truncate mt-0.5">{savedUser.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </motion.button>

                <button
                  onClick={() => handleGoogleSignIn()}
                  className="w-full flex items-center justify-center px-6 py-4 bg-transparent border-2 border-dashed border-gray-200 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all text-gray-500 font-bold text-sm group"
                >
                  <span className="group-hover:scale-105 transition-transform">Use a different account</span>
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGoogleSignIn()}
                className="w-full flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
              >
                {/* Google Logo SVG */}
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-base font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">
                  Continue with Google
                </span>
              </motion.button>
            )}

            <div className="mt-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
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
