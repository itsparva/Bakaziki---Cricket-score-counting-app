require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const Match = require('./models/Match');

const app = express();
const server = http.createServer(app);

// ==========================================
// 1. BRUTE FORCE CORS (The Sledgehammer)
// ==========================================
// We are manually injecting the exact headers the browser is begging for.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Intercept pre-flight OPTIONS requests and approve them immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Socket.io also gets the wide-open treatment
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "OPTIONS"]
  }
});

// ==========================================
// 2. DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🔥 MongoDB Connected successfully'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// ==========================================
// 3. API ROUTES
// ==========================================
app.get('/', (req, res) => {
  res.send('🏏 Bakaziki Backend is Live and Running!');
});

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

app.get('/api/match/:matchId', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId.toUpperCase() });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.status(200).json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

app.put('/api/match/:matchId', async (req, res) => {
  try {
    const { liveState, stats, isComplete, finalResult } = req.body;
    
    const updatedMatch = await Match.findOneAndUpdate(
      { matchId: req.params.matchId },
      { $set: { liveState, stats, isComplete, finalResult } },
      { new: true }
    );

    if (!updatedMatch) return res.status(404).json({ error: 'Match not found' });

    io.to(req.params.matchId).emit('matchUpdate', updatedMatch);
    res.status(200).json({ message: 'Match updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// ==========================================
// 4. SOCKET.IO ROOMS
// ==========================================
io.on('connection', (socket) => {
  socket.on('joinMatch', (matchId) => {
    socket.join(matchId);
  });
});

// ==========================================
// 5. START SERVER (Crucial: server.listen)
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});