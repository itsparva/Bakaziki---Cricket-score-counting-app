import React, { useState } from "react";
import PostMatchSummary from "./PostMatchSummary";
import useMatchScoring from "../hooks/useMatchScoring";
import ExitModal from "./ExitModal";
import ExtraModal from "./ExtraModal";
import WicketModal from "./WicketModal";

const MiniBallIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <circle cx="16" cy="16" r="14" fill="url(#ballGradConsole)" />
    <path d="M16 3c2 5 2 21 0 26" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.6" strokeDasharray="2.5 2.5" />
    <defs>
      <radialGradient id="ballGradConsole" cx="0.35" cy="0.28" r="0.8">
        <stop offset="0%" stopColor="#d6425a" />
        <stop offset="55%" stopColor="#8B1220" />
        <stop offset="100%" stopColor="#430A10" />
      </radialGradient>
    </defs>
  </svg>
);

const THEME_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,800;0,9..144,900;1,9..144,700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');

  .font-display { font-family: 'Fraunces', serif; }
  .font-mono-score { font-family: 'Space Mono', monospace; }

  .btn-press { transition: transform 0.12s ease, box-shadow 0.15s ease, background 0.2s ease; }
  .btn-press:active { transform: scale(0.95); }

  .scorecard-panel { background: #0d0d0d; border: 1px solid rgba(212,175,55,0.14); }
  .field-dark { background: #060606; border: 1px solid #1c1c1c; }

  .glow-red { animation: glowRed 2.2s ease-in-out infinite; }
  @keyframes glowRed {
    0%, 100% { box-shadow: 0 0 0 rgba(185,28,43,0); }
    50%      { box-shadow: 0 0 26px rgba(185,28,43,0.55); }
  }
  .glow-gold { animation: glowGold 2.2s ease-in-out infinite; }
  @keyframes glowGold {
    0%, 100% { box-shadow: 0 0 0 rgba(212,175,55,0); }
    50%      { box-shadow: 0 0 24px rgba(212,175,55,0.45); }
  }

  @media (prefers-reduced-motion: reduce) {
    .glow-red, .glow-gold { animation: none !important; }
    .btn-press { transition: none; }
  }
`;

export default function UmpireConsole({ matchData, onEndMatch }) {
  const scoring = useMatchScoring(matchData);

  const [wicketModal, setWicketModal] = useState({ isOpen: false, type: "", fielder: "", runOutBatsman: "", runOutRuns: 0, runOutEnd: "" });
  const [extraModal, setExtraModal] = useState({ isOpen: false, type: "WD", runs: 0 });
  const [exitModalOpen, setExitModalOpen] = useState(false);

  if (scoring.matchComplete) {
    let resultMsg = "Match Tied!";
    if (scoring.matchStage === 'superOver') {
      const isWin = scoring.runs >= scoring.firstInningsStats.target;
      if (isWin) resultMsg = `${matchData[scoring.battingTeam]} Won the Super Over!`;
      else if (scoring.firstInningsStats.runs > scoring.runs) resultMsg = `${scoring.firstInningsStats.team} Won the Super Over!`;
      else resultMsg = "Super Over Tied!";
    } else {
      const isWin = scoring.runs >= scoring.firstInningsStats.target;
      if (isWin) resultMsg = `${matchData[scoring.battingTeam]} Won by ${scoring.totalWickets - scoring.wickets} wickets!`;
      else if (scoring.firstInningsStats.runs > scoring.runs) resultMsg = `${scoring.firstInningsStats.team} Won by ${scoring.firstInningsStats.runs - scoring.runs} runs!`;
    }

    const finalData = {
      isSuperOver: scoring.matchStage === 'superOver',
      regularStats: scoring.regularStats,
      superOverStats: scoring.matchStage === 'superOver' ? { t1: scoring.firstInningsStats, t2: { team: matchData[scoring.battingTeam], runs: scoring.runs, wickets: scoring.wickets, stats: scoring.stats } } : null,
      t1: scoring.matchStage === 'regular' ? scoring.firstInningsStats : scoring.regularStats.t1,
      t2: scoring.matchStage === 'regular' ? { team: matchData[scoring.battingTeam], runs: scoring.runs, wickets: scoring.wickets, stats: scoring.stats } : scoring.regularStats.t2,
      resultMessage: resultMsg,
      setupData: matchData.setupData,
      matchId: matchData.matchId,
    };
    return <PostMatchSummary finalData={finalData} onExit={onEndMatch}/>;
  }

  if ((!scoring.striker || !scoring.nonStriker) && !scoring.isLastManStanding && !scoring.isInningsComplete) {
    const missingRole = !scoring.striker ? "Striker" : "Non-Striker";
    const available = matchData[scoring.battingTeamKey].filter(p => p !== scoring.striker && p !== scoring.nonStriker && scoring.stats.batting[p] && !scoring.stats.batting[p].out);
    
    // --- NEW: Get Batting Team Name ---
    const battingTeamName = matchData[scoring.battingTeam];

    return (
      <div className="p-6 h-full bg-[#060606] text-[#EDE6D6] flex flex-col relative font-sans">
        <style>{THEME_STYLES}</style>
        <div className="absolute -top-16 -left-20 w-[50%] h-[25%] bg-[#D4AF37]/[0.05] blur-[100px] rounded-full pointer-events-none z-0" />

        <div className="relative z-10 flex justify-between items-start mb-6">
          <div>
            {scoring.matchStage === 'superOver' && (
              <span className="text-[#EDE6D6] bg-white/10 border border-white/25 font-black tracking-widest uppercase inline-block text-xs mb-2 px-2 py-0.5 rounded-sm">
                Super Over
              </span>
            )}
            <h3 className="font-display text-2xl font-black text-[#D4AF37] uppercase">Select {missingRole}</h3>
            <p className="text-xs font-bold text-[#EDE6D6]/50 uppercase tracking-widest mt-2 border-l-2 border-[#D4AF37] pl-2">
              For {battingTeamName}
            </p>
          </div>
          <button onClick={() => setExitModalOpen(true)} className="btn-press text-[#EDE6D6]/40 hover:text-[#e0616f] font-bold transition-colors mt-1">✕ Exit</button>
        </div>
        
        <div className="relative z-10 space-y-2 flex-1 overflow-y-auto">
          {available.map((p) => (
            <button
              key={p}
              onClick={() => (!scoring.striker ? scoring.setStriker(p) : scoring.setNonStriker(p))}
              className="btn-press w-full p-4 rounded-sm font-display font-bold text-left scorecard-panel hover:border-[#D4AF37]/40 text-[#D4AF37] transition-all"
            >
              {p}
            </button>
          ))}
        </div>
        <ExitModal isOpen={exitModalOpen} onClose={() => setExitModalOpen(false)} onConfirm={onEndMatch} />
      </div>
    );
  }

  if (!scoring.bowler && !scoring.isInningsComplete) {
    const prevOverBowler = scoring.pastOvers.length > 0 ? scoring.historyStack[scoring.historyStack.length - 1]?.bowler : null;
    const available = matchData[scoring.bowlingTeamKey];
    
    // --- NEW: Get Bowling Team Name ---
    const bowlingTeamName = matchData[scoring.battingTeam === "teamA" ? "teamB" : "teamA"];

    return (
      <div className="p-6 h-full bg-[#060606] text-[#EDE6D6] flex flex-col relative font-sans">
        <style>{THEME_STYLES}</style>
        <div className="absolute -top-16 -right-20 w-[50%] h-[25%] bg-[#D4AF37]/[0.05] blur-[100px] rounded-full pointer-events-none z-0" />

        <div className="relative z-10 flex justify-between items-start mb-6">
          <div>
            {scoring.matchStage === 'superOver' && (
              <span className="text-[#EDE6D6] bg-white/10 border border-white/25 font-black tracking-widest uppercase inline-block text-xs mb-2 px-2 py-0.5 rounded-sm">
                Super Over
              </span>
            )}
            <h3 className="font-display text-2xl font-black text-[#D4AF37] uppercase">Select Bowler</h3>
            <p className="text-xs font-bold text-[#EDE6D6]/50 uppercase tracking-widest mt-2 border-l-2 border-[#D4AF37] pl-2">
              From {bowlingTeamName}
            </p>
          </div>
          <button onClick={() => setExitModalOpen(true)} className="btn-press text-[#EDE6D6]/40 hover:text-[#e0616f] font-bold transition-colors mt-1">✕ Exit</button>
        </div>

        <div className="relative z-10 space-y-2 flex-1 overflow-y-auto">
          {available.map((p) => {
            const bStats = scoring.getBowlerStats(p);
            const isRestricted = (p === prevOverBowler && available.length > 1) || bStats.isFinished;
            
            return (
              <button 
                key={p} 
                onClick={() => scoring.setBowler(p)} 
                disabled={isRestricted} 
                className={`btn-press w-full p-4 rounded-sm font-bold text-left border transition-all ${
                  isRestricted
                    ? "bg-[#0a0a0a] border-[#161616] text-[#EDE6D6]/25 opacity-60"
                    : "scorecard-panel hover:border-[#D4AF37]/40 text-[#D4AF37]"
                }`}
              >
                <div className="flex justify-between items-center gap-3">
                  <span className="font-display truncate">{p}</span>
                  <span className={`shrink-0 text-[10px] uppercase font-bold px-2 py-1 rounded-sm font-mono-score ${bStats.remaining > 0 ? 'bg-[#141414] text-[#EDE6D6]/50' : 'bg-[#B91C2B]/15 text-[#e0616f]'}`}>
                    {bStats.isFinished ? "Dusro se bhi dalva liya karo " : `${bStats.remaining} overs left`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <ExitModal isOpen={exitModalOpen} onClose={() => setExitModalOpen(false)} onConfirm={onEndMatch} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#060606] text-[#EDE6D6] select-none relative font-sans">
      <style>{THEME_STYLES}</style>
      <ExitModal isOpen={exitModalOpen} onClose={() => setExitModalOpen(false)} onConfirm={onEndMatch} />
      <ExtraModal extraModal={extraModal} setExtraModal={setExtraModal} confirmExtra={() => { scoring.processExtra(extraModal.type, extraModal.runs); setExtraModal({ isOpen: false, type: "WD", runs: 0 }); }} />
      <WicketModal wicketModal={wicketModal} setWicketModal={setWicketModal} confirmWicket={() => { scoring.processWicket(wicketModal); setWicketModal({ isOpen: false, type: "", fielder: "", runOutBatsman: "", runOutRuns: 0, runOutEnd: "" }); }} striker={scoring.striker} nonStriker={scoring.nonStriker} fieldingTeamList={scoring.fieldingTeamList} />

      {/* --- STICKY SCOREBOARD HEADER --- */}
      <div className="relative bg-[#0a0a0a] pt-5 pb-3 px-4 border-b border-[#D4AF37]/15 shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-10 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`text-xs font-bold animate-pulse uppercase tracking-widest px-2 py-1 rounded-sm font-mono-score ${scoring.matchStage === 'superOver' ? 'bg-white/10 text-[#EDE6D6] border border-white/25' : 'bg-[#B91C2B]/15 text-[#e0616f]'}`}>
              {scoring.matchStage === 'superOver' ? `SUPER OVER ${scoring.innings}` : `Inn ${scoring.innings}`}
            </span>
            <span className="text-xs text-[#D4AF37] font-mono-score tracking-widest bg-[#141414] px-2 py-1 rounded-sm">ID: {matchData.matchId}</span>
            {scoring.innings === 2 && scoring.firstInningsStats && (
              <span className="text-xs text-[#1B140A] font-bold bg-[#D4AF37] px-2 py-1 rounded-sm font-mono-score">Target: {scoring.firstInningsStats.target}</span>
            )}
          </div>
          <button onClick={() => setExitModalOpen(true)} className="btn-press text-[#EDE6D6]/40 hover:text-[#e0616f] font-bold transition-colors">✕ Exit</button>
        </div>

        <div className="text-center mb-3">
          <div className="flex justify-center items-baseline gap-2">
            <span className="font-mono-score text-5xl font-bold text-[#D4AF37] drop-shadow-[0_0_16px_rgba(212,175,55,0.35)]">{scoring.runs}</span>
            <span className="font-mono-score text-2xl text-[#EDE6D6]/30 font-bold">/</span>
            <span className="font-mono-score text-3xl font-bold text-[#EDE6D6]">{scoring.wickets}</span>
          </div>
          <p className="text-sm text-[#EDE6D6]/50 font-mono-score mt-1">
            Ov: <span className="text-[#D4AF37] font-bold">{Math.floor(scoring.balls / 6)}.{scoring.balls % 6}</span> / {scoring.targetOvers}
          </p>
          {scoring.innings === 2 && scoring.firstInningsStats && scoring.runs < scoring.firstInningsStats.target && (
            <p className="text-xs text-[#D4AF37]/80 mt-1 italic font-bold tracking-wide">Need {scoring.firstInningsStats.target - scoring.runs} runs in {scoring.targetOvers * 6 - scoring.balls} balls</p>
          )}
        </div>

        <div className="flex justify-between field-dark p-3 rounded-sm text-sm shadow-inner">
          <div className="flex-1">
            {scoring.striker && (
              <p className="text-[#D4AF37] font-bold truncate">
                🏏 {scoring.striker} 
                <span className="text-[#EDE6D6] ml-1 font-mono-score">
                  {scoring.stats.batting[scoring.striker]?.runs || 0} 
                  <span className="text-[#EDE6D6]/40 text-xs">({scoring.stats.batting[scoring.striker]?.balls || 0})</span>
                </span>
              </p>
            )}
            {scoring.isLastManStanding && <p className="text-[#e0616f] text-xs font-bold uppercase mt-1 pl-5">Last Standing</p>}
            {scoring.nonStriker && !scoring.isLastManStanding && (
              <p className="text-[#EDE6D6]/50 truncate pl-5 mt-1">
                {scoring.nonStriker} 
                <span className="text-[#EDE6D6]/40 ml-1 font-mono-score">
                  {scoring.stats.batting[scoring.nonStriker]?.runs || 0} 
                  <span className="text-xs">({scoring.stats.batting[scoring.nonStriker]?.balls || 0})</span>
                </span>
              </p>
            )}
          </div>
          <div className="text-right flex-1 border-l border-[#1c1c1c] pl-3">
            {scoring.bowler && (
              <>
                <p className="text-[#D4AF37] font-bold truncate flex items-center justify-end gap-1.5">
                  {scoring.bowler} <MiniBallIcon className="w-3.5 h-3.5" />
                </p>
                <p className="text-[#EDE6D6]/70 mt-1 font-mono-score">
                  {scoring.stats.bowling[scoring.bowler]?.wickets || 0} - {scoring.stats.bowling[scoring.bowler]?.runs || 0}
                  <span className="text-[#EDE6D6]/40 text-xs"> ({Math.floor((scoring.stats.bowling[scoring.bowler]?.balls || 0) / 6)}.{(scoring.stats.bowling[scoring.bowler]?.balls || 0) % 6})</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- SCROLLING BODY --- */}
      <div className="flex-1 overflow-y-auto bg-[#0d0d0d] p-4 flex flex-col relative">
        <div className="absolute -bottom-20 -right-20 w-[50%] h-[25%] bg-[#B91C2B]/[0.04] blur-[100px] rounded-full pointer-events-none z-0" />

        <div className="relative z-10 field-dark py-3 px-4 rounded-sm flex items-center overflow-x-auto shrink-0 mb-4">
          <span className="text-xs text-[#D4AF37]/70 font-bold uppercase mr-3 font-mono-score shrink-0">Over:</span>
          <div className="flex gap-2">
            {scoring.currentOverHistory.map((ball, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono-score shadow-md shrink-0 ${
                  ball === "W" || (ball.includes("W") && !ball.includes("WD"))
                    ? "bg-[#B91C2B] text-[#EDE6D6]"
                    : ball === "4" || ball === "6"
                    ? "bg-[#D4AF37] text-[#1B140A]"
                    : ball.includes("WD") || ball.includes("NB")
                    ? "bg-[#8a6c1a] text-[#1B140A]"
                    : "bg-[#1c1c1c] text-[#EDE6D6]/60"
                }`}
              >
                {ball}
              </div>
            ))}
          </div>
        </div>

        {scoring.isInningsComplete ? (
          <div className="relative z-10 mb-6 p-5 scorecard-panel rounded-sm text-center shadow-lg">
            <h3 className="font-display text-[#D4AF37] font-black mb-1 uppercase tracking-widest text-xl">
              {scoring.targetReached ? "Target Reached!" : scoring.isAllOut ? "All Out!" : "Overs Done!"}
            </h3>
            <button
              onClick={scoring.handleInningsTransition}
              className="btn-press glow-gold w-full mt-4 font-display text-[#1B140A] font-black text-lg py-4 rounded-sm shadow-lg uppercase"
              style={{ background: 'linear-gradient(180deg, #E4C158, #D4AF37 55%, #A6841E)' }}
            >
              {scoring.matchStage === 'regular' && scoring.innings === 2 && scoring.runs === scoring.firstInningsStats.target - 1 ? "Start Super Over!" : (scoring.innings === 1 ? "Start 2nd Innings" : "End Match")}
            </button>
          </div>
        ) : !scoring.isOverComplete ? (
          <div className="relative z-10 mb-6">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[0, 1, 2, 3, 4, 6].map((run) => (
                <button
                  key={run}
                  onClick={() => scoring.handleRun(run)}
                  className={`btn-press py-4 rounded-sm text-2xl font-bold font-mono-score shadow-sm transition-transform ${
                    run === 4 || run === 6
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40"
                      : "field-dark text-[#EDE6D6]"
                  }`}
                >
                  {run}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <button
                onClick={() => setExtraModal({ isOpen: true, type: "WD", runs: 0 })}
                className="btn-press w-full bg-[#8a6c1a]/15 text-[#D4AF37] border border-[#8a6c1a]/40 py-4 rounded-sm font-bold uppercase tracking-widest shadow-sm"
              >
                Add Extras (WD, NB, Byes)
              </button>
            </div>
            <button
              onClick={() => setWicketModal({ isOpen: true, type: "", fielder: "", runOutBatsman: "", runOutRuns: 0, runOutEnd: "" })}
              className="btn-press glow-red w-full font-display text-[#EDE6D6] font-black text-xl py-4 rounded-sm shadow-lg uppercase tracking-widest"
              style={{ background: 'linear-gradient(180deg, #9c2c3c, #B91C2B 60%, #5e1622)' }}
            >
              OUT! (Wicket)
            </button>
          </div>
        ) : (
          <div className="relative z-10 mb-6 p-4 scorecard-panel rounded-sm text-center">
            <h3 className="font-display text-[#D4AF37] font-bold mb-3 uppercase tracking-wider">Over Complete!</h3>
            <button
              onClick={scoring.handleStartNextOver}
              className="btn-press w-full font-display text-[#1B140A] font-black text-lg py-4 rounded-sm shadow-lg uppercase"
              style={{ background: 'linear-gradient(180deg, #E4C158, #D4AF37 55%, #A6841E)' }}
            >
              Confirm &amp; Pick Next Bowler
            </button>
          </div>
        )}

        <button
          onClick={scoring.handleUndo}
          disabled={scoring.historyStack.length === 0}
          className={`relative z-10 btn-press w-full py-3 rounded-sm uppercase text-sm font-bold flex items-center justify-center gap-2 mb-6 font-mono-score ${
            scoring.historyStack.length === 0 ? "bg-[#0a0a0a] text-[#EDE6D6]/20" : "field-dark text-[#EDE6D6]/60"
          }`}
        >
          <span>↺</span> Undo Last Action
        </button>

        <div className="relative z-10 mt-auto">
          <h3 className="text-xs font-bold text-[#D4AF37]/70 uppercase tracking-widest mb-3 border-b border-[#D4AF37]/15 pb-2 font-mono-score">
            Innings History
          </h3>
          {scoring.pastOvers.length === 0 ? (
            <p className="text-[#EDE6D6]/25 text-sm italic text-center py-4">No overs completed yet.</p>
          ) : (
            <div className="space-y-3 pb-4">
              {scoring.pastOvers.map((over, index) => (
                <div key={index} className="flex items-center gap-3 field-dark p-3 rounded-sm">
                  <span className="text-[#EDE6D6]/50 font-bold w-12 text-sm font-mono-score shrink-0">Ov {index + 1}</span>
                  <div className="flex gap-1 flex-wrap">
                    {over.map((ball, i) => {
                      let btnStyle = "bg-[#1c1c1c] text-[#EDE6D6]/50";
                      if (ball === "W" || (ball.includes("W") && !ball.includes("WD"))) btnStyle = "bg-[#B91C2B]/20 text-[#e0616f] border border-[#B91C2B]/30";
                      if (ball === "4" || ball === "6") btnStyle = "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30";
                      if (ball.includes("WD") || ball.includes("NB")) btnStyle = "bg-[#8a6c1a]/20 text-[#D4AF37] border border-[#8a6c1a]/40";
                      return (
                        <span key={i} className={`text-xs font-bold px-2 py-1 rounded-sm shadow-sm font-mono-score ${btnStyle}`}>
                          {ball}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}