import React from 'react';

const BrokenStumpsIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="5" y="14" width="2.2" height="12" rx="1" fill="currentColor" transform="rotate(-18 5 14)" />
    <rect x="14.8" y="10" width="2.2" height="16" rx="1" fill="currentColor" />
    <rect x="23" y="15" width="2.2" height="11" rx="1" fill="currentColor" transform="rotate(16 23 15)" />
    <rect x="10" y="6" width="7" height="2" rx="1" fill="currentColor" opacity="0.7" transform="rotate(-8 10 6)" />
  </svg>
);

export default function ExitModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/90 z-50 p-6 flex flex-col justify-center font-sans">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;0,9..144,900&display=swap');
          .font-display { font-family: 'Fraunces', serif; }
          .btn-press { transition: transform 0.12s ease, background 0.2s ease; }
          .btn-press:active { transform: scale(0.95); }
          .field-dark { background: #060606; border: 1px solid #1c1c1c; }
          .modal-panel { animation: modalIn 0.22s cubic-bezier(.2,.8,.2,1) both; }
          @keyframes modalIn {
            0%   { opacity: 0; transform: scale(0.94) translateY(6px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          .warn-ring { animation: warnPulse 2s ease-in-out infinite; }
          @keyframes warnPulse {
            0%, 100% { box-shadow: 0 0 0 rgba(185,28,43,0.25); }
            50%      { box-shadow: 0 0 22px rgba(185,28,43,0.5); }
          }
          .btn-glow-red { animation: glowRed 2.2s ease-in-out infinite; }
          @keyframes glowRed {
            0%, 100% { box-shadow: 0 0 0 rgba(185,28,43,0); }
            50%      { box-shadow: 0 0 24px rgba(185,28,43,0.5); }
          }
          @media (prefers-reduced-motion: reduce) {
            .modal-panel, .warn-ring, .btn-glow-red { animation: none !important; }
            .btn-press { transition: none; }
          }
        `}
      </style>

      <div className="modal-panel bg-[#0d0d0d] border border-[#B91C2B]/40 rounded-sm p-6 shadow-[0_20px_50px_rgba(0,0,0,0.75)] text-center">
        <div className="warn-ring w-16 h-16 bg-[#B91C2B]/10 text-[#e0616f] rounded-full flex items-center justify-center mx-auto mb-4">
          <BrokenStumpsIcon className="w-8 h-8" />
        </div>
        <h3 className="font-display text-xl font-black text-[#EDE6D6] uppercase mb-2 tracking-wide">Abandon Match?</h3>
        <p className="text-sm text-[#EDE6D6]/50 mb-6 leading-relaxed">
          Are you sure you want to exit? This will stop the live broadcast and clear your umpire session. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-press flex-1 py-3 rounded-sm field-dark text-[#EDE6D6]/60 font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-press btn-glow-red flex-1 py-3 rounded-sm font-display text-[#EDE6D6] font-black uppercase"
            style={{ background: 'linear-gradient(180deg, #9c2c3c, #B91C2B 60%, #5e1622)' }}
          >
            Abandon
          </button>
        </div>
      </div>
    </div>
  );
}