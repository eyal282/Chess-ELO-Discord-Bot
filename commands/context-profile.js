const { ApplicationCommandType } = require("discord-api-types/v9");
const { ContextMenuCommandBuilder } = require('@discordjs/builders');

const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');

const jsGay = require('../util.js')

let contextMenu = new ContextMenuCommandBuilder()
		.setType(ApplicationCommandType.User)
		.setName('Profile Ephemeral')
		.setDefaultPermission(true)


module.exports =
{
	data: contextMenu,
  async execute(client, interaction, settings, goodies)
  {  
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

      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise] = await jsGay.getCriticalData(interaction)
      
      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)
	  
	  ratingRoles = obj.ratingRoles
	  puzzleRatingRoles = obj.puzzleRatingRoles
	  titleRoles = obj.titleRoles
	  let guildRoles = obj.guildRoles
	  verifyRole = obj.verifyRole
	  titledRole = obj.titledRole

	 embed = new MessageEmbed()
	          .setColor('#0099ff')
			.setAuthor(`${interaction.member.displayName}'s Profile`, interaction.user.avatarURL())
		  	  .setFooter(`Note: Time Controls marked with X are never calculated as a role for this server.\nNote: Provisional rating in Chess.com is artifically calculated by Lichess standards.`)
		
      interaction.user = trueUser
      interaction.member = trueMember

		let description = "";
	  
	  	description += `<:lichess_logo:898198362455687218> Lichess: `

	  	// Soon chess.com data replaces this variable.
	  	let result = lichessAccountData;
	  
		if(result == null)
			description += ` Profile not linked.`

		else
		{
			let emptyStr = ""
	        let corresRating = "**Unrated**"
			let bulletRating = "**Unrated**"
	        let blitzRating = "**Unrated**"
	        let rapidRating = "**Unrated**"
	        let classicalRating = "**Unrated**"
			let puzzleRating = "**Unrated**"
	
			if(result.perfs)
			{
				if (result.perfs.correspondence)
				corresRating = emptyStr.concat(jsGay.areBitsContained(timeControlsBitwise, jsGay.Constant_CorresBitwise) ? "" : ":x:", "**", result.perfs.correspondence.rating.toString(), (result.perfs.correspondence.prov == undefined ? "" : "(?)"), "**")
	
				if (result.perfs.blitz)
				blitzRating = emptyStr.concat(jsGay.areBitsContained(timeControlsBitwise, jsGay.Constant_BlitzBitwise) ? "" : ":x:", "**", result.perfs.blitz.rating.toString(), (result.perfs.blitz.prov == undefined ? "" : "(?)"), "**")
	
				if (result.perfs.bullet)
				bulletRating = emptyStr.concat(jsGay.areBitsContained(timeControlsBitwise, jsGay.Constant_BulletBitwise) ? "" : ":x:", "**", result.perfs.bullet.rating.toString(), (result.perfs.bullet.prov == undefined ? "" : "(?)"), "**")
	
				if (result.perfs.rapid)
				rapidRating = emptyStr.concat(jsGay.areBitsContained(timeControlsBitwise, jsGay.Constant_RapidBitwise) ? "" : ":x:", "**", result.perfs.rapid.rating.toString(), (result.perfs.rapid.prov == undefined ? "" : "(?)"), "**")
	
				if (result.perfs.classical)
				classicalRating = emptyStr.concat(jsGay.areBitsContained(timeControlsBitwise, jsGay.Constant_ClassicalBitwise) ? "" : ":x:", "**", result.perfs.classical.rating.toString(), (result.perfs.classical.prov == undefined ? "**" : "(?)"), "**")
	
	 			if (result.perfs.puzzle && result.perfs.puzzle.prov == undefined)
				puzzleRating = emptyStr.concat("**", result.perfs.puzzle.rating.toString(), (result.perfs.puzzle.prov == undefined ? "" : "(?)"), "**")
			}
				// Username
				description += `${result.patron ? ' <:lichess_patron:898198175633010708> ' : ''}${jsGay.getEmojiFromTitle(result.title)}[${result.username}](${result.url}) `
	
				// Bullet
				description += `<:lichess_bullet:909072316019916850> Bullet: ${jsGay.addStarForBestRating(highestRating, bulletRating, lichessRatingEquation)} `
	
				// Blitz
				description += `<:lichess_blitz:909072315806003243> Blitz: ${jsGay.addStarForBestRating(highestRating, blitzRating, lichessRatingEquation)} `
	
				// Rapid
				description += `<:lichess_rapid:909072316128956476> Rapid: ${jsGay.addStarForBestRating(highestRating, rapidRating, lichessRatingEquation)} `
	
				// Classical
				description += `<:lichess_classical:909073486075527210> Classical: ${jsGay.addStarForBestRating(highestRating, classicalRating, lichessRatingEquation)} `
	
				// Daily
				description += `<:lichess_correspondence:909072696090976267> Daily: ${jsGay.addStarForBestRating(highestRating, corresRating, lichessRatingEquation)} `

				// Puzzles
				description += `<:lichess_puzzles:927950539617087519> Puzzles: ${puzzleRating} `

			
		}

	  	description += `\n\n<:chess_com_logo:898211680604016690> Chess.com: `

	  	// Now chess.com steals every variable!
	    result = chessComAccountData
		if(chessComAccountData == null)
			description += ` Profile not linked.`

		else
		{
	
			let emptyStr = ""
			let bulletRating = "**Unrated**"
	        let blitzRating = "**Unrated**"
	        let rapidRating = "**Unrated**"
			let corresRating = "**Unrated**"
			let puzzleRating = "**Unrated**"
	
	    
	        if (result.chess_bullet)
	            bulletRating = emptyStr.concat(jsGay.areBitsContained(timeControlsBitwise, jsGay.Constant_BulletBitwise) ? "" : ":x:", "**", result.chess_bullet.last.rating.toString(), (result.chess_bullet.last.rd < jsGay.Constant_ProvisionalRD ? "" : "(?)"), "**")
	
	        if (result.chess_blitz)
	            blitzRating = emptyStr.concat(jsGay.areBitsContained(timeControlsBitwise, jsGay.Constant_BlitzBitwise) ? "" : ":x:", "**", result.chess_blitz.last.rating.toString(), (result.chess_blitz.last.rd < jsGay.Constant_ProvisionalRD ? "" : "(?)"), "**")
	
	        if (result.chess_rapid)
	          rapidRating = emptyStr.concat(jsGay.areBitsContained(timeControlsBitwise, jsGay.Constant_RapidBitwise) ? "" : ":x:", "**", result.chess_rapid.last.rating.toString(), (result.chess_rapid.last.rd < jsGay.Constant_ProvisionalRD ? "" : "(?)"), "**")
	
	   		if (result.chess_daily)
	          corresRating = emptyStr.concat(jsGay.areBitsContained(timeControlsBitwise, jsGay.Constant_CorresBitwise) ? "" : ":x:", "**", result.chess_daily.last.rating.toString(), (result.chess_daily.last.rd < jsGay.Constant_ProvisionalRD ? "" : "(?)"), "**")
	
			if(result.tactics && result.tactics.last && result.tactics.last.rating && result.tactics.last.rating != -1)
			 	puzzleRating = emptyStr.concat("**", result.tactics.last.rating.toString(), "**")

			// Username
			description += `${result.status == "premium" ? ` ${jsGay.getEmojiFromPremiumLevel(result.membership_level)}` : ''}${jsGay.getEmojiFromTitle(result.title)}[${chessComAccount}](https://www.chess.com/member/${chessComAccount}) `
			
			// Bullet
			description += `<:lichess_bullet:909072316019916850> Bullet: ${jsGay.addStarForBestRating(highestRating, bulletRating, chessComRatingEquation)} `

			// Blitz
			description += `<:lichess_blitz:909072315806003243> Blitz: ${jsGay.addStarForBestRating(highestRating, blitzRating, chessComRatingEquation)} `

			// Rapid
			description += `<:lichess_rapid:909072316128956476> Rapid: ${jsGay.addStarForBestRating(highestRating, rapidRating, chessComRatingEquation)} `


			// Daily
			description += `<:lichess_correspondence:909072696090976267> Daily: ${jsGay.addStarForBestRating(highestRating, corresRating, chessComRatingEquation)} `

			// Puzzles
			description += `<:lichess_puzzles:927950539617087519> Puzzles: ${puzzleRating} `
		}
	  
	  embed.setDescription(description);
	  
      interaction.editReply({ embeds: [embed], failIfNotExists: false})
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
