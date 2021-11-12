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
		.setName('intro')
		.setDescription('Introduction to the bot')

    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Only you can see this message?')
    ),
    async execute(client, interaction, settings, goodies) {
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole] = await jsGay.getCriticalData(interaction)
      
      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole)
	  
	  ratingRoles = obj.ratingRoles
	  puzzleRatingRoles = obj.puzzleRatingRoles
	  titleRoles = obj.titleRoles
	  let guildRoles = obj.guildRoles
	  verifyRole = obj.verifyRole
      
      embed = new MessageEmbed()
              .setColor('#0099ff')
              .setDescription("Greetings, this is a bot that gives you rating roles after linking your chess account.\n\nIf you are a new user to the server, use either `/embed`, `/lichess` or `/chess` to link your account, or an existing embed.\n\nIf you join this server after you link with the bot, you don't have to bother linking again, as the bot automatically updates your roles after joining a server, or after sending a message, or after `/profile` is run upon your account, with a cooldown of 2 minutes per update.\n\nAs usual `/help` always comes to the rescue.\n\n**Information for server owners:**\n\nQuick Setup if you just invited the bot: `/setup`\n\nYou can go to a channel designed for reaction roles and run `/embed` there to allow **keyboard free link** which is very useful for mobile users.\n\nYou can add a verify role to make this bot your gateway against scambots, through `/verifyrole`. Verify role is a role given after linking either Lichess or Chess.com.")
              
      interaction.editReply({embeds: [embed], failIfNotExists: false})
	},
};