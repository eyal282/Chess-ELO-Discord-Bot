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
		.setDescription('Adds as many elo <---> role pairs as you want to the bot.')

    .addStringOption((option) =>
      option.setName('arguments').setDescription('Pairs of elo and roles. Example: /addelo -1 @unrated 0 @Under 600 600 @600~800 800 @800~1000').setRequired(true))


module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings)
  {  
      let args = interaction.options.getString('arguments').replace(/`/g, "").trim().split(/ +/g)
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp] = await jsGay.getCriticalData(interaction)
      
      let guildRoles
      await interaction.guild.roles.fetch()
      .then(roles => 
          {
              guildRoles = roles
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

        await interaction.reply({embeds: [embed], failIfNotExists: false})

        const msg = await interaction.fetchReply();

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
              
            else
            {
              ratingRoles.push(result)            
              result = "Success."
            }

        }
        embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(msgToSend)

        msg.edit({embeds: [embed], failIfNotExists: false}).catch(() => null)
      }

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)
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
