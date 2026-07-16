require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Match = require('./models/Match');

const app = express();
const server = http.createServer(app);

// CORS setup for Vercel & Local testing
// --- EXPRESS CORS ---
const corsOptions = {
  origin: '*', // Wide open to the internet
  methods: ['GET', 'POST', 'PUT', 'OPTIONS']
  // ❌ REMOVED credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// --- SOCKET.IO INITIALIZATION ---
const io = require('socket.io')(server, {
  cors: {
    origin: '*', // Wide open to the internet
    methods: ['GET', 'POST', 'PUT', 'OPTIONS']
    // ❌ REMOVED credentials: true
  }
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🔥 MongoDB Connected successfully'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---

// Basic health check route
app.get('/', (req, res) => {
  res.send('🏏 GullyScorer Backend is Live and Running!');
});

// 1. Create a New Match (Triggered when "Let's Play" is clicked)
app.post('/api/match', async (req, res) => {
  try {
    const { matchId, setupData } = req.body;
    const newMatch = new Match({ matchId, setupData });
    await newMatch.save();
    res.status(201).json({ message: 'Match created!', matchId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// 2. Fetch Live Match Data (For Spectators)
app.get('/api/match/:matchId', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId.toUpperCase() });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.status(200).json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// 3. Update Live Match State (Triggered by the Umpire on EVERY ball)
app.put('/api/match/:matchId', async (req, res) => {
  try {
    const { liveState, stats, isComplete, finalResult } = req.body;
    
    const updatedMatch = await Match.findOneAndUpdate(
      { matchId: req.params.matchId },
      { $set: { liveState, stats, isComplete, finalResult } },
      { new: true }
    );

    if (!updatedMatch) return res.status(404).json({ error: 'Match not found' });

    // 🔥 THE MAGIC: Broadcast the update instantly to anyone watching this specific match ID
    io.to(req.params.matchId).emit('matchUpdate', updatedMatch);

    res.status(200).json({ message: 'Match updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// --- SOCKET.IO CONNECTIONS ---
io.on('connection', (socket) => {
  console.log(`📡 Spectator connected: ${socket.id}`);

  // When a spectator enters a Match ID, they "join" that specific room
  socket.on('joinMatch', (matchId) => {
    socket.join(matchId);
    console.log(`User joined match room: ${matchId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Spectator disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});