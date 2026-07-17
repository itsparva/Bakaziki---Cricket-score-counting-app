import React from 'react';

export default function WicketModal({ wicketModal, setWicketModal, confirmWicket, striker, nonStriker, fieldingTeamList }) {
  if (!wicketModal.isOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/90 z-50 p-6 flex flex-col justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-xl font-black text-red-500 uppercase mb-4 text-center">How was {striker} out?</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped'].map(type => (
            <button 
              key={type} 
              onClick={() => setWicketModal({...wicketModal, type, fielder: '', runOutBatsman: type === 'Run Out' ? striker : '', runOutRuns: 0, runOutEnd: ''})} 
              className={`py-3 rounded-lg font-bold border transition-colors ${wicketModal.type === type ? 'bg-red-500 text-white border-red-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {wicketModal.type === 'Run Out' && (
          <div className="mb-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Runs Completed Before Out</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[0, 1, 2, 3].map(r => (
                <button 
                  key={r} 
                  onClick={() => setWicketModal({...wicketModal, runOutRuns: r})} 
                  className={`py-2 rounded-lg font-bold border ${wicketModal.runOutRuns === r ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Who is Out?</p>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setWicketModal({...wicketModal, runOutBatsman: striker})} 
                className={`flex-1 py-2 text-sm rounded-lg font-bold border truncate px-1 ${wicketModal.runOutBatsman === striker ? 'bg-red-500 text-white border-red-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                {striker} (Str)
              </button>
              {nonStriker && (
                <button 
                  onClick={() => setWicketModal({...wicketModal, runOutBatsman: nonStriker})} 
                  className={`flex-1 py-2 text-sm rounded-lg font-bold border truncate px-1 ${wicketModal.runOutBatsman === nonStriker ? 'bg-red-500 text-white border-red-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  {nonStriker} (Non-Str)
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">At Which End?</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setWicketModal({...wicketModal, runOutEnd: 'striker'})} 
                className={`flex-1 py-2 text-sm rounded-lg font-bold border truncate px-1 ${wicketModal.runOutEnd === 'striker' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                Striker's End
              </button>
              <button 
                onClick={() => setWicketModal({...wicketModal, runOutEnd: 'non_striker'})} 
                className={`flex-1 py-2 text-sm rounded-lg font-bold border truncate px-1 ${wicketModal.runOutEnd === 'non_striker' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                Non-Striker's End
              </button>
            </div>
          </div>
        )}

        {['Caught', 'Run Out', 'Stumped'].includes(wicketModal.type) && (
          <div className="mb-6">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Select Fielder</p>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {fieldingTeamList.map(fielder => (
                <button key={fielder} onClick={() => setWicketModal({...wicketModal, fielder})} className={`py-2 px-2 text-sm rounded-lg font-bold border transition-colors ${wicketModal.fielder === fielder ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{fielder}</button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-3 mt-4">
          <button onClick={() => setWicketModal({isOpen: false, type: '', fielder: '', runOutBatsman: '', runOutRuns: 0, runOutEnd: ''})} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold">Cancel</button>
          <button 
            onClick={confirmWicket} 
            disabled={!wicketModal.type || (['Caught', 'Run Out', 'Stumped'].includes(wicketModal.type) && !wicketModal.fielder) || (wicketModal.type === 'Run Out' && (!wicketModal.runOutBatsman || !wicketModal.runOutEnd))} 
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black uppercase disabled:opacity-50 disabled:bg-slate-700"
          >
            Confirm Out
          </button>
        </div>
      </div>
    </div>
  );
}