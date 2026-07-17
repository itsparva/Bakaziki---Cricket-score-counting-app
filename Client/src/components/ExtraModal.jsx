import React from 'react';

export default function ExtraModal({ extraModal, setExtraModal, confirmExtra }) {
  if (!extraModal.isOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/90 z-50 p-6 flex flex-col justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-xl font-black text-amber-500 uppercase mb-4 text-center">Add Extras</h3>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[{lbl: 'Wide', val: 'WD'}, {lbl: 'No Ball', val: 'NB'}, {lbl: 'Byes', val: 'B'}, {lbl: 'Leg Byes', val: 'LB'}].map(t => (
            <button key={t.val} onClick={() => setExtraModal({...extraModal, type: t.val})} className={`py-3 rounded-lg font-bold border transition-colors ${extraModal.type === t.val ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{t.lbl}</button>
          ))}
        </div>
        
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Runs Scored (Bat or Running)</p>
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[0, 1, 2, 3, 4, 6].map(r => (
            <button key={r} onClick={() => setExtraModal({...extraModal, runs: r})} className={`py-3 rounded-lg font-bold border transition-colors ${extraModal.runs === r ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{r}</button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setExtraModal({isOpen: false, type: 'WD', runs: 0})} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold">Cancel</button>
          <button onClick={confirmExtra} className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 font-black uppercase">Confirm</button>
        </div>
      </div>
    </div>
  );
}