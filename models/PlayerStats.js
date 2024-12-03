const mongoose = require('mongoose');

const PlayerStatsSchema = new mongoose.Schema({
    playerId: { type: String, required: true, unique: true },
    playerName: { type: String, required: true },
    totalGames: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 }
});

module.exports = mongoose.model('PlayerStats', PlayerStatsSchema);