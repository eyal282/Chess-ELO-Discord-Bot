const { SlashCommandBuilder } = require('discord.js');


const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { EmbedBuilder, MessageAttachment } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');

const jsGay = require('../util.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lookup')
		.setDescription('Finds a discord user within the bot by username')

    .addStringOption((option) =>
      option.setName('username').setDescription('Username to check.').setRequired(true))

    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Only you can see this message?')
    ),
    async execute(client, interaction, settings, goodies) {
      
      let embed = undefined
      let row = undefined
      let attachment = undefined

      let lookupUsername = interaction.options.getString('username');

	  let keyValues = await jsGay.settings.filter(value => typeof value === "string" && value.toUpperCase() == lookupUsername.toUpperCase());

	  let found = false
	  embed = new EmbedBuilder()
		.setColor(0x0099ff)
		.setDescription(`Below is a list of matches of the username **${lookupUsername}** within the bot:`)

	  for(let i=0;i < keyValues.length;i++)
	  {
		  let key = keyValues[i][0]
		  
		  if(key.includes('lichess-account-of-'))
		  {
			found = true

			let discordUserId = key.replace('lichess-account-of-', '')

 			embed.addFields(
            { name: 'Lichess:', value: `<@${discordUserId}>`, inline: true })
		  }
		  else if(key.includes('chesscom-account-of-'))
		  {
			  found = true

			  let discordUserId = key.replace('chesscom-account-of-', '')

				embed.addFields(
				{ name: 'Chess.com:', value: `<@${discordUserId}>`, inline: true })
		  }
	  }

      interaction.editReply({ embeds: [embed], failIfNotExists: false })
    }
};