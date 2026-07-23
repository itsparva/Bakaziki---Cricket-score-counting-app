import React, { useState } from 'react';

export default function HomeDashboard({ onStartMatch }) {
  const [matchId, setMatchId] = useState('');

  const handleJoinLive = (e) => {
    e.preventDefault();
    if (matchId.trim()) {
      onStartMatch(matchId.trim().toUpperCase(), true); 
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white relative overflow-y-auto overflow-x-hidden select-none font-sans">
      
      {/* INJECTED CUSTOM CSS */}
      <style>
        {`
          .bg-speed-lines {
            background-image: repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px);
          }
        `}
      </style>

      {/* --- BACKGROUND LAYERS --- */}
      <div className="absolute inset-0 bg-speed-lines pointer-events-none z-0"></div>
      
      {/* Top Floodlights */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[60%] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none z-0"></div>

      {/* Giant Neon Stumps Background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-4 opacity-[0.15] pointer-events-none z-0 pb-10">
        <div className="w-4 h-64 bg-amber-500 rounded-t-full shadow-[0_0_30px_#f59e0b]"></div>
        <div className="w-4 h-64 bg-amber-500 rounded-t-full shadow-[0_0_30px_#f59e0b]"></div>
        <div className="w-4 h-64 bg-amber-500 rounded-t-full shadow-[0_0_30px_#f59e0b]"></div>
        <div className="absolute top-0 left-[-10px] w-14 h-3 bg-amber-400 rounded-full shadow-[0_0_20px_#fbbf24]"></div>
        <div className="absolute top-0 right-[-10px] w-14 h-3 bg-amber-400 rounded-full shadow-[0_0_20px_#fbbf24]"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-1 p-6">
        
        {/* HEADER: CSS Cricket Ball + Title */}
        <div className="text-center mt-4 mb-10 flex flex-col items-center shrink-0">
          
          {/* Spinning 3D CSS Ball */}
          <div className="relative w-24 h-24 rounded-full bg-[#8B0000] border-4 border-[#4a0000] shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.8),0_0_40px_rgba(220,38,38,0.5)] flex items-center justify-center overflow-hidden mb-6 z-20">
            <div className="w-full h-full animate-[spin_3s_linear_infinite] absolute">
               {/* The Seam */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] h-[150%] border-x-[4px] border-dashed border-white/80 rounded-[50%] shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
            </div>
          </div>

          <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 drop-shadow-[0_5px_5px_rgba(245,158,11,0.4)]">
            BAKAZIKI
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 border-y border-slate-800 py-1 px-4 inline-block bg-slate-950/50 backdrop-blur-sm">
            Next-Gen Scoring Engine
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-2 pb-10 shrink-0">
          
          {/* HOST MATCH: ESPORTS STYLE */}
          <div className="relative group shrink-0">
            <div className="absolute inset-0 bg-emerald-600 transform skew-x-[-12deg] opacity-20 group-hover:opacity-40 transition-all duration-500 rounded-lg"></div>
            <div className="absolute inset-0 border-2 border-emerald-500/50 transform skew-x-[-12deg] scale-[1.03] opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 rounded-lg"></div>
            
            <div className="relative p-8 flex flex-col items-center">
              <h2 className="text-3xl font-black italic text-emerald-400 uppercase tracking-widest mb-1 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">Take the Field</h2>
              <p className="text-emerald-500/70 text-[10px] font-bold uppercase tracking-widest mb-6">Officiate & Score a Match</p>
              
              <button 
                onClick={() => onStartMatch()} 
                className="w-full relative px-8 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xl uppercase tracking-widest transform skew-x-[-12deg] shadow-[8px_8px_0px_rgba(4,120,87,0.7)] active:translate-x-2 active:translate-y-2 active:shadow-[0px_0px_0px_rgba(4,120,87,0.7)] transition-all rounded-sm"
              >
                <span className="block transform skew-x-[12deg]">Host Match</span>
                <div className="absolute top-1 right-2 w-2 h-2 bg-slate-950/30 rounded-full"></div>
              </button>
            </div>
          </div>

          {/* VS / OR Divider */}
          <div className="flex justify-center my-2 relative z-10 shrink-0">
             <div className="w-12 h-12 bg-slate-950 border-2 border-slate-800 transform rotate-45 flex justify-center items-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
               <span className="transform -rotate-45 text-slate-500 font-black text-[10px] uppercase tracking-widest">OR</span>
             </div>
          </div>

          {/* SPECTATE MATCH: ESPORTS STYLE */}
          <div className="relative group shrink-0">
            <div className="absolute inset-0 bg-cyan-600 transform skew-x-[12deg] opacity-20 group-hover:opacity-40 transition-all duration-500 rounded-lg"></div>
            <div className="absolute inset-0 border-2 border-cyan-500/50 transform skew-x-[12deg] scale-[1.03] opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 rounded-lg"></div>
            
            <div className="relative p-8 flex flex-col items-center">
              <h2 className="text-3xl font-black italic text-cyan-400 uppercase tracking-widest mb-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">Enter the Stands</h2>
              <p className="text-cyan-500/70 text-[10px] font-bold uppercase tracking-widest mb-6">Watch the Action Live</p>
              
              <form onSubmit={handleJoinLive} className="w-full flex gap-3">
                <div className="flex-1 bg-slate-950 border-2 border-slate-700 transform skew-x-[12deg] flex items-center px-4 focus-within:border-cyan-500 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all rounded-sm min-w-0">
                   <input 
                      type="text" 
                      value={matchId}
                      onChange={(e) => setMatchId(e.target.value.toUpperCase())}
                      placeholder="MATCH ID" 
                      maxLength={6}
                      className="w-full bg-transparent text-xl font-black text-center text-white placeholder-slate-700 uppercase tracking-widest focus:outline-none transform skew-x-[-12deg]"
                   />
                </div>
                <button 
                  type="submit"
                  disabled={!matchId.trim()}
                  className="px-6 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none text-slate-950 font-black text-xl uppercase tracking-widest transform skew-x-[12deg] shadow-[8px_8px_0px_rgba(8,145,178,0.7)] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all rounded-sm shrink-0"
                >
                  <span className="block transform skew-x-[-12deg]">Join</span>
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-auto relative z-10 shrink-0">
          <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[9px] bg-slate-950/80 inline-block px-4 py-2 rounded-full border border-slate-800/50 backdrop-blur-sm">
            Built for Friends with Heart ❤️
          </p>
        </div>
        
      </div>
    </div>
  );
}