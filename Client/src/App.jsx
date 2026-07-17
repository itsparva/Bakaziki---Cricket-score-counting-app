import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HomeDashboard from './components/HomeDashboard';
import MatchSetup from './components/MatchSetup';
import UmpireConsole from './components/UmpireConsole';
import SpectatorView from './components/SpectatorView';

const SERVER_URL = 'https://bakaziki-cricket-score-counting-app.onrender.com';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeMatchData, setActiveMatchData] = useState(null);
  const [spectatorMatchId, setSpectatorMatchId] = useState('');

  // NEW: Check local storage on initial load to survive refreshes
  useEffect(() => {
    const savedMatch = localStorage.getItem('bakaziki_active_match');
    if (savedMatch) {
      setActiveMatchData(JSON.parse(savedMatch));
      setCurrentScreen('scoring');
    }
  }, []);

  const handleNavigation = async (data, isSpectator = false) => {
    if (isSpectator) {
      setSpectatorMatchId(data);
      setCurrentScreen('spectator');
    } else {
      const matchId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const matchDetails = { ...data, matchId };
      
      try {
        await axios.post(`${SERVER_URL}/api/match`, {
          matchId: matchId,
          setupData: matchDetails
        });
        
        // NEW: Save to local storage before navigating
        localStorage.setItem('bakaziki_active_match', JSON.stringify(matchDetails));
        setActiveMatchData(matchDetails);
        setCurrentScreen('scoring');
      } catch (err) {
        console.error("Full Error Details:", err);
        if (err.response) {
          alert(`Server Error: ${err.response.data.error}`);
        } else if (err.request) {
          alert(`Network Error: Ensure backend is running at ${SERVER_URL}`);
        } else {
          alert(`Error: ${err.message}`);
        }
      }
    }
  };

  // NEW: A function to clear storage when a match naturally ends
  const handleEndMatch = () => {
    localStorage.removeItem('bakaziki_active_match');
    setActiveMatchData(null);
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center font-sans antialiased">
      <div className="w-full max-w-md h-screen max-h-[850px] bg-slate-900 shadow-2xl relative overflow-hidden sm:rounded-3xl border border-slate-800 flex flex-col">
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          
          {currentScreen === 'home' && (
            <HomeDashboard 
              onStartMatch={(data, isSpectator) => {
                if (isSpectator) {
                  handleNavigation(data, true);
                } else {
                  setCurrentScreen('setup');
                }
              }} 
            />
          )}

          {currentScreen === 'setup' && (
            <MatchSetup 
              onBack={() => setCurrentScreen('home')} 
              onStartMatch={(data) => handleNavigation(data, false)} 
            />
          )}

          {currentScreen === 'scoring' && (
             <UmpireConsole matchData={activeMatchData} onEndMatch={handleEndMatch} /> 
          )}

          {currentScreen === 'spectator' && (
             <SpectatorView 
               matchId={spectatorMatchId} 
               onBack={() => setCurrentScreen('home')} 
             /> 
          )}

        </main>
      </div>
    </div>
  );
}