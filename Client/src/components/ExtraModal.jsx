import React from 'react';

export default function ExtraModal({ extraModal, setExtraModal, confirmExtra }) {
  if (!extraModal.isOpen) return null;

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

      <div className="modal-panel bg-[#0d0d0d] border border-[#D4AF37]/20 rounded-sm p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
        <h3 className="font-display text-xl font-black text-[#D4AF37] uppercase mb-4 text-center tracking-wide">
          Add Extras
        </h3>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {[{lbl: 'Wide', val: 'WD'}, {lbl: 'No Ball', val: 'NB'}, {lbl: 'Byes', val: 'B'}, {lbl: 'Leg Byes', val: 'LB'}].map(t => (
            <button
              key={t.val}
              onClick={() => setExtraModal({...extraModal, type: t.val})}
              className={`btn-press py-3 rounded-sm font-bold border uppercase tracking-wide text-sm ${
                extraModal.type === t.val
                  ? 'bg-[#D4AF37] text-[#1B140A] border-[#D4AF37]'
                  : 'field-dark text-[#EDE6D6]/50'
              }`}
            >
              {t.lbl}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-[#D4AF37]/70 uppercase tracking-widest font-bold mb-2 font-mono-score">
          Runs Scored (Bat or Running)
        </p>
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[0, 1, 2, 3, 4, 6].map(r => (
            <button
              key={r}
              onClick={() => setExtraModal({...extraModal, runs: r})}
              className={`btn-press py-3 rounded-sm font-bold font-mono-score border ${
                extraModal.runs === r
                  ? 'bg-[#D4AF37] text-[#1B140A] border-[#D4AF37]'
                  : 'field-dark text-[#EDE6D6]/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setExtraModal({isOpen: false, type: 'WD', runs: 0})}
            className="btn-press flex-1 py-3 rounded-sm field-dark text-[#EDE6D6]/50 font-bold uppercase text-sm"
          >
            Cancel
          </button>
          <button
            onClick={confirmExtra}
            className="btn-press flex-1 py-3 rounded-sm font-display text-[#1B140A] font-black uppercase"
            style={{ background: 'linear-gradient(180deg, #E4C158, #D4AF37 55%, #A6841E)' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}