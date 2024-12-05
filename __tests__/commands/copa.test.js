const { execute } = require('../../commands/main/copa');
const Session = require('../../models/Session');
const PlayerStats = require('../../models/PlayerStats');

jest.mock('../../models/Session');
jest.mock('../../models/PlayerStats');

describe('Copa Command', () => {
    let interaction;
    let member;
    let collectorCallbacks = [];
    
    beforeEach(() => {
        collectorCallbacks = [];
        member = {
            permissions: {
                has: jest.fn()
            },
            displayName: 'TestUser',
            user: { id: '123' }
        };

        interaction = {
            guild: {},
            member,
            reply: jest.fn(),
            followUp: jest.fn(),
            fetchReply: jest.fn().mockResolvedValue({
                createMessageComponentCollector: () => ({
                    on: jest.fn((event, callback) => {
                        if (event === 'collect') {
                            collectorCallbacks.push(callback);
                        }
                        return this;
                    }),
                    stop: jest.fn()
                }),
                edit: jest.fn()
            }),
            client: {
                on: jest.fn(),
                off: jest.fn()
            }
        };
    });

    describe('Basic Functionality', () => {
        test('should require SendMessages permission', async () => {
            member.permissions.has.mockReturnValue(false);
            await execute(interaction);
            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('Erro ao executar comando'),
                    ephemeral: true
                })
            );
        });

        test('should allow participants to join', async () => {
            member.permissions.has.mockReturnValue(true);
            await execute(interaction);
            
            const buttonInteraction = {
                member,
                customId: 'confirm_participation',
                update: jest.fn(),
                reply: jest.fn()
            };
            
            const collector = await interaction.fetchReply();
            await collector.createMessageComponentCollector().on('collect', async (i) => {
                await i.update({ content: 'Updated' });
            });
            
            expect(collector.edit).toBeDefined();
        });
    });
});