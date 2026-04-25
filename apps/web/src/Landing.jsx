import React from 'react';
import globeImg from './assets/globe.png';

export default function Landing({ onStart }) {
  return (
    <div className="min-h-screen bg-[#1a4d2e] text-white font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="w-full py-8 flex justify-center items-center relative z-10 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center">
          Welcome To ChainHandler
        </h1>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-6 lg:px-20 flex flex-col lg:flex-row items-center justify-center relative">
        {/* Left Side Content */}
        <div className="w-full lg:w-1/2 z-10 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
          <div>
            <span className="text-xs lg:text-sm font-bold tracking-[0.3em] text-emerald-400 uppercase">
              The Future of Logistics
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-5xl lg:text-7xl font-bold leading-tight">
              Your Supply Chain.
            </h2>
            <h2 className="text-5xl lg:text-7xl font-bold text-emerald-400 leading-tight">
              Fully in Control.
            </h2>
          </div>

          <p className="text-lg lg:text-xl text-emerald-100/70 max-w-lg leading-relaxed font-medium">
            Leverage real-time intelligence and automated logistics to transform your global operations into a competitive advantage.
          </p>

          <div>
            <button
              onClick={onStart}
              className="bg-[#8cd8b8] text-[#1a4d2e] font-black px-10 py-4 rounded-2xl text-lg shadow-[0_15px_40px_rgba(140,216,184,0.3)] hover:shadow-[0_20px_50px_rgba(140,216,184,0.4)] hover:-translate-y-1 transition-all duration-300"
            >
              Start Now
            </button>
          </div>
        </div>

        {/* Right Side - Globe Asset */}
        <div className="w-full lg:w-1/2 mt-12 lg:mt-0 flex justify-center items-center relative">
          <div className="absolute w-[120%] h-[120%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative">
            <div className="w-[350px] h-[350px] lg:w-[600px] lg:h-[600px] rounded-full overflow-hidden border-[10px] border-white/5 shadow-2xl">
              <img 
                src={globeImg} 
                alt="Logistics Globe" 
                className="w-full h-full object-cover animate-spin-slow"
              />
            </div>
            <div className="absolute inset-0 rounded-full border-[1px] border-white/20 pointer-events-none shadow-inner"></div>
          </div>
        </div>
      </main>

      {/* Background decorations */}
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/50 rounded-full blur-[150px] pointer-events-none -z-0"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-800/30 rounded-full blur-[120px] pointer-events-none -z-0"></div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 60s linear infinite;
        }
      `}} />
    </div>
  );
}
