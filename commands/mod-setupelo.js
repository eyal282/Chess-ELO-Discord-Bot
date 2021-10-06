// To do: progress bar.

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
		.setName('setupelo')
		.setDescription('Quick setup of ELO roles for lazy people.')

module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)

      let ephemeral = false

      let botRole = await jsGay.getBotIntegrationRoleByInteraction(interaction)

      let guildRoles 
      await interaction.guild.roles.fetch()
      .then(roles => 
          {

              guildRoles = roles

              if(botRole)
              {
                  for (let i = 0; i < ratingRoles.length; i++)
                  {
                      let role = roles.get(ratingRoles[i].id)

                      // if role doesn't exist or is above bot.
                      if (!role || botRole.rawPosition < role.rawPosition)
                          ratingRoles.splice(i, 1)
                  }

                  for (let i = 0; i < puzzleRatingRoles.length; i++)
                  {
                      let role = roles.get(puzzleRatingRoles[i].id)

        // if role doesn't exist or is above bot.
                      if (!role || botRole.rawPosition < role.rawPosition)
        puzzleRatingRoles.splice(i, 1)
                  }

                  for (let i = 0; i < titleRoles.length; i++) {
                      let role = roles.get(titleRoles[i].id)

                      // if role doesn't exist or is above bot.
                      if (!role || botRole.rawPosition < role.rawPosition)
                      titleRoles.splice(i, 1)
                  }
              }
          })
      .catch(() => null)

      ratingRoles.sort(function (a, b) { return a.rating - b.rating });
      puzzleRatingRoles.sort(function (a, b) { return a.rating - b.rating });

      
      let queue = {}
      
      let isAdmin = await jsGay.isBotControlAdminByInteraction(interaction, modRoles)
    
      console.log(ratingRoles)
      if (!isAdmin) {
          jsGay.replyAccessDeniedByInteraction(interaction)
      }
      else if (botRole.rawPosition != 1 || ratingRoles.length > 0 || puzzleRatingRoles > 0 || titleRoles.length > 0) {
         
              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Bot integration role must be the lowest position in the guild to execute this command\nAlso, no roles can be assigned to the bot besides moderator roles.`)

              ephemeral = true
      }
      else
      {
        let increment = 200
        for(let i=3000;i > 0;i -= increment)
        {
            let nextElo = i - increment
            await interaction.guild.roles.create({
              name: `${nextElo}~${i}`,
              reason: 'Setup command',
            })
            .then(role => 
            {
                guildRoles.set(role.id, role)

                let result = jsGay.addEloCommand(interaction, ratingRoles, role, i, guildRoles)

                ratingRoles.push(result)
            })
            .catch(console.error);
        }

              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Success.`)
      }
      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)

      if(embed)
      {
        await interaction.editReply({embeds: [embed], failIfNotExists: false, ephemeral: ephemeral});
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
