import React, { useState } from "react";
import PostMatchSummary from "./PostMatchSummary";
import useMatchScoring from "../hooks/useMatchScoring";
import ExitModal from "./ExitModal";
import ExtraModal from "./ExtraModal";
import WicketModal from "./WicketModal";

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
    };
    return <PostMatchSummary finalData={finalData} />;
  }

  if ((!scoring.striker || !scoring.nonStriker) && !scoring.isLastManStanding && !scoring.isInningsComplete) {
    const missingRole = !scoring.striker ? "Striker" : "Non-Striker";
    const available = matchData[scoring.battingTeamKey].filter(p => p !== scoring.striker && p !== scoring.nonStriker && scoring.stats.batting[p] && !scoring.stats.batting[p].out);
    return (
      <div className="p-6 h-full bg-slate-950 text-white flex flex-col relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-amber-500 uppercase">{scoring.matchStage === 'superOver' && <span className="text-red-500 block text-xs">SUPER OVER</span>} Select {missingRole}</h3>
          <button onClick={() => setExitModalOpen(true)} className="text-slate-500 hover:text-red-400 font-bold active:scale-95 transition-transform">✕ Exit</button>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {available.map((p) => (
            <button key={p} onClick={() => (!scoring.striker ? scoring.setStriker(p) : scoring.setNonStriker(p))} className="w-full p-4 rounded-xl font-bold text-left bg-slate-900 border border-slate-700 hover:bg-slate-800 active:scale-95 text-emerald-400 transition-all">{p}</button>
          ))}
        </div>
        <ExitModal isOpen={exitModalOpen} onClose={() => setExitModalOpen(false)} onConfirm={onEndMatch} />
      </div>
    );
  }

  if (!scoring.bowler && !scoring.isInningsComplete) {
    const prevOverBowler = scoring.pastOvers.length > 0 ? scoring.historyStack[scoring.historyStack.length - 1]?.bowler : null;
    const available = matchData[scoring.bowlingTeamKey];
    return (
      <div className="p-6 h-full bg-slate-950 text-white flex flex-col relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-emerald-500 uppercase">{scoring.matchStage === 'superOver' && <span className="text-red-500 block text-xs">SUPER OVER</span>} Select Bowler</h3>
          <button onClick={() => setExitModalOpen(true)} className="text-slate-500 hover:text-red-400 font-bold active:scale-95 transition-transform">✕ Exit</button>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {available.map((p) => {
            const isRestricted = p === prevOverBowler && available.length > 1;
            return (
              <button key={p} onClick={() => scoring.setBowler(p)} disabled={isRestricted} className={`w-full p-4 rounded-xl font-bold text-left border transition-all ${isRestricted ? "bg-slate-950 border-slate-800 text-slate-600 opacity-50" : "bg-slate-900 border-slate-700 active:scale-95 text-amber-400"}`}>{p} {isRestricted && "(Bowled last over)"}</button>
            );
          })}
        </div>
        <ExitModal isOpen={exitModalOpen} onClose={() => setExitModalOpen(false)} onConfirm={onEndMatch} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none relative">
      <ExitModal isOpen={exitModalOpen} onClose={() => setExitModalOpen(false)} onConfirm={onEndMatch} />
      <ExtraModal extraModal={extraModal} setExtraModal={setExtraModal} confirmExtra={() => { scoring.processExtra(extraModal.type, extraModal.runs); setExtraModal({ isOpen: false, type: "WD", runs: 0 }); }} />
      <WicketModal wicketModal={wicketModal} setWicketModal={setWicketModal} confirmWicket={() => { scoring.processWicket(wicketModal); setWicketModal({ isOpen: false, type: "", fielder: "", runOutBatsman: "", runOutRuns: 0, runOutEnd: "" }); }} striker={scoring.striker} nonStriker={scoring.nonStriker} fieldingTeamList={scoring.fieldingTeamList} />

      <div className="bg-slate-900 pt-5 pb-3 px-4 border-b border-slate-800 shadow-xl z-10 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-2 items-center">
            <span className={`text-xs font-bold animate-pulse uppercase tracking-widest px-2 py-1 rounded-lg ${scoring.matchStage === 'superOver' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' : 'bg-red-500/10 text-red-500'}`}>
              {scoring.matchStage === 'superOver' ? `SUPER OVER ${scoring.innings}` : `Inn ${scoring.innings}`}
            </span>
            <span className="text-xs text-amber-500 font-mono tracking-widest bg-slate-800 px-2 py-1 rounded">ID: {matchData.matchId}</span>
            {scoring.innings === 2 && scoring.firstInningsStats && (
              <span className="text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded-lg">Target: {scoring.firstInningsStats.target}</span>
            )}
          </div>
          <button onClick={() => setExitModalOpen(true)} className="text-slate-500 hover:text-red-400 font-bold active:scale-95 transition-transform">✕ Exit</button>
        </div>

        <div className="text-center mb-3">
          <div className="flex justify-center items-baseline gap-2">
            <span className="text-5xl font-black text-amber-500">{scoring.runs}</span>
            <span className="text-2xl text-slate-500 font-bold">/</span>
            <span className="text-3xl font-bold text-white">{scoring.wickets}</span>
          </div>
          <p className="text-sm text-slate-400 font-mono mt-1">
            Ov: <span className="text-emerald-400 font-bold">{Math.floor(scoring.balls / 6)}.{scoring.balls % 6}</span> / {scoring.targetOvers}
          </p>
          {scoring.innings === 2 && scoring.firstInningsStats && scoring.runs < scoring.firstInningsStats.target && (
            <p className="text-xs text-amber-500/90 mt-1 italic font-bold tracking-wide">Need {scoring.firstInningsStats.target - scoring.runs} runs in {scoring.targetOvers * 6 - scoring.balls} balls</p>
          )}
        </div>

        <div className="flex justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm shadow-inner">
          <div className="flex-1">
            {scoring.striker && (
              <p className="text-emerald-400 font-bold truncate">
                🏏 {scoring.striker} 
                <span className="text-white ml-1">
                  {scoring.stats.batting[scoring.striker]?.runs || 0} 
                  <span className="text-slate-500 text-xs">({scoring.stats.batting[scoring.striker]?.balls || 0})</span>
                </span>
              </p>
            )}
            {scoring.isLastManStanding && <p className="text-red-400 text-xs font-bold uppercase mt-1 pl-5">Last Man</p>}
            {scoring.nonStriker && !scoring.isLastManStanding && (
              <p className="text-slate-400 truncate pl-5 mt-1">
                {scoring.nonStriker} 
                <span className="text-slate-500 ml-1">
                  {scoring.stats.batting[scoring.nonStriker]?.runs || 0} 
                  <span className="text-xs">({scoring.stats.batting[scoring.nonStriker]?.balls || 0})</span>
                </span>
              </p>
            )}
          </div>
          <div className="text-right flex-1 border-l border-slate-800 pl-3">
            {scoring.bowler && (
              <>
                <p className="text-amber-400 font-bold truncate">⚾ {scoring.bowler}</p>
                <p className="text-slate-300 mt-1">{scoring.stats.bowling[scoring.bowler]?.wickets || 0} - {scoring.stats.bowling[scoring.bowler]?.runs || 0} <span className="text-slate-500 text-xs">({Math.floor((scoring.stats.bowling[scoring.bowler]?.balls || 0) / 6)}.{(scoring.stats.bowling[scoring.bowler]?.balls || 0) % 6})</span></p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-900 p-4 flex flex-col">
        <div className="bg-slate-950 py-3 px-4 border border-slate-800 rounded-xl flex items-center overflow-x-auto shrink-0 mb-4">
          <span className="text-xs text-slate-500 font-bold uppercase mr-3">Over:</span>
          <div className="flex gap-2">
            {scoring.currentOverHistory.map((ball, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${ball === "W" || (ball.includes("W") && !ball.includes("WD")) ? "bg-red-500 text-white" : ball === "4" || ball === "6" ? "bg-emerald-500 text-slate-950" : ball.includes("WD") || ball.includes("NB") ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>{ball}</div>
            ))}
          </div>
        </div>

        {scoring.isInningsComplete ? (
          <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center shadow-lg">
            <h3 className="text-amber-400 font-black mb-1 uppercase tracking-widest text-xl">{scoring.targetReached ? "Target Reached!" : scoring.isAllOut ? "All Out!" : "Overs Done!"}</h3>
            <button onClick={scoring.handleInningsTransition} className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-lg py-4 rounded-xl shadow-lg active:scale-95 uppercase">
              {scoring.matchStage === 'regular' && scoring.innings === 2 && scoring.runs === scoring.firstInningsStats.target - 1 ? "Start Super Over!" : (scoring.innings === 1 ? "Start 2nd Innings" : "End Match")}
            </button>
          </div>
        ) : !scoring.isOverComplete ? (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[0, 1, 2, 3, 4, 6].map((run) => (
                <button key={run} onClick={() => scoring.handleRun(run)} className={`py-4 rounded-2xl text-2xl font-black shadow-sm active:scale-95 transition-transform ${run === 4 || run === 6 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-white"}`}>{run}</button>
              ))}
            </div>
            <div className="mb-4">
              <button onClick={() => setExtraModal({ isOpen: true, type: "WD", runs: 0 })} className="w-full bg-amber-500/20 text-amber-500 border border-amber-500/30 py-4 rounded-2xl font-bold active:scale-95 uppercase tracking-widest shadow-sm">Add Extras (WD, NB, Byes)</button>
            </div>
            <button onClick={() => setWicketModal({ isOpen: true, type: "", fielder: "", runOutBatsman: "", runOutRuns: 0, runOutEnd: "" })} className="w-full bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black text-xl py-4 rounded-2xl shadow-lg uppercase tracking-widest">OUT! (Wicket)</button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-2xl text-center">
            <h3 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider">Over Complete!</h3>
            <button onClick={scoring.handleStartNextOver} className="w-full bg-emerald-500 text-slate-950 font-black text-lg py-4 rounded-xl shadow-lg active:scale-95 uppercase">Confirm & Pick Next Bowler</button>
          </div>
        )}

        <button onClick={scoring.handleUndo} disabled={scoring.historyStack.length === 0} className={`w-full py-3 rounded-xl uppercase text-sm font-bold flex items-center justify-center gap-2 mb-6 ${scoring.historyStack.length === 0 ? "bg-slate-900 text-slate-700" : "bg-slate-800 text-slate-400 active:scale-95"}`}>
          <span>↺</span> Undo Last Action
        </button>

        <div className="mt-auto">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Innings History</h3>
          {scoring.pastOvers.length === 0 ? (
            <p className="text-slate-600 text-sm italic text-center py-4">No overs completed yet.</p>
          ) : (
            <div className="space-y-3 pb-4">
              {scoring.pastOvers.map((over, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-bold w-12 text-sm">Ov {index + 1}</span>
                  <div className="flex gap-1 flex-wrap">
                    {over.map((ball, i) => {
                      let btnStyle = "bg-slate-800 text-slate-300";
                      if (ball === "W" || (ball.includes("W") && !ball.includes("WD"))) btnStyle = "bg-red-500/20 text-red-400 border border-red-500/30";
                      if (ball === "4" || ball === "6") btnStyle = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
                      if (ball.includes("WD") || ball.includes("NB")) btnStyle = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
                      return (<span key={i} className={`text-xs font-bold px-2 py-1 rounded shadow-sm ${btnStyle}`}>{ball}</span>);
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