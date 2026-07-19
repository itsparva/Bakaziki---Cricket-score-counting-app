import React, { useState } from 'react';

export default function MatchSetup({ onBack, onStartMatch }) {
  const [matchDetails, setMatchDetails] = useState({
    venue: '', 
    teamA: 'Team A',
    teamB: 'Team B',
    captainA: '', 
    captainB: '',
    overs: 5,
    playersA: ['', '', '', '', ''],
    playersB: ['', '', '', '', ''],
    tossWinner: 'teamA',
    optedTo: 'bat'
  });

  const handlePlayerChange = (team, index, value) => {
    const newPlayers = [...matchDetails[team]];
    newPlayers[index] = value;
    setMatchDetails({ ...matchDetails, [team]: newPlayers });
  };

  const addPlayerSlot = (team) => {
    setMatchDetails({ ...matchDetails, [team]: [...matchDetails[team], ''] });
  };

  const removePlayerSlot = (team, index) => {
    const newPlayers = matchDetails[team].filter((_, i) => i !== index);
    setMatchDetails({ ...matchDetails, [team]: newPlayers });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate uniqueness
    const allPlayers = [...matchDetails.playersA, ...matchDetails.playersB].filter(p => p.trim() !== '');
    const uniquePlayers = new Set(allPlayers.map(p => p.toLowerCase()));

    if (uniquePlayers.size !== allPlayers.length) {
      alert("Error: All player names must be unique across both teams.");
      return;
    }

    if (!matchDetails.captainA || !matchDetails.captainB) {
      alert("Please select a captain for both teams.");
      return;
    }

    const currentDate = new Date().toLocaleDateString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });

    const cleanedDetails = {
      ...matchDetails,
      matchDate: currentDate,
      playersA: matchDetails.playersA.filter(p => p.trim() !== ''),
      playersB: matchDetails.playersB.filter(p => p.trim() !== '')
    };
    onStartMatch(cleanedDetails);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center sticky top-0 z-10 shadow-md">
        <button onClick={onBack} className="text-emerald-500 font-bold mr-4 active:scale-90 transition-transform">← Back</button>
        <h2 className="text-lg font-bold uppercase tracking-wider">Match Setup</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Settings & Venue (Restored) */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Total Overs</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setMatchDetails(prev => ({...prev, overs: Math.max(1, prev.overs - 1)}))} className="bg-slate-800 w-10 h-10 rounded-lg font-bold text-xl active:bg-slate-700">-</button>
              <span className="text-2xl font-black w-12 text-center">{matchDetails.overs}</span>
              <button type="button" onClick={() => setMatchDetails(prev => ({...prev, overs: prev.overs + 1}))} className="bg-slate-800 w-10 h-10 rounded-lg font-bold text-xl active:bg-slate-700">+</button>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Venue / Ground</label>
            <input type="text" value={matchDetails.venue} onChange={(e) => setMatchDetails({...matchDetails, venue: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-amber-500 font-bold" placeholder="e.g. L.D. College Ground" />
          </div>
        </div>

        {/* Teams */}
        {['A', 'B'].map((teamLetter) => {
          const teamKey = `team${teamLetter}`;
          const playersKey = `players${teamLetter}`;
          const captainKey = `captain${teamLetter}`;
          const accentColor = teamLetter === 'A' ? 'emerald' : 'blue';

          return (
            <div key={teamLetter} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <input type="text" value={matchDetails[teamKey]} onChange={(e) => setMatchDetails({...matchDetails, [teamKey]: e.target.value})} className={`w-full bg-transparent border-b-2 border-${accentColor}-500/50 text-xl font-bold px-2 py-2 mb-4 focus:outline-none`} required />
              <label className="text-[10px] text-slate-500 uppercase font-bold">Team Captain</label>
              <select value={matchDetails[captainKey]} onChange={(e) => setMatchDetails({...matchDetails, [captainKey]: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm mb-4" required>
                <option value="">Select Captain</option>
                {matchDetails[playersKey].filter(p => p.trim() !== '').map((p, i) => <option key={i} value={p}>{p}</option>)}
              </select>
              <div className="space-y-2">
                {matchDetails[playersKey].map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="bg-slate-800 text-slate-400 w-8 flex items-center justify-center rounded-lg text-xs font-bold">{index + 1}</span>
                    <input type="text" value={player} onChange={(e) => handlePlayerChange(playersKey, index, e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm" placeholder="Player Name" required />
                    <button type="button" onClick={() => removePlayerSlot(playersKey, index)} className="text-red-400 px-2 font-bold text-xl">×</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addPlayerSlot(playersKey)} className={`mt-3 text-xs font-bold text-${accentColor}-400 py-2 w-full text-center border border-${accentColor}-500/30 rounded-lg`}>+ Add Player</button>
            </div>
          );
        })}

        {/* Toss (Restored) */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Toss Won By</label>
          <div className="flex gap-2 mb-4">
            {['teamA', 'teamB'].map((team) => (
              <button key={team} type="button" onClick={() => setMatchDetails({...matchDetails, tossWinner: team})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${matchDetails.tossWinner === team ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {matchDetails[team]}
              </button>
            ))}
          </div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Opted To</label>
          <div className="flex gap-2">
            {['bat', 'bowl'].map((choice) => (
              <button key={choice} type="button" onClick={() => setMatchDetails({...matchDetails, optedTo: choice})} className={`flex-1 py-2 rounded-lg text-sm font-bold border uppercase ${matchDetails.optedTo === choice ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {choice}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div className="p-4 bg-slate-900 border-t border-slate-800 absolute bottom-0 w-full">
        <button onClick={handleSubmit} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-lg py-4 rounded-xl shadow-lg uppercase">Let's Play!</button>
      </div>
    </div>
  );
}