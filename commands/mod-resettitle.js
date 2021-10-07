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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resettitle')
		.setDescription('Resets all tile roles'),
    async execute(client, interaction, settings, goodies) {
          
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)
      
      [ratingRoles, puzzleRatingRoles, titleRoles, guildRoles] = jsGay.wipeDeletedRolesFromDB(interactionm, ratingRoles, puzzleRatingRoles, titleRoles)

        let queue = {}
        let isAdmin = await jsGay.isBotControlAdminByInteraction(interaction, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByInteraction(interaction)
        }
        else
        {
          let msgToSend = '/addtitle arguments:`'

          for (let i = 0; i < titleRoles.length; i++) {
              msgToSend = msgToSend + titleRoles[i].title + " <@&" + titleRoles[i].id + "> "
          }
          
        
          msgToSend = msgToSend.trim() + "`"

          if (!msgToSend.includes('<@')) {
              embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`There were no role milestones to delete.`)
          }
          else {

              titleRoles = undefined
              
              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully reset all title related roles! Command to undo:\n\`\`\`\n${msgToSend}\n\`\`\``)

              interaction.member.send({embeds: [embed], failIfNotExists: false}).catch(() => null)
              
          }
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