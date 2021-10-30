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

module.exports =
{
	data: new SlashCommandBuilder()
		.setName('chess')
		.setDescription('Links your Chess.com account.')

    .addStringOption((option) =>
      option.setName('username').setDescription('Your Chess.com Username')
    ),
    async execute(client, interaction, settings, goodies)
    {
      let embed = undefined
      let row = undefined
      let attachment = undefined

      let bUpdate = false
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)
      

      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole)
	  
	  ratingRoles = obj.ratingRoles
	  puzzleRatingRoles = obj.puzzleRatingRoles
	  titleRoles = obj.titleRoles
	  let guildRoles = obj.guildRoles
	  verifyRole = obj.verifyRole

      let queue = {}

      let userName = interaction.options.getString('username');

      if (userName)
      {
            if ((timestamp == undefined || timestamp + 10 * 1000 < Date.now())) {
                queue[`last-command-${interaction.user.id}`] = Date.now()
                let result = await fetch(`https://api.chess.com/pub/player/${userName}`).then(response => {
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
                  embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setDescription('User was not found!')
                }
                else if (result == "Rate Limit") {
                      embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setURL(`https://www.chess.com/member/${userName}`)
                      .setDescription('Rate Limit Encountered! Please try again!')

                      row = new MessageActionRow()
                        .addComponents(
                          new MessageButton()
                            .setCustomId(`retry-link-${interaction.user.id}`)
                            .setLabel(`Retry Link for ${userName}`)
                            .setStyle('PRIMARY'),
                        );
                }
                else {
                    // result.profile.location
                    let fullDiscordUsername = interaction.user.username + "#" + interaction.user.discriminator

                    if (result.location && fullDiscordUsername == result.location) {
                        queue[`chesscom-account-of-${interaction.user.id}`] = result.username

                        // Unfortunately the endpoint of chess.com is different for getting location than the endpoint for getting stats, therefore we cannot use the line below.
                        //await settings.set(`cached-chesscom-account-data-of-${interaction.user.id}`, result)
                        jsGay.updateProfileDataByInteraction(interaction, true)

                        embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setDescription(`Successfully linked your [Chess.com Profile](${result.url})`)

                    }
                    else {

                        attachment = await jsGay.buildCanvasForChessCom(interaction.user.username + "#" + interaction.user.discriminator)

                      
                        embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setURL(`https://www.chess.com/member/${userName}`)
                            .setDescription('You need to put `' + interaction.user.username + "#" + interaction.user.discriminator + '` in `Location` in your [Chess.com Profile](https://www.chess.com/settings)')

                              row = new MessageActionRow()
                              .addComponents(
                                new MessageButton()
                                  .setCustomId(`retry-link-${interaction.user.id}`)
                                  .setLabel(`Retry Link for ${userName}`)
                                  .setStyle('PRIMARY'),
                              );
                    }
                }
            }
            else {
              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setURL(`https://www.chess.com/member/${userName}`)
                .setDescription('Rate Limit Encountered! Please try again!')

                row = new MessageActionRow()
                  .addComponents(
                    new MessageButton()
                      .setCustomId(`retry-link-${interaction.user.id}`)
                      .setLabel(`Retry Link for ${userName}`)
                      .setStyle('PRIMARY'),
                  );
            }
        }
        else {
            queue[`chesscom-account-of-${interaction.user.id}`] = null
            queue[`cached-chesscom-account-data-of-${interaction.user.id}`] = undefined

            bUpdate = true

            embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully unlinked your Chess.com Profile`)
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
}