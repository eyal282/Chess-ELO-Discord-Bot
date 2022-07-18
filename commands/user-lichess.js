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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lichess')
		.setDescription('Links your Lichess account.')

    .addStringOption((option) =>
      option.setName('username').setDescription('Your Lichess Username').setRequired(true)
    ),
    async execute(client, interaction, settings, goodies) {
      
      let embed = undefined
      let row = undefined
      let attachment = undefined

      let bUpdate = false
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise] = await jsGay.getCriticalData(interaction)
      
      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)
	  
	  ratingRoles = obj.ratingRoles
	  puzzleRatingRoles = obj.puzzleRatingRoles
	  titleRoles = obj.titleRoles
	  let guildRoles = obj.guildRoles
	  verifyRole = obj.verifyRole
	  titledRole = obj.titledRole

      let queue = {}

      let userName = interaction.options.getString('username');

      if (userName)
      {
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
                embed = new EmbedBuilder({description: 'User was not found!'})
                  .setColor(0x0099ff)
              }
              else if (result == "Rate Limit") {
                  embed = new EmbedBuilder({url: `https://lichess.org/@/${userName}`, description: 'Rate Limit Encountered! Please try again!'})
                    .setColor(0x0099ff)

                    row = new ActionRowBuilder()
                      .addComponents(
                        new ButtonBuilder()
                          .setCustomId(`retry-link-${interaction.user.id}`)
                          .setLabel(`Retry Link for ${userName}`)
                          .setStyle('Primary'),
                      );
              }
              else {
                  // result.profile.location
                  let fullDiscordUsername = interaction.user.username + "#" + interaction.user.discriminator

                  if(result.profile?.location?.includes(fullDiscordUsername) || result.profile?.bio?.includes(fullDiscordUsername)) {
                      queue[`lichess-account-of-${interaction.user.id}`] = result.username
                      queue[`cached-lichess-account-data-of-${interaction.user.id}`] = result
                      bUpdate = true

                      embed = new EmbedBuilder()
                          .setColor(0x0099ff)
                          .setDescription(`Successfully linked your [Lichess Profile](${result.url})`)

                  }
                  else {
                      attachment = await jsGay.buildCanvasForLichess(interaction.user.username + "#" + interaction.user.discriminator)

                      embed = new EmbedBuilder({url: result.url, description: 'You need to put `' + interaction.user.username + "#" + interaction.user.discriminator + '` in `Location` or `Biography` in your [Lichess Profile](https://lichess.org/account/profile)\nNote: If this never works, link with `/embed` instead.'})
                          .setColor(0x0099ff)

                          row = new ActionRowBuilder()
                            .addComponents(
                              new ButtonBuilder()
                                .setCustomId(`retry-link-${interaction.user.id}`)
                                .setLabel(`Retry Link for ${userName}`)
                                .setStyle('Primary'),
                            );
                  }
              }
          }
          else {
            embed = new EmbedBuilder({url: `https://lichess.org/@/${userName}`, description: 'Rate Limit Encountered! Please try again!'})
              .setColor(0x0099ff)

              row = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId(`retry-link-${interaction.user.id}`)
                    .setLabel(`Retry Link for ${userName}`)
                    .setStyle('Primary'),
                );
          }
      }
      else
      {

          queue[`lichess-account-of-${interaction.user.id}`] = null
          queue[`cached-lichess-account-data-of-${interaction.user.id}`] = undefined
          
          bUpdate = true

          embed = new EmbedBuilder({description: `Successfully unlinked your Lichess Profile`})
              .setColor(0x0099ff)

      }

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)

      if(bUpdate)
      {
        jsGay.updateProfileDataByInteraction(interaction, true)
      }

      if(embed && row && attachment)
      {
        interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false, files: [attachment] })
      }
      else if(embed && row)
      {
        interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false })
      }
      else if(embed)
      {
        interaction.editReply({ embeds: [embed], failIfNotExists: false })
      }
    }
};
