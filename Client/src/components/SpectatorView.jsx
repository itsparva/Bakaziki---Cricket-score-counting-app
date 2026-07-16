import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import PostMatchSummary from './PostMatchSummary';

const SERVER_URL = 'https://gullyscorer-api.onrender.com';

export default function SpectatorView({ matchId, onBack }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab State: default to first batting team
  const [activeTab, setActiveTab] = useState(0); 

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

    const socket = io(SERVER_URL);
    socket.emit('joinMatch', matchId);
    socket.on('matchUpdate', (updatedData) => setMatchData(updatedData));
    return () => socket.disconnect();
  }, [matchId]);

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

  // Determine Teams
  const team1Name = setupData.optedTo === 'bat' ? setupData[setupData.tossWinner] : setupData[setupData.tossWinner === 'teamA' ? 'teamB' : 'teamA'];
  const team2Name = setupData.optedTo === 'bat' ? setupData[setupData.tossWinner === 'teamA' ? 'teamB' : 'teamA'] : setupData[setupData.tossWinner];
  
  const team1Key = setupData.teamA === team1Name ? 'playersA' : 'playersB';
  const team2Key = setupData.teamA === team2Name ? 'playersA' : 'playersB';

  const teams = [
    {
      name: team1Name,
      isLive: liveState.innings === 1,
      hasBatted: true,
      stats: liveState.innings === 1 ? stats : liveState.firstInningsStats?.stats,
      liveInfo: liveState.innings === 1 ? liveState : liveState.firstInningsStats,
      squadKey: team1Key
    },
    {
      name: team2Name,
      isLive: liveState.innings === 2,
      hasBatted: liveState.innings === 2,
      stats: liveState.innings === 2 ? stats : null,
      liveInfo: liveState.innings === 2 ? liveState : null,
      squadKey: team2Key
    }
  ];

  // --- GOOGLE STYLE SCORECARD RENDERER ---
  const renderGoogleScorecard = (teamObj) => {
    if (!teamObj.hasBatted) {
      // "Yet to Bat" Squad List
      return (
        <div className="animate-fade-in pb-20 p-4">
          <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4">Yet to Bat</h3>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            {setupData[teamObj.squadKey].map((player, idx) => (
              <div key={idx} className="py-2 border-b border-slate-800/50 text-slate-300 font-bold last:border-0">{player}</div>
            ))}
          </div>
        </div>
      );
    }

    const { stats: teamStats, liveInfo } = teamObj;
    const didNotBat = setupData[teamObj.squadKey].filter(p => teamStats.batting[p].balls === 0 && !teamStats.batting[p].out && liveInfo.striker !== p && liveInfo.nonStriker !== p);

    return (
      <div className="animate-fade-in pb-20">
        
        {/* Batting Table */}
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
                    <span className={`flex-1 font-bold ${s.out ? 'text-slate-300' : 'text-emerald-400'}`}>
                      {p} {isCurrentlyBatting ? '*' : ''}
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

          {/* DNB */}
          {didNotBat.length > 0 && (
            <div className="px-4 py-3 text-xs text-slate-400">
              <span className="font-bold uppercase tracking-widest text-slate-500">Yet to bat:</span> {didNotBat.join(', ')}
            </div>
          )}
        </div>

        {/* Fall of Wickets */}
        {liveInfo.fallOfWickets && liveInfo.fallOfWickets.length > 0 && (
          <div className="px-4 py-4 border-b border-slate-800 bg-slate-900/50">
            <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Fall of Wickets</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {liveInfo.fallOfWickets.map(f => `${f.score}-${f.wicket} (${f.player}, ${f.over})`).join(', ')}
            </p>
          </div>
        )}

        {/* Bowling Table */}
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
                  <span className={`flex-1 font-bold ${isCurrentlyBowling ? 'text-amber-400' : 'text-slate-300'}`}>
                    {p} {isCurrentlyBowling ? '*' : ''}
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
    <div className="flex flex-col h-full bg-slate-950 text-white select-none">
      
      {/* Top Main Status Bar */}
      <div className="bg-slate-900 pt-5 pb-3 px-4 shrink-0 shadow-lg relative z-20">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="text-xs text-slate-400 font-bold active:scale-95 transition-transform">← Live Matches</button>
          <span className="text-[10px] font-black text-red-500 animate-pulse uppercase tracking-widest px-2 py-1 bg-red-500/10 rounded">Live</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white leading-none">{teams[0].name}</h2>
            {teams[0].hasBatted && (
              <p className="text-amber-500 font-black text-2xl mt-1">
                {teams[0].liveInfo?.runs}<span className="text-lg text-slate-500">/{teams[0].liveInfo?.wickets}</span>
                <span className="text-sm font-mono text-slate-400 ml-2">({Math.floor((teams[0].liveInfo?.balls||0)/6)}.{(teams[0].liveInfo?.balls||0)%6})</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-500 leading-none">{teams[1].name}</h2>
            {teams[1].hasBatted && (
              <p className="text-amber-500 font-black text-2xl mt-1">
                {teams[1].liveInfo?.runs}<span className="text-lg text-slate-500">/{teams[1].liveInfo?.wickets}</span>
                <span className="text-sm font-mono text-slate-400 ml-2">({Math.floor((teams[1].liveInfo?.balls||0)/6)}.{(teams[1].liveInfo?.balls||0)%6})</span>
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Context Tag (E.g. Target needed) */}
        <div className="mt-3">
           {liveState.innings === 2 && (
              <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 inline-block px-2 py-1 rounded">
                Need {(liveState.firstInningsStats?.target || 0) - liveState.runs} runs in {(parseInt(setupData.overs) * 6) - liveState.balls} balls
              </p>
           )}
        </div>
      </div>

      {/* The Tabs Slider */}
      <div className="flex shrink-0 bg-slate-900 border-b border-slate-800">
        {teams.map((team, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveTab(idx)} 
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors relative ${activeTab === idx ? 'text-amber-400' : 'text-slate-500'}`}
          >
            {team.name}
            {activeTab === idx && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-amber-400 rounded-t-full"></div>}
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