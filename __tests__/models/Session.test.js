const Session = require('../../models/Session');

describe('Session Model', () => {
    test('should create new session', async () => {
        const sessionData = {
            sessionId: 'test-123',
            participants: [
                { id: '1', name: 'Player1' },
                { id: '2', name: 'Player2' }
            ],
            team1: [{ id: '1', name: 'Player1' }],
            team2: [{ id: '2', name: 'Player2' }]
        };

        Session.prototype.save = jest.fn();
        const session = new Session(sessionData);
        await session.save();

        expect(session.save).toHaveBeenCalled();
    });
});