const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  matchId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true // Speeds up search when spectators enter the ID
  },
  setupData: { 
    type: Object, 
    required: true 
  },
  liveState: { 
    type: Object, 
    default: {} // Stores runs, wickets, balls, current striker, bowler, etc.
  },
  stats: { 
    type: Object, 
    default: {} // Stores the deep player analytics
  },
  isComplete: { 
    type: Boolean, 
    default: false 
  },
  finalResult: {
    type: Object,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);