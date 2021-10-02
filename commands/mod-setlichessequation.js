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
		.setName('setlichessequation')
		.setDescription('Sets Lichess formula to inflate rating')

    .addStringOption((option) =>
      option.setName('formula').setDescription(`Formula of rating inflation. Ignore to reset. Default: ${jsGay.Constant_lichessDefaultRatingEquation}`)
    ),
    async execute(client, interaction, settings) {

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
            let formula = interaction.options.getString('formula');

            if (!formula)
            {
                queue[`guild-lichess-rating-equation-${interaction.guild.id}`] = undefined

                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully reset Lichess rating equation to default: ${jsGay.Constant_lichessDefaultRatingEquation}`)
                interaction.reply({embeds: [embed], failIfNotExists: false})
            }
            else
            {  
              formula = formula.trim()

              try {
                  Parser.evaluate(formula, { x: 1000 })
                  Parser.evaluate(formula, { x: 0 })
                  Parser.evaluate(formula, { x: -1 })
              }
              catch (error) {
                  let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Invalid formula! Must support preset values of x = 1000, x = 0, x = -1\nError: ${error.message}`)
                  interaction.reply({embeds: [embed], failIfNotExists: false})

                  embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully reset Lichess rating equation to default: ${jsGay.Constant_lichessDefaultRatingEquation}`)
                  interaction.reply({embeds: [embed], failIfNotExists: false})

                  return;
              }

              queue[`guild-lichess-rating-equation-${interaction.guild.id}`] = formula
              interaction.reply(`Successfully set Lichess rating equation to: ${formula}`)
            }
      }

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)
    }
};