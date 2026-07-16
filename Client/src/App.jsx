import React, { useState } from 'react';
import axios from 'axios';
import HomeDashboard from './components/HomeDashboard';
import MatchSetup from './components/MatchSetup';
import UmpireConsole from './components/UmpireConsole';
import SpectatorView from './components/SpectatorView';

const SERVER_URL = 'http://localhost:5000';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeMatchData, setActiveMatchData] = useState(null);
  const [spectatorMatchId, setSpectatorMatchId] = useState('');

  const handleNavigation = async (data, isSpectator = false) => {
    if (isSpectator) {
      // User typed an ID to watch a match
      setSpectatorMatchId(data);
      setCurrentScreen('spectator');
    } else {
      // Umpire finished setup and hit "Let's Play"
      const matchId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const matchDetails = { ...data, matchId };
      
      try {
        // Create match in MongoDB
        await axios.post(`${SERVER_URL}/api/match`, {
          matchId: matchId,
          setupData: matchDetails
        });
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

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center font-sans antialiased">
      <div className="w-full max-w-md h-screen max-h-[850px] bg-slate-900 shadow-2xl relative overflow-hidden sm:rounded-3xl border border-slate-800 flex flex-col">
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          
          {currentScreen === 'home' && (
            <HomeDashboard 
              onStartMatch={(data, isSpectator) => {
                if (isSpectator) {
                  handleNavigation(data, true); // Go to spectator view
                } else {
                  setCurrentScreen('setup'); // FIX: Just go to setup screen!
                }
              }} 
            />
          )}

          {currentScreen === 'setup' && (
            <MatchSetup 
              onBack={() => setCurrentScreen('home')} 
              onStartMatch={(data) => handleNavigation(data, false)} // Sends setup data to DB
            />
          )}

          {currentScreen === 'scoring' && (
             <UmpireConsole matchData={activeMatchData} /> 
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