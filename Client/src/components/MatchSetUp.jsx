import React, { useState } from 'react';

export default function MatchSetup({ onBack, onStartMatch }) {
  const [matchDetails, setMatchDetails] = useState({
    teamA: 'Team A',
    teamB: 'Team B',
    overs: 5,
    playersA: ['', '', '', '', ''], // Default to 5 empty slots
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
    // Clean up empty player names before starting
    const cleanedDetails = {
      ...matchDetails,
      playersA: matchDetails.playersA.filter(p => p.trim() !== ''),
      playersB: matchDetails.playersB.filter(p => p.trim() !== '')
    };
    onStartMatch(cleanedDetails);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center sticky top-0 z-10 shadow-md">
        <button onClick={onBack} className="text-emerald-500 font-bold mr-4 active:scale-90 transition-transform">
          ← Back
        </button>
        <h2 className="text-lg font-bold uppercase tracking-wider">Match Setup</h2>
      </div>

      {/* Scrollable Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* Match Settings */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Total Overs</label>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMatchDetails(prev => ({...prev, overs: Math.max(1, prev.overs - 1)}))} className="bg-slate-800 w-10 h-10 rounded-lg font-bold text-xl active:bg-slate-700">-</button>
            <span className="text-2xl font-black w-12 text-center">{matchDetails.overs}</span>
            <button type="button" onClick={() => setMatchDetails(prev => ({...prev, overs: prev.overs + 1}))} className="bg-slate-800 w-10 h-10 rounded-lg font-bold text-xl active:bg-slate-700">+</button>
          </div>
        </div>

        {/* Team Configuration - Reusable Block */}
        {['A', 'B'].map((teamLetter) => {
          const teamKey = `team${teamLetter}`;
          const playersKey = `players${teamLetter}`;
          const accentColor = teamLetter === 'A' ? 'emerald' : 'blue';

          return (
            <div key={teamLetter} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <input
                type="text"
                value={matchDetails[teamKey]}
                onChange={(e) => setMatchDetails({...matchDetails, [teamKey]: e.target.value})}
                className={`w-full bg-transparent border-b-2 border-${accentColor}-500/50 focus:border-${accentColor}-500 text-xl font-bold px-2 py-2 mb-4 focus:outline-none`}
                placeholder={`Team ${teamLetter} Name`}
                required
              />
              
              <div className="space-y-2">
                {matchDetails[playersKey].map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="bg-slate-800 text-slate-400 w-8 flex items-center justify-center rounded-lg text-xs font-bold">{index + 1}</span>
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => handlePlayerChange(playersKey, index, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                      placeholder="Player Name"
                    />
                    <button type="button" onClick={() => removePlayerSlot(playersKey, index)} className="text-red-400 px-2 font-bold text-xl active:scale-90">×</button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addPlayerSlot(playersKey)}
                className={`mt-3 text-xs font-bold text-${accentColor}-400 uppercase tracking-wider py-2 w-full text-center border border-${accentColor}-500/30 rounded-lg active:bg-${accentColor}-500/10`}
              >
                + Add Player
              </button>
            </div>
          );
        })}

        {/* Toss Details */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Toss Won By</label>
          <div className="flex gap-2 mb-4">
            {['teamA', 'teamB'].map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => setMatchDetails({...matchDetails, tossWinner: team})}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${matchDetails.tossWinner === team ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
              >
                {matchDetails[team]}
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Opted To</label>
          <div className="flex gap-2">
            {['bat', 'bowl'].map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setMatchDetails({...matchDetails, optedTo: choice})}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border uppercase transition-colors ${matchDetails.optedTo === choice ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Sticky Bottom Action Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 absolute bottom-0 w-full left-0">
        <button 
          onClick={handleSubmit}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-lg py-4 rounded-xl shadow-lg transition-transform uppercase tracking-wider"
        >
          Let's Play!
        </button>
      </div>
    </div>
  );
}