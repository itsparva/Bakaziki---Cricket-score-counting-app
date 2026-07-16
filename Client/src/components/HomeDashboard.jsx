import React, { useState } from 'react';

export default function HomeDashboard({ onStartMatch }) {
  const [matchId, setMatchId] = useState('');

  const handleJoinLive = (e) => {
    e.preventDefault();
    if (matchId.trim()) {
      // Pass the entered ID back to App.jsx
      onStartMatch(matchId.trim().toUpperCase(), true); 
    }
  };

  return (
    <div className="flex flex-col justify-between h-full px-5 py-8 bg-slate-900 text-white select-none">
      {/* Top Welcome Header */}
      <div className="text-center mt-6">
        <h1 className="text-3xl font-black tracking-wider text-amber-500 uppercase">
          Bakaziki
        </h1>
        <p className="text-xs text-slate-400 mt-1 tracking-wide">
          Local Cricket • Real-Time Stats
        </p>
      </div>

      {/* Middle Interactive Zone */}
      <div className="space-y-8 my-auto">
        {/* Spectator Box */}
        <form onSubmit={handleJoinLive} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 shadow-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
            Watch a Live Match
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Match ID (e.g., MATCH123)"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors uppercase placeholder:normal-case font-mono tracking-wider"
            />
            <button 
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-5 rounded-xl text-sm transition-all"
            >
              Go
            </button>
          </div>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 uppercase tracking-widest">OR</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        {/* Organizer Button */}
        <div className="text-center">
          <button
            onClick={onStartMatch}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold text-base py-4 rounded-2xl shadow-lg shadow-emerald-950/40 transition-all tracking-wide uppercase"
          >
            🏏 Start New Match
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Setup teams, customize overs, and start Bakaziking instantly.
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[10px] text-slate-600 font-medium tracking-widest uppercase">
        Built for Friends with Hearts ❤️
      </div>
    </div>
  );
}