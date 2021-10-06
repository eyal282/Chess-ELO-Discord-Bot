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
		.setName('setup')
		.setDescription('Quick setup of ELO roles. This WILL create 50 roles. /purge to somewhat undo this command')

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
    
      if (!isAdmin) {
          jsGay.replyAccessDeniedByInteraction(interaction)
      }
      else if (botRole.rawPosition != 1 || ratingRoles.length > 0 || puzzleRatingRoles.length > 0 || titleRoles.length > 0) {
              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Bot integration role must be the lowest position in the guild to execute this command\nAlso, no roles can be assigned to the bot besides moderator roles.\nNote: Sometimes discord forgets the bot's position, so play with it until you get it to the lowest role position and this should work.\nNote: \`/getelo /getpuzzleelo /gettitle\` are the commands to check if there are any roles left.`)

              ephemeral = true
      }
      else
      {
        let maxElo = 3000
        let minElo = 0
        let increment = 200

        // Elo setup!!!
        await interaction.guild.roles.create({
          name: `${maxElo}+`,
          reason: 'Setup command',
        })
        .then(role => 
        {
            guildRoles.set(role.id, role)

            let result = jsGay.addEloCommand(interaction, ratingRoles, role, maxElo, guildRoles)

            ratingRoles.push(result)
        })
        .catch(console.error);

        
        for(let i=maxElo;i > minElo;i -= increment)
        {
            let nextElo = i - increment
            await interaction.guild.roles.create({
              name: `${nextElo}~${i}`,
              reason: 'Setup command',
            })
            .then(role => 
            {
                guildRoles.set(role.id, role)

                let result = jsGay.addEloCommand(interaction, ratingRoles, role, nextElo, guildRoles)

                ratingRoles.push(result)
            })
            .catch(console.error);
        }

        await interaction.guild.roles.create({
          name: `Unrated`,
          reason: 'Setup command',
        })
        .then(role => 
        {
            guildRoles.set(role.id, role)

            let result = jsGay.addEloCommand(interaction, ratingRoles, role, -1, guildRoles)

            ratingRoles.push(result)
        })
        .catch(console.error);


        // Puzzles Setup!!!

        await interaction.guild.roles.create({
          name: `Puzzles ${maxElo}+`,
          reason: 'Setup command',
        })
        .then(role => 
        {
            guildRoles.set(role.id, role)

            let result = jsGay.addPuzzleEloCommand(interaction, puzzleRatingRoles, role, maxElo, guildRoles)

            puzzleRatingRoles.push(result)
        })
        .catch(console.error);

        
        for(let i=maxElo;i > minElo;i -= increment)
        {
            let nextElo = i - increment
            await interaction.guild.roles.create({
              name: `Puzzles ${nextElo}~${i}`,
              reason: 'Setup command',
            })
            .then(role => 
            {
                guildRoles.set(role.id, role)

                let result = jsGay.addPuzzleEloCommand(interaction, puzzleRatingRoles, role, nextElo, guildRoles)

                puzzleRatingRoles.push(result)
            })
            .catch(console.error);
        }

        await interaction.guild.roles.create({
          name: `Puzzles Unrated`,
          reason: 'Setup command',
        })
        .then(role => 
        {
            guildRoles.set(role.id, role)

            let result = jsGay.addPuzzleEloCommand(interaction, puzzleRatingRoles, role, -1, guildRoles)

            puzzleRatingRoles.push(result)
        })
        .catch(console.error);

        // Title Setup!!!

         jsGay.titleList.forEach(async (title) => {
            await interaction.guild.roles.create({
              name: title.roleName,
              reason: 'Setup command',
            })
            .then(role => 
            {
                guildRoles.set(role.id, role)

                let result = jsGay.addTitleCommand(interaction, titleRoles, role, title.titleName, guildRoles)

                titleRoles.push(result)
            })
            .catch(console.error);
          });
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
