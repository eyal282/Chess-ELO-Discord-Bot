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
		.setName('lichess')
		.setDescription('Links your Lichess account.')

    .addStringOption((option) =>
      option.setName('username').setDescription('Your Lichess Username')
    ),
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

      let userName = interaction.options.getString('username');

      if (userName)
      {
          let timestamp = manyMuch[`last-command-${interaction.user.id}`]

          if ((timestamp == undefined || timestamp + 10 * 1000 < Date.now())) {
              queue[`last-command-${interaction.user.id}`] = Date.now()

              let result = await fetch(`https://lichess.org/api/user/${userName}`).then(response => {
                  if (response.status == 404) { // Not Found
                      return null
                  }
                  else if (response.status == 429) { // Rate Limit
                      return "Rate Limit"
                  }
                  else if (response.status == 200) { // Status OK
                      return response.json()
                  }
              })

              if (result == null) {
                let embed = new MessageEmbed()
                  .setColor('#0099ff')
                  .setDescription('User was not found!')
                interaction.reply({ embeds: [embed], failIfNotExists: false,ephemeral: true })
              }
              else if (result == "Rate Limit") {
                  let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setURL(`https://lichess.org/@/${userName}`)
                    .setDescription('Rate Limit Encountered! Please try again!')

                    const row = new MessageActionRow()
                      .addComponents(
                        new MessageButton()
                          .setCustomId(interaction.user.id)
                          .setLabel(`Retry Link for ${userName}`)
                          .setStyle('PRIMARY'),
                      );
                    interaction.reply({ embeds: [embed], components: [row], failIfNotExists: false })
              }
              else {
                  // result.profile.location
                  let fullDiscordUsername = interaction.user.username + "#" + interaction.user.discriminator

                  if(result.profile && result.profile.location && fullDiscordUsername == result.profile.location) {
                      queue[`lichess-account-of-${interaction.user.id}`] = result.username
                      queue[`cached-lichess-account-data-of-${interaction.user.id}`] = result
                      jsGay.updateProfileDataByInteraction(interaction, true)

                      let embed = new MessageEmbed()
                          .setColor('#0099ff')
                          .setDescription(`Successfully linked your [Lichess Profile](${result.url})`)

                      interaction.reply({ embeds: [embed], failIfNotExists: false })

                  }
                  else {
                      let attachment = await jsGay.buildCanvasForLichess(interaction.user.username + "#" + interaction.user.discriminator)

                      let embed = new MessageEmbed()
                          .setColor('#0099ff')
                          .setURL(result.url)
                          .setDescription('You need to put `' + interaction.user.username + "#" + interaction.user.discriminator + '` in `Location` in your [Lichess Profile](https://lichess.org/account/profile)')

                          const row = new MessageActionRow()
                            .addComponents(
                              new MessageButton()
                                .setCustomId(interaction.user.id)
                                .setLabel(`Retry Link for ${userName}`)
                                .setStyle('PRIMARY'),
                            );

                            interaction.reply({ embeds: [embed], components: [row], failIfNotExists: false, files: [attachment] })
                  }
              }
          }
          else {
            let embed = new MessageEmbed()
              .setColor('#0099ff')
              .setURL(`https://lichess.org/@/${userName}`)
              .setDescription('Rate Limit Encountered! Please try again!')

              const row = new MessageActionRow()
                .addComponents(
                  new MessageButton()
                    .setCustomId(interaction.user.id)
                    .setLabel(`Retry Link for ${userName}`)
                    .setStyle('PRIMARY'),
                );
              interaction.reply({ embeds: [embed], components: [row], failIfNotExists: false, ephemeral: true })
          }
      }
      else
      {

          queue[`lichess-account-of-${interaction.user.id}`] = undefined
          queue[`cached-lichess-account-data-of-${interaction.user.id}`] = undefined

          jsGay.updateProfileDataByInteraction(interaction, true)

          let embed = new MessageEmbed()
              .setColor('#0099ff')
              .setDescription(`Successfully unlinked your Lichess Profile`)

          interaction.reply({ embeds: [embed], failIfNotExists: false })

      }

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)
    }
};
