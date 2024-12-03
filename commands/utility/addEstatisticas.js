const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PlayerStats = require('../../models/PlayerStats');

module.exports = {
   data: new SlashCommandBuilder()
       .setName('addestatistica')
       .setDescription('Adiciona estatísticas para um jogador')
       .addMentionableOption(option => 
           option.setName('jogador')
           .setDescription('Mencione o jogador')
           .setRequired(true))
       .addIntegerOption(option =>
           option.setName('vitorias')
           .setDescription('Número de vitórias')
           .setRequired(true))
       .addIntegerOption(option =>
           option.setName('derrotas')
           .setDescription('Número de derrotas')
           .setRequired(true)),

   async execute(interaction) {
       try {
           const mentionable = interaction.options.getMentionable('jogador');
           if (!mentionable || !mentionable.user) {
               return interaction.reply('Por favor, mencione um usuário válido.');
           }

           const wins = interaction.options.getInteger('vitorias');
           const losses = interaction.options.getInteger('derrotas');
           const totalGames = wins + losses;
           const winPercentage = (wins / totalGames) * 100;

           await PlayerStats.findOneAndUpdate(
               { playerId: mentionable.user.id },
               {
                   playerName: mentionable.user.displayName,
                   wins,
                   losses,
                   totalGames,
                   winPercentage
               },
               { upsert: true, new: true }
           );

           const embed = new EmbedBuilder()
               .setTitle(`Estatísticas atualizadas para ${mentionable.user.displayName}`)
               .addFields(
                   { name: 'Total de Jogos', value: totalGames.toString(), inline: true },
                   { name: 'Vitórias', value: wins.toString(), inline: true },
                   { name: 'Derrotas', value: losses.toString(), inline: true },
                   { name: '% de Vitória', value: winPercentage.toFixed(2) + '%', inline: true }
               )
               .setColor('#0099ff');

           await interaction.reply({ embeds: [embed] });
       } catch (error) {
           console.error('Erro ao adicionar estatísticas:', error);
           await interaction.reply('Erro ao adicionar estatísticas.');
       }
   }
};