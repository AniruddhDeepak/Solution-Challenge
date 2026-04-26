import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from 'firebase/auth';
import { auth, provider } from './firebase';
import { 
  Box, 
  Truck, 
  Globe, 
  BarChart3, 
  ArrowRight, 
  AlertTriangle,
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react';

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        className="absolute inset-0 opacity-40"
      />
      <motion.div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export default function Login() {
  const [savedUser, setSavedUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('chainhandler_last_user');
    if (saved) {
      try {
        setSavedUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) console.log('Redirect success');
      } catch (error) {
        setError(error.message);
      }
    };
    checkRedirect();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      provider.setCustomParameters({ prompt: 'select_account' });
      await setPersistence(auth, stayLoggedIn ? browserLocalPersistence : browserSessionPersistence);
      
      try {
        // Try popup first (best UX)
        await signInWithPopup(auth, provider);
      } catch (popupError) {
        // If blocked or restricted, fallback to Redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/cancelled-popup-request' ||
            popupError.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setError(error.message);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white flex-col justify-between p-20 relative overflow-hidden">
        <GridBackground />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center mb-20"
          >
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <Box className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="ml-5">
              <h1 className="font-black text-3xl tracking-tighter">ChainHandler</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60 mt-1">Enterprise Intelligence</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-7xl font-black leading-[1.05] mb-8 tracking-tight">
              Supply Chain<br />Intelligence<br />Platform
            </h2>
            <p className="text-emerald-100/80 text-xl leading-relaxed max-w-lg font-medium">
              Unified control for global inventory, predictive analytics, and real-time logistics optimization.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-10">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            {[
              { num: '9', label: 'Innovation', color: 'bg-orange-500/20 border-orange-400/30' },
              { num: '12', label: 'Production', color: 'bg-yellow-500/20 border-yellow-400/30' },
              { num: '13', label: 'Climate', color: 'bg-teal-500/20 border-teal-400/30' },
            ].map(sdg => (
              <span key={sdg.num} className={`px-4 py-2 rounded-xl border text-xs font-bold ${sdg.color} backdrop-blur-md`}>
                SDG {sdg.num} · {sdg.label}
              </span>
            ))}
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: Truck, label: 'Smart Logistics', sub: 'Predictive Routing' },
              { icon: BarChart3, label: 'Gemini Analytics', sub: 'Demand Forecast' },
              { icon: Globe, label: 'Global Nodes', sub: 'Multi-Warehouse' },
              { icon: ShieldCheck, label: 'Secure Chain', sub: 'Encrypted Data' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.15)' }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col group cursor-default"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-400 transition-colors">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-bold text-white mb-1">{f.label}</span>
                <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">{f.sub}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In */}
      <div className="flex-1 flex items-center justify-center p-12 relative bg-gray-50">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

        <AnimatePresence mode="wait">
          {isAuthenticating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center text-center max-w-sm"
            >
              <div className="relative w-24 h-24 mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Box className="w-8 h-8 text-emerald-600 animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">Connecting</h2>
              <p className="text-gray-500 font-medium leading-relaxed">Securing your session with the ChainHandler network...</p>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <div className="mb-12">
                <h2 className="text-5xl font-black text-gray-900 tracking-tight mb-4">Welcome</h2>
                <p className="text-gray-500 text-lg font-medium">Access your global supply chain dashboard.</p>
              </div>

              {error && (
                <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start space-x-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-red-900">Sign-in Error</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {savedUser ? (
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGoogleSignIn()}
                      className="w-full flex items-center p-5 bg-white border border-gray-200 rounded-[32px] shadow-sm hover:border-emerald-500 transition-all text-left group"
                    >
                      <img src={savedUser.photoURL} alt="" className="w-16 h-16 rounded-2xl shadow-md" />
                      <div className="ml-5 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Continue as</p>
                        <p className="text-xl font-black text-gray-900 group-hover:text-emerald-700">{savedUser.displayName}</p>
                        <p className="text-sm font-semibold text-gray-400">{savedUser.email}</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-emerald-500 transition-all" />
                    </motion.button>
                    
                    <button
                      onClick={() => {
                        localStorage.removeItem('chainhandler_last_user');
                        setSavedUser(null);
                      }}
                      className="w-full text-center text-sm font-bold text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      Use a different account
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGoogleSignIn()}
                    className="w-full flex items-center justify-center py-5 bg-white border-2 border-gray-100 rounded-[32px] shadow-sm hover:border-emerald-500 transition-all group"
                  >
                    <svg className="w-7 h-7 mr-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-lg font-black text-gray-800">Continue with Google</span>
                  </motion.button>
                )}
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" className="sr-only" checked={stayLoggedIn} onChange={(e) => setStayLoggedIn(e.target.checked)} />
                  <div className={`w-10 h-6 rounded-full transition-colors ${stayLoggedIn ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform mt-1 ml-1 ${stayLoggedIn ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-sm font-bold text-gray-500 group-hover:text-gray-700">Keep me signed in</span>
                </label>
                <div className="flex space-x-4">
                  <Layers className="w-5 h-5 text-gray-300 hover:text-emerald-500 transition-colors" />
                  <Zap className="w-5 h-5 text-gray-300 hover:text-yellow-500 transition-colors" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
