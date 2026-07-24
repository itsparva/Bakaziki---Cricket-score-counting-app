import React, { useState } from 'react';

const MiniBallIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <circle cx="16" cy="16" r="14" fill="url(#ballGrad)" />
    <path d="M16 3c2 5 2 21 0 26" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.6" strokeDasharray="2.5 2.5" />
    <defs>
      <radialGradient id="ballGrad" cx="0.35" cy="0.28" r="0.8">
        <stop offset="0%" stopColor="#d6425a" />
        <stop offset="55%" stopColor="#8B1220" />
        <stop offset="100%" stopColor="#430A10" />
      </radialGradient>
    </defs>
  </svg>
);

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

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => { // <-- Add 'async' here
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

    // --- NEW: Trigger loading state and await the response ---
    setIsSubmitting(true);
    try {
      await onStartMatch(cleanedDetails);
    } finally {
      setIsSubmitting(false); // Re-enables the button if the API fails
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-[#060606] text-[#EDE6D6] font-sans">

      {/* INJECTED CUSTOM CSS */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,800;0,9..144,900;1,9..144,700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');

          .font-display { font-family: 'Fraunces', serif; }
          .font-mono-score { font-family: 'Space Mono', monospace; }

          .stripe-bg-soft {
            background: repeating-linear-gradient(115deg, #101010 0px, #101010 64px, #060606 64px, #060606 128px);
            background-size: 300% 300%;
            animation: stripeDrift 60s linear infinite;
          }
          @keyframes stripeDrift {
            from { background-position: 0% 0%; }
            to   { background-position: 200% 0%; }
          }

          .coin-mini {
            background: radial-gradient(circle at 35% 30%, #F2D97D, #D4AF37 55%, #8a6c1a 100%);
            box-shadow: inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -2px 3px rgba(0,0,0,0.4), 0 0 10px rgba(212,175,55,0.3);
            animation: coinFlip 3.4s ease-in-out infinite;
          }
          @keyframes coinFlip {
            0%, 100% { transform: scaleX(1); }
            48%, 52% { transform: scaleX(0.12); }
          }

          .btn-glow-gold { animation: glowGold 2.6s ease-in-out infinite; }
          @keyframes glowGold {
            0%, 100% { box-shadow: 0 5px 0 #7a611a, 0 10px 18px rgba(0,0,0,0.35), 0 0 0 rgba(212,175,55,0); }
            50%      { box-shadow: 0 5px 0 #7a611a, 0 10px 22px rgba(0,0,0,0.4), 0 0 22px rgba(212,175,55,0.45); }
          }

          .btn-press { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease; }
          .btn-press:active { transform: translateY(2px); }

          .scorecard-panel {
            background: #0d0d0d;
            border: 1px solid rgba(212,175,55,0.14);
          }

          .field-dark {
            background: #060606;
            border: 1px solid #232323;
          }
          .field-dark:focus-within, .field-dark:focus {
            border-color: #D4AF37;
          }

          @media (prefers-reduced-motion: reduce) {
            .stripe-bg-soft, .coin-mini, .btn-glow-gold { animation: none !important; }
            .animate-spin { animation: none !important; }
            .btn-press { transition: none; }
          }
        `}
      </style>

      {/* Ambient backdrop */}
      <div className="absolute inset-0 stripe-bg-soft pointer-events-none z-0" />
      <div className="absolute -top-16 -left-20 w-[60%] h-[30%] bg-[#D4AF37]/[0.05] blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute -top-16 -right-20 w-[60%] h-[30%] bg-[#B91C2B]/[0.05] blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <div className="relative z-20 bg-[#0a0a0a] p-4 border-b border-[#D4AF37]/15 flex items-center sticky top-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <button onClick={onBack} className="font-display text-[#D4AF37] font-bold mr-4 active:scale-90 transition-transform">
          ← Back
        </button>
        <h2 className="font-display text-lg font-extrabold uppercase tracking-wider text-[#EDE6D6]">
          Match Setup
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto p-4 space-y-6 pb-28">

        {/* Settings & Venue */}
        <div className="scorecard-panel p-4 rounded-sm shadow-[0_10px_24px_rgba(0,0,0,0.4)] space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#D4AF37]/80 uppercase tracking-[0.2em] mb-2">Total Overs</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMatchDetails(prev => ({ ...prev, overs: Math.max(1, prev.overs - 1) }))}
                className="btn-press field-dark w-10 h-10 rounded-sm font-display font-bold text-xl text-[#D4AF37] active:bg-[#161616]"
              >
                −
              </button>
              <span className="font-mono-score text-2xl font-bold w-12 text-center text-[#EDE6D6]">
                {matchDetails.overs}
              </span>
              <button
                type="button"
                onClick={() => setMatchDetails(prev => ({ ...prev, overs: prev.overs + 1 }))}
                className="btn-press field-dark w-10 h-10 rounded-sm font-display font-bold text-xl text-[#D4AF37] active:bg-[#161616]"
              >
                +
              </button>
            </div>
          </div>
          <div className="pt-4 border-t border-[#D4AF37]/10">
            <label className="block text-[10px] font-bold text-[#D4AF37]/80 uppercase tracking-[0.2em] mb-2">Venue / Ground</label>
            <input
              type="text"
              value={matchDetails.venue}
              onChange={(e) => setMatchDetails({ ...matchDetails, venue: e.target.value })}
              className="field-dark w-full rounded-sm px-3 py-3 text-sm focus:outline-none font-semibold text-[#EDE6D6] placeholder-[#EDE6D6]/25"
              placeholder="e.g. L.D. College Ground"
            />
          </div>
        </div>

        {/* Teams */}
        {['A', 'B'].map((teamLetter) => {
          const teamKey = `team${teamLetter}`;
          const playersKey = `players${teamLetter}`;
          const captainKey = `captain${teamLetter}`;
          const isTeamA = teamLetter === 'A';
          const accentHex = isTeamA ? '#D4AF37' : '#B91C2B';
          const accentBorderClass = isTeamA ? 'border-[#D4AF37]/50' : 'border-[#B91C2B]/50';
          const accentTextClass = isTeamA ? 'text-[#D4AF37]' : 'text-[#e0616f]';
          const accentDashedClass = isTeamA ? 'border-[#D4AF37]/30' : 'border-[#B91C2B]/30';

          return (
            <div key={teamLetter} className="scorecard-panel p-4 rounded-sm shadow-[0_10px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="font-mono-score text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0"
                  style={{ background: accentHex, color: '#0a0a0a' }}
                >
                  {teamLetter}
                </span>
                <input
                  type="text"
                  value={matchDetails[teamKey]}
                  onChange={(e) => setMatchDetails({ ...matchDetails, [teamKey]: e.target.value })}
                  className={`font-display flex-1 min-w-0 bg-transparent border-b-2 ${accentBorderClass} text-xl font-bold px-2 py-2 focus:outline-none text-[#EDE6D6]`}
                  required
                />
              </div>

              <label className="text-[10px] text-[#D4AF37]/70 uppercase font-bold tracking-[0.2em]">Team Captain</label>
              <select
                value={matchDetails[captainKey]}
                onChange={(e) => setMatchDetails({ ...matchDetails, [captainKey]: e.target.value })}
                className="field-dark w-full rounded-sm px-3 py-2 text-sm mt-2 mb-4 text-[#EDE6D6]"
                required
              >
                <option value="">Select Captain</option>
                {matchDetails[playersKey].filter(p => p.trim() !== '').map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>

              <div className="space-y-2">
                {matchDetails[playersKey].map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <span
                      className="font-mono-score w-8 flex items-center justify-center rounded-sm text-xs font-bold shrink-0"
                      style={{ background: '#141414', color: accentHex, border: `1px solid ${accentHex}33` }}
                    >
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => handlePlayerChange(playersKey, index, e.target.value)}
                      className="field-dark flex-1 min-w-0 rounded-sm px-3 py-2 text-sm text-[#EDE6D6] placeholder-[#EDE6D6]/25"
                      placeholder="Player Name"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removePlayerSlot(playersKey, index)}
                      className="btn-press shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-base"
                      style={{ background: '#1c1c1c', color: '#e0616f', border: '1px solid #B91C2B4d' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addPlayerSlot(playersKey)}
                className={`btn-press mt-3 text-xs font-bold ${accentTextClass} py-2 w-full text-center border border-dashed ${accentDashedClass} rounded-sm uppercase tracking-[0.15em]`}
              >
                + Add Player
              </button>
            </div>
          );
        })}

        {/* Toss */}
        <div className="scorecard-panel p-4 rounded-sm shadow-[0_10px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="coin-mini w-6 h-6 rounded-full shrink-0" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-[#EDE6D6]">The Toss</span>
          </div>

          <label className="block text-[10px] font-bold text-[#D4AF37]/80 uppercase tracking-[0.2em] mb-3">Toss Won By</label>
          <div className="flex gap-2 mb-5">
            {['teamA', 'teamB'].map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => setMatchDetails({ ...matchDetails, tossWinner: team })}
                className={`btn-press flex-1 py-2 rounded-sm text-sm font-bold border truncate px-2 ${
                  matchDetails.tossWinner === team
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-[#1B140A]'
                    : 'field-dark text-[#EDE6D6]/60'
                }`}
              >
                {matchDetails[team]}
              </button>
            ))}
          </div>

          <label className="block text-[10px] font-bold text-[#D4AF37]/80 uppercase tracking-[0.2em] mb-3">Opted To</label>
          <div className="flex gap-2">
            {['bat', 'bowl'].map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setMatchDetails({ ...matchDetails, optedTo: choice })}
                className={`btn-press flex-1 py-2 rounded-sm text-sm font-bold border uppercase ${
                  matchDetails.optedTo === choice
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-[#1B140A]'
                    : 'field-dark text-[#EDE6D6]/60'
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div className="relative z-20 p-4 bg-[#0a0a0a] border-t border-[#D4AF37]/15 absolute bottom-0 w-full">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`btn-press w-full font-display font-black text-lg py-4 rounded-sm shadow-lg uppercase transition-all flex items-center justify-center gap-3 ${
            isSubmitting
              ? 'bg-[#161616] text-[#EDE6D6]/30 cursor-not-allowed'
              : 'btn-glow-gold text-[#1B140A]'
          }`}
          style={!isSubmitting ? { background: 'linear-gradient(180deg, #E4C158, #D4AF37 55%, #A6841E)' } : undefined}
        >
          {isSubmitting && <MiniBallIcon className="w-5 h-5 animate-spin" />}
          {isSubmitting ? 'Sending request to ICC Server...' : "Let's Play!"}
        </button>
      </div>
    </div>
  );
}