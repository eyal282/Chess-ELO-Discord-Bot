const { SlashCommandBuilder } = require('@discordjs/builders');


const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');

const jsGay = require('../util.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('embed')
		.setDescription('Creates an embed for linking accounts'
    ),
    async execute(client, interaction, settings, goodies)
    {
      
      let embed = undefined
      let row = undefined
      let row2 = undefined
      let attachment = undefined
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)
      
      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles)
	  
      ratingRoles = obj.ratingRoles
      puzzleRatingRoles = obj.puzzleRatingRoles
      titleRoles = obj.titleRoles
      let guildRoles = obj.guildRoles

      let queue = {}

      embed = new MessageEmbed()
        .setColor('#0099ff')
        .setDescription('Use the buttons below for linking your account to gain your rating roles!\n\nIf you want to link by editing your profile, you can still use /lichess and /chess')

      row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(`link-lichess-${interaction.user.id}`)
            .setLabel(`Link Lichess Account`)
            .setStyle('SUCCESS'))
        .addComponents(
          new MessageButton()
            .setCustomId(`link-chesscom-${interaction.user.id}`)
            .setLabel(`Link Chess.com Account`)
            .setStyle('SUCCESS')
      );

      row2 = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(`unlink-lichess-${interaction.user.id}`)
            .setLabel(`Unlink Lichess Account`)
            .setStyle('DANGER'))
        .addComponents(
          new MessageButton()
            .setCustomId(`unlink-chesscom-${interaction.user.id}`)
            .setLabel(`Unlink Chess.com Account`)
            .setStyle('DANGER')
       );    

         
      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)

      interaction.editReply({ embeds: [embed], components: [row, row2], failIfNotExists: false})
    }
};
