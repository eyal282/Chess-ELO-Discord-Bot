const { SlashCommandBuilder } = require('discord.js');

const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');

const jsGay = require('../util.js')

let slashCommand = new SlashCommandBuilder()
		.setName('timecontrols')
		.setDescription('Sets which time controls are accepted by the bot. Default: All except bullet')
	
		.addBooleanOption((option) =>
      		option.setName('bullet').setDescription('Is bullet real chess?').setRequired(true))

		.addBooleanOption((option) =>
      		option.setName('blitz').setDescription('Is blitz real chess?').setRequired(true))

		.addBooleanOption((option) =>
      		option.setName('rapid').setDescription('Is rapid real chess?').setRequired(true))

		.addBooleanOption((option) =>
      		option.setName('classical').setDescription('Is classical real chess?').setRequired(true))

		.addBooleanOption((option) =>
      		option.setName('corres').setDescription('Is correspondence real chess?').setRequired(true))

			  
module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
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

      let queue = {}
      
      let isAdmin = await jsGay.isBotControlAdminByInteraction(interaction, modRoles)
  
      if (!isAdmin) {
          jsGay.replyAccessDeniedByInteraction(interaction)
      }
      else
      {
		  let result = 0

		  let bullet = interaction.options.getBoolean('bullet')
		  let blitz = interaction.options.getBoolean('blitz')
		  let rapid = interaction.options.getBoolean('rapid')
		  let classical = interaction.options.getBoolean('classical')
		  let corres = interaction.options.getBoolean('corres')

		  if(bullet)
		  	result |= jsGay.Constant_BulletBitwise

		  if(blitz)
			result |= jsGay.Constant_BlitzBitwise

		  if(rapid)
		  	result |= jsGay.Constant_RapidBitwise

		  if(classical)
		  	result |= jsGay.Constant_ClassicalBitwise

		  if(corres)
		  	result |= jsGay.Constant_CorresBitwise

        queue[`guild-time-controls-${interaction.guild.id}`] = result
		
        embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(`Successfully changed the accepted time controls.`)

      }

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)

      if(embed)
      {
        await interaction.editReply({embeds: [embed], failIfNotExists: false});
      }
  }
}

function splitBy(text, delimiter) {
    var delimiterPATTERN = "(" + delimiter + ")",
        delimiterRE = new RegExp(delimiterPATTERN, "g");

    return text.split(delimiterRE).reduce(function (chunks, item) {
        if (item.match(delimiterRE)) {
            chunks[chunks.length - 1] += item;
        } else {
            chunks.push(item.trim());
        }
        return chunks;
    }, []);
}
