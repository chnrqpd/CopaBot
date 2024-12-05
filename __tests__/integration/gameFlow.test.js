const { execute: copaExecute } = require('../../commands/main/copa');
const { execute: vencedorExecute } = require('../../commands/main/vencedor');
const Session = require('../../models/Session');
const PlayerStats = require('../../models/PlayerStats');

jest.mock('../../models/Session');
jest.mock('../../models/PlayerStats');
jest.mock('../../config/logger', () => ({
    error: jest.fn()
}));

describe('Game Flow Integration', () => {
    test('should update player stats and session when declaring winner', async () => {
        // O primeiro teste permanece o mesmo, pois está funcionando corretamente
        const mockSession = {
            sessionId: 'test-123',
            team1: [
                { id: 'player1', name: 'Player 1' },
                { id: 'player2', name: 'Player 2' }
            ],
            team2: [
                { id: 'player3', name: 'Player 3' },
                { id: 'player4', name: 'Player 4' }
            ],
            winner: null,
            save: jest.fn().mockResolvedValue(true)
        };

        Session.findOne.mockResolvedValue(mockSession);
        PlayerStats.findOneAndUpdate.mockResolvedValue({});
        PlayerStats.findOne.mockResolvedValue({ totalGames: 5, wins: 3 });

        const interaction = {
            options: {
                getString: jest.fn()
                    .mockReturnValueOnce('test-123')
                    .mockReturnValueOnce('time1')
            },
            reply: jest.fn().mockResolvedValue({})
        };

        await vencedorExecute(interaction);

        expect(Session.findOne).toHaveBeenCalledWith({ sessionId: 'test-123' });
        expect(mockSession.save).toHaveBeenCalled();
        expect(mockSession.winner).toBe('time1');
        expect(PlayerStats.findOneAndUpdate).toHaveBeenCalled();
    });

    test('should create new session when starting copa', async () => {
        const interaction = {
            guild: {},
            member: {
                permissions: { has: jest.fn().mockReturnValue(true) },
                displayName: 'TestUser',
                user: { id: '123' }
            },
            reply: jest.fn(async (data) => {
                // Armazenamos o dado do reply para verificação posterior
                interaction.lastReply = data;
                return {};
            }),
            followUp: jest.fn().mockResolvedValue({}),
            fetchReply: jest.fn().mockResolvedValue({
                createMessageComponentCollector: () => ({
                    on: jest.fn(),
                    stop: jest.fn()
                })
            }),
            client: {
                on: jest.fn(),
                off: jest.fn()
            }
        };

        Session.prototype.save.mockResolvedValue({});

        await copaExecute(interaction);

        // Verificamos se a interação inicial foi chamada
        expect(interaction.reply).toHaveBeenCalled();

        // Verificamos o conteúdo do embed de uma maneira mais robusta
        const replyData = interaction.lastReply;
        expect(replyData).toBeDefined();
        expect(replyData.embeds).toBeDefined();
        expect(replyData.embeds).toHaveLength(1);
        
        const embed = replyData.embeds[0];
        expect(embed).toBeDefined();
        expect(embed.data).toBeDefined();
        expect(embed.data.title).toBe('🏆 Vamos Copa? 🏆');
        
        // Verificamos outros aspectos importantes do embed
        expect(embed.data.color).toBe(0x3498db); // Cor azul conforme definido no código
        expect(embed.data.fields).toHaveLength(2); // Deve ter campos para participantes e status
        expect(embed.data.fields[0].name).toBe('Participantes Confirmados');
        expect(embed.data.fields[1].name).toBe('Status');
    });
});