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
		.setName('resetelo')
		.setDescription('Resets all ELO roles'),
    async execute(client, interaction, settings) {
          
        let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp] = await jsGay.getCriticalData(interaction)

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
          let msgToSend = `/addelo arguments: `

          for (let i = 0; i < ratingRoles.length; i++) {
              msgToSend = msgToSend + ratingRoles[i].rating + " <@&" + ratingRoles[i].id + ">\n"
          }
          
          msgToSend = msgToSend + "\t"

          if (msgToSend.length < 20) {
              let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`There were no role milestones to delete.`)
              interaction.reply({embeds: [embed], failIfNotExists: false})
          }
          else {

              ratingRoles = undefined
              
              let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully reset all elo related roles! Command to undo:\n\`${msgToSend}\``)
              interaction.reply({embeds: [embed], failIfNotExists: false})

              interaction.member.send(`Successfully reset all elo related roles! Command to 
              undo:\n` + '```' + msgToSend + '```').catch(() => null)
              
          }
        }

        queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
        queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
        queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
        queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

        await settings.setMany(queue, true)
    } 
}