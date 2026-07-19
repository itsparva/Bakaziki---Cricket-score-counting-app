import { useState, useEffect } from "react";
import axios from "axios";

export default function useMatchScoring(matchData) {
  const [matchStage, setMatchStage] = useState('regular'); // 'regular' or 'superOver'
  const [regularStats, setRegularStats] = useState(null);
  const [innings, setInnings] = useState(1);
  const [firstInningsStats, setFirstInningsStats] = useState(null);
  const [matchComplete, setMatchComplete] = useState(false);

  const [battingTeam, setBattingTeam] = useState(
    matchData.optedTo === "bat" ? matchData.tossWinner : (matchData.tossWinner === "teamA" ? "teamB" : "teamA")
  );

  const battingTeamKey = battingTeam === "teamA" ? "playersA" : "playersB";
  const bowlingTeamKey = battingTeam === "teamA" ? "playersB" : "playersA";
  const fieldingTeamList = matchData[bowlingTeamKey];

  // --- FIXED: Wicket and Last Man Logic ---
  const teamSize = matchData[battingTeamKey].length;
  const targetOvers = matchStage === 'superOver' ? 1 : parseInt(matchData.overs);
  const totalWickets = matchStage === 'superOver' ? Math.min(2, teamSize) : teamSize;

  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [currentOverHistory, setCurrentOverHistory] = useState([]);
  const [pastOvers, setPastOvers] = useState([]);
  const [fallOfWickets, setFallOfWickets] = useState([]);
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [historyStack, setHistoryStack] = useState([]);

  const getInitialStats = () => {
    const s = { batting: {}, bowling: {} };
    matchData[battingTeamKey].forEach(p => s.batting[p] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: "" });
    matchData[bowlingTeamKey].forEach(p => s.bowling[p] = { runs: 0, balls: 0, wickets: 0 });
    return s;
  };

  const [stats, setStats] = useState(getInitialStats());

  const isAllOut = wickets >= totalWickets;
  // Last man standing only happens if we are at the second to last player on the ENTIRE team roster, and not all out.
  const isLastManStanding = wickets === teamSize - 1 && !isAllOut; 
  const isOversFinished = balls >= targetOvers * 6;
  const targetReached = innings === 2 && firstInningsStats && runs >= firstInningsStats.target;
  const isInningsComplete = isAllOut || isOversFinished || targetReached;
  
  const validBallsInCurrentOver = currentOverHistory.filter(b => !b.includes("WD") && !b.includes("NB")).length;
  const isOverComplete = validBallsInCurrentOver >= 6;

  const saveSnapshot = () => {
    setHistoryStack(prev => [...prev, JSON.parse(JSON.stringify({
      runs, wickets, balls, currentOverHistory, pastOvers, striker, nonStriker, bowler, stats, fallOfWickets
    }))]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    setRuns(last.runs); setWickets(last.wickets); setBalls(last.balls);
    setCurrentOverHistory(last.currentOverHistory); setPastOvers(last.pastOvers);
    setStriker(last.striker); setNonStriker(last.nonStriker); setBowler(last.bowler);
    setStats(last.stats); setFallOfWickets(last.fallOfWickets);
    setHistoryStack(prev => prev.slice(0, -1));
  };

  const rotateStrike = (currentStriker, currentNonStriker) => {
    if (isLastManStanding) return;
    setStriker(currentNonStriker);
    setNonStriker(currentStriker);
  };

  const handleRun = (runValue) => {
    saveSnapshot();
    setRuns(prev => prev + runValue);
    setBalls(prev => prev + 1);
    setCurrentOverHistory(prev => [...prev, runValue.toString()]);

    const newStats = JSON.parse(JSON.stringify(stats));
    newStats.batting[striker].runs += runValue;
    newStats.batting[striker].balls += 1;
    if (runValue === 4) newStats.batting[striker].fours += 1;
    if (runValue === 6) newStats.batting[striker].sixes += 1;
    newStats.bowling[bowler].runs += runValue;
    newStats.bowling[bowler].balls += 1;
    setStats(newStats);

    if (runValue % 2 !== 0) rotateStrike(striker, nonStriker);
  };

  const processExtra = (type, extraRuns) => {
    saveSnapshot();
    const newStats = JSON.parse(JSON.stringify(stats));
    let totalRunsAdded = 0; let isLegalDelivery = false; let ballLabel = "";

    if (type === "WD") {
      totalRunsAdded = 1 + extraRuns;
      newStats.bowling[bowler].runs += totalRunsAdded;
      ballLabel = extraRuns > 0 ? `${totalRunsAdded}WD` : "WD";
    } else if (type === "NB") {
      totalRunsAdded = 1 + extraRuns;
      newStats.bowling[bowler].runs += totalRunsAdded;
      newStats.batting[striker].runs += extraRuns;
      newStats.batting[striker].balls += 1;
      ballLabel = extraRuns > 0 ? `${totalRunsAdded}NB` : "NB";
    } else if (type === "B" || type === "LB") {
      totalRunsAdded = extraRuns;
      newStats.batting[striker].balls += 1;
      newStats.bowling[bowler].balls += 1;
      isLegalDelivery = true;
      ballLabel = extraRuns > 0 ? `${extraRuns}${type}` : "0";
    }

    setRuns(prev => prev + totalRunsAdded);
    if (isLegalDelivery) setBalls(prev => prev + 1);
    setCurrentOverHistory(prev => [...prev, ballLabel]);
    setStats(newStats);
    if (extraRuns % 2 !== 0) rotateStrike(striker, nonStriker);
  };

  const processWicket = ({ type, fielder, runOutBatsman, runOutRuns, runOutEnd }) => {
    saveSnapshot();
    const newStats = JSON.parse(JSON.stringify(stats));
    let runsToAdd = type === "Run Out" ? runOutRuns : 0;
    const outPlayer = type === "Run Out" ? runOutBatsman : striker;
    const overString = `${Math.floor(balls / 6)}.${balls % 6}`;

    setFallOfWickets(prev => [...prev, { score: runs + runsToAdd, wicket: wickets + 1, over: overString, player: outPlayer }]);
    
    // Increment local state variables immediately for the logic checks
    const newWickets = wickets + 1;
    setRuns(prev => prev + runsToAdd); setWickets(newWickets); setBalls(prev => prev + 1);
    setCurrentOverHistory(prev => [...prev, type === "Run Out" && runsToAdd > 0 ? `${runsToAdd}+W` : "W"]);

    if (runsToAdd > 0) {
      newStats.batting[striker].runs += runsToAdd;
      newStats.bowling[bowler].runs += runsToAdd;
    }

    newStats.batting[striker].balls += 1;
    newStats.batting[outPlayer].out = true;

    let dismissalStr = "";
    if (type === "Bowled") dismissalStr = `b ${bowler}`;
    else if (type === "LBW") dismissalStr = `lbw b ${bowler}`;
    else if (type === "Caught") dismissalStr = `c ${fielder} b ${bowler}`;
    else if (type === "Run Out") dismissalStr = `run out (${fielder})`;
    else if (type === "Stumped") dismissalStr = `st ${fielder} b ${bowler}`;
    newStats.batting[outPlayer].dismissal = dismissalStr;

    if (type !== "Run Out") newStats.bowling[bowler].wickets += 1;
    newStats.bowling[bowler].balls += 1;
    setStats(newStats);

    // --- FIXED: Prevent Blank Page on All Out / Last Man ---
    const isNowAllOut = newWickets >= totalWickets;
    const isNowLastMan = newWickets === teamSize - 1 && !isNowAllOut;
    const survivingBatsman = type === "Run Out" ? (outPlayer === striker ? nonStriker : striker) : nonStriker;

    if (isNowAllOut) {
      // Innings is completely over. Clear both slots.
      setStriker(null);
      setNonStriker(null);
    } else if (isNowLastMan) {
      // Last man standing mode (only if entire roster is out)
      setStriker(survivingBatsman);
      setNonStriker(null);
    } else {
      // Normal wicket, we need to slot the new batsman
      if (type === "Run Out") {
        if (runOutEnd === "striker") { setStriker(null); setNonStriker(survivingBatsman); } 
        else { setNonStriker(null); setStriker(survivingBatsman); }
      } else {
        setStriker(null);
      }
    }
  };

  const handleStartNextOver = () => {
    saveSnapshot();
    setPastOvers(prev => [...prev, currentOverHistory]);
    setCurrentOverHistory([]);
    rotateStrike(striker, nonStriker);
    setBowler(null);
  };

  const handleInningsTransition = () => {
    if (matchStage === 'regular') {
      if (innings === 1) {
        setFirstInningsStats({ team: matchData[battingTeam], runs, wickets, target: runs + 1, stats, fallOfWickets });
        const nextBattingTeam = battingTeam === "teamA" ? "teamB" : "teamA";
        const nextBattingKey = nextBattingTeam === "teamA" ? "playersA" : "playersB";
        const nextBowlingKey = nextBattingTeam === "teamA" ? "playersB" : "playersA";

        const newStats = { batting: {}, bowling: {} };
        matchData[nextBattingKey].forEach(p => newStats.batting[p] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: "" });
        matchData[nextBowlingKey].forEach(p => newStats.bowling[p] = { runs: 0, balls: 0, wickets: 0 });

        setStats(newStats); setInnings(2); setBattingTeam(nextBattingTeam);
        setRuns(0); setWickets(0); setBalls(0); setCurrentOverHistory([]); setPastOvers([]); setHistoryStack([]); setFallOfWickets([]);
        setStriker(null); setNonStriker(null); setBowler(null);
      } else {
        if (runs === firstInningsStats.target - 1) {
          // --- MATCH TIED: TRIGGER SUPER OVER ---
          setRegularStats({ t1: firstInningsStats, t2: { team: matchData[battingTeam], runs, wickets, stats, fallOfWickets } });
          setMatchStage('superOver'); setInnings(1); setFirstInningsStats(null);
          
          const newStats = { batting: {}, bowling: {} };
          matchData[battingTeamKey].forEach(p => newStats.batting[p] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: "" });
          matchData[bowlingTeamKey].forEach(p => newStats.bowling[p] = { runs: 0, balls: 0, wickets: 0 });
          
          setStats(newStats); setRuns(0); setWickets(0); setBalls(0);
          setCurrentOverHistory([]); setPastOvers([]); setHistoryStack([]); setFallOfWickets([]);
          setStriker(null); setNonStriker(null); setBowler(null);
        } else {
          setMatchComplete(true);
        }
      }
    } else if (matchStage === 'superOver') {
      if (innings === 1) {
        setFirstInningsStats({ team: matchData[battingTeam], runs, wickets, target: runs + 1, stats, fallOfWickets });
        const nextBattingTeam = battingTeam === "teamA" ? "teamB" : "teamA";
        const nextBattingKey = nextBattingTeam === "teamA" ? "playersA" : "playersB";
        const nextBowlingKey = nextBattingTeam === "teamA" ? "playersB" : "playersA";

        const newStats = { batting: {}, bowling: {} };
        matchData[nextBattingKey].forEach(p => newStats.batting[p] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: "" });
        matchData[nextBowlingKey].forEach(p => newStats.bowling[p] = { runs: 0, balls: 0, wickets: 0 });

        setStats(newStats); setInnings(2); setBattingTeam(nextBattingTeam);
        setRuns(0); setWickets(0); setBalls(0); setCurrentOverHistory([]); setPastOvers([]); setHistoryStack([]); setFallOfWickets([]);
        setStriker(null); setNonStriker(null); setBowler(null);
      } else {
        setMatchComplete(true);
      }
    }
  };

  useEffect(() => {
    if (innings === 2 && runs === 0 && balls === 0) setStats(getInitialStats());
  }, [innings]);

  useEffect(() => {
    if (balls > 0 || wickets > 0 || matchComplete || (striker && nonStriker)) {
      const payload = {
        liveState: { matchStage, innings, battingTeam: matchData[battingTeam], firstInningsStats, runs, wickets, balls, currentOverHistory, pastOvers, striker, nonStriker, bowler, fallOfWickets },
        stats: stats,
        isComplete: matchComplete,
        finalResult: matchComplete ? {
          isSuperOver: matchStage === 'superOver',
          regularStats: regularStats,
          superOverStats: matchStage === 'superOver' ? { t1: firstInningsStats, t2: { team: matchData[battingTeam], runs, wickets, stats } } : null,
          t1: matchStage === 'regular' ? firstInningsStats : regularStats.t1,
          t2: matchStage === 'regular' ? { team: matchData[battingTeam], runs, wickets, stats } : regularStats.t2,
          resultMessage: "Match Over",
          setupData: matchData.setupData,
        } : null,
      };
      axios.put(`https://bakaziki-cricket-score-counting-app.onrender.com/api/match/${matchData.matchId}`, payload).catch((err) => console.error(err));
    }
  }, [runs, wickets, balls, currentOverHistory, striker, nonStriker, bowler, matchComplete, matchStage]);

  return {
    matchStage, regularStats, innings, matchComplete, battingTeam, runs, wickets, balls, currentOverHistory, pastOvers, fallOfWickets,
    striker, setStriker, nonStriker, setNonStriker, bowler, setBowler, stats, firstInningsStats, historyStack,
    targetOvers, totalWickets, battingTeamKey, bowlingTeamKey, fieldingTeamList,
    isLastManStanding, isAllOut, isOversFinished, targetReached, isInningsComplete, isOverComplete,
    handleRun, processExtra, processWicket, handleStartNextOver, handleInningsTransition, handleUndo
  };
}