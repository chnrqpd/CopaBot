const { execute } = require('../../commands/main/vencedor');
const Session = require('../../models/Session');
const PlayerStats = require('../../models/PlayerStats');

jest.mock('../../models/Session');
jest.mock('../../models/PlayerStats');

describe('Vencedor Command', () => {
    let interaction;

    beforeEach(() => {
        interaction = {
            options: {
                getString: jest.fn()
            },
            reply: jest.fn()
        };

        Session.findOne.mockReset();
        PlayerStats.findOne.mockReset();
        PlayerStats.findOneAndUpdate.mockReset();
    });

    test('should require valid session', async () => {
        interaction.options.getString.mockReturnValueOnce('invalid-session')
            .mockReturnValueOnce('time1');
        Session.findOne.mockResolvedValue(null);

        await execute(interaction);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('Sessão não encontrada'),
                ephemeral: true
            })
        );
    });
});
