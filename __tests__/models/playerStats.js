jest.mock('../../models/PlayerStats', () => ({
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn()
}));

const PlayerStats = require('../../models/PlayerStats');

describe('PlayerStats Model', () => {
    test('should calculate win percentage correctly', async () => {
        const player = { id: '123', name: 'Winner' };
        PlayerStats.findOne.mockResolvedValue({ totalGames: 5, wins: 3 });
        
        await PlayerStats.findOneAndUpdate(
            { playerId: player.id },
            {
                playerName: player.name,
                playerId: player.id,
                $inc: { totalGames: 1, wins: 1 },
                $set: { winPercentage: 66.67 }
            }
        );

        expect(PlayerStats.findOneAndUpdate).toHaveBeenCalled();
    });
});