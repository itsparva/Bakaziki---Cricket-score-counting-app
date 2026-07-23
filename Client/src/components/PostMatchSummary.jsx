import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function PostMatchSummary({ finalData, onExit }) {
  const { isSuperOver, superOverStats, t1, t2, setupData, resultMessage } = finalData;
  const [activeTab, setActiveTab] = useState('awards');
  const [isDownloading, setIsDownloading] = useState(false);
  const pdfRef = useRef(null);

  const venue = setupData?.venue || 'Local Ground';
  const matchDate = setupData?.matchDate || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  // --- NEW: Helper to identify the Captain ---
  const checkCaptain = (playerName, teamName) => {
    if (teamName === setupData?.teamA && playerName === setupData?.captainA) return true;
    if (teamName === setupData?.teamB && playerName === setupData?.captainB) return true;
    return false;
  };

  // --- PLAYER STATS AGGREGATION ---
  const playersStats = {};
  const initPlayer = (name, teamName) => {
    if (!playersStats[name]) {
      playersStats[name] = { name, team: teamName, runs: 0, balls: 0, fours: 0, sixes: 0, wRuns: 0, wBalls: 0, wickets: 0, out: false, dismissal: '' };
    }
  };

  Object.keys(t1.stats.batting).forEach(p => { initPlayer(p, t1.team); playersStats[p] = { ...playersStats[p], ...t1.stats.batting[p] }; });
  Object.keys(t1.stats.bowling).forEach(p => { initPlayer(p, t2.team); playersStats[p].wRuns = t1.stats.bowling[p].runs; playersStats[p].wBalls = t1.stats.bowling[p].balls; playersStats[p].wickets = t1.stats.bowling[p].wickets; });
  Object.keys(t2.stats.batting).forEach(p => { initPlayer(p, t2.team); playersStats[p].runs = t2.stats.batting[p].runs; playersStats[p].balls = t2.stats.batting[p].balls; playersStats[p].fours = t2.stats.batting[p].fours; playersStats[p].sixes = t2.stats.batting[p].sixes; playersStats[p].out = t2.stats.batting[p].out; playersStats[p].dismissal = t2.stats.batting[p].dismissal; });
  Object.keys(t2.stats.bowling).forEach(p => { initPlayer(p, t1.team); playersStats[p].wRuns = t2.stats.bowling[p].runs; playersStats[p].wBalls = t2.stats.bowling[p].balls; playersStats[p].wickets = t2.stats.bowling[p].wickets; });

  const allPlayers = Object.values(playersStats);
  const bestBatter = [...allPlayers].sort((a, b) => b.runs - a.runs || a.balls - b.balls)[0];
  const bestBowler = [...allPlayers].sort((a, b) => b.wickets - a.wickets || a.wRuns - b.wRuns)[0];

  const getPoints = (p) => p.runs + p.fours + (p.sixes * 2) + (p.wickets * 25);
  const motm = [...allPlayers].sort((a, b) => getPoints(b) - getPoints(a))[0];

  const downloadPDF = async () => {
    const input = pdfRef.current;
    if (!input) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(input, { cacheBust: true, backgroundColor: '#020617', pixelRatio: 2 });
      if (dataUrl === 'data:,') throw new Error("Capture failed");
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(dataUrl);
      const totalPdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = totalPdfHeight; let position = 0;
      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfPageHeight;
      while (heightLeft > 0) {
        position = heightLeft - totalPdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, totalPdfHeight);
        heightLeft -= pdfPageHeight;
      }
      pdf.save(`Bakaziki-${t1.team}-vs-${t2.team}.pdf`);
    } catch (error) {
      console.error(error); alert("Failed to download PDF.");
    } finally { setIsDownloading(false); }
  };

  const renderMobileScorecard = (teamData, isSuperOverTab = false) => (
    <div className="space-y-4 animate-fade-in pb-20">
      <h3 className={`text-xl font-black uppercase tracking-widest pl-2 border-l-4 ${isSuperOverTab ? 'text-purple-400 border-purple-500' : 'text-amber-500 border-amber-500'}`}>
        {teamData.team} {isSuperOverTab ? 'Super Over' : 'Innings'}
      </h3>
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="bg-slate-800/80 p-2 text-xs font-bold text-slate-400 uppercase flex">
          <span className="flex-1">Batter</span><span className="w-8 text-center">R</span><span className="w-8 text-center">B</span><span className="w-8 text-center">4s</span><span className="w-8 text-center">6s</span><span className="w-10 text-center">SR</span>
        </div>
        {Object.keys(teamData.stats.batting).map(p => {
          const s = teamData.stats.batting[p];
          if (s.balls === 0 && s.runs === 0 && !s.out) return null; 
          const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : 0;
          const isCap = checkCaptain(p, teamData.team);
          return (
            <div key={p} className="flex flex-col p-3 border-b border-slate-800/50 text-sm">
              <div className="flex items-center">
                <span className={`flex-1 font-bold ${s.out ? 'text-slate-400' : 'text-emerald-400'}`}>
                  {p} 
                  {/* --- NEW: Beautiful Captain Badge --- */}
                  {isCap && <span className="ml-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded-md align-middle">C</span>} 
                  {s.out ? '' : '*'}
                </span>
                <span className="w-8 text-center font-bold text-white">{s.runs}</span>
                <span className="w-8 text-center text-slate-400">{s.balls}</span>
                <span className="w-8 text-center text-slate-400">{s.fours}</span>
                <span className="w-8 text-center text-slate-400">{s.sixes}</span>
                <span className="w-10 text-center text-slate-500">{sr}</span>
              </div>
              {s.out && <div className="text-[11px] text-slate-500 italic mt-1">{s.dismissal}</div>}
            </div>
          );
        })}
      </div>
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg mt-4">
        <div className="bg-slate-800/80 p-2 text-xs font-bold text-slate-400 uppercase flex">
          <span className="flex-1">Bowler</span><span className="w-10 text-center">O</span><span className="w-10 text-center">R</span><span className="w-10 text-center">W</span><span className="w-12 text-center">Econ</span>
        </div>
        {Object.keys(teamData.stats.bowling).map(p => {
          const s = teamData.stats.bowling[p];
          if (s.balls === 0) return null; 
          const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
          const econ = ((s.runs / s.balls) * 6).toFixed(1);
          const isCap = checkCaptain(p, teamData.team === t1.team ? t2.team : t1.team); // Bowler belongs to the OTHER team
          return (
            <div key={p} className="flex p-3 border-b border-slate-800/50 text-sm items-center">
              <span className="flex-1 font-bold text-amber-400">
                {p}
                {isCap && <span className="ml-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded-md align-middle">C</span>}
              </span>
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
    <>
      <div className="flex flex-col h-full bg-slate-950 text-white select-none overflow-hidden relative z-10">
        <div className="bg-gradient-to-b from-emerald-900/40 to-slate-950 pt-8 pb-4 px-4 border-b border-slate-800 shrink-0 text-center">
          <h1 className="text-3xl font-black text-amber-500 uppercase tracking-widest mb-2">Match Summary</h1>
          <h2 className="text-md font-black text-emerald-400 uppercase tracking-widest mb-2 drop-shadow-md">{resultMessage}</h2>
          
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

          {isSuperOver && (
            <div className="mt-4 bg-purple-900/30 p-3 rounded-xl border border-purple-500/50 shadow-inner">
              <h3 className="text-purple-400 font-black uppercase tracking-widest text-[10px] mb-2">Super Over Score</h3>
              <div className="flex justify-center gap-6 font-mono text-xs">
                <div className="text-right">
                  <span className="text-white font-bold">{superOverStats.t1.team}</span>
                  <span className="text-purple-300 ml-2">{superOverStats.t1.runs}/{superOverStats.t1.wickets}</span>
                </div>
                <div className="text-left">
                  <span className="text-purple-300 mr-2">{superOverStats.t2.runs}/{superOverStats.t2.wickets}</span>
                  <span className="text-white font-bold">{superOverStats.t2.team}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 border-b border-slate-800 bg-slate-900 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button onClick={() => setActiveTab('awards')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'awards' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500'}`}>Awards</button>
          <button onClick={() => setActiveTab('scorecard1')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'scorecard1' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}>{t1.team}</button>
          <button onClick={() => setActiveTab('scorecard2')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'scorecard2' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}>{t2.team}</button>
          {isSuperOver && (
            <>
              <button onClick={() => setActiveTab('so1')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'so1' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}>SO: {superOverStats.t1.team}</button>
              <button onClick={() => setActiveTab('so2')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'so2' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}>SO: {superOverStats.t2.team}</button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
          {activeTab === 'awards' && (
            <div className="space-y-4 animate-fade-in pb-32">
              {motm && (
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-6xl opacity-10">🏆</div>
                  <p className="text-amber-500 text-xs font-black uppercase tracking-widest mb-1">Man of the Match</p>
                  <h3 className="text-2xl font-black text-white mb-2">
                    {motm.name} 
                    {checkCaptain(motm.name, motm.team) && <span className="ml-2 text-amber-200 text-sm align-middle">(C)</span>}
                  </h3>
                  <p className="text-slate-300 text-sm font-mono bg-slate-900/50 inline-block px-3 py-1 rounded-lg border border-slate-800">
                    {motm.runs > 0 && `${motm.runs} Runs `} 
                    {motm.wickets > 0 && `• ${motm.wickets} Wkts `}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {bestBatter && (
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Best Batter</p>
                      <h3 className="text-lg font-bold text-white truncate">
                        {bestBatter.name}
                        {checkCaptain(bestBatter.name, bestBatter.team) && <span className="ml-1 text-slate-400 text-[10px] align-middle">(C)</span>}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-xl font-black text-amber-400">{bestBatter.runs}</span>
                      <span className="text-xs text-slate-500 font-mono">({bestBatter.balls})</span>
                    </div>
                  </div>
                )}
                {bestBowler && (bestBowler.wickets > 0 || bestBowler.wBalls > 0) && (
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Best Bowler</p>
                      <h3 className="text-lg font-bold text-white truncate">
                        {bestBowler.name}
                        {checkCaptain(bestBowler.name, bestBowler.team) && <span className="ml-1 text-slate-400 text-[10px] align-middle">(C)</span>}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-xl font-black text-amber-400">{bestBowler.wickets}</span>
                      <span className="text-sm text-slate-400 font-mono">/{bestBowler.wRuns}</span>
                      <span className="text-xs text-slate-500 font-mono ml-1">({Math.floor(bestBowler.wBalls/6)}.{bestBowler.wBalls%6})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'scorecard1' && renderMobileScorecard(t1)}
          {activeTab === 'scorecard2' && renderMobileScorecard(t2)}
          {activeTab === 'so1' && isSuperOver && renderMobileScorecard(superOverStats.t1, true)}
          {activeTab === 'so2' && isSuperOver && renderMobileScorecard(superOverStats.t2, true)}
        </div>

        <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center gap-3">
          <button onClick={downloadPDF} disabled={isDownloading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-2xl border border-emerald-500 active:scale-95 transition-all uppercase tracking-wider text-[11px] disabled:opacity-50">
            {isDownloading ? 'Generating...' : '📥 Download PDF'}
          </button>
          <button onClick={onExit} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl shadow-2xl border border-slate-700 active:scale-95 transition-transform uppercase tracking-wider text-[11px]">
            Exit
          </button>
        </div>
      </div>

      {/* --- REDESIGNED BEAUTIFUL PDF TEMPLATE --- */}
      <div style={{ position: 'absolute', top: 0, left: '-9999px', zIndex: -9999 }}>
        <div ref={pdfRef} className="w-[850px] bg-[#020617] text-white p-12 font-sans flex flex-col gap-8 border-[8px] border-slate-900 rounded-3xl m-4">
          
          <div className="flex justify-between items-end border-b-2 border-slate-800 pb-6">
            <div>
              <h1 className="text-5xl font-black text-amber-500 tracking-widest uppercase">Bakaziki</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest mt-1 text-sm">Official Scorecard</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm flex items-center justify-end gap-2 mb-1"><span className="text-amber-500">📍</span> {venue}</p>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">{matchDate}</p>
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-9xl opacity-5">🏆</div>
            <h2 className="text-4xl font-black text-emerald-400 uppercase tracking-widest relative z-10">Match Over</h2>
            <p className="text-2xl font-bold text-slate-300 uppercase tracking-widest mt-2 relative z-10">{resultMessage}</p>
            
            <div className="flex justify-center items-center gap-16 mt-8 font-mono text-3xl relative z-10">
              <div className="text-right w-48">
                <p className="font-bold text-white uppercase text-xl mb-1">{t1.team}</p>
                <p className="text-slate-300">{t1.runs}<span className="text-xl text-slate-500">/{t1.wickets}</span></p>
              </div>
              <div className="text-slate-700 font-black text-4xl">VS</div>
              <div className="text-left w-48">
                <p className="font-bold text-white uppercase text-xl mb-1">{t2.team}</p>
                <p className="text-slate-300">{t2.runs}<span className="text-xl text-slate-500">/{t2.wickets}</span></p>
              </div>
            </div>

            {isSuperOver && (
              <div className="mt-8 border-t border-emerald-500/30 pt-8 relative z-10">
                <p className="text-purple-400 font-black uppercase tracking-widest text-lg mb-4">Super Over Scores</p>
                <div className="flex justify-center gap-16 font-mono text-2xl">
                  <div className="text-right w-48"><span className="text-white font-bold">{superOverStats.t1.team}</span> <span className="text-slate-300 ml-2">{superOverStats.t1.runs}/{superOverStats.t1.wickets}</span></div>
                  <div className="text-left w-48"><span className="text-slate-300 mr-2">{superOverStats.t2.runs}/{superOverStats.t2.wickets}</span> <span className="text-white font-bold">{superOverStats.t2.team}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {motm && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <p className="text-amber-500 text-xs font-black uppercase tracking-widest mb-2">Man of the Match</p>
                <h3 className="text-2xl font-bold text-white mb-3">{motm.name} {checkCaptain(motm.name, motm.team) && <span className="text-amber-500 text-lg ml-1">(c)</span>}</h3>
                <p className="text-slate-400 text-sm font-mono bg-slate-950 inline-block px-3 py-1.5 rounded-lg">{motm.runs > 0 && `${motm.runs} Runs `} {motm.wickets > 0 && `• ${motm.wickets} Wkts`}</p>
              </div>
            )}
            {bestBatter && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <p className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-2">Best Batter</p>
                <h3 className="text-2xl font-bold text-white mb-3">{bestBatter.name} {checkCaptain(bestBatter.name, bestBatter.team) && <span className="text-slate-400 text-lg ml-1">(c)</span>}</h3>
                <p className="text-amber-400 text-xl font-black">{bestBatter.runs} <span className="text-slate-500 text-sm font-mono">({bestBatter.balls})</span></p>
              </div>
            )}
            {bestBowler && (bestBowler.wickets > 0 || bestBowler.wBalls > 0) && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <p className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-2">Best Bowler</p>
                <h3 className="text-2xl font-bold text-white mb-3">{bestBowler.name} {checkCaptain(bestBowler.name, bestBowler.team) && <span className="text-slate-400 text-lg ml-1">(c)</span>}</h3>
                <p className="text-amber-400 text-xl font-black">{bestBowler.wickets}<span className="text-slate-400 text-lg">/{bestBowler.wRuns}</span> <span className="text-slate-500 text-sm font-mono">({Math.floor(bestBowler.wBalls/6)}.{bestBowler.wBalls%6})</span></p>
              </div>
            )}
          </div>

          {[t1, t2].map((teamData, idx) => (
            <div key={idx} className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-6 pl-3 border-l-4 border-amber-500">{teamData.team} Innings</h3>
              <table className="w-full text-left mb-8 border-collapse">
                <thead><tr className="bg-slate-950 text-slate-500 text-sm uppercase tracking-widest"><th className="py-3 px-4 rounded-l-lg">Batter</th><th className="py-3 px-4 text-center">R</th><th className="py-3 px-4 text-center">B</th><th className="py-3 px-4 text-center">4s</th><th className="py-3 px-4 text-center">6s</th><th className="py-3 px-4 text-center rounded-r-lg">SR</th></tr></thead>
                <tbody>
                  {Object.keys(teamData.stats.batting).map(p => {
                    const s = teamData.stats.batting[p];
                    if (s.balls === 0 && s.runs === 0 && !s.out) return null; 
                    const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : 0;
                    const isCap = checkCaptain(p, teamData.team);
                    return (
                      <tr key={p} className="border-b border-slate-800/50 last:border-0">
                        <td className="py-4 px-4"><span className={`font-bold text-lg ${s.out ? 'text-slate-300' : 'text-emerald-400'}`}>{p} {isCap ? '(c)' : ''} {s.out ? '' : '*'}</span>{s.out && <div className="text-xs text-slate-500 italic mt-1">{s.dismissal}</div>}</td>
                        <td className="py-4 px-4 text-center font-bold text-lg text-white">{s.runs}</td><td className="py-4 px-4 text-center text-slate-400">{s.balls}</td><td className="py-4 px-4 text-center text-slate-400">{s.fours}</td><td className="py-4 px-4 text-center text-slate-400">{s.sixes}</td><td className="py-4 px-4 text-center text-slate-500 font-mono">{sr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-950 text-slate-500 text-sm uppercase tracking-widest"><th className="py-3 px-4 rounded-l-lg">Bowler</th><th className="py-3 px-4 text-center">O</th><th className="py-3 px-4 text-center">M</th><th className="py-3 px-4 text-center">R</th><th className="py-3 px-4 text-center">W</th><th className="py-3 px-4 text-center rounded-r-lg">Econ</th></tr></thead>
                <tbody>
                  {Object.keys(teamData.stats.bowling).map(p => {
                    const s = teamData.stats.bowling[p];
                    if (s.balls === 0) return null; 
                    const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
                    const econ = ((s.runs / s.balls) * 6).toFixed(1);
                    const isCap = checkCaptain(p, teamData.team === t1.team ? t2.team : t1.team);
                    return (
                      <tr key={p} className="border-b border-slate-800/50 last:border-0">
                        <td className="py-4 px-4 font-bold text-lg text-amber-400">{p} {isCap ? '(c)' : ''}</td><td className="py-4 px-4 text-center text-slate-400 font-mono">{overs}</td><td className="py-4 px-4 text-center text-slate-500">0</td><td className="py-4 px-4 text-center text-white text-lg">{s.runs}</td><td className="py-4 px-4 text-center font-bold text-white text-lg">{s.wickets}</td><td className="py-4 px-4 text-center text-slate-500 font-mono">{econ}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

          {isSuperOver && [superOverStats.t1, superOverStats.t2].map((teamData, idx) => (
            <div key={`so-${idx}`} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mt-4">
              <h3 className="text-2xl font-black text-purple-400 uppercase tracking-widest mb-6 pl-3 border-l-4 border-purple-500">Super Over: {teamData.team}</h3>
              <table className="w-full text-left mb-8 border-collapse">
                <thead><tr className="bg-slate-950 text-slate-500 text-sm uppercase tracking-widest"><th className="py-3 px-4 rounded-l-lg">Batter</th><th className="py-3 px-4 text-center">R</th><th className="py-3 px-4 text-center">B</th><th className="py-3 px-4 text-center">4s</th><th className="py-3 px-4 text-center">6s</th><th className="py-3 px-4 text-center rounded-r-lg">SR</th></tr></thead>
                <tbody>
                  {Object.keys(teamData.stats.batting).map(p => {
                    const s = teamData.stats.batting[p];
                    if (s.balls === 0 && s.runs === 0 && !s.out) return null; 
                    const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : 0;
                    const isCap = checkCaptain(p, teamData.team);
                    return (
                      <tr key={p} className="border-b border-slate-800/50 last:border-0">
                        <td className="py-4 px-4"><span className={`font-bold text-lg ${s.out ? 'text-slate-300' : 'text-purple-400'}`}>{p} {isCap ? '(c)' : ''} {s.out ? '' : '*'}</span>{s.out && <div className="text-xs text-slate-500 italic mt-1">{s.dismissal}</div>}</td>
                        <td className="py-4 px-4 text-center font-bold text-lg text-white">{s.runs}</td><td className="py-4 px-4 text-center text-slate-400">{s.balls}</td><td className="py-4 px-4 text-center text-slate-400">{s.fours}</td><td className="py-4 px-4 text-center text-slate-400">{s.sixes}</td><td className="py-4 px-4 text-center text-slate-500 font-mono">{sr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-950 text-slate-500 text-sm uppercase tracking-widest"><th className="py-3 px-4 rounded-l-lg">Bowler</th><th className="py-3 px-4 text-center">O</th><th className="py-3 px-4 text-center">M</th><th className="py-3 px-4 text-center">R</th><th className="py-3 px-4 text-center">W</th><th className="py-3 px-4 text-center rounded-r-lg">Econ</th></tr></thead>
                <tbody>
                  {Object.keys(teamData.stats.bowling).map(p => {
                    const s = teamData.stats.bowling[p];
                    if (s.balls === 0) return null; 
                    const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
                    const econ = ((s.runs / s.balls) * 6).toFixed(1);
                    const isCap = checkCaptain(p, teamData.team === superOverStats.t1.team ? superOverStats.t2.team : superOverStats.t1.team);
                    return (
                      <tr key={p} className="border-b border-slate-800/50 last:border-0">
                        <td className="py-4 px-4 font-bold text-lg text-purple-400">{p} {isCap ? '(c)' : ''}</td><td className="py-4 px-4 text-center text-slate-400 font-mono">{overs}</td><td className="py-4 px-4 text-center text-slate-500">0</td><td className="py-4 px-4 text-center text-white text-lg">{s.runs}</td><td className="py-4 px-4 text-center font-bold text-white text-lg">{s.wickets}</td><td className="py-4 px-4 text-center text-slate-500 font-mono">{econ}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

          <div className="text-center mt-6 pt-6 border-t-2 border-slate-800/50">
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Generated via Bakaziki App • Built for Friends with Hearts ❤️</p>
          </div>
          
        </div>
      </div>
    </>
  );
}