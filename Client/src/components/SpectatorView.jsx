import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import PostMatchSummary from './PostMatchSummary';

// Point this to your Node server
const SERVER_URL = 'https://bakaziki-cricket-score-counting-app.onrender.com'; 

export default function SpectatorView({ matchId, onBack }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Fetch initial data when they first join
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

    // 2. Connect to WebSockets for real-time updates
    const socket = io(SERVER_URL);
    
    // Join the specific match room
    socket.emit('joinMatch', matchId);

    // Listen for umpire updates
    socket.on('matchUpdate', (updatedData) => {
      setMatchData(updatedData);
    });

    // Cleanup on unmount
    return () => socket.disconnect();
  }, [matchId]);

  if (loading) return <div className="h-full bg-slate-950 flex justify-center items-center text-emerald-400 font-bold">Connecting to Stadium...</div>;
  if (error) return <div className="h-full bg-slate-950 flex flex-col justify-center items-center text-red-500 font-bold p-6 text-center"><p>{error}</p><button onClick={onBack} className="mt-4 bg-slate-800 text-white px-4 py-2 rounded-lg">Go Back</button></div>;

  if (matchData.isComplete) {
    return <PostMatchSummary finalData={matchData.finalResult} />;
  }

  const { liveState, setupData, stats } = matchData;
  const targetOvers = parseInt(setupData.overs);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none">
      {/* Header */}
      <div className="bg-slate-900 pt-5 pb-3 px-4 border-b border-slate-800 shadow-xl shrink-0">
        <div className="flex justify-between items-center mb-2">
          <button onClick={onBack} className="text-xs text-slate-400 border border-slate-700 px-2 py-1 rounded">Leave</button>
          <span className="text-xs font-bold text-red-500 animate-pulse uppercase tracking-widest px-2 py-1 bg-red-500/10 rounded-lg">Live Spectator</span>
        </div>
        
        <div className="text-center mb-3 mt-4">
          <div className="flex justify-center items-baseline gap-2">
            <span className="text-6xl font-black text-amber-500">{liveState.runs}</span>
            <span className="text-3xl text-slate-500 font-bold">/</span>
            <span className="text-4xl font-bold text-white">{liveState.wickets}</span>
          </div>
          <p className="text-sm text-slate-400 font-mono mt-2">
            Ov: <span className="text-emerald-400 font-bold">{Math.floor(liveState.balls/6)}.{liveState.balls%6}</span> / {targetOvers}
          </p>
        </div>

        {/* Mini Scorecard */}
        <div className="flex justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm shadow-inner mt-4">
          <div className="flex-1">
            {liveState.striker && <p className="text-emerald-400 font-bold truncate">🏏 {liveState.striker} <span className="text-white ml-1">{stats.batting[liveState.striker]?.runs} <span className="text-slate-500 text-xs">({stats.batting[liveState.striker]?.balls})</span></span></p>}
            {liveState.nonStriker && <p className="text-slate-400 truncate pl-5 mt-1">{liveState.nonStriker} <span className="text-slate-500 ml-1">{stats.batting[liveState.nonStriker]?.runs} <span className="text-xs">({stats.batting[liveState.nonStriker]?.balls})</span></span></p>}
          </div>
          <div className="text-right flex-1 border-l border-slate-800 pl-3">
            {liveState.bowler && (
              <>
                <p className="text-amber-400 font-bold truncate">⚾ {liveState.bowler}</p>
                <p className="text-slate-300 mt-1">{stats.bowling[liveState.bowler]?.wickets} - {stats.bowling[liveState.bowler]?.runs} <span className="text-slate-500 text-xs">({Math.floor(stats.bowling[liveState.bowler]?.balls/6)}.{stats.bowling[liveState.bowler]?.balls%6})</span></p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 flex-1 bg-slate-900">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Current Over</h3>
        <div className="flex gap-2 bg-slate-950 py-3 px-4 border border-slate-800 rounded-xl overflow-x-auto">
          {liveState.currentOverHistory.length === 0 && <span className="text-slate-600 text-sm italic">Waiting for delivery...</span>}
          {liveState.currentOverHistory.map((ball, i) => (
             <div key={i} className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${ball === 'W' ? 'bg-red-500 text-white' : ball === '4' || ball === '6' ? 'bg-emerald-500 text-slate-950' : ball === 'WD' || ball === 'NB' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{ball}</div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-xs mt-10 animate-pulse">Updates automatically...</p>
      </div>
    </div>
  );
}