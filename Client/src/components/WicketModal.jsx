import React from 'react';

export default function WicketModal({ wicketModal, setWicketModal, confirmWicket, striker, nonStriker, fieldingTeamList }) {
  if (!wicketModal.isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/90 z-50 p-6 flex flex-col justify-center font-sans">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,800;0,9..144,900&family=Space+Mono:wght@400;700&display=swap');
          .font-display { font-family: 'Fraunces', serif; }
          .font-mono-score { font-family: 'Space Mono', monospace; }
          .btn-press { transition: transform 0.12s ease, background 0.2s ease, border-color 0.2s ease; }
          .btn-press:active { transform: scale(0.95); }
          .field-dark { background: #060606; border: 1px solid #1c1c1c; }
          .modal-panel { animation: modalIn 0.22s cubic-bezier(.2,.8,.2,1) both; }
          @keyframes modalIn {
            0%   { opacity: 0; transform: scale(0.94) translateY(6px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .modal-panel { animation: none; }
            .btn-press { transition: none; }
          }
        `}
      </style>

      <div className="modal-panel bg-[#0d0d0d] border border-[#B91C2B]/25 rounded-sm p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-xl font-black text-[#e0616f] uppercase mb-4 text-center tracking-wide">
          How was {striker} out?
        </h3>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped'].map(type => (
            <button 
              key={type} 
              onClick={() => setWicketModal({...wicketModal, type, fielder: '', runOutBatsman: type === 'Run Out' ? striker : '', runOutRuns: 0, runOutEnd: ''})} 
              className={`btn-press py-3 rounded-sm font-bold border uppercase text-sm tracking-wide ${
                wicketModal.type === type
                  ? 'bg-[#B91C2B] text-[#EDE6D6] border-[#B91C2B]'
                  : 'field-dark text-[#EDE6D6]/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {wicketModal.type === 'Run Out' && (
          <div className="mb-4 field-dark p-4 rounded-sm">
            <p className="text-xs text-[#D4AF37]/70 uppercase tracking-widest font-bold mb-2 font-mono-score">
              Runs Completed Before Out
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[0, 1, 2, 3].map(r => (
                <button 
                  key={r} 
                  onClick={() => setWicketModal({...wicketModal, runOutRuns: r})} 
                  className={`btn-press py-2 rounded-sm font-bold font-mono-score border ${
                    wicketModal.runOutRuns === r
                      ? 'bg-[#D4AF37] text-[#1B140A] border-[#D4AF37]'
                      : 'bg-[#0a0a0a] text-[#EDE6D6]/40 border-[#1c1c1c]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-[#D4AF37]/70 uppercase tracking-widest font-bold mb-2 font-mono-score">
              Who is Out?
            </p>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setWicketModal({...wicketModal, runOutBatsman: striker})} 
                className={`btn-press flex-1 py-2 text-sm rounded-sm font-bold border truncate px-1 ${
                  wicketModal.runOutBatsman === striker
                    ? 'bg-[#B91C2B] text-[#EDE6D6] border-[#B91C2B]'
                    : 'bg-[#0a0a0a] text-[#EDE6D6]/40 border-[#1c1c1c]'
                }`}
              >
                {striker} (Str)
              </button>
              {nonStriker && (
                <button 
                  onClick={() => setWicketModal({...wicketModal, runOutBatsman: nonStriker})} 
                  className={`btn-press flex-1 py-2 text-sm rounded-sm font-bold border truncate px-1 ${
                    wicketModal.runOutBatsman === nonStriker
                      ? 'bg-[#B91C2B] text-[#EDE6D6] border-[#B91C2B]'
                      : 'bg-[#0a0a0a] text-[#EDE6D6]/40 border-[#1c1c1c]'
                  }`}
                >
                  {nonStriker} (Non-Str)
                </button>
              )}
            </div>

            <p className="text-xs text-[#D4AF37]/70 uppercase tracking-widest font-bold mb-2 font-mono-score">
              At Which End?
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setWicketModal({...wicketModal, runOutEnd: 'striker'})} 
                className={`btn-press flex-1 py-2 text-sm rounded-sm font-bold border truncate px-1 ${
                  wicketModal.runOutEnd === 'striker'
                    ? 'bg-[#D4AF37] text-[#1B140A] border-[#D4AF37]'
                    : 'bg-[#0a0a0a] text-[#EDE6D6]/40 border-[#1c1c1c]'
                }`}
              >
                Striker's End
              </button>
              <button 
                onClick={() => setWicketModal({...wicketModal, runOutEnd: 'non_striker'})} 
                className={`btn-press flex-1 py-2 text-sm rounded-sm font-bold border truncate px-1 ${
                  wicketModal.runOutEnd === 'non_striker'
                    ? 'bg-[#D4AF37] text-[#1B140A] border-[#D4AF37]'
                    : 'bg-[#0a0a0a] text-[#EDE6D6]/40 border-[#1c1c1c]'
                }`}
              >
                Non-Striker's End
              </button>
            </div>
          </div>
        )}

        {['Caught', 'Run Out', 'Stumped'].includes(wicketModal.type) && (
          <div className="mb-6">
            <p className="text-xs text-[#D4AF37]/70 uppercase tracking-widest font-bold mb-2 font-mono-score">
              Select Fielder
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {fieldingTeamList.map(fielder => (
                <button
                  key={fielder}
                  onClick={() => setWicketModal({...wicketModal, fielder})}
                  className={`btn-press py-2 px-2 text-sm rounded-sm font-bold border ${
                    wicketModal.fielder === fielder
                      ? 'bg-[#D4AF37] text-[#1B140A] border-[#D4AF37]'
                      : 'field-dark text-[#EDE6D6]/50'
                  }`}
                >
                  {fielder}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setWicketModal({isOpen: false, type: '', fielder: '', runOutBatsman: '', runOutRuns: 0, runOutEnd: ''})}
            className="btn-press flex-1 py-3 rounded-sm field-dark text-[#EDE6D6]/50 font-bold uppercase text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={confirmWicket} 
            disabled={!wicketModal.type || (['Caught', 'Run Out', 'Stumped'].includes(wicketModal.type) && !wicketModal.fielder) || (wicketModal.type === 'Run Out' && (!wicketModal.runOutBatsman || !wicketModal.runOutEnd))} 
            className="btn-press flex-1 py-3 rounded-sm font-display text-[#EDE6D6] font-black uppercase disabled:opacity-40 disabled:text-[#EDE6D6]/30"
            style={{
              background: (!wicketModal.type || (['Caught', 'Run Out', 'Stumped'].includes(wicketModal.type) && !wicketModal.fielder) || (wicketModal.type === 'Run Out' && (!wicketModal.runOutBatsman || !wicketModal.runOutEnd)))
                ? '#1c1c1c'
                : 'linear-gradient(180deg, #9c2c3c, #B91C2B 60%, #5e1622)'
            }}
          >
            Confirm Out
          </button>
        </div>
      </div>
    </div>
  );
}