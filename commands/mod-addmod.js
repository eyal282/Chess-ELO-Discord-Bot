const { SlashCommandBuilder } = require('discord.js');


const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { EmbedBuilder, MessageAttachment } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');

const jsGay = require('../util.js')

let slashCommand = new SlashCommandBuilder()
		.setName('addmod')
		.setDescription('Adds as many moderator roles as you want to the bot')

    .addStringOption((option) =>
      option.setName('arguments').setDescription('List of roles to add as moderator').setRequired(true))


module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      /*
       <>@ allows mass mentioning roles without spacebar.
       /` /g allows to encase the entire message with ` ` or ``` ```.
       / +/g seperates the string into arguments by spaces
      */
      let args = interaction.options.getString('arguments').replaceAll('><@', '> <@').replace(/`/g, "").trim().split(/ +/g)
      
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
      else if (args.length == 0) {
          embed = new EmbedBuilder()
                  .setColor(0x0099ff)
                  .setDescription(`/addmod [@role] (@role2) (@role3) ... ...`)
      }
      else
      {
        let msgToSend = ""

        for (let i = 0; i < args.length; i++)
        {
            let role = jsGay.getRoleFromMentionString(interaction.guild, args[i])

            let result = 'Could not find role'

            if(role)
            {
                result = jsGay.addModCommand(interaction, modRoles, role)
            }

            if(result == undefined)
              result = "This role was already added to the bot!"
 
            else if(result != 'Could not find role')
            {
              modRoles.push(result)            
              result = "Success."
            }

            msgToSend = `${msgToSend} ${i+1}. ${result}\n`

        }

        embed = new EmbedBuilder(({description: msgToSend}))
            .setColor(0x0099ff)
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
