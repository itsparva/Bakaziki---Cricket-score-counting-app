import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostMatchSummary from './PostMatchSummary';

export default function UmpireConsole({ matchData }) {
  const [innings, setInnings] = useState(1);
  const [firstInningsStats, setFirstInningsStats] = useState(null);
  const [matchComplete, setMatchComplete] = useState(false);
  const [battingTeam, setBattingTeam] = useState(
    matchData.optedTo === 'bat' ? matchData.tossWinner : (matchData.tossWinner === 'teamA' ? 'teamB' : 'teamA')
  );

  const battingTeamKey = battingTeam === 'teamA' ? 'playersA' : 'playersB';
  const bowlingTeamKey = battingTeam === 'teamA' ? 'playersB' : 'playersA';
  const fieldingTeamList = matchData[bowlingTeamKey];
  const targetOvers = parseInt(matchData.overs);
  const totalWickets = matchData[battingTeamKey].length;

  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [currentOverHistory, setCurrentOverHistory] = useState([]);
  const [pastOvers, setPastOvers] = useState([]);
  
  // NEW: Fall of Wickets Tracking
  const [fallOfWickets, setFallOfWickets] = useState([]);

  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [historyStack, setHistoryStack] = useState([]); 
  const [wicketModal, setWicketModal] = useState({ isOpen: false, type: '', fielder: '' });

  const getInitialStats = () => {
    const s = { batting: {}, bowling: {} };
    matchData[battingTeamKey].forEach(p => s.batting[p] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: '' });
    matchData[bowlingTeamKey].forEach(p => s.bowling[p] = { runs: 0, balls: 0, wickets: 0 });
    return s;
  };
  const [stats, setStats] = useState(getInitialStats());

  const isLastManStanding = wickets === totalWickets - 1;
  const isAllOut = wickets >= totalWickets;
  const isOversFinished = balls >= (targetOvers * 6);
  const targetReached = innings === 2 && firstInningsStats && runs >= firstInningsStats.target;
  const isInningsComplete = isAllOut || isOversFinished || targetReached;

  const validBallsInCurrentOver = currentOverHistory.filter(b => b !== 'WD' && b !== 'NB').length;
  const isOverComplete = validBallsInCurrentOver >= 6;

  const saveSnapshot = () => {
    setHistoryStack(prev => [...prev, JSON.parse(JSON.stringify({
      runs, wickets, balls, currentOverHistory, pastOvers,
      striker, nonStriker, bowler, stats, fallOfWickets
    }))]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const lastState = historyStack[historyStack.length - 1];
    setRuns(lastState.runs); setWickets(lastState.wickets); setBalls(lastState.balls);
    setCurrentOverHistory(lastState.currentOverHistory); setPastOvers(lastState.pastOvers);
    setStriker(lastState.striker); setNonStriker(lastState.nonStriker); setBowler(lastState.bowler);
    setStats(lastState.stats); setFallOfWickets(lastState.fallOfWickets);
    setHistoryStack(prev => prev.slice(0, -1));
  };

  const rotateStrike = (currentStriker, currentNonStriker) => {
    if (isLastManStanding) return; 
    setStriker(currentNonStriker);
    setNonStriker(currentStriker);
  };

  const handleRun = (runValue) => {
    saveSnapshot();
    setRuns(prev => prev + runValue);
    setBalls(prev => prev + 1);
    setCurrentOverHistory(prev => [...prev, runValue.toString()]);

    const newStats = { ...stats };
    newStats.batting[striker].runs += runValue;
    newStats.batting[striker].balls += 1;
    if (runValue === 4) newStats.batting[striker].fours += 1;
    if (runValue === 6) newStats.batting[striker].sixes += 1;
    newStats.bowling[bowler].runs += runValue;
    newStats.bowling[bowler].balls += 1;
    setStats(newStats);

    if (runValue % 2 !== 0) rotateStrike(striker, nonStriker);
  };

  const handleExtra = (type) => {
    saveSnapshot();
    setRuns(prev => prev + 1);
    setCurrentOverHistory(prev => [...prev, type]);
    const newStats = { ...stats };
    newStats.bowling[bowler].runs += 1;
    setStats(newStats);
  };

  const triggerWicketModal = () => {
    setWicketModal({ isOpen: true, type: '', fielder: '' });
  };

  const confirmWicket = () => {
    saveSnapshot();
    
    // Record Fall of Wicket
    const overString = `${Math.floor(balls / 6)}.${balls % 6}`;
    setFallOfWickets(prev => [...prev, { score: runs, wicket: wickets + 1, over: overString, player: striker }]);

    setWickets(prev => prev + 1);
    setBalls(prev => prev + 1);
    setCurrentOverHistory(prev => [...prev, 'W']);

    const newStats = { ...stats };
    newStats.batting[striker].out = true;
    newStats.batting[striker].balls += 1;

    let dismissalStr = '';
    const { type, fielder } = wicketModal;
    if (type === 'Bowled') dismissalStr = `b ${bowler}`;
    else if (type === 'LBW') dismissalStr = `lbw b ${bowler}`;
    else if (type === 'Caught') dismissalStr = `c ${fielder} b ${bowler}`;
    else if (type === 'Run Out') dismissalStr = `run out (${fielder})`;
    else if (type === 'Stumped') dismissalStr = `st ${fielder} b ${bowler}`;
    else dismissalStr = type;

    newStats.batting[striker].dismissal = dismissalStr;

    if (type !== 'Run Out') newStats.bowling[bowler].wickets += 1;
    newStats.bowling[bowler].balls += 1;
    
    setStats(newStats);
    setStriker(null); 
    if (wickets + 1 === totalWickets - 1) {
      setStriker(nonStriker);
      setNonStriker(null);
    }
    setWicketModal({ isOpen: false, type: '', fielder: '' });
  };

  const handleStartNextOver = () => {
    saveSnapshot();
    setPastOvers(prev => [...prev, currentOverHistory]);
    setCurrentOverHistory([]);
    rotateStrike(striker, nonStriker); 
    setBowler(null); 
  };

  const handleInningsTransition = () => {
    if (innings === 1) {
      setFirstInningsStats({ team: matchData[battingTeam], runs, wickets, target: runs + 1, stats, fallOfWickets });
      setInnings(2);
      setBattingTeam(battingTeam === 'teamA' ? 'teamB' : 'teamA');
      setRuns(0); setWickets(0); setBalls(0);
      setCurrentOverHistory([]); setPastOvers([]); setHistoryStack([]); setFallOfWickets([]);
      setStriker(null); setNonStriker(null); setBowler(null);
    } else {
      setMatchComplete(true);
    }
  };

  useEffect(() => {
    if (innings === 2 && runs === 0 && balls === 0) setStats(getInitialStats());
  }, [innings]);

 // --- SYNC WITH BACKEND (UPDATED PAYLOAD) ---
  useEffect(() => {
    // FIX: Now it also syncs the moment both strikers are selected!
    if (balls > 0 || wickets > 0 || matchComplete || (striker && nonStriker)) {
      const payload = {
        liveState: { innings, battingTeam: matchData[battingTeam], firstInningsStats, runs, wickets, balls, currentOverHistory, pastOvers, striker, nonStriker, bowler, fallOfWickets },
        stats: stats,
        isComplete: matchComplete,
        finalResult: matchComplete ? { t1: firstInningsStats, t2: { team: matchData[battingTeam], runs, wickets, stats }, resultMessage: "Match Over" } : null
      };

      axios.put(`https://gullyscorer-api.onrender.com/api/match/${matchData.matchId}`, payload)
        .catch(err => console.error("Failed to sync score", err));
    }
  }, [runs, wickets, balls, currentOverHistory, striker, nonStriker, bowler, matchComplete]);

  // ================= RENDER LOGIC =================
  if (matchComplete) {
    const t2Name = matchData[battingTeam];
    const isWin = runs >= firstInningsStats.target;
    const totalWicketsAvailable = matchData[battingTeam === 'teamA' ? 'playersA' : 'playersB'].length;
    let resultMsg = "Match Tied!";
    if (isWin) resultMsg = `${t2Name} Won by ${totalWicketsAvailable - wickets} wickets!`;
    else if (firstInningsStats.runs > runs) resultMsg = `${firstInningsStats.team} Won by ${firstInningsStats.runs - runs} runs!`;

    const finalData = { t1: firstInningsStats, t2: { team: t2Name, runs, wickets, stats }, resultMessage: resultMsg };
    return <PostMatchSummary finalData={finalData} />;
  }

  if (wickets === 0 && !striker && !nonStriker && !isInningsComplete) {
    const available = matchData[battingTeamKey];
    return (
      <div className="p-6 h-full bg-slate-950 text-white flex flex-col">
        <h3 className="text-xl font-bold text-amber-500 mb-4 uppercase">Select Opening Batsmen</h3>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {available.map(p => (
            <button key={p} onClick={() => striker ? setNonStriker(p) : setStriker(p)} disabled={striker === p} className={`w-full p-4 rounded-xl font-bold text-left border transition-all ${striker === p ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}>{p} {striker === p && '(Striker)'}</button>
          ))}
        </div>
      </div>
    );
  }

  if (!striker && !isLastManStanding && !isInningsComplete) {
    const available = matchData[battingTeamKey].filter(p => p !== nonStriker && !stats.batting[p].out);
    return (
      <div className="p-6 h-full bg-slate-950 text-white flex flex-col">
        <h3 className="text-xl font-bold text-amber-500 mb-4 uppercase">Select Next Batsman</h3>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {available.map(p => (
            <button key={p} onClick={() => setStriker(p)} className="w-full p-4 rounded-xl font-bold text-left bg-slate-900 border border-slate-700 active:scale-95 text-emerald-400">{p}</button>
          ))}
        </div>
      </div>
    );
  }

  if (!bowler && !isInningsComplete) {
    const prevOverBowler = pastOvers.length > 0 ? historyStack[historyStack.length - 1]?.bowler : null;
    const available = matchData[bowlingTeamKey];
    return (
      <div className="p-6 h-full bg-slate-950 text-white flex flex-col">
        <h3 className="text-xl font-bold text-emerald-500 mb-4 uppercase">Select Bowler</h3>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {available.map(p => {
            const isRestricted = p === prevOverBowler && available.length > 1;
            return (
              <button key={p} onClick={() => setBowler(p)} disabled={isRestricted} className={`w-full p-4 rounded-xl font-bold text-left border transition-all ${isRestricted ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-50' : 'bg-slate-900 border-slate-700 active:scale-95 text-amber-400'}`}>{p} {isRestricted && '(Bowled last over)'}</button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none relative">
      
      {/* WICKET MODAL */}
      {wicketModal.isOpen && (
        <div className="absolute inset-0 bg-slate-950/90 z-50 p-6 flex flex-col justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xl font-black text-red-500 uppercase mb-4 text-center">How was {striker} out?</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped'].map(type => (
                <button key={type} onClick={() => setWicketModal({...wicketModal, type, fielder: ''})} className={`py-3 rounded-lg font-bold border transition-colors ${wicketModal.type === type ? 'bg-red-500 text-white border-red-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{type}</button>
              ))}
            </div>
            {['Caught', 'Run Out', 'Stumped'].includes(wicketModal.type) && (
              <div className="mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Select Fielder</p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {fieldingTeamList.map(fielder => (
                    <button key={fielder} onClick={() => setWicketModal({...wicketModal, fielder})} className={`py-2 px-2 text-sm rounded-lg font-bold border transition-colors ${wicketModal.fielder === fielder ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{fielder}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setWicketModal({isOpen: false, type: '', fielder: ''})} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold">Cancel</button>
              <button onClick={confirmWicket} disabled={!wicketModal.type || (['Caught', 'Run Out', 'Stumped'].includes(wicketModal.type) && !wicketModal.fielder)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black uppercase disabled:opacity-50 disabled:bg-slate-700">Confirm Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Scoreboard */}
      <div className="bg-slate-900 pt-5 pb-3 px-4 border-b border-slate-800 shadow-xl z-10 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-red-500 animate-pulse uppercase tracking-widest px-2 py-1 bg-red-500/10 rounded-lg">Inn {innings}</span>
          <span className="text-xs text-amber-500 font-mono tracking-widest bg-slate-800 px-2 py-1 rounded">ID: {matchData.matchId}</span>
          {innings === 2 && firstInningsStats && <span className="text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded-lg">Target: {firstInningsStats.target}</span>}
        </div>
        
        <div className="text-center mb-3">
          <div className="flex justify-center items-baseline gap-2">
            <span className="text-5xl font-black text-amber-500">{runs}</span>
            <span className="text-2xl text-slate-500 font-bold">/</span>
            <span className="text-3xl font-bold text-white">{wickets}</span>
          </div>
          <p className="text-sm text-slate-400 font-mono mt-1">
            Ov: <span className="text-emerald-400 font-bold">{Math.floor(balls/6)}.{balls%6}</span> / {targetOvers}
          </p>
          {innings === 2 && firstInningsStats && runs < firstInningsStats.target && (
            <p className="text-xs text-amber-500/90 mt-1 italic font-bold tracking-wide">
              Need {firstInningsStats.target - runs} runs in {(targetOvers * 6) - balls} balls
            </p>
          )}
        </div>

        <div className="flex justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm shadow-inner">
          <div className="flex-1">
            {striker && <p className="text-emerald-400 font-bold truncate">🏏 {striker} <span className="text-white ml-1">{stats.batting[striker].runs} <span className="text-slate-500 text-xs">({stats.batting[striker].balls})</span></span></p>}
            {nonStriker && !isLastManStanding && <p className="text-slate-400 truncate pl-5 mt-1">{nonStriker} <span className="text-slate-500 ml-1">{stats.batting[nonStriker].runs} <span className="text-xs">({stats.batting[nonStriker].balls})</span></span></p>}
            {isLastManStanding && <p className="text-red-400 text-xs font-bold uppercase mt-1 pl-5">Last Man</p>}
          </div>
          <div className="text-right flex-1 border-l border-slate-800 pl-3">
            {bowler && (
              <>
                <p className="text-amber-400 font-bold truncate">⚾ {bowler}</p>
                <p className="text-slate-300 mt-1">{stats.bowling[bowler].wickets} - {stats.bowling[bowler].runs} <span className="text-slate-500 text-xs">({Math.floor(stats.bowling[bowler].balls/6)}.{stats.bowling[bowler].balls%6})</span></p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Pad */}
      <div className="flex-1 overflow-y-auto bg-slate-900 p-4 flex flex-col">
        <div className="bg-slate-950 py-3 px-4 border border-slate-800 rounded-xl flex items-center overflow-x-auto shrink-0 mb-4">
          <span className="text-xs text-slate-500 font-bold uppercase mr-3">Over:</span>
          <div className="flex gap-2">
            {currentOverHistory.map((ball, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${ball === 'W' ? 'bg-red-500 text-white' : ball === '4' || ball === '6' ? 'bg-emerald-500 text-slate-950' : ball === 'WD' || ball === 'NB' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{ball}</div>
            ))}
          </div>
        </div>

        {isInningsComplete ? (
           <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center shadow-lg">
             <h3 className="text-amber-400 font-black mb-1 uppercase tracking-widest text-xl">{targetReached ? "Target Reached!" : isAllOut ? "All Out!" : "Overs Done!"}</h3>
             <button onClick={handleInningsTransition} className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-lg py-4 rounded-xl shadow-lg active:scale-95 uppercase">{innings === 1 ? "Start 2nd Innings" : "End Match"}</button>
           </div>
        ) : !isOverComplete ? (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[0, 1, 2, 3, 4, 6].map((run) => <button key={run} onClick={() => handleRun(run)} className={`py-4 rounded-2xl text-2xl font-black shadow-sm active:scale-95 transition-transform ${run === 4 || run === 6 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-white'}`}>{run}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => handleExtra('WD')} className="bg-amber-500/20 text-amber-500 border border-amber-500/30 py-3 rounded-2xl font-bold active:scale-95">Wide (WD)</button>
              <button onClick={() => handleExtra('NB')} className="bg-amber-500/20 text-amber-500 border border-amber-500/30 py-3 rounded-2xl font-bold active:scale-95">No Ball (NB)</button>
            </div>
            <button onClick={triggerWicketModal} className="w-full bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black text-xl py-4 rounded-2xl shadow-lg uppercase tracking-widest">OUT! (Wicket)</button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-2xl text-center">
            <h3 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider">Over Complete!</h3>
            <button onClick={handleStartNextOver} className="w-full bg-emerald-500 text-slate-950 font-black text-lg py-4 rounded-xl shadow-lg active:scale-95 uppercase">Confirm & Pick Next Bowler</button>
          </div>
        )}

        <button onClick={handleUndo} disabled={historyStack.length === 0} className={`w-full py-3 rounded-xl uppercase text-sm font-bold flex items-center justify-center gap-2 mb-6 ${historyStack.length === 0 ? 'bg-slate-900 text-slate-700' : 'bg-slate-800 text-slate-400 active:scale-95'}`}>
          <span>↺</span> Undo Last Action
        </button>

        <div className="mt-auto">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Innings History</h3>
          {pastOvers.length === 0 ? <p className="text-slate-600 text-sm italic text-center py-4">No overs completed yet.</p> : (
            <div className="space-y-3 pb-4">
              {pastOvers.map((over, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-bold w-12 text-sm">Ov {index + 1}</span>
                  <div className="flex gap-1 flex-wrap">
                    {over.map((ball, i) => {
                      let btnStyle = 'bg-slate-800 text-slate-300';
                      if (ball === 'W') btnStyle = 'bg-red-500/20 text-red-400 border border-red-500/30';
                      if (ball === '4' || ball === '6') btnStyle = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                      if (ball === 'WD' || ball === 'NB') btnStyle = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                      return <span key={i} className={`text-xs font-bold px-2 py-1 rounded shadow-sm ${btnStyle}`}>{ball}</span>;
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