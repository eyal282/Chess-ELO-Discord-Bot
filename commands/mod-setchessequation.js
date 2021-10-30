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
		.setName('setchessequation')
		.setDescription('Sets Chess.com formula to inflate rating')

    .addStringOption((option) =>
      option.setName('formula').setDescription(`Formula of rating inflation. Ignore to reset. Default: ${jsGay.Constant_chessComDefaultRatingEquation}`)
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
                queue[`guild-chesscom-rating-equation-${interaction.guild.id}`] = undefined

                embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully reset Chess.com rating equation to default: ${jsGay.Constant_chessComDefaultRatingEquation}`)
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
                  embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Invalid formula! Must support preset values of x = 1000, x = 0, x = -1\nError: ${error.message}`)

                  await interaction.editReply({embeds: [embed], failIfNotExists: false});

                  return;
              }

              queue[`guild-chesscom-rating-equation-${interaction.guild.id}`] = formula

              embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully set Chess.com rating equation to: ${formula}`)
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
};