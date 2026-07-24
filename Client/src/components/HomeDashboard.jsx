import React, { useState } from 'react';

const StumpsIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="6" y="8" width="2.4" height="20" rx="1" fill="currentColor" />
    <rect x="14.8" y="8" width="2.4" height="20" rx="1" fill="currentColor" />
    <rect x="23.6" y="8" width="2.4" height="20" rx="1" fill="currentColor" />
    <rect x="5" y="6" width="10" height="2.4" rx="1.2" fill="currentColor" opacity="0.85" />
    <rect x="13.8" y="6" width="10" height="2.4" rx="1.2" fill="currentColor" opacity="0.85" />
  </svg>
);

const ScoreboardIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="4" y="7" width="24" height="18" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="7" y="11" width="7" height="6" rx="0.5" fill="currentColor" opacity="0.85" />
    <rect x="18" y="11" width="7" height="6" rx="0.5" fill="currentColor" opacity="0.85" />
    <rect x="7" y="20" width="18" height="1.6" rx="0.8" fill="currentColor" opacity="0.5" />
  </svg>
);

const DUST = [
  { left: '6%',  size: 3, delay: '0s',   dur: '10s' },
  { left: '18%', size: 2, delay: '2.2s', dur: '12s' },
  { left: '33%', size: 3, delay: '0.8s', dur: '9s'  },
  { left: '47%', size: 2, delay: '4.4s', dur: '13s' },
  { left: '61%', size: 3, delay: '1.4s', dur: '11s' },
  { left: '74%', size: 2, delay: '3.1s', dur: '10s' },
  { left: '87%', size: 3, delay: '5s',   dur: '12s' },
  { left: '95%', size: 2, delay: '1.8s', dur: '9.5s' },
];

const TICKER = ['EVERY BALL COUNTS', 'HOWZAT?', 'LIVE SCORING ENGINE', 'OVERS · RUNS · WICKETS', 'BUILT FOR FRIENDS'];

export default function HomeDashboard({ onStartMatch }) {
  const [matchId, setMatchId] = useState('');

  const handleJoinLive = (e) => {
    e.preventDefault();
    if (matchId.trim()) {
      onStartMatch(matchId.trim().toUpperCase(), true);
    }
  };

  const title = 'BAKAZIKI'.split('');
  const tickerLoop = [...TICKER, ...TICKER];

  return (
    <div className="relative flex flex-col h-full w-full overflow-y-auto overflow-x-hidden select-none font-sans text-[#EDE6D6] bg-[#060606]">

      {/* INJECTED CUSTOM CSS */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,800;0,9..144,900;1,9..144,700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');

          .font-display { font-family: 'Fraunces', serif; }
          .font-mono-score { font-family: 'Space Mono', monospace; }

          .stripe-bg {
            background: repeating-linear-gradient(115deg, #121212 0px, #121212 64px, #060606 64px, #060606 128px);
            background-size: 300% 300%;
            animation: stripeDrift 50s linear infinite;
          }
          @keyframes stripeDrift {
            from { background-position: 0% 0%; }
            to   { background-position: 200% 0%; }
          }

          @keyframes haloPulse {
            0%, 100% { transform: scale(1);    opacity: 0.55; }
            50%      { transform: scale(1.18); opacity: 0.95; }
          }
          @keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes glintSweep {
            0%   { transform: translateX(-130%) rotate(20deg); }
            55%  { transform: translateX(130%) rotate(20deg); }
            100% { transform: translateX(130%) rotate(20deg); }
          }

          .flap-letter {
            font-family: 'Fraunces', serif;
            font-weight: 800;
            position: relative;
            transform-origin: 50% 50%;
            animation: flapIn 0.7s cubic-bezier(.2,.8,.2,1) both, letterIdle 5s ease-in-out infinite;
          }
          .flap-letter::after {
            content: '';
            position: absolute;
            left: 2px; right: 2px; top: 50%;
            height: 1px;
            background: rgba(27, 20, 10, 0.3);
          }
          @keyframes flapIn {
            0%   { transform: rotateX(-100deg); opacity: 0; }
            60%  { transform: rotateX(12deg);    opacity: 1; }
            100% { transform: rotateX(0deg);     opacity: 1; }
          }
          @keyframes letterIdle {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-1.5px); }
          }

          .shimmer-mask { position: relative; overflow: hidden; }
          .shimmer-mask::after {
            content: '';
            position: absolute;
            top: 0; bottom: 0; left: -60%;
            width: 40%;
            background: linear-gradient(100deg, transparent, rgba(212,175,55,0.16), transparent);
            animation: shimmerSweep 5s ease-in-out infinite;
          }
          @keyframes shimmerSweep {
            0%   { left: -60%; }
            45%  { left: 120%; }
            100% { left: 120%; }
          }

          .coin {
            background: radial-gradient(circle at 35% 30%, #F2D97D, #D4AF37 55%, #8a6c1a 100%);
            box-shadow: inset 0 2px 3px rgba(255,255,255,0.5), inset 0 -3px 5px rgba(0,0,0,0.4), 0 0 16px rgba(212,175,55,0.35);
            animation: coinFlip 3.4s ease-in-out infinite;
          }
          @keyframes coinFlip {
            0%, 100%   { transform: scaleX(1); }
            48%, 52%   { transform: scaleX(0.12); }
          }

          .ledger-card {
            background:
              repeating-linear-gradient(to bottom, rgba(27,20,10,0.05) 0px, rgba(27,20,10,0.05) 1px, transparent 1px, transparent 27px),
              linear-gradient(180deg, #F7F0DE, #EFE4C8);
            animation: cardFloat 6s ease-in-out infinite;
          }
          @keyframes cardFloat {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-5px); }
          }

          .btn-glow-gold {
            animation: glowGold 2.6s ease-in-out infinite;
          }
          @keyframes glowGold {
            0%, 100% { box-shadow: 0 5px 0 #7a611a, 0 10px 18px rgba(0,0,0,0.35), 0 0 0 rgba(212,175,55,0); }
            50%      { box-shadow: 0 5px 0 #7a611a, 0 10px 22px rgba(0,0,0,0.4), 0 0 22px rgba(212,175,55,0.45); }
          }
          .btn-glow-red {
            animation: glowRed 2.6s ease-in-out infinite;
          }
          @keyframes glowRed {
            0%, 100% { box-shadow: 0 5px 0 #4a121b, 0 10px 18px rgba(0,0,0,0.35), 0 0 0 rgba(185,28,43,0); }
            50%      { box-shadow: 0 5px 0 #4a121b, 0 10px 22px rgba(0,0,0,0.4), 0 0 22px rgba(185,28,43,0.4); }
          }

          .btn-press { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease; }
          .btn-press:active { transform: translateY(3px); }

          .dust {
            position: absolute;
            bottom: -10px;
            border-radius: 9999px;
            background: rgba(212,175,55,0.55);
            animation-name: floatUp;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
          @keyframes floatUp {
            0%   { transform: translateY(0);       opacity: 0; }
            10%  { opacity: 0.65; }
            85%  { opacity: 0.25; }
            100% { transform: translateY(-620px);  opacity: 0; }
          }

          .sweep-light {
            position: absolute;
            top: -20%;
            left: -60%;
            width: 34%;
            height: 180%;
            background: linear-gradient(100deg, transparent, rgba(255,255,255,0.045), transparent);
            transform: rotate(12deg);
            animation: sweepLight 8s ease-in-out infinite;
          }
          @keyframes sweepLight {
            0%   { transform: translateX(0)   rotate(12deg); }
            100% { transform: translateX(420%) rotate(12deg); }
          }

          .pitch-watermark { animation: pitchBreathe 7s ease-in-out infinite; }
          @keyframes pitchBreathe {
            0%, 100% { opacity: 0.05; }
            50%      { opacity: 0.09; }
          }

          .ticker-track { animation: tickerScroll 22s linear infinite; }
          @keyframes tickerScroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }

          @media (prefers-reduced-motion: reduce) {
            .stripe-bg, .flap-letter, .shimmer-mask::after, .coin, .ledger-card,
            .btn-glow-gold, .btn-glow-red, .dust, .sweep-light, .pitch-watermark,
            .ticker-track, .orbit-spin, .halo-pulse, .glint-sweep {
              animation: none !important;
            }
            .flap-letter { opacity: 1; transform: none; }
            .btn-press { transition: none; }
          }
        `}
      </style>

      {/* --- BACKGROUND: LIVING PINSTRIPE --- */}
      <div className="absolute inset-0 stripe-bg pointer-events-none z-0" />

      {/* Warm floodlight wash */}
      <div className="absolute -top-24 -left-32 w-[75%] h-[45%] bg-[#D4AF37]/[0.07] blur-[110px] rounded-full pointer-events-none z-0" />
      <div className="absolute -top-24 -right-32 w-[75%] h-[45%] bg-[#B91C2B]/[0.06] blur-[110px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none z-0" />

      {/* Roaming light sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="sweep-light" />
      </div>

      {/* Rising dust / floodlight particles */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        {DUST.map((d, i) => (
          <span
            key={i}
            className="dust"
            style={{
              left: d.left,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDuration: d.dur,
              animationDelay: d.delay,
            }}
          />
        ))}
      </div>

      {/* Faint chalk pitch watermark */}
      <svg
        className="pitch-watermark absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[135%] w-auto pointer-events-none z-0"
        viewBox="0 0 220 760"
        fill="none"
      >
        <rect x="60" y="10" width="100" height="740" stroke="#EDE6D6" strokeWidth="2" />
        <line x1="60" y1="90" x2="160" y2="90" stroke="#EDE6D6" strokeWidth="2" strokeDasharray="6 6" />
        <line x1="60" y1="670" x2="160" y2="670" stroke="#EDE6D6" strokeWidth="2" strokeDasharray="6 6" />
        <rect x="90" y="70" width="40" height="20" stroke="#EDE6D6" strokeWidth="1.5" />
        <rect x="90" y="670" width="40" height="20" stroke="#EDE6D6" strokeWidth="1.5" />
        <g stroke="#EDE6D6" strokeWidth="3">
          <line x1="102" y1="30" x2="102" y2="65" />
          <line x1="110" y1="30" x2="110" y2="65" />
          <line x1="118" y1="30" x2="118" y2="65" />
          <line x1="102" y1="705" x2="102" y2="740" />
          <line x1="110" y1="705" x2="110" y2="740" />
          <line x1="118" y1="705" x2="118" y2="740" />
        </g>
      </svg>

      <div className="relative z-10 flex flex-col flex-1 px-6 py-8">

        {/* --- REVOLVING CRICKET BALL --- */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-5 shrink-0">
          <div className="halo-pulse absolute inset-[-22px] rounded-full bg-[#B91C2B]/25 blur-2xl" style={{ animation: 'haloPulse 4s ease-in-out infinite' }} />
          <div className="orbit-spin absolute inset-[-13px]" style={{ animation: 'orbitSpin 6s linear infinite' }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]" />
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D4AF37]/60" />
          </div>
          <div
            className="relative w-full h-full rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 32% 26%, #d6425a, #8B1220 55%, #430A10 100%)',
              boxShadow: 'inset -10px -10px 24px rgba(0,0,0,0.8), inset 6px 6px 14px rgba(255,255,255,0.08), 0 0 44px rgba(185,28,43,0.4)',
            }}
          >
            <div className="absolute inset-0" style={{ animation: 'spin 3.2s linear infinite' }}>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38%] h-[150%] border-x-[3px] border-dashed border-white/85"
                style={{ borderRadius: '50%' }}
              />
            </div>
            <div
              className="glint-sweep absolute inset-0"
              style={{
                background: 'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 48%, transparent 62%)',
                animation: 'glintSweep 3.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* --- HONOURS BOARD TITLE --- */}
        <div className="mx-auto mb-6 flex flex-col items-center shrink-0">
          <div className="rounded-md p-[3px] bg-gradient-to-b from-[#8a5a30] to-[#432612] shadow-[0_14px_34px_rgba(0,0,0,0.6)]">
            <div className="shimmer-mask relative rounded-[4px] bg-[#141414] px-5 py-4 sm:px-7 sm:py-5 border border-[#6b4226]/70">
              <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
              <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
              <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_4px_rgba(212,175,55,0.8)]" />

              <div className="flex gap-1 sm:gap-1.5 justify-center" style={{ perspective: '500px' }}>
                {title.map((ch, i) => (
                  <span
                    key={i}
                    className="flap-letter flex items-center justify-center w-7 h-9 sm:w-9 sm:h-11 rounded-[3px] text-xl sm:text-2xl text-[#1B140A]"
                    style={{
                      animationDelay: `${i * 85}ms, ${i * 220}ms`,
                      background: 'linear-gradient(180deg, #F7F1E3, #EAD9AF)',
                      boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.35)',
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-[10px] font-semibold tracking-[0.42em] uppercase text-[#D4AF37]">
            Scoring Engine
          </p>
          <div className="w-16 h-px bg-[#D4AF37]/40 mt-2" />
        </div>

        {/* --- LED RIBBON TICKER --- */}
        <div className="relative w-full overflow-hidden border-y border-[#D4AF37]/15 bg-[#0a0a0a]/80 py-2 mb-8 shrink-0 max-w-md mx-auto rounded-sm">
          <div className="ticker-track flex w-max gap-10 whitespace-nowrap font-mono-score text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/75">
            {tickerLoop.map((t, i) => (
              <span key={i} className="flex items-center gap-10">
                {t}
                <span className="text-[#B91C2B]/70">●</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-5 pb-10 shrink-0">

          {/* --- SCORE A MATCH: LEDGER CARD --- */}
          <div className="relative shrink-0 rounded-sm overflow-hidden shadow-[0_18px_36px_rgba(0,0,0,0.6)]">
            <div className="ledger-card relative pl-7 pr-6 py-6">
              <div className="absolute left-0 top-0 bottom-0 w-0 border-l-2 border-dashed border-[#B91C2B]/50" />
              <div className="absolute left-2.5 top-4 w-1.5 h-1.5 rounded-full bg-[#1B140A]/15" />
              <div className="absolute left-2.5 bottom-4 w-1.5 h-1.5 rounded-full bg-[#1B140A]/15" />

              <div className="flex items-center gap-3 mb-1">
                <StumpsIcon className="w-6 h-6 text-[#B91C2B]" />
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1B140A] tracking-tight">
                  Score a Match
                </h2>
              </div>
              <p className="text-[#1B140A]/60 text-xs sm:text-sm font-medium mb-5 pl-9">
                Step up as scorer and umpire
              </p>

              <button
                onClick={() => onStartMatch()}
                className="btn-press btn-glow-gold w-full py-4 rounded-sm font-display font-bold text-lg sm:text-xl tracking-wide text-[#2a1a0a] uppercase"
                style={{ background: 'linear-gradient(180deg, #E4C158, #D4AF37 55%, #A6841E)' }}
              >
                Host Match
              </button>
            </div>
          </div>

          {/* --- THE TOSS: DIVIDER --- */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-[#D4AF37]/20" />
            <div className="flex flex-col items-center gap-1.5">
              <div className="coin w-10 h-10 rounded-full flex items-center justify-center">
                <StumpsIcon className="w-4 h-4 text-[#3b2415]" />
              </div>
              <span className="text-[8px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]/60">
                call it
              </span>
            </div>
            <div className="h-px flex-1 bg-[#D4AF37]/20" />
          </div>

          {/* --- FOLLOW A MATCH: LEDGER CARD --- */}
          <div className="relative shrink-0 rounded-sm overflow-hidden shadow-[0_18px_36px_rgba(0,0,0,0.6)]" style={{ animationDelay: '3s' }}>
            <div className="ledger-card relative pl-7 pr-6 py-6" style={{ animationDelay: '3s' }}>
              <div className="absolute left-0 top-0 bottom-0 w-0 border-l-2 border-dashed border-[#B91C2B]/50" />
              <div className="absolute left-2.5 top-4 w-1.5 h-1.5 rounded-full bg-[#1B140A]/15" />
              <div className="absolute left-2.5 bottom-4 w-1.5 h-1.5 rounded-full bg-[#1B140A]/15" />

              <div className="flex items-center gap-3 mb-1">
                <ScoreboardIcon className="w-6 h-6 text-[#1B140A]/70" />
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1B140A] tracking-tight">
                  Follow a Match
                </h2>
              </div>
              <p className="text-[#1B140A]/60 text-xs sm:text-sm font-medium mb-5 pl-9">
                Enter the match code to watch live
              </p>

              <form onSubmit={handleJoinLive} className="flex gap-2.5">
                <div className="flex-1 min-w-0 rounded-sm bg-[#060606] border border-[#000] px-3 flex items-center focus-within:ring-2 focus-within:ring-[#D4AF37]/60 transition-shadow">
                  <input
                    type="text"
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value.toUpperCase())}
                    placeholder="MATCH ID"
                    maxLength={6}
                    className="font-mono-score w-full bg-transparent py-3.5 text-lg sm:text-xl font-bold text-center text-[#EDE6D6] placeholder-[#EDE6D6]/25 tracking-[0.25em] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!matchId.trim()}
                  className={`btn-press shrink-0 px-6 rounded-sm font-display font-bold text-base sm:text-lg uppercase tracking-wide text-[#F3ECDA] disabled:text-[#F3ECDA]/30 ${matchId.trim() ? 'btn-glow-red' : ''}`}
                  style={{
                    background: matchId.trim() ? 'linear-gradient(180deg, #9c2c3c, #B91C2B 60%, #5e1622)' : '#1c1c1c',
                  }}
                >
                  Watch
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* --- FOOTER --- */}
        <div className="text-center mt-auto relative z-10 shrink-0">
          <div className="w-10 h-px bg-[#D4AF37]/30 mx-auto mb-3" />
          <p className="text-[#EDE6D6]/40 font-medium tracking-[0.15em] text-[9px] uppercase">
            Built for friends&nbsp; © 2026 Bakaziki Labs
          </p>
        </div>

      </div>
    </div>
  );
}