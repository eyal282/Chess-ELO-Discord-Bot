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
		.setName('resetmod')
		.setDescription('Resets all Moderator roles. Using this without MANAGE_SERVER will steal your rights. '),
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

        let queue = {}
        let isAdmin = await jsGay.isBotControlAdminByInteraction(interaction, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByInteraction(interaction)
        }
        else
        {
          let msgToSend = '/addmod arguments:`'

          for (let i = 0; i < modRoles.length; i++) {
              msgToSend = msgToSend + " <@&" + modRoles[i] + "> "
          }
          
        
          msgToSend = msgToSend.trim() + "`"

          if (!msgToSend.includes('<@')) {
              embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`There were no moderator roles to delete.`)
          }
          else {

              modRoles = undefined
              
              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully reset all moderator roles! Command to undo:\n\`\`\`\n${msgToSend}\n\`\`\``)

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