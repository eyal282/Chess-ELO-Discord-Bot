// To do: progress bar.

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

let slashCommand = new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Deletes all roles below the bot that either got 3+ numbers in their names or get created with /setup')
		
		.addBooleanOption((option) =>
      option.setName('sure1').setDescription('Are you sure you want to delete every relevant role?').setRequired(true))

		.addBooleanOption((option) =>
      option.setName('sure2').setDescription('Are you sure you want to delete every relevant role?').setRequired(true))

		.addBooleanOption((option) =>
      option.setName('sure3').setDescription('Are you sure you want to delete every relevant role?').setRequired(true))

		.addBooleanOption((option) =>
      option.setName('sure4').setDescription('Are you sure you want to delete every relevant role?').setRequired(true))

module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
	  if(!interaction.options.getBoolean('sure1') || !interaction.options.getBoolean('sure2') || !interaction.options.getBoolean('sure3') || !interaction.options.getBoolean('sure4'))
	  	return;

      let embed = undefined
      let row = undefined
      let attachment = undefined
       
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise] = await jsGay.getCriticalData(interaction)

      let ephemeral = false

      let botRole = await jsGay.getBotIntegrationRoleByInteraction(interaction)

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
          guildRoles.forEach(async (role, id) => {
              let strNumbersInName = role.name.replace(/\D/g, '')

              let forcePurge = false

              jsGay.titleList.forEach((value) => {
                  if(value.roleName == role.name)
                  {
                    forcePurge = true
                  }
              })

              jsGay.roleNamesToPurge.forEach((value) => {
                  if(value == role.name)
                  {
                    forcePurge = true
                  }
              })


              if(strNumbersInName.length >= 3 || forcePurge)
              {
                  await role.delete(`Purge Command executed by ${jsGay.getUserFullDiscordName(interaction.user)}`).catch(() => null)

              }
          });

          embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully purged all related roles.`)
      }
      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)

      if(embed)
      {
        await interaction.editReply({embeds: [embed], failIfNotExists: false, ephemeral: ephemeral});
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
