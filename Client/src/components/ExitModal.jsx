import React from 'react';

export default function ExitModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/90 z-50 p-6 flex flex-col justify-center">
      <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
        <h3 className="text-xl font-black text-white uppercase mb-2">Abandon Match?</h3>
        <p className="text-sm text-slate-400 mb-6">Are you sure you want to exit? This will stop the live broadcast and clear your umpire session. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold active:scale-95">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black uppercase active:scale-95 shadow-lg shadow-red-600/30">Abandon</button>
        </div>
      </div>
    </div>
  );
}