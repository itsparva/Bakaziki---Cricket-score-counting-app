import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PostMatchSummary({ finalData, onGoHome }) {
  // Extract setupData from finalData
  const { t1, t2, resultMessage, setupData } = finalData;
  const [activeTab, setActiveTab] = useState('awards');
  const [isDownloading, setIsDownloading] = useState(false);
  const pdfRef = useRef(null);

  // Fallbacks just in case old matches don't have this data
  const venue = setupData?.venue || 'Local Ground';
  const matchDate = setupData?.matchDate || 'Unknown Date';

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

  const downloadPDF = async () => {
    const input = pdfRef.current;
    if (!input) return;
    
    setIsDownloading(true);
    
    try {
      input.style.display = 'block';
      const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#020617' });
      input.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bakaziki-${t1.team}-vs-${t2.team}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderScorecard = (teamData, isPdf = false) => (
    <div className={`space-y-4 ${isPdf ? '' : 'animate-fade-in pb-20'}`}>
      <h3 className="text-xl font-black text-amber-500 uppercase tracking-widest pl-2 border-l-4 border-amber-500">{teamData.team} Innings</h3>
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
              {s.out && <div className="text-[11px] text-slate-500 italic mt-1">{s.dismissal}</div>}
            </div>
          );
        })}
      </div>
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mt-2">
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
          <div className="space-y-4 animate-fade-in pb-32">
            {motm && (
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">🏆</div>
                <p className="text-amber-500 text-xs font-black uppercase tracking-widest mb-1">Man of the Match</p>
                <h3 className="text-2xl font-black text-white">{motm.name} <span className="text-sm font-normal text-amber-500/80">({motm.team})</span></h3>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {bestBatter && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Best Batter</p>
                  <h3 className="text-lg font-bold text-white truncate">{bestBatter.name}</h3>
                </div>
              )}
              {bestBowler && bestBowler.wickets > 0 && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Best Bowler</p>
                  <h3 className="text-lg font-bold text-white truncate">{bestBowler.name}</h3>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'scorecard1' && renderScorecard(t1, false)}
        {activeTab === 'scorecard2' && renderScorecard(t2, false)}
      </div>

      <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center gap-3">
        <button onClick={downloadPDF} disabled={isDownloading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-2xl border border-emerald-500 active:scale-95 transition-all uppercase tracking-wider text-[11px] disabled:opacity-50">
          {isDownloading ? 'Generating...' : '📥 Download PDF'}
        </button>
        <button onClick={() => window.location.reload()} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl shadow-2xl border border-slate-700 active:scale-95 transition-transform uppercase tracking-wider text-[11px]">
          Exit
        </button>
      </div>

      {/* --- HIDDEN PDF TEMPLATE --- */}
      <div style={{ display: 'none' }}>
        <div ref={pdfRef} className="w-[800px] bg-slate-950 p-10 text-white font-sans">
          <div className="text-center mb-8 border-b border-slate-800 pb-8 relative">
            <p className="absolute top-0 left-0 text-slate-500 font-bold uppercase tracking-widest text-sm">{matchDate}</p>
            <p className="absolute top-0 right-0 text-slate-500 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="text-amber-500">📍</span> {venue}
            </p>
            <h1 className="text-5xl font-black text-amber-500 tracking-widest uppercase mb-2 mt-6">Bakaziki Scorecard</h1>
            <h2 className="text-3xl font-bold text-white mt-4">{resultMessage}</h2>
          </div>
          <div className="mb-10">{renderScorecard(t1, true)}</div>
          <div className="mb-10">{renderScorecard(t2, true)}</div>
        </div>
      </div>
      
    </div>
  );
}