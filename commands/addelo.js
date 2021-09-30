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
		.setName('addelo')
		.setDescription('Adds as many elo <---> role pairs as you want to the bot. Each pair is seperated by SHIFT + ENTER')

    .addStringOption((option) =>
      option.setName('arguments').setDescription('Pairs of elo and roles. Example: /addelo -1 @unrated\n0 @Under 600\n600 @600~800\n800 @800~1000').setRequired(true))


module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings)
  {
      let args = interaction.options.getString('arguments').trim().split('<@&');


      console.log(args)
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp] = await jsGay.getCriticalData(interaction)

      let isAdmin = await jsGay.isBotControlAdminByInteraction(interaction, modRoles)
  
      if (!isAdmin) {
          jsGay.replyAccessDeniedByMessage(interaction)
      }
      else if (args.length == 0 || args.length % 2 != 0) {
          let embed = new MessageEmbed()
                  .setColor('#0099ff')
                  .setDescription(`/addelo [elo] [@role] (elo2) [@role2] ... ...`)
          interaction.reply({embeds: [embed], failIfNotExists: false})
      }
      else
      {
        let embed = new MessageEmbed()
                  .setColor('#0099ff')
                  .setDescription(`Adding Roles...`)
        await interaction.reply({embeds: [embed], failIfNotExists: false}).then(async msg =>
        {
          let msgToSend = ""



          for (let i = 0; i < (args.length / 2); i++)
          {
              let role = jsGay.getRoleFromMentionString(interaction.guild, args[2 * i + 1])

              let result = 'Could not find role'

              if(role)
              {
                  result = jsGay.addEloCommand(interaction, ratingRoles, role, args[2 * i + 0])
              }

              if(result == undefined)
                result = "This role was already added to the bot!"

              else
              {
                ratingRoles.push(result)            
                result = "Success."
              }

              msgToSend = msgToSend + (i + 1).toString() + ". " + result + " \n"
          }

          if (msgToSend == "") {
              msgToSend = "Internal Error, Cringe :("
          }

          msg.edit(msgToSend).catch(() => null)
        })
        .catch(() => null)
      }
  }
}