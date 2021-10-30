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
		.setName('profile')
		.setDescription('Show Lichess / Chess.com profile of user')

    .addUserOption((option) =>
      option.setName('user').setDescription('User to check. Leave empty for your profile')
    )
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Only you can see this message?')
    ),
    async execute(client, interaction, settings, goodies) {
      
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      let trueUser = interaction.user
      let trueMember = interaction.member

      let fakeUser = interaction.options.getUser('user');
      let fakeMember = interaction.options.getMember('user');
      
      if(!fakeUser)
      {
          fakeUser = trueUser
      }

      if(!fakeMember)
      {
          fakeMember = trueMember
      }

      // We do a little trolling
      interaction.user = fakeUser
      interaction.member = fakeMember

      let highestRating

      let timestamp1 = await settings.get(`last-updated-${interaction.user.id}`)

      if ((timestamp1 == undefined || timestamp1 + 120 * 1000 < Date.now() || (jsGay.isBotSelfHosted() && timestamp1 + 10 * 1000 < Date.now())))
      {
        highestRating = await jsGay.updateProfileDataByInteraction(interaction, false)
      }
      else
      {
        highestRating = await jsGay.updateProfileDataByInteraction(interaction, true)
      }

      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)
      
      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole)
	  
      ratingRoles = obj.ratingRoles
      puzzleRatingRoles = obj.puzzleRatingRoles
      titleRoles = obj.titleRoles
      let guildRoles = obj.guildRoles
  
      interaction.user = trueUser
      interaction.member = trueMember

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
          corresRating = result.perfs.correspondence.rating.toString() + (result.perfs.correspondence.prov == undefined ? "" : "**(?)**")

        if (result.perfs.blitz)
          blitzRating = result.perfs.blitz.rating.toString() + (result.perfs.blitz.prov == undefined ? "" : "**(?)**")

        if (result.perfs.rapid)
          rapidRating = result.perfs.rapid.rating.toString() + (result.perfs.rapid.prov == undefined ? "" : "**(?)**")

        if (result.perfs.classical)
          classicalRating = result.perfs.classical.rating.toString() + (result.perfs.classical.prov == undefined ? "" : "**(?)**")

        let bestLichess = 
        lichessEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`<:lichess_logo:898198362455687218> Lichess Stats of ${jsGay.getUserFullDiscordName(fakeUser)}`)
    
          .addFields(
            { name: '\u200B', value: '\u200B' },
            { name: `*Username:*`, value: `${result.patron ? ' <:lichess_patron:898198175633010708> ' : ''}${jsGay.getEmojiFromTitle(result.title)}[${lichessAccount}](${result.url})` },
            { name: 'Blitz Rating', value: jsGay.addStarForBestRating(highestRating, blitzRating, lichessRatingEquation), inline: true },
            { name: 'Rapid Rating', value: jsGay.addStarForBestRating(highestRating, rapidRating, lichessRatingEquation), inline: true },
            { name: 'Classical Rating', value: jsGay.addStarForBestRating(highestRating, classicalRating, lichessRatingEquation), inline: true },
            { name: 'Correspondence Rating', value: jsGay.addStarForBestRating(highestRating, corresRating, lichessRatingEquation), inline: true },
          )
      }
      else
      {
        lichessEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`<:lichess_logo:898198362455687218> Lichess Stats of ${jsGay.getUserFullDiscordName(fakeUser)}`)
          .setDescription('Could not find stats for user.')
      }

      // Now chess.com steals every variable!

      result = chessComAccountData

      if(result)
      {
        corresRating = "Unrated"
        blitzRating = "Unrated"
        rapidRating = "Unrated"

        if (result.chess_daily)
          corresRating = result.chess_daily.last.rating.toString() + (result.chess_daily.last.rd < jsGay.Constant_ProvisionalRD ? "" : "**(?)**")

        if (result.chess_blitz)
          blitzRating = result.chess_blitz.last.rating.toString() + (result.chess_blitz.last.rd < jsGay.Constant_ProvisionalRD ? "" : "**(?)**")

        if (result.chess_rapid)
          rapidRating = result.chess_rapid.last.rating.toString() + (result.chess_rapid.last.rd < jsGay.Constant_ProvisionalRD ? "" : "**(?)**")

        chessComEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`<:chess_com_logo:898211680604016690> Chess.com Stats of ${jsGay.getUserFullDiscordName(fakeUser)}`)
          
          .addFields(
            { name: '\u200B', value: '\u200B' },
            { name: `*Username:*`, value: `[${chessComAccount}](https://www.chess.com/member/${chessComAccount})` },
            { name: 'Blitz Rating', value: jsGay.addStarForBestRating(highestRating, blitzRating, chessComRatingEquation), inline: true },
            { name: 'Rapid Rating', value: jsGay.addStarForBestRating(highestRating, rapidRating, chessComRatingEquation), inline: true },
            { name: 'Correspondence Rating', value: jsGay.addStarForBestRating(highestRating, corresRating, chessComRatingEquation), inline: true },
          )
          .setFooter(`Note: Provisional rating is artifically calculated by Lichess standards.\nNote: Linking your account won't update your rating, you must send a message to update your rating`);
      }
      else
      {
        chessComEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`<:chess_com_logo:898211680604016690> Chess.com Stats of ${jsGay.getUserFullDiscordName(fakeUser)}`)
          .setDescription('Could not find any stats for user.')
          .setFooter(`Note: Linking your account won't update your rating, you must send a message to update your rating`);

      }
      interaction.editReply({ embeds: [lichessEmbed, chessComEmbed], failIfNotExists: false, ephemeral: ephemeral })
    }
};