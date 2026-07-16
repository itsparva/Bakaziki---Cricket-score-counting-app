require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Make sure this matches your exact folder/file spelling!
const Match = require('./models/Match'); 

const app = express();
const server = http.createServer(app);

// ==========================================
// 1. BULLETPROOF CORS (Wide Open)
// ==========================================
app.use(cors({ origin: '*' }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: '*' }
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
// Health check
app.get('/', (req, res) => {
  res.send('🏏 GullyScorer Backend is Live and Running!');
});

// Create Match
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

// Fetch Match
app.get('/api/match/:matchId', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId.toUpperCase() });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.status(200).json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Update Match
app.put('/api/match/:matchId', async (req, res) => {
  try {
    const { liveState, stats, isComplete, finalResult } = req.body;
    
    const updatedMatch = await Match.findOneAndUpdate(
      { matchId: req.params.matchId },
      { $set: { liveState, stats, isComplete, finalResult } },
      { new: true }
    );

    if (!updatedMatch) return res.status(404).json({ error: 'Match not found' });

    // Broadcast the update via WebSockets
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
// 5. START SERVER
// ==========================================
// CRITICAL: This must be server.listen, not app.listen!
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});