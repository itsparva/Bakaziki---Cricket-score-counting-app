import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import PostMatchSummary from './PostMatchSummary';

const SERVER_URL = 'https://bakaziki-cricket-score-counting-app.onrender.com';

export default function SpectatorView({ matchId, onBack }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0); 
  const [recentEvent, setRecentEvent] = useState(null);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const response = await axios.get(`${SERVER_URL}/api/match/${matchId}`);
        setMatchData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Match not found or has not started yet.');
        setLoading(false);
      }
    };
    fetchMatch();

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      upgrade: false
    });
    
    socket.emit('joinMatch', matchId);

    socket.on('matchUpdate', (updatedData) => {
      setMatchData(updatedData);
    });

    return () => socket.disconnect();
  }, [matchId]);

  // --- Animation Trigger Logic (2.0 Seconds) ---
  useEffect(() => {
    if (matchData?.liveState?.currentOverHistory) {
      const history = matchData.liveState.currentOverHistory;
      if (history.length > 0) {
        const lastBall = history[history.length - 1];
        
        if (lastBall === '4' || lastBall === '6' || lastBall === 'W') {
          setRecentEvent(lastBall);
          const timer = setTimeout(() => setRecentEvent(null), 2000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [matchData?.liveState?.currentOverHistory]);

  if (loading) return <div className="h-full bg-slate-950 flex justify-center items-center text-emerald-400 font-bold">Connecting to Stadium...</div>;
  if (error) return <div className="h-full bg-slate-950 flex flex-col justify-center items-center text-red-500 font-bold p-6 text-center"><p>{error}</p><button onClick={onBack} className="mt-4 bg-slate-800 text-white px-4 py-2 rounded-lg">Go Back</button></div>;

  if (matchData.isComplete) {
    return <PostMatchSummary finalData={matchData.finalResult} />;
  }

  const { liveState, setupData, stats } = matchData;

  if (!liveState || Object.keys(liveState).length === 0 || !stats || !stats.batting) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-white justify-center items-center p-6 text-center select-none">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-2">Toss Done!</h2>
        <p className="text-slate-400">Waiting for the umpire to walk onto the field...</p>
        <button onClick={onBack} className="mt-8 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm">Leave Stadium</button>
      </div>
    );
  }

  const team1Name = setupData.optedTo === 'bat' ? setupData[setupData.tossWinner] : setupData[setupData.tossWinner === 'teamA' ? 'teamB' : 'teamA'];
  const team2Name = setupData.optedTo === 'bat' ? setupData[setupData.tossWinner === 'teamA' ? 'teamB' : 'teamA'] : setupData[setupData.tossWinner];
  
  const team1Key = setupData.teamA === team1Name ? 'playersA' : 'playersB';
  const team2Key = setupData.teamA === team2Name ? 'playersA' : 'playersB';

  const teams = [
    { name: team1Name, isLive: liveState.innings === 1, hasBatted: true, stats: liveState.innings === 1 ? stats : liveState.firstInningsStats?.stats, liveInfo: liveState.innings === 1 ? liveState : liveState.firstInningsStats, squadKey: team1Key },
    { name: team2Name, isLive: liveState.innings === 2, hasBatted: liveState.innings === 2, stats: liveState.innings === 2 ? stats : null, liveInfo: liveState.innings === 2 ? liveState : null, squadKey: team2Key }
  ];
  
  // --- FIXED: Removing "match." prefix to properly target setupData ---
  const checkCaptain = (playerName, teamName) => {
    if (teamName === setupData?.teamA && playerName === setupData?.captainA) return true;
    if (teamName === setupData?.teamB && playerName === setupData?.captainB) return true;
    return false;
  };

  let allOvers = [];
  if (liveState.pastOvers) allOvers = [...liveState.pastOvers];
  if (liveState.currentOverHistory && liveState.currentOverHistory.length > 0) {
    allOvers.push(liveState.currentOverHistory);
  }

  const renderGoogleScorecard = (teamObj) => {
    if (!teamObj.hasBatted) {
      return (
        <div className="animate-fade-in pb-20 p-4">
          <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4">Yet to Bat</h3>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            {setupData[teamObj.squadKey].map((player, idx) => (
              <div key={idx} className="py-2 border-b border-slate-800/50 text-slate-300 font-bold last:border-0">
                {player}
                {checkCaptain(player, teamObj.name) && <span className="ml-2 text-amber-500 text-[9px] px-1 rounded border border-amber-500/30">C</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    const { stats: teamStats, liveInfo, name: battingTeamName } = teamObj;
    const bowlingTeamName = battingTeamName === team1Name ? team2Name : team1Name; // Dynamically grab the other team
    const didNotBat = setupData[teamObj.squadKey].filter(p => teamStats.batting[p].balls === 0 && !teamStats.batting[p].out && liveInfo.striker !== p && liveInfo.nonStriker !== p);

    return (
      <div className="animate-fade-in pb-20">
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="flex text-[10px] text-slate-500 uppercase font-bold px-4 py-2 bg-slate-950">
            <span className="flex-1">Batter</span>
            <div className="flex gap-4">
              <span className="w-6 text-right">R</span><span className="w-6 text-right">B</span>
              <span className="w-6 text-right">4s</span><span className="w-6 text-right">6s</span>
              <span className="w-10 text-right">SR</span>
            </div>
          </div>
          
          <div className="px-4">
            {Object.keys(teamStats.batting).map(p => {
              const s = teamStats.batting[p];
              if (s.balls === 0 && !s.out && liveInfo.striker !== p && liveInfo.nonStriker !== p) return null;
              const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : 0;
              const isCurrentlyBatting = p === liveInfo.striker || p === liveInfo.nonStriker;

              return (
                <div key={p} className="py-3 border-b border-slate-800/50 flex flex-col justify-center">
                  <div className="flex items-center">
                    {/* --- FIXED: Added proper scoping to checkCaptain --- */}
                    <span className={`flex-1 font-bold ${s.out ? 'text-slate-300' : 'text-emerald-400'}`}>
                      {p} {isCurrentlyBatting ? '*' : ''}
                      {checkCaptain(p, battingTeamName) && <span className="ml-2 text-amber-500 text-[9px] px-1 rounded border border-amber-500/30">C</span>}
                    </span>
                    <div className="flex gap-4 text-sm">
                      <span className="w-6 text-right font-bold text-white">{s.runs}</span>
                      <span className="w-6 text-right text-slate-400">{s.balls}</span>
                      <span className="w-6 text-right text-slate-400">{s.fours}</span>
                      <span className="w-6 text-right text-slate-400">{s.sixes}</span>
                      <span className="w-10 text-right text-slate-500">{sr}</span>
                    </div>
                  </div>
                  {s.out && <span className="text-[11px] text-slate-500 italic mt-1 leading-none">{s.dismissal}</span>}
                </div>
              );
            })}
          </div>

          {didNotBat.length > 0 && (
            <div className="px-4 py-3 text-xs text-slate-400">
              <span className="font-bold uppercase tracking-widest text-slate-500">Yet to bat:</span> {didNotBat.join(', ')}
            </div>
          )}
        </div>

        {liveInfo.fallOfWickets && liveInfo.fallOfWickets.length > 0 && (
          <div className="px-4 py-4 border-b border-slate-800 bg-slate-900/50">
            <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Fall of Wickets</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {liveInfo.fallOfWickets.map(f => `${f.score}-${f.wicket} (${f.player}, ${f.over})`).join(', ')}
            </p>
          </div>
        )}

        <div className="bg-slate-900 mt-2 border-t border-slate-800">
          <div className="flex text-[10px] text-slate-500 uppercase font-bold px-4 py-2 bg-slate-950">
            <span className="flex-1">Bowler</span>
            <div className="flex gap-4">
              <span className="w-8 text-right">O</span><span className="w-8 text-right">R</span>
              <span className="w-8 text-right">W</span><span className="w-10 text-right">Econ</span>
            </div>
          </div>
          
          <div className="px-4">
            {Object.keys(teamStats.bowling).map(p => {
              const s = teamStats.bowling[p];
              if (s.balls === 0) return null;
              const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
              const econ = s.balls > 0 ? ((s.runs / s.balls) * 6).toFixed(1) : "0.0";
              const isCurrentlyBowling = p === liveInfo.bowler;

              return (
                <div key={p} className="py-3 border-b border-slate-800/50 flex items-center">
                  {/* --- FIXED: Checking the bowler's team --- */}
                  <span className={`flex-1 font-bold ${isCurrentlyBowling ? 'text-amber-400' : 'text-slate-300'}`}>
                    {p} {isCurrentlyBowling ? '*' : ''}
                    {checkCaptain(p, bowlingTeamName) && <span className="ml-2 text-amber-500 text-[9px] px-1 rounded border border-amber-500/30">C</span>}
                  </span>
                  <div className="flex gap-4 text-sm">
                    <span className="w-8 text-right text-slate-400">{overs}</span>
                    <span className="w-8 text-right text-white">{s.runs}</span>
                    <span className="w-8 text-right font-bold text-white">{s.wickets}</span>
                    <span className="w-10 text-right text-slate-500">{econ}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none relative overflow-hidden">
      
      {/* INJECTED CSS FOR MOTION GRAPHICS */}
      <style>
        {`
          @keyframes flySix {
            0% { transform: translate(-50px, 300px) scale(0.5); opacity: 1; }
            50% { transform: translate(150px, -50px) scale(2.5); opacity: 1; }
            100% { transform: translate(400px, 300px) scale(0.5); opacity: 0; }
          }
          @keyframes rollFour {
            0% { transform: translateX(-50px) rotate(0deg); opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateX(400px) rotate(1080deg); opacity: 0; }
          }
          @keyframes stumpBreak {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(45deg) translate(15px, 0px); opacity: 0; }
          }
          @keyframes bailFly {
            0% { transform: translate(0, 0) rotate(0deg); }
            100% { transform: translate(-30px, -40px) rotate(-180deg); opacity: 0; }
          }
          @keyframes textPop {
            0% { transform: scale(0.5); opacity: 0; }
            20% { transform: scale(1.2); opacity: 1; }
            80% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.8); opacity: 0; }
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* --- MOTION GRAPHICS OVERLAY --- */}
      {recentEvent && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
          {recentEvent === '6' && (
            <>
              <div style={{ animation: 'flySix 2s cubic-bezier(0.25, 1, 0.5, 1) forwards' }} className="absolute left-0 top-0">
                <div className="w-10 h-10 bg-red-600 rounded-full border-2 border-white shadow-2xl shadow-red-500 flex items-center justify-center">
                  <div className="w-full h-[2px] bg-white transform rotate-45"></div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'textPop 2s ease-in-out forwards' }}>
                <span className="text-8xl text-amber-400 font-black tracking-widest uppercase drop-shadow-[0_0_30px_rgba(251,191,36,1)] italic">SIX!!</span>
              </div>
            </>
          )}

          {recentEvent === '4' && (
            <>
              <div style={{ animation: 'rollFour 2s linear forwards' }} className="absolute left-0 bottom-32">
                <div className="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg shadow-red-500 flex items-center justify-center">
                  <div className="w-full h-[2px] bg-white transform -rotate-45"></div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'textPop 2s ease-in-out forwards' }}>
                <span className="text-7xl text-emerald-400 font-black tracking-widest uppercase drop-shadow-[0_0_30px_rgba(52,211,153,1)] italic">FOUR!</span>
              </div>
            </>
          )}

          {recentEvent === 'W' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40">
              <div className="relative w-32 h-40 mb-4">
                <div className="absolute bottom-0 w-full h-1 bg-slate-700"></div>
                <div className="absolute bottom-1 left-[20%] w-3 h-24 bg-amber-500 rounded-t-sm shadow-[inset_-2px_0_4px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute bottom-1 right-[20%] w-3 h-24 bg-amber-500 rounded-t-sm shadow-[inset_-2px_0_4px_rgba(0,0,0,0.3)]"></div>
                <div style={{ transformOrigin: 'bottom center', animation: 'stumpBreak 1s ease-out forwards' }} className="absolute bottom-1 left-[45%] w-3 h-24 bg-amber-500 rounded-t-sm shadow-[inset_-2px_0_4px_rgba(0,0,0,0.3)]"></div>
                <div style={{ transformOrigin: 'center', animation: 'bailFly 1s ease-out forwards' }} className="absolute bottom-24 left-[30%] w-6 h-1 bg-red-500 rounded-full"></div>
              </div>
              <span className="text-7xl text-red-500 font-black tracking-widest uppercase drop-shadow-[0_0_30px_rgba(239,68,68,1)]" style={{ animation: 'textPop 2s ease-in-out forwards' }}>OUT!</span>
            </div>
          )}
        </div>
      )}

      {/* Top Main Status Bar */}
      <div className="bg-slate-900 pt-5 pb-3 px-4 shrink-0 shadow-lg relative z-20 overflow-hidden">
        {/* --- NEW: BACKGROUND GRAPHICS (LOCAL FILES) --- */}
        <div 
          className="absolute inset-y-0 left-0 w-1/2 opacity-30 pointer-events-none" 
          style={{ 
            backgroundImage: "url('/lion.png')",
            backgroundSize: 'cover', 
            backgroundPosition: 'left center', 
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, transparent 100%)',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, transparent 100%)'
          }}
        ></div>
        <div 
          className="absolute inset-y-0 right-0 w-1/3 opacity-30 pointer-events-none" 
          style={{ 
            backgroundImage: "url('/phoenix.png')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'right center', 
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, transparent 100%)',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, transparent 100%)'
          }}
        ></div>

        <div className="flex justify-between items-center mb-4 relative z-10">
          <button onClick={onBack} className="text-xs text-slate-300 font-bold hover:text-white active:scale-95 transition-transform bg-slate-950/50 px-2 py-1 rounded">← Live Matches</button>
          <span className="text-[10px] font-black text-red-500 animate-pulse uppercase tracking-widest px-2 py-1 bg-red-500/20 rounded">Live</span>
        </div>
        
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-xl font-black text-white leading-none drop-shadow-md">{teams[0].name}</h2>
            {teams[0].hasBatted && (
              <p className="text-amber-400 font-black text-2xl mt-1 drop-shadow-md">
                {teams[0].liveInfo?.runs}<span className="text-lg text-slate-300">/{teams[0].liveInfo?.wickets}</span>
                <span className="text-sm font-mono text-amber-200/70 ml-2">({Math.floor((teams[0].liveInfo?.balls||0)/6)}.{(teams[0].liveInfo?.balls||0)%6})</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black text-white leading-none drop-shadow-md">{teams[1].name}</h2>
            {teams[1].hasBatted && (
              <p className="text-emerald-400 font-black text-2xl mt-1 drop-shadow-md">
                {teams[1].liveInfo?.runs}<span className="text-lg text-slate-300">/{teams[1].liveInfo?.wickets}</span>
                <span className="text-sm font-mono text-emerald-200/70 ml-2">({Math.floor((teams[1].liveInfo?.balls||0)/6)}.{(teams[1].liveInfo?.balls||0)%6})</span>
              </p>
            )}
          </div>
        </div>

        {allOvers.length > 0 && (
          <div className="mt-5 bg-slate-950/80 backdrop-blur-sm py-3 px-3 border border-slate-800/80 rounded-xl flex items-center overflow-x-auto shadow-inner hide-scrollbar scroll-smooth relative z-10">
            {allOvers.map((over, overIdx) => (
              <div key={overIdx} className="flex items-center shrink-0 border-r border-slate-800 pr-3 mr-3 last:border-0 last:pr-0 last:mr-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mr-2">Ov {overIdx + 1}</span>
                <div className="flex gap-1.5">
                  {over.map((ball, i) => {
                    let btnStyle = 'bg-slate-800 text-slate-300';
                    if (ball === 'W') btnStyle = 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]';
                    if (ball === '4' || ball === '6') btnStyle = 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                    if (ball.includes('WD') || ball.includes('NB')) btnStyle = 'bg-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
                    return (
                      <div key={i} className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center font-bold text-[9px] shadow-sm ${btnStyle}`}>
                        {ball}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {liveState.innings === 2 && (
           <div className="mt-3 relative z-10">
              <p className="text-xs font-bold text-amber-300 bg-slate-950/60 backdrop-blur-sm border border-slate-800/50 rounded-lg w-full text-center block py-2 drop-shadow-md tracking-wider">
                Need {(liveState.firstInningsStats?.target || 0) - liveState.runs} runs in {(parseInt(setupData.overs) * 6) - liveState.balls} balls
              </p>
           </div>
        )}
      </div>

      {/* The Tabs Slider */}
      <div className="flex shrink-0 bg-slate-900 border-b border-slate-800 relative z-10">
        {teams.map((team, idx) => (
          <button key={idx} onClick={() => setActiveTab(idx)} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors relative ${activeTab === idx ? 'text-amber-400' : 'text-slate-500'}`}>
            {team.name}
            {activeTab === idx && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-amber-400 rounded-t-full shadow-[0_-2px_10px_rgba(251,191,36,0.5)]"></div>}
          </button>
        ))}
      </div>

      {/* Tab Content Window */}
      <div className="flex-1 overflow-y-auto bg-slate-950">
        {renderGoogleScorecard(teams[activeTab])}
      </div>

    </div>
  );
}