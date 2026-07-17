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
    <div className="relative flex flex-col justify-between h-full px-5 py-6 bg-slate-950 text-white select-none overflow-hidden">
      
      {/* --- LIVE BACKGROUND ANIMATION --- */}
      <div className="absolute top-[-50px] left-[-20px] w-48 h-48 bg-amber-500/20 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute top-[-20px] right-[-40px] w-56 h-56 bg-emerald-500/15 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '5s' }}></div>
      
      {/* Top Welcome Header */}
      <div className="relative z-10 text-center mt-2">
        <h1 className="text-4xl font-black tracking-wider text-amber-500 uppercase drop-shadow-md">
          Bakaziki
        </h1>
        <p className="text-xs text-slate-400 mt-1 tracking-wide">
          Local Cricket • Real-Time Stats
        </p>
      </div>

      {/* Middle Interactive Zone */}
      <div className="relative z-10 space-y-5 my-auto w-full">
        {/* Spectator Box */}
        <form onSubmit={handleJoinLive} className="bg-slate-900/60 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 shadow-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
            Watch a Live Match
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Match ID (e.g. MATCH123)"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className="flex-1 bg-slate-950/80 border border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors uppercase placeholder:normal-case font-mono tracking-wider"
            />
            <button 
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black px-5 rounded-xl text-sm transition-all"
            >
              GO
            </button>
          </div>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-700/50"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">OR</span>
          <div className="flex-grow border-t border-slate-700/50"></div>
        </div>

        {/* Organizer Button */}
        <div className="text-center">
          <button
            onClick={onStartMatch}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-950/40 transition-all tracking-wide uppercase"
          >
            🏏 Start New Match
          </button>
          <p className="text-[11px] text-slate-500 mt-3 px-4">
            Setup teams, customize overs, and start Bakaziking instantly.
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="relative z-10 text-center text-[10px] text-slate-600 font-bold tracking-widest uppercase mb-2">
        Built for Friends with Heart ❤️
      </div>
    </div>
  );
}