const { SlashCommandBuilder } = require('discord.js');
const Session = require('../../models/Session');
const PlayerStats = require('../../models/PlayerStats');
const logger = require('../../config/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vencedor')
        .setDescription('Registra o time vencedor de uma sessão')
        .addStringOption(option => 
            option.setName('sessao')
                .setDescription('ID da sessão')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('time')
                .setDescription('Time vencedor')
                .setRequired(true)
                .addChoices(
                    { name: 'Time 1', value: 'time1' },
                    { name: 'Time 2', value: 'time2' }
                )),

    async execute(interaction) {
        try {
            const sessionId = interaction.options.getString('sessao');
            const winnerTeam = interaction.options.getString('time');

            const session = await Session.findOne({ sessionId });
            if (!session) {
                logger.error('Sessão não encontrada:', { sessionId });
                return interaction.reply({ 
                    content: 'Sessão não encontrada.',
                    ephemeral: true 
                });
            }

            if (session.winner) {
                logger.error('Sessão já finalizada:', { sessionId });
                return interaction.reply({ 
                    content: 'Esta sessão já foi finalizada.',
                    ephemeral: true 
                });
            }

            const winningPlayers = winnerTeam === 'time1' ? session.team1 : session.team2;
            const losingPlayers = winnerTeam === 'time1' ? session.team2 : session.team1;

            for (const player of winningPlayers) {
                try {
                    const playerId = player.id || player.name;
                    const playerStats = await PlayerStats.findOne({ 
                        $or: [
                            { playerId: playerId },
                            { playerName: player.name }
                        ]
                    }) || { totalGames: 0, wins: 0 };
                    
                    await PlayerStats.findOneAndUpdate(
                        { $or: [
                            { playerId: playerId },
                            { playerName: player.name }
                        ]},
                        {
                            playerName: player.name,
                            playerId: playerId,
                            $inc: { totalGames: 1, wins: 1 },
                            $set: { winPercentage: calculateWinPercentage(playerStats.wins + 1, playerStats.totalGames + 1) }
                        },
                        { upsert: true, new: true }
                    );
                } catch (error) {
                    logger.error('Erro ao atualizar estatísticas do vencedor:', { 
                        player: player.name, 
                        error: error.message 
                    });
                }
            }

            for (const player of losingPlayers) {
                try {
                    const playerId = player.id || player.name;
                    const playerStats = await PlayerStats.findOne({ 
                        $or: [
                            { playerId: playerId },
                            { playerName: player.name }
                        ]
                    }) || { totalGames: 0, losses: 0 };

                    await PlayerStats.findOneAndUpdate(
                        { $or: [
                            { playerId: playerId },
                            { playerName: player.name }
                        ]},
                        {
                            playerName: player.name,
                            playerId: playerId,
                            $inc: { totalGames: 1, losses: 1 },
                            $set: { winPercentage: calculateWinPercentage(playerStats.wins || 0, playerStats.totalGames + 1) }
                        },
                        { upsert: true, new: true }
                    );
                } catch (error) {
                    logger.error('Erro ao atualizar estatísticas do perdedor:', { 
                        player: player.name, 
                        error: error.message 
                    });
                }
            }

            session.winner = winnerTeam;
            session.status = 'completed';
            const winnerDisplay = winnerTeam === 'time1' ? 'Time 1' : 'Time 2';
            await session.save();

            interaction.reply(`Sessão ${sessionId} finalizada. Vencedor: ${winnerDisplay}`);
        } catch (error) {
            logger.error('Erro ao registrar vencedor:', { error: error.message });
            interaction.reply({ 
                content: 'Erro ao processar o resultado.',
                ephemeral: true 
            });
        }
    }
};

function calculateWinPercentage(wins, totalGames) {
    return totalGames > 0 ? (wins / totalGames) * 100 : 0;
}