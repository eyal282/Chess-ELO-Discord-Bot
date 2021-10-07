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
		.setName('addpuzzleelo')
		.setDescription(`Adds as many elo <---> role pairs as you want to the bot for puzzles.`)

    .addStringOption((option) =>
      option.setName('arguments').setDescription('Pairs of elo and roles. Example: /addpuzzleelo -1 @Unrated 0 @0~600 600 @600~800').setRequired(true))


module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
      let args = interaction.options.getString('arguments').replace(/`/g, "").trim().split(/ +/g)
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)
      
      [ratingRoles, puzzleRatingRoles, titleRoles, guildRoles] = jsGay.wipeDeletedRolesFromDB(interactionm, ratingRoles, puzzleRatingRoles, titleRoles)

      let queue = {}
      
      let isAdmin = await jsGay.isBotControlAdminByInteraction(interaction, modRoles)
  
      if (!isAdmin) {
          jsGay.replyAccessDeniedByInteraction(interaction)
      }
      else if (args.length == 0 || args.length % 2 != 0) {
          embed = new MessageEmbed()
                  .setColor('#0099ff')
                  .setDescription(`/addpuzzleelo [elo] [@role] (elo2) (@role2) (elo3) (@role3) ... ...`)
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
                result = jsGay.addPuzzleEloCommand(interaction, puzzleRatingRoles, role, args[2 * i + 0], guildRoles)
            }

            if(result == undefined)
              result = "This role was already added to the bot!"

            else if(result == -1)
              result = "This role is above the bot's highest role!"
              
            else if(result != 'Could not find role')
            {
              puzzleRatingRoles.push(result)            
              result = "Success."
            }

            msgToSend = `${msgToSend} ${i+1}. ${result}\n`

        }

        embed = new MessageEmbed()
            .setColor('#0099ff')
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
