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

let embed
let row
let attachment

let slashCommand = new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Deletes all roles below the bot that have 3+ numbers in their names. Must have MANAGE_ROLES and mod')

module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)

      let ephemeral = false

      let botRole = await jsGay.getBotIntegrationRoleByInteraction(interaction)

      [ratingRoles, puzzleRatingRoles, titleRoles, guildRoles] = jsGay.wipeDeletedRolesFromDB(interactionm, ratingRoles, puzzleRatingRoles, titleRoles)

      
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
                  await role.delete(`Purge Command executed by ${jsGay.getUserFullDiscordName(interaction.user)}`).catch()
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
