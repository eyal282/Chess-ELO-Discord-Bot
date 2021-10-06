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
		.setName('resetpuzzleelo')
		.setDescription('Resets all ELO roles for puzzles'),
    async execute(client, interaction, settings, goodies) {
          
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)
      
        await interaction.guild.roles.fetch()
        .then(roles => 
            {
                let highestBotRole = interaction.guild.members.resolve(client.user).roles.highest

                if(highestBotRole)
                {
                    for (let i = 0; i < ratingRoles.length; i++)
                    {
                        let role = roles.get(ratingRoles[i].id)

                        // if role doesn't exist or is above bot.
                        if (!role || highestBotRole.rawPosition < role.rawPosition)
                            ratingRoles.splice(i, 1)
                    }

                    for (let i = 0; i < puzzleRatingRoles.length; i++)
                    {
                        let role = roles.get(puzzleRatingRoles[i].id)

          // if role doesn't exist or is above bot.
                        if (!role || highestBotRole.rawPosition < role.rawPosition)
          puzzleRatingRoles.splice(i, 1)
                    }

                    for (let i = 0; i < titleRoles.length; i++) {
                        let role = roles.get(titleRoles[i].id)

                        // if role doesn't exist or is above bot.
                        if (!role || highestBotRole.rawPosition < role.rawPosition)
                        titleRoles.splice(i, 1)
                    }
                }
            })
        .catch(() => null)

        ratingRoles.sort(function (a, b) { return a.rating - b.rating });
        puzzleRatingRoles.sort(function (a, b) { return a.rating - b.rating });

        let queue = {}
        let isAdmin = await jsGay.isBotControlAdminByInteraction(interaction, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByInteraction(interaction)
        }
        else
        {
          let msgToSend = '/addpuzzleelo arguments:`'

          for (let i = 0; i < puzzleRatingRoles.length; i++) {
              msgToSend = msgToSend + puzzleRatingRoles[i].rating + " <@&" + puzzleRatingRoles[i].id + "> "
          }
          
        
          msgToSend = msgToSend.trim() + "`"

          if (!msgToSend.includes('<@')) {
              embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`There were no role milestones to delete.`)
          }
          else {

              puzzleRatingRoles = undefined
              
              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully reset all elo related roles for puzzles! Command to undo:\n\`\`\`\n${msgToSend}\n\`\`\``)

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