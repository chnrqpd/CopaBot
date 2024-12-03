// utils/commandExecutor.js
const { Collection } = require('discord.js');
const logger = require('../config/logger');

const cooldowns = new Collection();

const executeCommand = async (interaction) => {
    try {
        // Gerencia cooldown
        if (!cooldowns.has(interaction.commandName)) {
            cooldowns.set(interaction.commandName, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(interaction.commandName);
        const cooldownAmount = 3000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({
                    content: `Aguarde ${timeLeft.toFixed(1)} segundos antes de usar o comando novamente.`,
                    ephemeral: true
                });
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        // Validações específicas para cada comando
        if (interaction.commandName === 'copa') {
            // Validação para o comando 'copa'
            if (!interaction.guild) {
                throw new Error('Este comando só pode ser usado em um servidor.');
            }
        } else if (interaction.commandName === 'vencedor') {
            // Validação para o comando 'vencedor'
            const sessionId = interaction.options.getString('sessao');
            if (!sessionId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
                throw new Error('ID de sessão inválido.');
            }
        }

        // Executa o comando
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            throw new Error(`Comando ${interaction.commandName} não encontrado.`);
        }

        await command.execute(interaction);

    } catch (error) {
        logger.error('Erro na execução do comando:', {
            comando: interaction.commandName,
            usuario: interaction.user.id,
            erro: error.message,
            stack: error.stack
        });

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'Ocorreu um erro ao executar este comando.',
                ephemeral: true
            });
        } else if (interaction.deferred) {
            await interaction.editReply({
                content: 'Ocorreu um erro ao executar este comando.',
                ephemeral: true
            });
        }
    }
};

module.exports = executeCommand;
