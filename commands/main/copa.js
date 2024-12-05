const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, ButtonStyle, TextInputBuilder, TextInputStyle } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const Session = require('../../models/Session');
const PlayerStats = require('../../models/PlayerStats');
const logger = require('../../config/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('copa')
        .setDescription('Sorteia dois times caso haja 10 participantes confirmados.'),

    async execute(interaction) {
        try {
            if (!interaction.guild || !interaction.member.permissions.has('SendMessages')) {
                throw new Error('Permissões insuficientes ou comando usado fora do servidor.');
            }

            const sessionId = uuidv4();
            let participants = [];

            const createConfirmationEmbed = (participantsList) => {
                return new EmbedBuilder()
                    .setColor('#3498db')
                    .setTitle('🏆 Vamos Copa? 🏆')
                    .setDescription('Confirme sua participação para o jogo!')
                    .addFields(
                        { 
                            name: 'Participantes Confirmados', 
                            value: participantsList.length > 0 
                                ? participantsList.map((p, index) => `${index + 1}. ${p.name}`).join('\n')
                                : '_Nenhum participante confirmado ainda_',
                            inline: false 
                        },
                        { 
                            name: 'Status', 
                            value: `${participantsList.length}/10 jogadores`, 
                            inline: false 
                        }
                    )
                    .setFooter({ text: `ID da Sessão: ${sessionId}` });
            };

            const createActionRow = () => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_participation')
                            .setLabel('✅ Confirmar')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('cancel_participation')
                            .setLabel('❌ Cancelar')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('add_custom_name')
                            .setLabel('➕ Adicionar Nome')
                            .setStyle(ButtonStyle.Primary)
                    );
            };

            const createTeamEmbed = (team1, team2) => {
                return new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('🏆 Times Sorteados 🏆')
                    .addFields(
                        { name: 'Time 1', value: team1.map(p => p.name).join('\n'), inline: true },
                        { name: 'Time 2', value: team2.map(p => p.name).join('\n'), inline: true }
                    )
                    .setFooter({ text: `ID da Sessão: ${sessionId}` });
            };

            const createWinnerButtons = () => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('winner_team1')
                            .setLabel('Time 1 Venceu')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('winner_team2')
                            .setLabel('Time 2 Venceu')
                            .setStyle(ButtonStyle.Success)
                    );
            };

            await interaction.reply({ 
                embeds: [createConfirmationEmbed(participants)], 
                components: [createActionRow()] 
            });

            const message = await interaction.fetchReply();

            const collector = message.createMessageComponentCollector({
                time: 300000
            });

            const handleModalSubmit = async (modalInteraction) => {
                try {
                    if (!modalInteraction.isModalSubmit() || modalInteraction.customId !== 'add_name_modal') return;
                    
                    const customName = modalInteraction.fields.getTextInputValue('custom_name');
                    if (!customName || customName.length > 32) {
                        throw new Error('Nome inválido');
                    }
                    
                    participants.push({ name: customName });
                    
                    await message.edit({
                        embeds: [createConfirmationEmbed(participants)],
                        components: [createActionRow()]
                    });

                    await modalInteraction.reply({ content: `${customName} adicionado à lista!`, ephemeral: true });

                    if (participants.length === 10) {
                        collector.stop('maxParticipants');
                    }
                    
                } catch (error) {
                    logger.error('Erro no modal:', { sessionId, error: error.message });
                    await modalInteraction.reply({ content: 'Erro ao adicionar nome.', ephemeral: true });
                }
            };

            interaction.client.on('interactionCreate', handleModalSubmit);
            
            collector.on('end', () => {
                interaction.client.off('interactionCreate', handleModalSubmit);
            });

            collector.on('collect', async (buttonInteraction) => {
                try {
                    const member = buttonInteraction.member;
                    const displayName = member.displayName;

                    switch(buttonInteraction.customId) {
                        case 'confirm_participation':
                            if (!participants.some(p => p.id === member.user.id)) {
                                participants.push({
                                    id: member.user.id,
                                    name: displayName
                                });
                            } else {
                                await buttonInteraction.reply({ 
                                    content: 'Você já está confirmado!', 
                                    ephemeral: true 
                                });
                                return;
                            }
                            break;
                        case 'cancel_participation':
                            participants = participants.filter(p => p.name !== displayName);
                            break;
                        case 'add_custom_name':
                            const modal = new ModalBuilder()
                                .setCustomId('add_name_modal')
                                .setTitle('Adicionar Nome');

                            const nameInput = new TextInputBuilder()
                                .setCustomId('custom_name')
                                .setLabel('Digite o nome do jogador')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setMaxLength(32);

                            const modalRow = new ActionRowBuilder().addComponents(nameInput);
                            modal.addComponents(modalRow);
                            await buttonInteraction.showModal(modal);
                            return;
                    }

                    await buttonInteraction.update({ 
                        embeds: [createConfirmationEmbed(participants)], 
                        components: [createActionRow()] 
                    });

                    if (participants.length === 10) {
                        collector.stop('maxParticipants');
                    }
                } catch (error) {
                    logger.error('Erro no collector:', { sessionId, error: error.message });
                    await buttonInteraction.reply({ content: 'Erro ao processar ação.', ephemeral: true });
                }
            });

            collector.on('end', async (collected, reason) => {
                try {
                    if (reason === 'maxParticipants') {
                        const shuffled = participants.sort(() => Math.random() - 0.5);
                        const team1 = shuffled.slice(0, 5);
                        const team2 = shuffled.slice(5, 10);

                        const teamEmbed = createTeamEmbed(team1, team2);
                        const winnerButtons = createWinnerButtons();

                        const teamMessage = await interaction.followUp({ 
                            embeds: [teamEmbed],
                            components: [winnerButtons]
                        });

                        const winnerCollector = teamMessage.createMessageComponentCollector({
                            filter: i => i.customId.startsWith('winner_'),
                            time: 0
                        });

                        winnerCollector.on('collect', async (buttonInteraction) => {
                            try {
                                if (!buttonInteraction.member.permissions.has('Administrator')) {
                                    return buttonInteraction.reply({
                                        content: 'Apenas administradores podem confirmar o vencedor.',
                                        ephemeral: true
                                    });
                                }

                                const winnerTeam = buttonInteraction.customId === 'winner_team1' ? 'time1' : 'time2';
                                
                                const session = await Session.findOne({ sessionId });
                                if (!session || session.winner) {
                                    return buttonInteraction.reply({
                                        content: 'Sessão não encontrada ou já finalizada.',
                                        ephemeral: true
                                    });
                                }

                                const winningPlayers = winnerTeam === 'time1' ? team1 : team2;
                                const losingPlayers = winnerTeam === 'time1' ? team2 : team1;

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
                                                $set: { winPercentage: ((playerStats.wins + 1) / (playerStats.totalGames + 1)) * 100 }
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
                                                $set: { winPercentage: (playerStats.wins || 0) / (playerStats.totalGames + 1) * 100 }
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
                                await session.save();

                                const updatedEmbed = teamEmbed.setDescription(`🎉 Vencedor: ${winnerTeam === 'time1' ? 'Time 1' : 'Time 2'}`);
                                await buttonInteraction.update({ 
                                    embeds: [updatedEmbed],
                                    components: [] 
                                });

                                winnerCollector.stop();
                            } catch (error) {
                                logger.error('Erro ao registrar vencedor:', { sessionId, error: error.message });
                                await buttonInteraction.reply({
                                    content: 'Erro ao processar o resultado.',
                                    ephemeral: true
                                });
                            }
                        });

                        const newSession = new Session({
                            sessionId,
                            participants: [...team1, ...team2],
                            team1,
                            team2
                        });
                        await newSession.save();
                    } else {
                        await interaction.followUp('Não foi possível sortear os times. É necessário 10 participantes.');
                    }
                } catch (error) {
                    logger.error('Erro ao finalizar sessão:', { sessionId, error: error.message });
                    await interaction.followUp('Erro ao sortear os times.');
                }
            });

        } catch (error) {
            logger.error('Erro no comando copa:', { error: error.message });
            await interaction.reply({ content: 'Erro ao executar comando.', ephemeral: true });
        }
    }
};