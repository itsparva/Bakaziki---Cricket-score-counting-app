import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const CONFETTI_COLORS = ['#D4AF37', '#F2D97D', '#EDE6D6', '#B91C2B'];

const TrophyGlowIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <path d="M9 6h14v4a7 7 0 0 1-7 7 7 7 0 0 1-7-7V6z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M9 8H5a3 3 0 0 0 4 4M23 8h4a3 3 0 0 1-4 4" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 17v5M12 26h8M13 22h6l1 4H12l1-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export default function PostMatchSummary({ finalData, onExit }) {
  const { isSuperOver, superOverStats, t1, t2, setupData, resultMessage, matchId } = finalData;
  const [activeTab, setActiveTab] = useState('awards');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const pdfRef = useRef(null);

  const venue = setupData?.venue || 'Local Ground';
  const matchDate = setupData?.matchDate || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  // --- Confetti burst on arrival, cleaned up automatically ---
  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setShowConfetti(false); return; }
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const confettiPieces = useMemo(() => (
    Array.from({ length: 44 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 3 + Math.random() * 2.2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      drift: (Math.random() - 0.5) * 140,
      size: 5 + Math.random() * 5,
    }))
  ), []);

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

  // --- REBUILT: block-based PDF generation so cards never split mid-element ---
  const downloadPDF = async () => {
    const container = pdfRef.current;
    if (!container) return;
    setIsDownloading(true);
    try {
      const blocks = Array.from(container.querySelectorAll(':scope > .pdf-block'));
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      let cursorY = margin;
      let isFirstBlock = true;

      for (const block of blocks) {
        const dataUrl = await toPng(block, { cacheBust: true, backgroundColor: '#060606', pixelRatio: 2 });
        if (dataUrl === 'data:,') continue;
        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeight = (imgProps.height * usableWidth) / imgProps.width;

        // Start a new page if this block doesn't fit in what's left of the current one.
        if (!isFirstBlock && cursorY + imgHeight > pageHeight - margin) {
          pdf.addPage();
          cursorY = margin;
        }

        if (imgHeight > usableHeight) {
          // Rare case: a single block is taller than one page. Slice it cleanly
          // on pixel boundaries instead of letting the old code cut arbitrarily.
          // Always start this block on a fresh page so its first slice gets full room.
          if (cursorY !== margin) { pdf.addPage(); cursorY = margin; }

          const img = new Image();
          await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = dataUrl; });
          const pxPerMm = imgProps.width / usableWidth;
          const sliceHeightPx = Math.floor(usableHeight * pxPerMm);
          let sourceY = 0;
          let first = true;
          while (sourceY < imgProps.height) {
            if (!first) { pdf.addPage(); cursorY = margin; }
            const sliceHeight = Math.min(sliceHeightPx, imgProps.height - sourceY);
            const canvas = document.createElement('canvas');
            canvas.width = imgProps.width;
            canvas.height = sliceHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, sourceY, imgProps.width, sliceHeight, 0, 0, imgProps.width, sliceHeight);
            const sliceDataUrl = canvas.toDataURL('image/png');
            const sliceHeightMm = sliceHeight / pxPerMm;
            pdf.addImage(sliceDataUrl, 'PNG', margin, cursorY, usableWidth, sliceHeightMm);
            cursorY += sliceHeightMm + 4;
            sourceY += sliceHeight;
            first = false;
          }
        } else {
          pdf.addImage(dataUrl, 'PNG', margin, cursorY, usableWidth, imgHeight);
          cursorY += imgHeight + 4;
        }
        isFirstBlock = false;
      }

      const idPart = matchId ? `${matchId}-` : '';
      pdf.save(`Bakaziki-${idPart}${t1.team}-vs-${t2.team}.pdf`);
    } catch (error) {
      console.error(error); alert("Failed to download PDF.");
    } finally { setIsDownloading(false); }
  };

  const renderMobileScorecard = (teamData, isSuperOverTab = false) => (
    <div className="space-y-4 animate-fade-in pb-20">
      <h3 className={`font-display text-xl font-black uppercase tracking-widest pl-2 border-l-4 ${isSuperOverTab ? 'text-[#EDE6D6] border-white/40' : 'text-[#D4AF37] border-[#D4AF37]'}`}>
        {teamData.team} {isSuperOverTab ? 'Super Over' : 'Innings'}
      </h3>
      <div className="scorecard-panel rounded-sm overflow-hidden shadow-lg">
        <div className="bg-[#0a0a0a] p-2 text-xs font-bold text-[#D4AF37]/60 uppercase flex font-mono-score">
          <span className="flex-1">Batter</span><span className="w-8 text-center">R</span><span className="w-8 text-center">B</span><span className="w-8 text-center">4s</span><span className="w-8 text-center">6s</span><span className="w-10 text-center">SR</span>
        </div>
        {Object.keys(teamData.stats.batting).map(p => {
          const s = teamData.stats.batting[p];
          if (s.balls === 0 && s.runs === 0 && !s.out) return null; 
          const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : 0;
          const isCap = checkCaptain(p, teamData.team);
          return (
            <div key={p} className="flex flex-col p-3 border-b border-[#1c1c1c] text-sm">
              <div className="flex items-center">
                <span className={`flex-1 font-bold truncate pr-2 ${s.out ? 'text-[#EDE6D6]/60' : 'text-[#D4AF37]'}`}>
                  {p} 
                  {isCap && <span className="ml-2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] px-1.5 py-0.5 rounded-sm align-middle font-mono-score">C</span>} 
                  {s.out ? '' : '*'}
                </span>
                <span className="w-8 text-center font-bold text-[#EDE6D6] font-mono-score">{s.runs}</span>
                <span className="w-8 text-center text-[#EDE6D6]/40 font-mono-score">{s.balls}</span>
                <span className="w-8 text-center text-[#EDE6D6]/40 font-mono-score">{s.fours}</span>
                <span className="w-8 text-center text-[#EDE6D6]/40 font-mono-score">{s.sixes}</span>
                <span className="w-10 text-center text-[#EDE6D6]/30 font-mono-score">{sr}</span>
              </div>
              {s.out && <div className="text-[11px] text-[#EDE6D6]/35 italic mt-1">{s.dismissal}</div>}
            </div>
          );
        })}
      </div>
      <div className="scorecard-panel rounded-sm overflow-hidden shadow-lg mt-4">
        <div className="bg-[#0a0a0a] p-2 text-xs font-bold text-[#D4AF37]/60 uppercase flex font-mono-score">
          <span className="flex-1">Bowler</span><span className="w-10 text-center">O</span><span className="w-10 text-center">R</span><span className="w-10 text-center">W</span><span className="w-12 text-center">Econ</span>
        </div>
        {Object.keys(teamData.stats.bowling).map(p => {
          const s = teamData.stats.bowling[p];
          if (s.balls === 0) return null; 
          const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
          const econ = ((s.runs / s.balls) * 6).toFixed(1);
          const isCap = checkCaptain(p, teamData.team === t1.team ? t2.team : t1.team); // Bowler belongs to the OTHER team
          return (
            <div key={p} className="flex p-3 border-b border-[#1c1c1c] text-sm items-center">
              <span className="flex-1 font-bold text-[#D4AF37] truncate pr-2">
                {p}
                {isCap && <span className="ml-2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] px-1.5 py-0.5 rounded-sm align-middle font-mono-score">C</span>}
              </span>
              <span className="w-10 text-center text-[#EDE6D6]/40 font-mono-score">{overs}</span>
              <span className="w-10 text-center text-[#EDE6D6] font-mono-score">{s.runs}</span>
              <span className="w-10 text-center font-bold text-[#EDE6D6] font-mono-score">{s.wickets}</span>
              <span className="w-12 text-center text-[#EDE6D6]/30 font-mono-score">{econ}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full bg-[#060606] text-[#EDE6D6] select-none overflow-hidden relative z-10 font-sans">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;0,9..144,900&family=Space+Mono:wght@400;700&display=swap');
            .font-display { font-family: 'Fraunces', serif; }
            .font-mono-score { font-family: 'Space Mono', monospace; }
            .scorecard-panel { background: #0d0d0d; border: 1px solid rgba(212,175,55,0.14); }
            .btn-press { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease; }
            .btn-press:active { transform: scale(0.95); }

            .btn-glow-gold { animation: glowGold 2.6s ease-in-out infinite; }
            @keyframes glowGold {
              0%, 100% { box-shadow: 0 5px 0 #7a611a, 0 10px 18px rgba(0,0,0,0.35), 0 0 0 rgba(212,175,55,0); }
              50%      { box-shadow: 0 5px 0 #7a611a, 0 10px 22px rgba(0,0,0,0.4), 0 0 22px rgba(212,175,55,0.45); }
            }

            .motm-card { animation: cardRise 0.6s cubic-bezier(.2,.8,.2,1) both; }
            .stat-card-1 { animation: cardRise 0.6s cubic-bezier(.2,.8,.2,1) 0.12s both; }
            .stat-card-2 { animation: cardRise 0.6s cubic-bezier(.2,.8,.2,1) 0.24s both; }
            @keyframes cardRise {
              0%   { opacity: 0; transform: translateY(14px) scale(0.97); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }

            .trophy-glow { animation: trophyPulse 2.4s ease-in-out infinite; }
            @keyframes trophyPulse {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50%      { opacity: 0.9; transform: scale(1.08); }
            }

            .shimmer-mask { position: relative; overflow: hidden; }
            .shimmer-mask::after {
              content: '';
              position: absolute;
              top: 0; bottom: 0; left: -60%;
              width: 40%;
              background: linear-gradient(100deg, transparent, rgba(212,175,55,0.18), transparent);
              animation: shimmerSweep 4.5s ease-in-out infinite;
            }
            @keyframes shimmerSweep {
              0%   { left: -60%; }
              45%  { left: 120%; }
              100% { left: 120%; }
            }

            .confetti-piece {
              position: absolute;
              top: -5%;
              border-radius: 1px;
              animation-name: confettiFall;
              animation-timing-function: cubic-bezier(.4,0,.6,1);
              animation-fill-mode: forwards;
            }
            @keyframes confettiFall {
              0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
              100% { transform: translate(var(--drift), 115vh) rotate(600deg); opacity: 0; }
            }

            @media (prefers-reduced-motion: reduce) {
              .motm-card, .stat-card-1, .stat-card-2, .trophy-glow, .shimmer-mask::after, .btn-glow-gold, .confetti-piece {
                animation: none !important;
              }
              .btn-press { transition: none; }
            }
          `}
        </style>

        {/* --- CONFETTI --- */}
        {showConfetti && (
          <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
            {confettiPieces.map(c => (
              <span
                key={c.id}
                className="confetti-piece"
                style={{
                  left: `${c.left}%`,
                  width: `${c.size}px`,
                  height: `${c.size * 0.4}px`,
                  background: c.color,
                  animationDuration: `${c.duration}s`,
                  animationDelay: `${c.delay}s`,
                  '--drift': `${c.drift}px`,
                }}
              />
            ))}
          </div>
        )}

        <div className="bg-[#0a0a0a] pt-8 pb-4 px-4 border-b border-[#D4AF37]/15 shrink-0 text-center relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[70%] h-16 bg-[#D4AF37]/[0.08] blur-[60px] rounded-full pointer-events-none" />

          <h1 className="relative font-display text-3xl font-black text-[#D4AF37] uppercase tracking-widest mb-2">Match Summary</h1>
          <h2 className="relative font-display text-md font-black text-[#EDE6D6] uppercase tracking-widest mb-2 drop-shadow-md">{resultMessage}</h2>

          {matchId && (
            <span className="relative inline-block text-[10px] font-mono-score text-[#D4AF37]/80 tracking-widest bg-[#141414] border border-[#D4AF37]/20 px-2 py-1 rounded-sm mb-3">
              MATCH ID: {matchId}
            </span>
          )}
          
          <div className="relative flex justify-center items-center gap-6 text-sm font-mono-score text-[#EDE6D6]/70 mt-4">
            <div className="text-right">
              <p className="font-bold text-[#EDE6D6] uppercase">{t1.team}</p>
              <p className="text-xl text-[#D4AF37]">{t1.runs}<span className="text-[#EDE6D6]/40">/{t1.wickets}</span></p>
            </div>
            <div className="text-[#EDE6D6]/25 font-black text-xl">VS</div>
            <div className="text-left">
              <p className="font-bold text-[#EDE6D6] uppercase">{t2.team}</p>
              <p className="text-xl text-[#D4AF37]">{t2.runs}<span className="text-[#EDE6D6]/40">/{t2.wickets}</span></p>
            </div>
          </div>

          {isSuperOver && (
            <div className="relative mt-4 bg-white/[0.04] p-3 rounded-sm border border-white/15 shadow-inner">
              <h3 className="text-[#EDE6D6] font-black uppercase tracking-widest text-[10px] mb-2 font-mono-score">Super Over Score</h3>
              <div className="flex justify-center gap-6 font-mono-score text-xs">
                <div className="text-right">
                  <span className="text-[#EDE6D6] font-bold">{superOverStats.t1.team}</span>
                  <span className="text-[#EDE6D6]/60 ml-2">{superOverStats.t1.runs}/{superOverStats.t1.wickets}</span>
                </div>
                <div className="text-left">
                  <span className="text-[#EDE6D6]/60 mr-2">{superOverStats.t2.runs}/{superOverStats.t2.wickets}</span>
                  <span className="text-[#EDE6D6] font-bold">{superOverStats.t2.team}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 border-b border-[#1c1c1c] bg-[#0a0a0a] overflow-x-auto whitespace-nowrap hide-scrollbar">
          <button onClick={() => setActiveTab('awards')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors font-mono-score ${activeTab === 'awards' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#EDE6D6]/35'}`}>Awards</button>
          <button onClick={() => setActiveTab('scorecard1')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors font-mono-score ${activeTab === 'scorecard1' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#EDE6D6]/35'}`}>{t1.team}</button>
          <button onClick={() => setActiveTab('scorecard2')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors font-mono-score ${activeTab === 'scorecard2' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#EDE6D6]/35'}`}>{t2.team}</button>
          {isSuperOver && (
            <>
              <button onClick={() => setActiveTab('so1')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors font-mono-score ${activeTab === 'so1' ? 'text-[#EDE6D6] border-b-2 border-white/50' : 'text-[#EDE6D6]/35'}`}>SO: {superOverStats.t1.team}</button>
              <button onClick={() => setActiveTab('so2')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors font-mono-score ${activeTab === 'so2' ? 'text-[#EDE6D6] border-b-2 border-white/50' : 'text-[#EDE6D6]/35'}`}>SO: {superOverStats.t2.team}</button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[#060606]">
          {activeTab === 'awards' && (
            <div className="space-y-4 animate-fade-in pb-32">
              {motm && (
                <div className="motm-card shimmer-mask bg-gradient-to-br from-[#D4AF37]/15 to-[#8a6c1a]/10 border border-[#D4AF37]/30 p-5 rounded-sm relative overflow-hidden">
                  <div className="trophy-glow absolute -right-4 -top-4 text-[#D4AF37]">
                    <TrophyGlowIcon className="w-24 h-24 opacity-20" />
                  </div>
                  <p className="text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-1 font-mono-score">Man of the Match</p>
                  <h3 className="font-display text-2xl font-black text-[#EDE6D6] mb-2">
                    {motm.name} 
                    {checkCaptain(motm.name, motm.team) && <span className="ml-2 text-[#D4AF37] text-sm align-middle">(C)</span>}
                  </h3>
                  <p className="text-[#EDE6D6]/70 text-sm font-mono-score bg-black/40 inline-block px-3 py-1 rounded-sm border border-[#1c1c1c]">
                    {motm.runs > 0 && `${motm.runs} Runs `} 
                    {motm.wickets > 0 && `• ${motm.wickets} Wkts `}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {bestBatter && (
                  <div className="stat-card-1 scorecard-panel p-4 rounded-sm flex flex-col justify-between">
                    <div>
                      <p className="text-[#D4AF37]/70 text-[10px] font-black uppercase tracking-widest mb-1 font-mono-score">Best Batter</p>
                      <h3 className="font-display text-lg font-bold text-[#EDE6D6] truncate">
                        {bestBatter.name}
                        {checkCaptain(bestBatter.name, bestBatter.team) && <span className="ml-1 text-[#EDE6D6]/40 text-[10px] align-middle">(C)</span>}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-xl font-black text-[#D4AF37] font-mono-score">{bestBatter.runs}</span>
                      <span className="text-xs text-[#EDE6D6]/40 font-mono-score">({bestBatter.balls})</span>
                    </div>
                  </div>
                )}
                {bestBowler && (bestBowler.wickets > 0 || bestBowler.wBalls > 0) && (
                  <div className="stat-card-2 scorecard-panel p-4 rounded-sm flex flex-col justify-between">
                    <div>
                      <p className="text-[#D4AF37]/70 text-[10px] font-black uppercase tracking-widest mb-1 font-mono-score">Best Bowler</p>
                      <h3 className="font-display text-lg font-bold text-[#EDE6D6] truncate">
                        {bestBowler.name}
                        {checkCaptain(bestBowler.name, bestBowler.team) && <span className="ml-1 text-[#EDE6D6]/40 text-[10px] align-middle">(C)</span>}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-xl font-black text-[#D4AF37] font-mono-score">{bestBowler.wickets}</span>
                      <span className="text-sm text-[#EDE6D6]/50 font-mono-score">/{bestBowler.wRuns}</span>
                      <span className="text-xs text-[#EDE6D6]/40 font-mono-score ml-1">({Math.floor(bestBowler.wBalls/6)}.{bestBowler.wBalls%6})</span>
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
          <button
            onClick={downloadPDF}
            disabled={isDownloading}
            className="btn-press btn-glow-gold flex-1 font-display text-[#1B140A] font-bold py-3 rounded-sm shadow-2xl active:scale-95 transition-all uppercase tracking-wider text-[11px] disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg, #E4C158, #D4AF37 55%, #A6841E)' }}
          >
            {isDownloading ? 'Generating...' : '📥 Download PDF'}
          </button>
          <button onClick={onExit} className="btn-press flex-1 bg-[#141414] text-[#EDE6D6]/70 font-bold py-3 rounded-sm shadow-2xl border border-[#1c1c1c] active:scale-95 transition-transform uppercase tracking-wider text-[11px]">
            Exit
          </button>
        </div>
      </div>

      {/* --- PDF TEMPLATE: each direct child with .pdf-block is captured & placed as one atomic unit --- */}
      <div style={{ position: 'absolute', top: 0, left: '-9999px', zIndex: -9999 }}>
        <div ref={pdfRef} className="w-[850px] bg-[#060606] text-[#EDE6D6] p-10 font-sans flex flex-col gap-6">

          <div className="pdf-block flex justify-between items-end border-b-2 border-[#D4AF37]/25 pb-6 bg-[#060606] p-2">
            <div>
              <h1 className="font-display text-5xl font-black text-[#D4AF37] tracking-widest uppercase">Bakaziki</h1>
              <p className="text-[#EDE6D6]/50 font-bold uppercase tracking-widest mt-1 text-sm">Official Scorecard</p>
              {matchId && (
                <p className="text-[#D4AF37]/80 font-bold uppercase tracking-widest mt-2 text-sm font-mono">Match ID: {matchId}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[#EDE6D6]/50 font-bold uppercase tracking-widest text-sm flex items-center justify-end gap-2 mb-1"><span className="text-[#D4AF37]">📍</span> {venue}</p>
              <p className="text-[#EDE6D6]/35 font-bold uppercase tracking-widest text-sm">{matchDate}</p>
            </div>
          </div>

          <div className="pdf-block bg-[#0d0d0d] border border-[#D4AF37]/25 rounded-sm p-8 text-center">
            <h2 className="font-display text-4xl font-black text-[#D4AF37] uppercase tracking-widest">Match Over</h2>
            <p className="text-2xl font-bold text-[#EDE6D6]/80 uppercase tracking-widest mt-2">{resultMessage}</p>
            
            <div className="flex justify-center items-center gap-16 mt-8 font-mono text-3xl">
              <div className="text-right w-48">
                <p className="font-bold text-[#EDE6D6] uppercase text-xl mb-1">{t1.team}</p>
                <p className="text-[#EDE6D6]/80">{t1.runs}<span className="text-xl text-[#EDE6D6]/40">/{t1.wickets}</span></p>
              </div>
              <div className="text-[#EDE6D6]/20 font-black text-4xl">VS</div>
              <div className="text-left w-48">
                <p className="font-bold text-[#EDE6D6] uppercase text-xl mb-1">{t2.team}</p>
                <p className="text-[#EDE6D6]/80">{t2.runs}<span className="text-xl text-[#EDE6D6]/40">/{t2.wickets}</span></p>
              </div>
            </div>

            {isSuperOver && (
              <div className="mt-8 border-t border-[#D4AF37]/20 pt-8">
                <p className="text-[#EDE6D6] font-black uppercase tracking-widest text-lg mb-4">Super Over Scores</p>
                <div className="flex justify-center gap-16 font-mono text-2xl">
                  <div className="text-right w-48"><span className="text-[#EDE6D6] font-bold">{superOverStats.t1.team}</span> <span className="text-[#EDE6D6]/60 ml-2">{superOverStats.t1.runs}/{superOverStats.t1.wickets}</span></div>
                  <div className="text-left w-48"><span className="text-[#EDE6D6]/60 mr-2">{superOverStats.t2.runs}/{superOverStats.t2.wickets}</span> <span className="text-[#EDE6D6] font-bold">{superOverStats.t2.team}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="pdf-block grid grid-cols-3 gap-6 bg-[#060606] p-1">
            {motm && (
              <div className="bg-[#0d0d0d] border border-[#D4AF37]/25 p-6 rounded-sm">
                <p className="text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-2">Man of the Match</p>
                <h3 className="font-display text-2xl font-bold text-[#EDE6D6] mb-3">{motm.name} {checkCaptain(motm.name, motm.team) && <span className="text-[#D4AF37] text-lg ml-1">(c)</span>}</h3>
                <p className="text-[#EDE6D6]/60 text-sm font-mono bg-black/40 inline-block px-3 py-1.5 rounded-sm">{motm.runs > 0 && `${motm.runs} Runs `} {motm.wickets > 0 && `• ${motm.wickets} Wkts`}</p>
              </div>
            )}
            {bestBatter && (
              <div className="bg-[#0d0d0d] border border-[#1c1c1c] p-6 rounded-sm">
                <p className="text-[#D4AF37]/70 text-xs font-black uppercase tracking-widest mb-2">Best Batter</p>
                <h3 className="font-display text-2xl font-bold text-[#EDE6D6] mb-3">{bestBatter.name} {checkCaptain(bestBatter.name, bestBatter.team) && <span className="text-[#EDE6D6]/40 text-lg ml-1">(c)</span>}</h3>
                <p className="text-[#D4AF37] text-xl font-black">{bestBatter.runs} <span className="text-[#EDE6D6]/40 text-sm font-mono">({bestBatter.balls})</span></p>
              </div>
            )}
            {bestBowler && (bestBowler.wickets > 0 || bestBowler.wBalls > 0) && (
              <div className="bg-[#0d0d0d] border border-[#1c1c1c] p-6 rounded-sm">
                <p className="text-[#D4AF37]/70 text-xs font-black uppercase tracking-widest mb-2">Best Bowler</p>
                <h3 className="font-display text-2xl font-bold text-[#EDE6D6] mb-3">{bestBowler.name} {checkCaptain(bestBowler.name, bestBowler.team) && <span className="text-[#EDE6D6]/40 text-lg ml-1">(c)</span>}</h3>
                <p className="text-[#D4AF37] text-xl font-black">{bestBowler.wickets}<span className="text-[#EDE6D6]/50 text-lg">/{bestBowler.wRuns}</span> <span className="text-[#EDE6D6]/40 text-sm font-mono">({Math.floor(bestBowler.wBalls/6)}.{bestBowler.wBalls%6})</span></p>
              </div>
            )}
          </div>

          {[t1, t2].map((teamData, idx) => (
            <div key={idx} className="pdf-block bg-[#0d0d0d] rounded-sm border border-[#1c1c1c] p-6">
              <h3 className="font-display text-2xl font-black text-[#D4AF37] uppercase tracking-widest mb-6 pl-3 border-l-4 border-[#D4AF37]">{teamData.team} Innings</h3>
              <table className="w-full text-left mb-8 border-collapse">
                <thead><tr className="bg-black/40 text-[#D4AF37]/60 text-sm uppercase tracking-widest"><th className="py-3 px-4 rounded-l-sm">Batter</th><th className="py-3 px-4 text-center">R</th><th className="py-3 px-4 text-center">B</th><th className="py-3 px-4 text-center">4s</th><th className="py-3 px-4 text-center">6s</th><th className="py-3 px-4 text-center rounded-r-sm">SR</th></tr></thead>
                <tbody>
                  {Object.keys(teamData.stats.batting).map(p => {
                    const s = teamData.stats.batting[p];
                    if (s.balls === 0 && s.runs === 0 && !s.out) return null; 
                    const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : 0;
                    const isCap = checkCaptain(p, teamData.team);
                    return (
                      <tr key={p} className="border-b border-[#1c1c1c] last:border-0">
                        <td className="py-4 px-4"><span className={`font-bold text-lg ${s.out ? 'text-[#EDE6D6]/60' : 'text-[#D4AF37]'}`}>{p} {isCap ? '(c)' : ''} {s.out ? '' : '*'}</span>{s.out && <div className="text-xs text-[#EDE6D6]/35 italic mt-1">{s.dismissal}</div>}</td>
                        <td className="py-4 px-4 text-center font-bold text-lg text-[#EDE6D6]">{s.runs}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/40">{s.balls}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/40">{s.fours}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/40">{s.sixes}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/30 font-mono">{sr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-black/40 text-[#D4AF37]/60 text-sm uppercase tracking-widest"><th className="py-3 px-4 rounded-l-sm">Bowler</th><th className="py-3 px-4 text-center">O</th><th className="py-3 px-4 text-center">M</th><th className="py-3 px-4 text-center">R</th><th className="py-3 px-4 text-center">W</th><th className="py-3 px-4 text-center rounded-r-sm">Econ</th></tr></thead>
                <tbody>
                  {Object.keys(teamData.stats.bowling).map(p => {
                    const s = teamData.stats.bowling[p];
                    if (s.balls === 0) return null; 
                    const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
                    const econ = ((s.runs / s.balls) * 6).toFixed(1);
                    const isCap = checkCaptain(p, teamData.team === t1.team ? t2.team : t1.team);
                    return (
                      <tr key={p} className="border-b border-[#1c1c1c] last:border-0">
                        <td className="py-4 px-4 font-bold text-lg text-[#D4AF37]">{p} {isCap ? '(c)' : ''}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/40 font-mono">{overs}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/30">0</td><td className="py-4 px-4 text-center text-[#EDE6D6] text-lg">{s.runs}</td><td className="py-4 px-4 text-center font-bold text-[#EDE6D6] text-lg">{s.wickets}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/30 font-mono">{econ}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

          {isSuperOver && [superOverStats.t1, superOverStats.t2].map((teamData, idx) => (
            <div key={`so-${idx}`} className="pdf-block bg-[#0d0d0d] rounded-sm border border-white/15 p-6">
              <h3 className="font-display text-2xl font-black text-[#EDE6D6] uppercase tracking-widest mb-6 pl-3 border-l-4 border-white/40">Super Over: {teamData.team}</h3>
              <table className="w-full text-left mb-8 border-collapse">
                <thead><tr className="bg-black/40 text-[#D4AF37]/60 text-sm uppercase tracking-widest"><th className="py-3 px-4 rounded-l-sm">Batter</th><th className="py-3 px-4 text-center">R</th><th className="py-3 px-4 text-center">B</th><th className="py-3 px-4 text-center">4s</th><th className="py-3 px-4 text-center">6s</th><th className="py-3 px-4 text-center rounded-r-sm">SR</th></tr></thead>
                <tbody>
                  {Object.keys(teamData.stats.batting).map(p => {
                    const s = teamData.stats.batting[p];
                    if (s.balls === 0 && s.runs === 0 && !s.out) return null; 
                    const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : 0;
                    const isCap = checkCaptain(p, teamData.team);
                    return (
                      <tr key={p} className="border-b border-[#1c1c1c] last:border-0">
                        <td className="py-4 px-4"><span className={`font-bold text-lg ${s.out ? 'text-[#EDE6D6]/60' : 'text-[#EDE6D6]'}`}>{p} {isCap ? '(c)' : ''} {s.out ? '' : '*'}</span>{s.out && <div className="text-xs text-[#EDE6D6]/35 italic mt-1">{s.dismissal}</div>}</td>
                        <td className="py-4 px-4 text-center font-bold text-lg text-[#EDE6D6]">{s.runs}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/40">{s.balls}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/40">{s.fours}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/40">{s.sixes}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/30 font-mono">{sr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-black/40 text-[#D4AF37]/60 text-sm uppercase tracking-widest"><th className="py-3 px-4 rounded-l-sm">Bowler</th><th className="py-3 px-4 text-center">O</th><th className="py-3 px-4 text-center">M</th><th className="py-3 px-4 text-center">R</th><th className="py-3 px-4 text-center">W</th><th className="py-3 px-4 text-center rounded-r-sm">Econ</th></tr></thead>
                <tbody>
                  {Object.keys(teamData.stats.bowling).map(p => {
                    const s = teamData.stats.bowling[p];
                    if (s.balls === 0) return null; 
                    const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
                    const econ = ((s.runs / s.balls) * 6).toFixed(1);
                    const isCap = checkCaptain(p, teamData.team === superOverStats.t1.team ? superOverStats.t2.team : superOverStats.t1.team);
                    return (
                      <tr key={p} className="border-b border-[#1c1c1c] last:border-0">
                        <td className="py-4 px-4 font-bold text-lg text-[#EDE6D6]">{p} {isCap ? '(c)' : ''}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/40 font-mono">{overs}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/30">0</td><td className="py-4 px-4 text-center text-[#EDE6D6] text-lg">{s.runs}</td><td className="py-4 px-4 text-center font-bold text-[#EDE6D6] text-lg">{s.wickets}</td><td className="py-4 px-4 text-center text-[#EDE6D6]/30 font-mono">{econ}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

          <div className="pdf-block text-center pt-6 border-t-2 border-[#1c1c1c] bg-[#060606] p-2">
            <p className="text-[#EDE6D6]/30 font-bold uppercase tracking-widest text-xs">Generated via Bakaziki App • Built for Friends with Hearts ❤️</p>
          </div>
          
        </div>
      </div>
    </>
  );
}