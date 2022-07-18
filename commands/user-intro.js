const { SlashCommandBuilder } = require('discord.js');


const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { EmbedBuilder, MessageAttachment } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
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
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise] = await jsGay.getCriticalData(interaction)
      
      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)
	  
	  ratingRoles = obj.ratingRoles
	  puzzleRatingRoles = obj.puzzleRatingRoles
	  titleRoles = obj.titleRoles
	  let guildRoles = obj.guildRoles
	  verifyRole = obj.verifyRole
	  titledRole = obj.titledRole
      
            embed = new EmbedBuilder({description: "Greetings, this is a bot that gives you rating roles after linking your chess account.\n\nIf you are a new user to the server, use either `/embed`, `/lichess` or `/chess` to link your account, or an existing embed.\n\nIf you join this server after you link with the bot, you don't have to bother linking again, as the bot automatically updates your roles after joining a server, or after sending a message, or after `/profile` is run upon your account, with a cooldown of 2 minutes per update.\n\nAs usual `/help` always comes to the rescue.\n\n**Information for server owners:**\n\nQuick Setup if you just invited the bot: `/setup`\n\nYou can go to a channel designed for reaction roles and run `/embed` there to allow **keyboard free link** which is very useful for mobile users.\n\nYou can add a verify role to make this bot your gateway against scambots, through `/verifyrole`. Verify role is a role given after linking either Lichess or Chess.com.\n\nYou can add a titled role as the generic titled player role, through `/titledrole`. Titled role is only given if either Lichess or Chess.com gave you the title.\n\nYou enable Bullet as a time control for the bot with `/timecontrols`\n\nIf you made changes to the roles or changed the rating ranges, you can use `/refresh` to make the bot give everybody their new roles.**[Source Code for the Bot](https://github.com/eyal282/Chess-ELO-Discord-Bot)**\n\nOur draconian privacy policy is accessible via `/privacy`\n\nA new general purpose command named `/seize` will evaluate if I can give myself dangerous permission roles that are below me.\nYou can combine it with the template feature in server settings to check which roles can escalate themselves to ban players and nuke your server."})
          .setColor(0x0099ff)
              
      interaction.editReply({embeds: [embed], failIfNotExists: false})
	},
};