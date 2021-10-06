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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Show Lichess / Chess.com profile of user')

    .addUserOption((option) =>
      option.setName('user').setDescription('User to check. Leave empty for your profile')
    )
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Only you can see this message?')
    ),
    async execute(client, interaction, settings, goodies) {

      let trueUser = interaction.user

      let fakeUser = interaction.options.getUser('user');
      
      if(!fakeUser)
      {
          fakeUser = trueUser
      }

      // We do a little trolling
      interaction.user = fakeUser

      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)
      
      interaction.user = trueUser

      let ephemeral = interaction.options.getBoolean('ephemeral');

      // Soon chess.com steals every variable here.
      let result = lichessAccountData

      let lichessEmbed
      let chessComEmbed

      if(result)
      {
        let corresRating = "Unrated"
        let blitzRating = "Unrated"
        let rapidRating = "Unrated"
        let classicalRating = "Unrated"


        if (result.perfs.correspondence)
          corresRating = result.perfs.correspondence.rating.toString() + (result.perfs.correspondence.prov == undefined ? "" : "?")

        if (result.perfs.blitz)
          blitzRating = result.perfs.blitz.rating.toString() + (result.perfs.blitz.prov == undefined ? "" : "?")

        if (result.perfs.rapid)
          rapidRating = result.perfs.rapid.rating.toString() + (result.perfs.rapid.prov == undefined ? "" : "?")

        if (result.perfs.classical)
          classicalRating = result.perfs.classical.rating.toString() + (result.perfs.classical.prov == undefined ? "" : "?")

        lichessEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`Lichess Stats of ${jsGay.getUserFullDiscordName(fakeUser)}`)
          .setURL(result.url)
          .addFields(
            { name: '\u200B', value: '\u200B' },
            { name: 'Blitz Rating', value: blitzRating, inline: true },
            { name: 'Rapid Rating', value: rapidRating, inline: true },
            { name: 'Classical Rating', value: classicalRating, inline: true },
            { name: 'Correspondence Rating', value: corresRating, inline: true },
          )
      }
      else
      {
        lichessEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`Lichess Stats of ${jsGay.getUserFullDiscordName(fakeUser)}`)
          .setDescription('Could not find stats for user.')
      }

      // Now chess.com steals every variable!

      result = chessComAccountData

      if(result)
      {
        corresRating = "Unrated"
        blitzRating = "Unrated"
        rapidRating = "Unrated"
        classicalRating = "Unrated"

        if (result.chess_daily)
          corresRating = result.chess_daily.last.rating.toString() + (result.chess_daily.last.rd >= jsGay.Constant_ProvisionalRD ? "" : "?")

        if (result.chess_blitz)
          blitzRating = result.chess_blitz.last.rating.toString() + (result.chess_blitz.last.rd >= jsGay.Constant_ProvisionalRD ? "" : "?")

        if (result.chess_rapid)
          rapidRating = result.chess_rapid.last.rating.toString() + (result.chess_rapid.last.rd >= jsGay.Constant_ProvisionalRD ? "" : "?")

        chessComEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`Chess.com Stats of ${jsGay.getUserFullDiscordName(fakeUser)}`)
          .setURL(`https://www.chess.com/member/${chessComAccount}`)
          .addFields(
            { name: '\u200B', value: '\u200B' },
            { name: 'Blitz Rating', value: blitzRating, inline: true },
            { name: 'Rapid Rating', value: rapidRating, inline: true },
            { name: 'Classical Rating', value: classicalRating, inline: true },
            { name: 'Correspondence Rating', value: corresRating, inline: true },
          )
          .setFooter(`Note: Provisional rating is artifically calculated by Lichess standards.\nNote: Linking your account won't update your rating, you must send a message to update your rating`);
      }
      else
      {
        chessComEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`Chess.com Stats of ${jsGay.getUserFullDiscordName(fakeUser)}`)
          .setDescription('Could not find any stats for user.')
      }
      interaction.editReply({ embeds: [lichessEmbed, chessComEmbed], failIfNotExists: false, ephemeral: ephemeral })
    }
};