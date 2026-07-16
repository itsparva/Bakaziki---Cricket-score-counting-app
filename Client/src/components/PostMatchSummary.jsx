import React, { useState } from 'react';

export default function PostMatchSummary({ finalData, onGoHome }) {
  const { t1, t2, resultMessage } = finalData;
  const [activeTab, setActiveTab] = useState('awards');

  const playersStats = {};

  const initPlayer = (name, teamName) => {
    if (!playersStats[name]) {
      playersStats[name] = { name, team: teamName, runs: 0, balls: 0, fours: 0, sixes: 0, wRuns: 0, wBalls: 0, wickets: 0, out: false, dismissal: '' };
    }
  };

  Object.keys(t1.stats.batting).forEach(p => {
    initPlayer(p, t1.team);
    playersStats[p] = { ...playersStats[p], ...t1.stats.batting[p] };
  });
  Object.keys(t1.stats.bowling).forEach(p => {
    initPlayer(p, t2.team);
    playersStats[p].wRuns = t1.stats.bowling[p].runs;
    playersStats[p].wBalls = t1.stats.bowling[p].balls;
    playersStats[p].wickets = t1.stats.bowling[p].wickets;
  });

  Object.keys(t2.stats.batting).forEach(p => {
    initPlayer(p, t2.team);
    playersStats[p].runs = t2.stats.batting[p].runs;
    playersStats[p].balls = t2.stats.batting[p].balls;
    playersStats[p].fours = t2.stats.batting[p].fours;
    playersStats[p].sixes = t2.stats.batting[p].sixes;
    playersStats[p].out = t2.stats.batting[p].out;
    playersStats[p].dismissal = t2.stats.batting[p].dismissal;
  });
  Object.keys(t2.stats.bowling).forEach(p => {
    initPlayer(p, t1.team);
    playersStats[p].wRuns = t2.stats.bowling[p].runs;
    playersStats[p].wBalls = t2.stats.bowling[p].balls;
    playersStats[p].wickets = t2.stats.bowling[p].wickets;
  });

  const allPlayers = Object.values(playersStats);
  const bestBatter = [...allPlayers].sort((a, b) => b.runs - a.runs || a.balls - b.balls)[0];
  const bestBowler = [...allPlayers].sort((a, b) => b.wickets - a.wickets || a.wRuns - b.wRuns)[0];
  const mostSixes = [...allPlayers].sort((a, b) => b.sixes - a.sixes)[0];

  const getPoints = (p) => p.runs + p.fours + (p.sixes * 2) + (p.wickets * 25);
  const motm = [...allPlayers].sort((a, b) => getPoints(b) - getPoints(a))[0];

  const renderScorecard = (teamData) => (
    <div className="space-y-4 animate-fade-in pb-20">
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="bg-slate-800/50 p-2 text-xs font-bold text-slate-400 uppercase flex">
          <span className="flex-1">Batter</span>
          <span className="w-8 text-center">R</span>
          <span className="w-8 text-center">B</span>
          <span className="w-8 text-center">4s</span>
          <span className="w-8 text-center">6s</span>
          <span className="w-10 text-center">SR</span>
        </div>
        {Object.keys(teamData.stats.batting).map(p => {
          const s = teamData.stats.batting[p];
          if (s.balls === 0 && s.runs === 0 && !s.out) return null; 
          const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : 0;
          return (
            <div key={p} className="flex flex-col p-3 border-b border-slate-800/50 text-sm">
              <div className="flex items-center">
                <span className={`flex-1 font-bold ${s.out ? 'text-slate-300' : 'text-emerald-400'}`}>{p} {s.out ? '' : '*'}</span>
                <span className="w-8 text-center font-bold text-white">{s.runs}</span>
                <span className="w-8 text-center text-slate-400">{s.balls}</span>
                <span className="w-8 text-center text-slate-400">{s.fours}</span>
                <span className="w-8 text-center text-slate-400">{s.sixes}</span>
                <span className="w-10 text-center text-slate-500">{sr}</span>
              </div>
              {/* NEW: Dismissal Text displayed under the player name */}
              {s.out && (
                <div className="text-[11px] text-slate-500 italic mt-1">
                  {s.dismissal}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="bg-slate-800/50 p-2 text-xs font-bold text-slate-400 uppercase flex">
          <span className="flex-1">Bowler</span>
          <span className="w-10 text-center">O</span>
          <span className="w-10 text-center">R</span>
          <span className="w-10 text-center">W</span>
          <span className="w-12 text-center">Econ</span>
        </div>
        {Object.keys(teamData.stats.bowling).map(p => {
          const s = teamData.stats.bowling[p];
          if (s.balls === 0) return null; 
          const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
          const econ = ((s.runs / s.balls) * 6).toFixed(1);
          return (
            <div key={p} className="flex p-3 border-b border-slate-800/50 text-sm items-center">
              <span className="flex-1 font-bold text-amber-400">{p}</span>
              <span className="w-10 text-center text-slate-400">{overs}</span>
              <span className="w-10 text-center text-white">{s.runs}</span>
              <span className="w-10 text-center font-bold text-white">{s.wickets}</span>
              <span className="w-12 text-center text-slate-500">{econ}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none overflow-hidden relative">
      <div className="bg-gradient-to-b from-emerald-900/40 to-slate-950 pt-8 pb-4 px-4 border-b border-slate-800 shrink-0 text-center">
        <h2 className="text-3xl font-black text-amber-500 uppercase tracking-widest mb-2 drop-shadow-md">{resultMessage}</h2>
        <div className="flex justify-center items-center gap-6 text-sm font-mono text-slate-300 mt-4">
          <div className="text-right">
            <p className="font-bold text-white uppercase">{t1.team}</p>
            <p className="text-xl">{t1.runs}/{t1.wickets}</p>
          </div>
          <div className="text-slate-600 font-black text-xl">VS</div>
          <div className="text-left">
            <p className="font-bold text-white uppercase">{t2.team}</p>
            <p className="text-xl">{t2.runs}/{t2.wickets}</p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 border-b border-slate-800 bg-slate-900">
        <button onClick={() => setActiveTab('awards')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'awards' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500'}`}>Awards</button>
        <button onClick={() => setActiveTab('scorecard1')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'scorecard1' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}>{t1.team}</button>
        <button onClick={() => setActiveTab('scorecard2')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'scorecard2' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}>{t2.team}</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
        {activeTab === 'awards' && (
          <div className="space-y-4 animate-fade-in pb-20">
            {motm && (
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">🏆</div>
                <p className="text-amber-500 text-xs font-black uppercase tracking-widest mb-1">Man of the Match</p>
                <h3 className="text-2xl font-black text-white">{motm.name} <span className="text-sm font-normal text-amber-500/80">({motm.team})</span></h3>
                <p className="text-slate-300 text-sm mt-2 font-mono">
                  {motm.runs > 0 && `${motm.runs} Runs `} 
                  {motm.wickets > 0 && `• ${motm.wickets} Wkts `}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {bestBatter && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Best Batter</p>
                  <h3 className="text-lg font-bold text-white truncate">{bestBatter.name}</h3>
                  <p className="text-slate-400 text-xs mt-1 font-mono">{bestBatter.runs} ({bestBatter.balls})</p>
                </div>
              )}
              {bestBowler && bestBowler.wickets > 0 && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Best Bowler</p>
                  <h3 className="text-lg font-bold text-white truncate">{bestBowler.name}</h3>
                  <p className="text-slate-400 text-xs mt-1 font-mono">{bestBowler.wickets}/{bestBowler.wRuns} ({Math.floor(bestBowler.wBalls/6)}.{bestBowler.wBalls%6})</p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'scorecard1' && renderScorecard(t1)}
        {activeTab === 'scorecard2' && renderScorecard(t2)}
      </div>

      <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center">
        <button onClick={() => window.location.reload()} className="bg-slate-800 text-white font-bold py-3 px-8 rounded-full shadow-2xl border border-slate-700 active:scale-95 transition-transform uppercase tracking-wider text-sm">
          Exit to Home
        </button>
      </div>
    </div>
  );
}