

const { SlashCommandBuilder } = require('discord.js');
const { bold, italic, strikethrough, underscore, spoiler, quote, blockQuote, hyperlink, hideLinkEmbed } = require('discord.js');

const { ChannelType } = require('discord-api-types/v9');

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
		.setDescription('Creates an embed for linking accounts')
		.addStringOption((option) =>
      	option.setName('message').setDescription('Optional message to use. Use `///n` for new line'))
		 .addChannelOption((option) =>	
      		option.setName('channel').setDescription('If message is ommitted, channel to redirect to for slash commands').addChannelTypes(ChannelType.GuildText)
					
    ),
    async execute(client, interaction, settings, goodies)
    {
      
      let embed = undefined
      let row = undefined
      let row2 = undefined
      let attachment = undefined
      

      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise] = await jsGay.getCriticalData(interaction)
      
      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)
	  
	  ratingRoles = obj.ratingRoles
	  puzzleRatingRoles = obj.puzzleRatingRoles
	  titleRoles = obj.titleRoles
	  let guildRoles = obj.guildRoles
	  verifyRole = obj.verifyRole
	  titledRole = obj.titledRole
	  
      let queue = {}

	  let message = interaction.options.getString('message');

	  if(!message)
	  {
	  	message = jsGay.Constant_DefaultEmbedMessage

		let slashChannel = interaction.options.getChannel('channel');

		if(slashChannel)
		{
			let channelURL = `https://discord.com/channels/${slashChannel.guild.id}/${slashChannel.id}`
			message = message.replaceAll("/lichess", jsGay.hyperlinkBold('/lichess', channelURL))
			message = message.replaceAll("/chess", jsGay.hyperlinkBold('/chess', channelURL))
			
		}
	  }

	  message = message.replaceAll("///n", '\n');
		  
      embed = new MessageEmbed()
        .setColor('#0099ff')
        .setDescription(message)

      row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(`link-lichess`)
            .setLabel(`Link Lichess Account`)
            .setStyle('SUCCESS'))
        .addComponents(
          new MessageButton()
            .setCustomId(`link-chesscom`)
            .setLabel(`Link Chess.com Account`)
            .setStyle('SUCCESS')
      );

      row2 = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(`unlink-lichess`)
            .setLabel(`Unlink Lichess Account`)
            .setStyle('DANGER'))
        .addComponents(
          new MessageButton()
            .setCustomId(`unlink-chesscom`)
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
