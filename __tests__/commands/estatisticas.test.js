const { execute } = require('../../commands/main/estatisticas');
const PlayerStats = require('../../models/PlayerStats');
const logger = require('../../config/logger');

jest.mock('../../models/PlayerStats', () => ({
    findOne: jest.fn(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn()
}));

jest.mock('../../config/logger', () => ({
    error: jest.fn()
}));

describe('Estatisticas Command', () => {
    let interaction;
    let mentionable;

    beforeEach(() => {
        mentionable = {
            user: {
                id: '123',
                displayName: 'TestPlayer',
                displayAvatarURL: () => 'avatar-url'
            }
        };

        interaction = {
            options: {
                getMentionable: jest.fn()
            },
            reply: jest.fn()
        };

        jest.clearAllMocks();
    });

    test('should show individual player stats', async () => {
        interaction.options.getMentionable.mockReturnValue(mentionable);
        PlayerStats.findOne.mockResolvedValue({
            totalGames: 10,
            wins: 6,
            losses: 4,
            winPercentage: 60
        });

        await execute(interaction);

        expect(PlayerStats.findOne).toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalled();
    });

    test('should show top players when no player is mentioned', async () => {
        interaction.options.getMentionable.mockReturnValue(null);
        
        const topPlayers = [
            { playerName: 'Player1', wins: 10, totalGames: 15, winPercentage: 66.67 },
            { playerName: 'Player2', wins: 8, totalGames: 12, winPercentage: 66.67 }
        ];
    
        PlayerStats.find = jest.fn().mockReturnThis();
        PlayerStats.sort = jest.fn().mockReturnThis();
        PlayerStats.limit = jest.fn().mockResolvedValue(topPlayers);
    
        await execute(interaction);
    
        expect(interaction.reply).toHaveBeenCalled();
        const embedData = interaction.reply.mock.calls[0][0];
        expect(embedData.embeds[0].data.title).toBe('Top 10 Jogadores');
    });

    test('should handle database errors', async () => {
        interaction.options.getMentionable.mockReturnValue(null);
        const error = new Error('Database error');
        PlayerStats.limit.mockRejectedValue(error);

        await execute(interaction);

        expect(logger.error).toHaveBeenCalledWith('Erro nas estatísticas:', {
            erro: error.message
        });
        expect(interaction.reply).toHaveBeenCalledWith({
            content: 'Erro ao buscar estatísticas.',
            ephemeral: true
        });
    });
});