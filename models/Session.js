const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    sessionId: { type: String, unique: true, required: true },
    participants: [{
        id: String,
        name: String
    }],
    team1: [{
        id: String,
        name: String
    }],
    team2: [{
        id: String,
        name: String
    }],
    winner: { type: String, default: null },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' }
});

module.exports = mongoose.model('Session', SessionSchema);