const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PlayerStats = require('../../models/PlayerStats');
const logger = require('../../config/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('estatisticas')
        .setDescription('Mostra estatísticas dos jogadores')
        .addMentionableOption(option => 
            option.setName('jogador')
                .setDescription('Mencione o @ do discord do jogador.')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const mentionable = interaction.options.getMentionable('jogador');

            if (mentionable && mentionable.user) {
                const playerStats = await PlayerStats.findOne({ playerId: mentionable.user.id });
                if (!playerStats) {
                    return interaction.reply({ 
                        content: `Nenhuma estatística encontrada para ${mentionable.user.displayName}`,
                        ephemeral: true 
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Estatísticas de ${mentionable.user.displayName}`)
                    .setThumbnail(mentionable.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'Total de Jogos', value: playerStats.totalGames.toString(), inline: true },
                        { name: 'Vitórias', value: playerStats.wins.toString(), inline: true },
                        { name: 'Derrotas', value: playerStats.losses.toString(), inline: true },
                        { name: '% de Vitória', value: playerStats.winPercentage.toFixed(2) + '%', inline: true }
                    )
                    .setColor('#0099ff');

                return interaction.reply({ embeds: [embed] });
            } else {
                const topPlayers = await PlayerStats.find()
                    .sort({ wins: -1 })
                    .limit(10);

                if (!topPlayers.length) {
                    return interaction.reply({ 
                        content: 'Nenhuma estatística encontrada ainda.',
                        ephemeral: true 
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle('Top 10 Jogadores')
                    .setDescription('Ranking baseado no número de vitórias')
                    .setColor('#00ff00');

                topPlayers.forEach((player, index) => {
                    embed.addFields({
                        name: `${index + 1}. ${player.playerName}`, 
                        value: `Vitórias: ${player.wins} | % de Vitória: ${player.winPercentage.toFixed(2)}%`
                    });
                });

                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            logger.error('Erro nas estatísticas:', { 
                jogador: mentionable?.user?.id,
                erro: error.message 
            });
            await interaction.reply({ 
                content: 'Erro ao buscar estatísticas.',
                ephemeral: true 
            });
        }
    }
};