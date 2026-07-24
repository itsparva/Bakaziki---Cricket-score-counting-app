import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import PostMatchSummary from './PostMatchSummary';

const SERVER_URL = 'https://bakaziki-cricket-score-counting-app.onrender.com';

const MiniBallIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <circle cx="16" cy="16" r="14" fill="url(#ballGradSpectator)" />
    <path d="M16 3c2 5 2 21 0 26" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.6" strokeDasharray="2.5 2.5" />
    <defs>
      <radialGradient id="ballGradSpectator" cx="0.35" cy="0.28" r="0.8">
        <stop offset="0%" stopColor="#d6425a" />
        <stop offset="55%" stopColor="#8B1220" />
        <stop offset="100%" stopColor="#430A10" />
      </radialGradient>
    </defs>
  </svg>
);

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

  if (loading) return (
    <div className="h-full bg-[#060606] flex flex-col justify-center items-center text-[#D4AF37] font-bold gap-4 font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,800&display=swap'); .font-display{font-family:'Fraunces',serif;}`}</style>
      <MiniBallIcon className="w-10 h-10 animate-spin" />
      <span className="font-display uppercase tracking-widest text-sm">Connecting to Stadium...</span>
    </div>
  );

  if (error) return (
    <div className="h-full bg-[#060606] flex flex-col justify-center items-center text-[#e0616f] font-bold p-6 text-center font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,800&display=swap'); .font-display{font-family:'Fraunces',serif;}`}</style>
      <p className="font-display">{error}</p>
      <button onClick={onBack} className="mt-4 bg-[#141414] border border-[#D4AF37]/20 text-[#EDE6D6] px-4 py-2 rounded-sm font-bold">Go Back</button>
    </div>
  );

  if (matchData.isComplete) {
    return <PostMatchSummary finalData={{ ...matchData.finalResult, matchId: matchData.finalResult?.matchId || matchId }} />;
  }

  const { liveState, setupData, stats } = matchData;

  if (!liveState || Object.keys(liveState).length === 0 || !stats || !stats.batting) {
    return (
      <div className="flex flex-col h-full bg-[#060606] text-[#EDE6D6] justify-center items-center p-6 text-center select-none font-sans">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,800;0,9..144,900&display=swap'); .font-display{font-family:'Fraunces',serif;}`}</style>
        <MiniBallIcon className="w-14 h-14 animate-spin mb-6" />
        <h2 className="font-display text-2xl font-black text-[#D4AF37] uppercase tracking-widest mb-2">Toss Done!</h2>
        <p className="text-[#EDE6D6]/50">Waiting for the umpire to walk onto the field...</p>
        <button onClick={onBack} className="mt-8 bg-[#141414] border border-[#D4AF37]/20 text-[#EDE6D6] px-6 py-3 rounded-sm font-bold uppercase tracking-wider text-sm">Leave Stadium</button>
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
          <h3 className="text-[#D4AF37]/60 font-bold uppercase tracking-widest text-xs mb-4 font-mono-score">Yet to Bat</h3>
          <div className="scorecard-panel rounded-sm p-4">
            {setupData[teamObj.squadKey].map((player, idx) => (
              <div key={idx} className="py-2.5 border-b border-[#1c1c1c] text-[#EDE6D6]/80 font-bold last:border-0 flex items-center">
                {player}
                {checkCaptain(player, teamObj.name) && <span className="ml-2 text-[#D4AF37] text-[9px] px-1.5 py-0.5 rounded-sm border border-[#D4AF37]/40 font-mono-score">C</span>}
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
        <div className="border-b border-[#1c1c1c]">
          <div className="flex text-[10px] text-[#D4AF37]/60 uppercase font-bold px-4 py-2 bg-[#0a0a0a] font-mono-score">
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
                <div key={p} className="py-3 border-b border-[#1c1c1c] flex flex-col justify-center">
                  <div className="flex items-center">
                    {/* --- FIXED: Added proper scoping to checkCaptain --- */}
                    <span className={`flex-1 font-bold truncate pr-2 ${s.out ? 'text-[#EDE6D6]/70' : 'text-[#D4AF37]'}`}>
                      {p} {isCurrentlyBatting ? '*' : ''}
                      {checkCaptain(p, battingTeamName) && <span className="ml-2 text-[#D4AF37] text-[9px] px-1.5 py-0.5 rounded-sm border border-[#D4AF37]/40 font-mono-score">C</span>}
                    </span>
                    <div className="flex gap-4 text-sm font-mono-score shrink-0">
                      <span className="w-6 text-right font-bold text-[#EDE6D6]">{s.runs}</span>
                      <span className="w-6 text-right text-[#EDE6D6]/40">{s.balls}</span>
                      <span className="w-6 text-right text-[#EDE6D6]/40">{s.fours}</span>
                      <span className="w-6 text-right text-[#EDE6D6]/40">{s.sixes}</span>
                      <span className="w-10 text-right text-[#EDE6D6]/30">{sr}</span>
                    </div>
                  </div>
                  {s.out && <span className="text-[11px] text-[#EDE6D6]/35 italic mt-1 leading-none">{s.dismissal}</span>}
                </div>
              );
            })}
          </div>

          {didNotBat.length > 0 && (
            <div className="px-4 py-3 text-xs text-[#EDE6D6]/50">
              <span className="font-bold uppercase tracking-widest text-[#D4AF37]/50 font-mono-score">Yet to bat:</span> {didNotBat.join(', ')}
            </div>
          )}
        </div>

        {liveInfo.fallOfWickets && liveInfo.fallOfWickets.length > 0 && (
          <div className="px-4 py-4 border-b border-[#1c1c1c] bg-[#0a0a0a]/60">
            <h4 className="text-[10px] text-[#D4AF37]/50 uppercase font-bold tracking-widest mb-2 font-mono-score">Fall of Wickets</h4>
            <p className="text-xs text-[#EDE6D6]/50 leading-relaxed">
              {liveInfo.fallOfWickets.map(f => `${f.score}-${f.wicket} (${f.player}, ${f.over})`).join(', ')}
            </p>
          </div>
        )}

        <div className="mt-2 border-t border-[#1c1c1c]">
          <div className="flex text-[10px] text-[#D4AF37]/60 uppercase font-bold px-4 py-2 bg-[#0a0a0a] font-mono-score">
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
                <div key={p} className="py-3 border-b border-[#1c1c1c] flex items-center">
                  {/* --- FIXED: Checking the bowler's team --- */}
                  <span className={`flex-1 font-bold truncate pr-2 ${isCurrentlyBowling ? 'text-[#D4AF37]' : 'text-[#EDE6D6]/70'}`}>
                    {p} {isCurrentlyBowling ? '*' : ''}
                    {checkCaptain(p, bowlingTeamName) && <span className="ml-2 text-[#D4AF37] text-[9px] px-1.5 py-0.5 rounded-sm border border-[#D4AF37]/40 font-mono-score">C</span>}
                  </span>
                  <div className="flex gap-4 text-sm font-mono-score shrink-0">
                    <span className="w-8 text-right text-[#EDE6D6]/40">{overs}</span>
                    <span className="w-8 text-right text-[#EDE6D6]">{s.runs}</span>
                    <span className="w-8 text-right font-bold text-[#EDE6D6]">{s.wickets}</span>
                    <span className="w-10 text-right text-[#EDE6D6]/30">{econ}</span>
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
    <div className="flex flex-col h-full bg-[#060606] text-[#EDE6D6] select-none relative overflow-hidden font-sans">
      
      {/* INJECTED CSS FOR MOTION GRAPHICS */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,800&family=Space+Mono:wght@400;700&display=swap');
          .font-display { font-family: 'Fraunces', serif; }
          .font-mono-score { font-family: 'Space Mono', monospace; }
          .scorecard-panel { background: #0d0d0d; border: 1px solid rgba(212,175,55,0.14); }

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
          @keyframes flashGold {
            0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; }
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
              <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(circle at 50% 45%, rgba(212,175,55,0.35), transparent 65%)', animation: 'flashGold 2s ease-out forwards' }}
              />
              <div style={{ animation: 'flySix 2s cubic-bezier(0.25, 1, 0.5, 1) forwards' }} className="absolute left-0 top-0">
                <div className="w-10 h-10 rounded-full border-2 border-[#F2D97D] shadow-[0_0_30px_rgba(212,175,55,0.9)] flex items-center justify-center" style={{ background: 'radial-gradient(circle at 35% 30%, #d6425a, #8B1220 55%, #430A10 100%)' }}>
                  <div className="w-full h-[2px] bg-white/80 transform rotate-45"></div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'textPop 2s ease-in-out forwards' }}>
                <span className="font-display text-8xl text-[#D4AF37] font-black tracking-widest uppercase drop-shadow-[0_0_35px_rgba(212,175,55,0.9)] italic">SIX!!</span>
              </div>
            </>
          )}

          {recentEvent === '4' && (
            <>
              <div style={{ animation: 'rollFour 2s linear forwards' }} className="absolute left-0 bottom-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#F2D97D] shadow-[0_0_18px_rgba(212,175,55,0.7)] flex items-center justify-center" style={{ background: 'radial-gradient(circle at 35% 30%, #d6425a, #8B1220 55%, #430A10 100%)' }}>
                  <div className="w-full h-[2px] bg-white/80 transform -rotate-45"></div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'textPop 2s ease-in-out forwards' }}>
                <span className="font-display text-7xl text-[#EAD9AF] font-black tracking-widest uppercase drop-shadow-[0_0_28px_rgba(234,217,175,0.85)] italic">FOUR!</span>
              </div>
            </>
          )}

          {recentEvent === 'W' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <div className="relative w-32 h-40 mb-4">
                <div className="absolute bottom-0 w-full h-1 bg-[#3b2415]"></div>
                <div className="absolute bottom-1 left-[20%] w-3 h-24 bg-[#D4AF37] rounded-t-sm shadow-[inset_-2px_0_4px_rgba(0,0,0,0.4)]"></div>
                <div className="absolute bottom-1 right-[20%] w-3 h-24 bg-[#D4AF37] rounded-t-sm shadow-[inset_-2px_0_4px_rgba(0,0,0,0.4)]"></div>
                <div style={{ transformOrigin: 'bottom center', animation: 'stumpBreak 1s ease-out forwards' }} className="absolute bottom-1 left-[45%] w-3 h-24 bg-[#D4AF37] rounded-t-sm shadow-[inset_-2px_0_4px_rgba(0,0,0,0.4)]"></div>
                <div style={{ transformOrigin: 'center', animation: 'bailFly 1s ease-out forwards' }} className="absolute bottom-24 left-[30%] w-6 h-1 bg-[#B91C2B] rounded-full"></div>
              </div>
              <span className="font-display text-7xl text-[#e0616f] font-black tracking-widest uppercase drop-shadow-[0_0_35px_rgba(185,28,43,0.85)]" style={{ animation: 'textPop 2s ease-in-out forwards' }}>OUT!</span>
            </div>
          )}
        </div>
      )}

      {/* Top Main Status Bar */}
      <div className="bg-[#0a0a0a] pt-5 pb-3 px-4 shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative z-20 overflow-hidden border-b border-[#D4AF37]/10">
        {/* --- Team crest background art (unchanged assets, softened for the dark theme) --- */}
        <div 
          className="absolute inset-y-0 left-0 w-1/2 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: "url('/lion.png')",
            backgroundSize: 'cover', 
            backgroundPosition: 'left center', 
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, transparent 100%)',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, transparent 100%)'
          }}
        ></div>
        <div 
          className="absolute inset-y-0 right-0 w-1/3 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: "url('/phoenix.png')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'right center', 
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, transparent 100%)',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, transparent 100%)'
          }}
        ></div>

        <div className="flex justify-between items-center mb-4 relative z-10">
          <button onClick={onBack} className="text-xs text-[#EDE6D6]/70 font-bold hover:text-[#EDE6D6] active:scale-95 transition-transform bg-black/50 border border-[#1c1c1c] px-2 py-1 rounded-sm">← Live Matches</button>
          <span className="text-[10px] font-black text-[#e0616f] animate-pulse uppercase tracking-widest px-2 py-1 bg-[#B91C2B]/15 rounded-sm font-mono-score">Live</span>
        </div>
        
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="font-display text-xl font-black text-[#EDE6D6] leading-none drop-shadow-md">{teams[0].name}</h2>
            {teams[0].hasBatted && (
              <p className={`font-mono-score font-black text-2xl mt-1 drop-shadow-md ${teams[0].isLive ? 'text-[#D4AF37] drop-shadow-[0_0_14px_rgba(212,175,55,0.4)]' : 'text-[#EDE6D6]/60'}`}>
                {teams[0].liveInfo?.runs}<span className="text-lg text-[#EDE6D6]/30">/{teams[0].liveInfo?.wickets}</span>
                <span className="text-sm text-[#EDE6D6]/30 ml-2">({Math.floor((teams[0].liveInfo?.balls||0)/6)}.{(teams[0].liveInfo?.balls||0)%6})</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <h2 className="font-display text-xl font-black text-[#EDE6D6] leading-none drop-shadow-md">{teams[1].name}</h2>
            {teams[1].hasBatted && (
              <p className={`font-mono-score font-black text-2xl mt-1 drop-shadow-md ${teams[1].isLive ? 'text-[#D4AF37] drop-shadow-[0_0_14px_rgba(212,175,55,0.4)]' : 'text-[#EDE6D6]/60'}`}>
                {teams[1].liveInfo?.runs}<span className="text-lg text-[#EDE6D6]/30">/{teams[1].liveInfo?.wickets}</span>
                <span className="text-sm text-[#EDE6D6]/30 ml-2">({Math.floor((teams[1].liveInfo?.balls||0)/6)}.{(teams[1].liveInfo?.balls||0)%6})</span>
              </p>
            )}
          </div>
        </div>

        {allOvers.length > 0 && (
          <div className="mt-5 bg-black/60 backdrop-blur-sm py-3 px-3 border border-[#1c1c1c] rounded-sm flex items-center overflow-x-auto shadow-inner hide-scrollbar scroll-smooth relative z-10">
            {allOvers.map((over, overIdx) => (
              <div key={overIdx} className="flex items-center shrink-0 border-r border-[#1c1c1c] pr-3 mr-3 last:border-0 last:pr-0 last:mr-0">
                <span className="text-[10px] text-[#D4AF37]/50 font-bold uppercase tracking-widest mr-2 font-mono-score">Ov {overIdx + 1}</span>
                <div className="flex gap-1.5">
                  {over.map((ball, i) => {
                    let btnStyle = 'bg-[#1c1c1c] text-[#EDE6D6]/50';
                    if (ball === 'W') btnStyle = 'bg-[#B91C2B] text-[#EDE6D6] shadow-[0_0_8px_rgba(185,28,43,0.5)]';
                    if (ball === '4' || ball === '6') btnStyle = 'bg-[#D4AF37] text-[#1B140A] shadow-[0_0_8px_rgba(212,175,55,0.5)]';
                    if (ball.includes('WD') || ball.includes('NB')) btnStyle = 'bg-[#8a6c1a] text-[#1B140A] shadow-[0_0_8px_rgba(138,108,26,0.5)]';
                    return (
                      <div key={i} className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center font-bold text-[9px] font-mono-score shadow-sm ${btnStyle}`}>
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
              <p className="text-xs font-bold text-[#D4AF37]/90 bg-black/60 backdrop-blur-sm border border-[#1c1c1c] rounded-sm w-full text-center block py-2 drop-shadow-md tracking-wider">
                Need {(liveState.firstInningsStats?.target || 0) - liveState.runs} runs in {(parseInt(setupData.overs) * 6) - liveState.balls} balls
              </p>
           </div>
        )}
      </div>

      {/* The Tabs Slider */}
      <div className="flex shrink-0 bg-[#0a0a0a] border-b border-[#1c1c1c] relative z-10">
        {teams.map((team, idx) => (
          <button key={idx} onClick={() => setActiveTab(idx)} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors relative font-mono-score ${activeTab === idx ? 'text-[#D4AF37]' : 'text-[#EDE6D6]/35'}`}>
            {team.name}
            {activeTab === idx && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#D4AF37] rounded-t-full shadow-[0_-2px_10px_rgba(212,175,55,0.5)]"></div>}
          </button>
        ))}
      </div>

      {/* Tab Content Window */}
      <div className="flex-1 overflow-y-auto bg-[#060606]">
        {renderGoogleScorecard(teams[activeTab])}
      </div>

    </div>
  );
}