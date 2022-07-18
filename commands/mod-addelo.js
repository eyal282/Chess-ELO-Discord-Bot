const { SlashCommandBuilder } = require('discord.js');


const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { EmbedBuilder, MessageAttachment } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');

const jsGay = require('../util.js')

let slashCommand = new SlashCommandBuilder()
		.setName('addelo')
		.setDescription('Adds as many elo <---> role pairs as you want to the bot.')

    .addStringOption((option) =>
      option.setName('arguments').setDescription('Pairs of elo and roles. Example: /addelo -1 @unrated 0 @Under 600 600 @600~800 800 @800~1000').setRequired(true))

    


module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      let args = interaction.options.getString('arguments').replace(/`/g, "").trim().split(/ +/g)
      
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
      else if (args.length == 0 || args.length % 2 != 0) {
          embed = new EmbedBuilder()
                  .setColor(0x0099ff)
                  .setDescription(`/addelo [elo] [@role] (elo2) (@role2) (elo3) (@role3) ... ...`)
      }
      else
      {
        let msgToSend = ""

        for (let i = 0; i < (args.length / 2); i++)
        {
            let role = jsGay.getRoleFromMentionString(interaction.guild, args[2 * i + 1])

            let result = 'Could not find role'

            if(role)
            {
                result = jsGay.addEloCommand(interaction, ratingRoles, role, args[2 * i + 0], guildRoles)
            }

            if(result == undefined)
              result = "This role was already added to the bot!"

            else if(result == -1)
              result = "This role is above the bot's highest role!"
              
            else if(result != 'Could not find role')
            {
              ratingRoles.push(result)            
              result = "Success."
            }

            msgToSend = `${msgToSend} ${i+1}. ${result}\n`

        }

        embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setDescription(msgToSend)
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
