const token = process.env["SECRET_BOT_TOKEN"]
const mongoPassword = process.env["SECRET_MONGO_PASSWORD"]


const { clientId, guildId, channelId, chessComClientId, chessComRedirectURI, chessComEndOfWebsite, myWebsite, dbURL } = require('./config.json');

trueDBURL = dbURL.replace('<password>', mongoPassword)


const express = require('express');
const app = express();
const port = 3000;
 
app.get('/', (req, res) => res.sendFile("website/index.html", { root: '.' }));
app.get('/fail', (req, res) => res.sendFile("website/fail.html", { root: '.' }));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

var session = require('express-session');
app.use(session({ secret: process.env['LICHESS_OAUTH2'] }));

let Constant_lichessDefaultRatingEquation = "x"
let Constant_chessComDefaultRatingEquation = "0.75 * x + 650"
let Constant_ProvisionalRD = 110

let Constant_BulletBitwise = (1 << 0)
let Constant_BlitzBitwise = (1 << 1)
let Constant_RapidBitwise = (1 << 2)
let Constant_ClassicalBitwise = (1 << 3)
let Constant_CorresBitwise = (1 << 4)

let Constant_Lichess = 0
let Constant_ChessCom = 1

let Constant_DefaultEmbedMessage = "Use the buttons below for linking your account to gain your rating roles!\n\nIf you want to link by editing your profile, you can still use /lichess and /chess"

let Constant_DefaultSelectUniqueRoleMessage = "Use the menu below to pick a unique role. Only one role may be picked."

let Constant_DefaultSelectManyRolesMessage = "Use the menu below to pick up to {MAX_ROLES} unique roles. Every unpicked role is deleted."

const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');

const { bold, italic, strikethrough, underscore, spoiler, quote, blockQuote, hyperlink, hideLinkEmbed } = require('@discordjs/builders');

const Parser = require('expr-eval').Parser;

const Josh = require("@joshdb/core");
const provider = require("@joshdb/mongo");
const fetch = require('node-fetch');

var CryptoJS = require("crypto-js");

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", 'DIRECT_MESSAGES']} );

let modCommands = []

const settings = new Josh({
  name: 'Chess ELO Role',
  provider,
  providerOptions: {
    collection: `settings`,
    url: trueDBURL,
  }
});

let bootDate = new Date();

let titleList = [
  {
    "roleName": "Lichess Master",
    "titleName": "LM"
  },
  {
    "roleName": "Grandmaster",
    "titleName": "GM"
  }, 
  {
    "roleName": "Woman Grandmaster",
    "titleName": "WGM"
  }, 
  {
    "roleName": "International Master",
    "titleName": "IM"
  }, 
  {
    "roleName": "Woman International Master",
    "titleName": "WIM"
  }, 
  {
    "roleName": "FIDE Master",
    "titleName": "FM"
  }, 
  {
    "roleName": "Woman FIDE Master",
    "titleName": "WFM"
  }, 
  {
    "roleName": "National Master",
    "titleName": "NM"
  }, 
  {
    "roleName": "Candidate Master",
    "titleName": "CM"
  }, 
  {
    "roleName": "Woman Candidate Master",
    "titleName": "WCM"
  }, 
  {
    "roleName": "Woman National Master",
    "titleName": "WNM"
  }
]

let roleNamesToPurge = ["Unrated", "Puzzles Unrated"]

/*

FUNCTIONS!!!!

*/


async function setModSlashCommands(commandsArray)
{
	modCommands = commandsArray
}

async function generateEmbedForProfileByInteraction(interaction)
{
	let highestRating = -1;
	
	let timestamp1 = await settings.get(`last-updated-${interaction.user.id}`)

	if ((timestamp1 == undefined || timestamp1 + 120 * 1000 < Date.now() || (isBotSelfHosted() && timestamp1 + 10 * 1000 < Date.now())))
	{
		highestRating = await updateProfileDataByInteraction(interaction, false)
	}
	else
	{
		highestRating = await 						updateProfileDataByInteraction(interaction, true)
	}
	
	let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise] = await getCriticalData(interaction)
	  
	let obj = await wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)
	
	ratingRoles = obj.ratingRoles
	puzzleRatingRoles = obj.puzzleRatingRoles
	titleRoles = obj.titleRoles
	let guildRoles = obj.guildRoles
	verifyRole = obj.verifyRole
	titledRole = obj.titledRole

	let embed = new MessageEmbed({color: '#0099ff', author: `${interaction.member.displayName}'s Profile`, footer: `Note: Time Controls marked with X are never calculated as a role for this server.\nNote: Provisional rating in Chess.com is artifically calculated by Lichess standards.`})
	
	let description = "";
	  
	description += `<:lichess_logo:898198362455687218> **Lichess:** `

	// Soon chess.com data replaces this variable.
	let result = lichessAccountData;
  
	if(result == null)
		description += ` Profile not linked.`

	else
	{
		let emptyStr = ""
		let corresRating = "Unrated"
		let bulletRating = "Unrated"
		let blitzRating = "Unrated"
		let rapidRating = "Unrated"
		let classicalRating = "Unrated"
		let puzzleRating = "Unrated"

		if(result.perfs)
		{
			if (result.perfs.correspondence)
			corresRating = emptyStr.concat(areBitsContained(timeControlsBitwise, Constant_CorresBitwise) ? "" : ":x:", result.perfs.correspondence.rating.toString(), (result.perfs.correspondence.prov == undefined ? "" : "(?)"))

			if (result.perfs.blitz)
			blitzRating = emptyStr.concat(areBitsContained(timeControlsBitwise, Constant_BlitzBitwise) ? "" : ":x:", result.perfs.blitz.rating.toString(), (result.perfs.blitz.prov == undefined ? "" : "(?)"))

			if (result.perfs.bullet)
			bulletRating = emptyStr.concat(areBitsContained(timeControlsBitwise, Constant_BulletBitwise) ? "" : ":x:", result.perfs.bullet.rating.toString(), (result.perfs.bullet.prov == undefined ? "" : "(?)"))

			if (result.perfs.rapid)
			rapidRating = emptyStr.concat(areBitsContained(timeControlsBitwise, Constant_RapidBitwise) ? "" : ":x:", result.perfs.rapid.rating.toString(), (result.perfs.rapid.prov == undefined ? "" : "(?)"))

			if (result.perfs.classical)
			classicalRating = emptyStr.concat(areBitsContained(timeControlsBitwise, Constant_ClassicalBitwise) ? "" : ":x:", result.perfs.classical.rating.toString(), (result.perfs.classical.prov == undefined ? "" : "(?)"))

			if (result.perfs.puzzle && result.perfs.puzzle.prov == undefined)
			puzzleRating = emptyStr.concat(result.perfs.puzzle.rating.toString(), (result.perfs.puzzle.prov == undefined ? "" : "(?)"))
		}
			// Username
			description += `${result.patron ? ' <:lichess_patron:898198175633010708> ' : ''}${getEmojiFromTitle(result.title)}**[${result.username}](${result.url})**\n`

			// Bullet
			description += `<:lichess_bullet:909072316019916850> Bullet: **${addStarForBestRating(highestRating, bulletRating, lichessRatingEquation)}** \\|\\| `

			// Blitz
			description += `<:lichess_blitz:909072315806003243> Blitz: **${addStarForBestRating(highestRating, blitzRating, lichessRatingEquation)}** \\|\\| `

			// Rapid
			description += `<:lichess_rapid:909072316128956476> Rapid: **${addStarForBestRating(highestRating, rapidRating, lichessRatingEquation)}**\n`

			// Classical
			description += `<:lichess_classical:909073486075527210> Classical: **${addStarForBestRating(highestRating, classicalRating, lichessRatingEquation)}** \\|\\| `

			// Daily
			description += `<:lichess_correspondence:909072696090976267> Daily: **${addStarForBestRating(highestRating, corresRating, lichessRatingEquation)}** \\|\\| `

			// Puzzles
			description += `<:lichess_puzzles:927950539617087519> Puzzles: **${puzzleRating}** `

		
	}

	description += `\n\n<:chess_com_logo:898211680604016690> **Chess.com:** `

	// Now chess.com steals every variable!
	result = chessComAccountData
	if(chessComAccountData == null)
		description += ` Profile not linked.`

	else
	{

		let emptyStr = ""
		let bulletRating = "Unrated"
		let blitzRating = "Unrated"
		let rapidRating = "Unrated"
		let corresRating = "Unrated"
		let puzzleRating = "Unrated"

	
		if (result.chess_bullet)
			bulletRating = emptyStr.concat(areBitsContained(timeControlsBitwise, Constant_BulletBitwise) ? "" : ":x:", result.chess_bullet.last.rating.toString(), (result.chess_bullet.last.rd < Constant_ProvisionalRD ? "" : "(?)"))

		if (result.chess_blitz)
			blitzRating = emptyStr.concat(areBitsContained(timeControlsBitwise, Constant_BlitzBitwise) ? "" : ":x:", result.chess_blitz.last.rating.toString(), (result.chess_blitz.last.rd < Constant_ProvisionalRD ? "" : "(?)"))

		if (result.chess_rapid)
		  rapidRating = emptyStr.concat(areBitsContained(timeControlsBitwise, Constant_RapidBitwise) ? "" : ":x:", result.chess_rapid.last.rating.toString(), (result.chess_rapid.last.rd < Constant_ProvisionalRD ? "" : "(?)"))

		if (result.chess_daily)
		  corresRating = emptyStr.concat(areBitsContained(timeControlsBitwise, Constant_CorresBitwise) ? "" : ":x:", result.chess_daily.last.rating.toString(), (result.chess_daily.last.rd < Constant_ProvisionalRD ? "" : "(?)"))

		if(result.tactics && result.tactics.last && result.tactics.last.rating && result.tactics.last.rating != -1)
			puzzleRating = emptyStr.concat(result.tactics.last.rating.toString())

		// Username
		description += `${result.status == "premium" ? ` ${getEmojiFromPremiumLevel(result.membership_level)}` : ''}${getEmojiFromTitle(result.title)}**[${chessComAccount}](https://www.chess.com/member/${chessComAccount})**\n`
		
		// Bullet
		description += `<:lichess_bullet:909072316019916850> Bullet: **${addStarForBestRating(highestRating, bulletRating, chessComRatingEquation)}** \\|\\| `

		// Blitz
		description += `<:lichess_blitz:909072315806003243> Blitz: **${addStarForBestRating(highestRating, blitzRating, chessComRatingEquation)}** \\|\\| `

		// Rapid
		description += `<:lichess_rapid:909072316128956476> Rapid: **${addStarForBestRating(highestRating, rapidRating, chessComRatingEquation)}**\n`


		// Daily
		description += `<:lichess_correspondence:909072696090976267> Daily: **${addStarForBestRating(highestRating, corresRating, chessComRatingEquation)}** \\|\\| `

		// Puzzles
		description += `<:lichess_puzzles:927950539617087519> Puzzles: **${puzzleRating}** `
	}
	  
	embed.setDescription(description);

	return embed;
}

// This returns the best rating AFTER formula.
// You can sneak a fake interaction if you assign .guild, .user and .member
async function updateProfileDataByInteraction(interaction, useCacheOnly)
{
	let interactions = [];

	interactions.push(interaction);

	return await updateProfileDataByInteractionsArray(interactions, useCacheOnly);
}

// This returns the best rating AFTER formula.
// You can sneak a fake interaction if you assign .guild, .user and .member
async function updateProfileDataByInteractionsArray(interactions, useCacheOnly)
{
    if(!interactions[0].guild.me.permissions.has('MANAGE_ROLES'))
        return -1;

	let highestRating = -1
	
	let queues = []

	let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, dummy_value1, dummy_value2, dummy_value3, dummy_value4, dummy_value5, verifyRole, titledRole, timeControlsBitwise] = await getCriticalData(interactions[0])


	try {
	  Parser.evaluate(lichessRatingEquation, { x: 1000 })
	  Parser.evaluate(lichessRatingEquation, { x: 0 })
	  Parser.evaluate(lichessRatingEquation, { x: -1 })

	  Parser.evaluate(chessComRatingEquation, { x: 1000 })
	  Parser.evaluate(chessComRatingEquation, { x: 0 })
	  Parser.evaluate(chessComRatingEquation, { x: -1 })
	}
	catch {}
		
	let obj = await wipeDeletedRolesFromDB(interactions[0], ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)

	for(let num=0;num < interactions.length;num++)
	{
		let queue = []
		
		let interaction = interactions[num];	

		highestRating = -1

	 	let [dummy_value100, dummy_value101, dummy_value102, dummy_value103, dummy_value104, dummy_value105, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, dummy_value106, dummy_value107, dummy_value108] = await getCriticalData(interaction)
		
		ratingRoles = obj.ratingRoles
		puzzleRatingRoles = obj.puzzleRatingRoles
		titleRoles = obj.titleRoles
		let guildRoles = obj.guildRoles
		verifyRole = obj.verifyRole
		titledRole = obj.titledRole
	
	    queue[`last-updated-${interaction.user.id}`] = Date.now()
	
	    let result
	
	    if (lichessAccount == undefined) {
	      result = null;
	    }
	    else
	    {
	      if(useCacheOnly) 
	      {
	        result = lichessAccountData
	      }
	      else
	      {
	        result = await fetch(`https://lichess.org/api/user/${lichessAccount}`).then(response => {
	          if (response.status == 404) { // Not Found
	            return null
	          }
	          else if (response.status == 200) { // Status OK
	            return response.json()
	          }
	          else if(response.status == 429) { // Rate Limit
	            return null
	          }
	        })
	      }
	    }

	    let highestPuzzleRating = -1
	    let lichessHighestRating = -1
	    let lichessPuzzleRating = -1
	    let lichessTitle = ""
	    let chessTitle = ""

	    if(result != null)
	    {
	      queue[`cached-lichess-account-data-of-${interaction.user.id}`] = result
	
		  let bulletRating = -1
	      let blitzRating = -1
	      let rapidRating = -1
	      let classicalRating = -1
		  let corresRating = -1
	
	      let puzzleRating = -1
	
		  if (result.perfs)
		  {
			if (result.perfs.bullet && result.perfs.bullet.prov == undefined) bulletRating = result.perfs.bullet.rating
	
			if (result.perfs.blitz && result.perfs.blitz.prov == undefined) blitzRating = result.perfs.blitz.rating
	
			if (result.perfs.rapid && result.perfs.rapid.prov == undefined) rapidRating = result.perfs.rapid.rating
	
			if (result.perfs.classical && result.perfs.classical.prov == undefined) classicalRating = result.perfs.classical.rating
	
			if (result.perfs.correspondence && result.perfs.correspondence.prov == undefined) corresRating = 
				result.perfs.correspondence.rating
	
	      	if (result.perfs.puzzle && result.perfs.puzzle.prov == undefined) puzzleRating = result.perfs.puzzle.rating
		  }
	
		  if(!areBitsContained(timeControlsBitwise, Constant_BulletBitwise))
		  	bulletRating = -1
	
		  if(!areBitsContained(timeControlsBitwise, Constant_BlitzBitwise))
		  	blitzRating = -1
	
		  if(!areBitsContained(timeControlsBitwise, Constant_RapidBitwise))
		  	rapidRating = -1
	
		  if(!areBitsContained(timeControlsBitwise, Constant_ClassicalBitwise))
		  	classicalRating = -1
	
		  if(!areBitsContained(timeControlsBitwise, Constant_CorresBitwise))
		  	corresRating = -1
	
	      lichessHighestRating = Math.max(bulletRating, blitzRating, rapidRating, classicalRating, corresRating)
	      lichessPuzzleRating = puzzleRating
	
	      let value = lichessHighestRating
	
	      try {
	
			if(value != -1)
	        	value = Math.round(Parser.evaluate(lichessRatingEquation, { x: lichessHighestRating }))
	      }
	
	      catch { console.log(error)}

	      lichessHighestRating = value
	      highestRating = lichessHighestRating
	      highestPuzzleRating = lichessPuzzleRating
	
	      if (result.title) 
	        lichessTitle = result.title
	    }

	    if (chessComAccount == undefined) {
	      result = null;
	    }
	    else
	    {
	      if(useCacheOnly) 
	      {
	        result = chessComAccountData
	      }
	      else
	      {
	        result = await fetch(`https://api.chess.com/pub/player/${chessComAccount}/stats`).then(response => {
	          if (response.status == 404) { // Not Found
	            return null
	          }
	          else if (response.status == 200) { // Status OK
	            return response.json()
	          }
	          else if(response.status == 429) { // Rate Limit
	            return null
	          }
	        })
	      }
	    }

	    if(result != null)
	    {
			let result2 = await fetch(`https://api.chess.com/pub/player/${chessComAccount}`).then(response => {
	          if (response.status == 404) { // Not Found
	            return null
	          }
	          else if (response.status == 200) { // Status OK
	            return response.json()
	          }
	          else if(response.status == 429) { // Rate Limit
	            return null
	          }
	        })
	
			let result3 = await fetch(`https://www.chess.com/callback/member/stats/${chessComAccount}`).then(response => {
	          if (response.status == 404) { // Not Found
	            return null
	          }
	          else if (response.status == 200) { // Status OK
	            return response.json()
	          }
	          else if(response.status == 429) { // Rate Limit
	            return null
	          }
	        })
	
			let result4 = await fetch(`https://www.chess.com/callback/user/popup/${chessComAccount}`).then(response => {
	          if (response.status == 404) { // Not Found
	            return null
	          }
	          else if (response.status == 200) { // Status OK
	            return response.json()
	          }
	          else if(response.status == 429) { // Rate Limit
	            return null
	          }
	        })
			
			let puzzleRating = -1

			if(result3 != null)
			{
				for(let i=0;i < result3.stats.length;i++)
				{
					if(result3.stats[i].key == 'tactics' && result3.stats[i].stats && result3.stats[i].stats.rating)
					{
	
						puzzleRating = result3.stats[i].stats.rating
					}
				}
			}

			// Override the future result of chess.com for premiums
			if(result4 != null && result4.membership != undefined && result4.membership.level != undefined)
			{
				result.membership_level = result4.membership.level
			}

			result.tactics.last = {}
			result.tactics.last.rating = puzzleRating
	
			if(result2 != null)
			{
	      	queue[`cached-chesscom-account-data-of-${interaction.user.id}`] = Object.assign(result2, result) // stats are the most important thing!
			}
			else
			{
				queue[`cached-chesscom-account-data-of-${interaction.user.id}`] = result;
			}

		  let bulletRating = -1
	      let blitzRating = -1
	      let rapidRating = -1
	      let corresRating = -1
		  
	      puzzleRating = -1
	
	
	      if (result.chess_bullet && result.chess_bullet.last.rd < Constant_ProvisionalRD) bulletRating = result.chess_bullet.last.rating
	
	      if (result.chess_blitz && result.chess_blitz.last.rd < Constant_ProvisionalRD) blitzRating = result.chess_blitz.last.rating
	
	      if (result.chess_rapid && result.chess_rapid.last.rd < Constant_ProvisionalRD) rapidRating = result.chess_rapid.last.rating
	
	      if (result.chess_daily && result.chess_daily.last.rd < Constant_ProvisionalRD) corresRating = result.chess_daily.last.rating
	
	      if (result.tactics && result.tactics.highest) puzzleRating = result.tactics.last.rating
	
		  if(!areBitsContained(timeControlsBitwise, Constant_BulletBitwise))
		  	bulletRating = -1
	
		  if(!areBitsContained(timeControlsBitwise, Constant_BlitzBitwise))
		  	blitzRating = -1
	
		  if(!areBitsContained(timeControlsBitwise, Constant_RapidBitwise))
		  	rapidRating = -1
	
		  if(!areBitsContained(timeControlsBitwise, Constant_CorresBitwise))
		  	corresRating = -1
			  
	      let chessComHighestRating = Math.max(bulletRating, blitzRating, rapidRating, corresRating)
	
		  let chessComPuzzleRating = puzzleRating
	
	      let value = chessComHighestRating

	      try {
			if(value != -1)
	        	value = Math.round(Parser.evaluate(chessComRatingEquation, { x: chessComHighestRating }))
	      }
	      catch {}
	      chessComHighestRating = value
	
	      highestRating = Math.max(lichessHighestRating, chessComHighestRating)
		  highestPuzzleRating = Math.max(lichessPuzzleRating, chessComPuzzleRating)
	
	      if (result2 && result2.title)
	        chessTitle = result2.title

	    }
	
	    let highestRatingRole = null;
	    let highestPuzzleRatingRole = null;
	    let highestTitleRole = null;

	    let fullRolesCache = interaction.member.roles.cache
	
	    if (fullRolesCache)
	    {
	      let fullRolesArray = Array.from(fullRolesCache.keys());
	
		  // Now we remove every rating role from the user and readd the right role for a lot of lines here:
	
	      for (let i = 0; i < ratingRoles.length; i++)
	      {
	        if (highestRating >= ratingRoles[i].rating)
	          highestRatingRole = ratingRoles[i].id;
	
	        let index = fullRolesArray.indexOf(ratingRoles[i].id)
	
	        if(index != -1)
	          fullRolesArray.splice(index, 1);
	      }
	
	      for (let i = 0; i < puzzleRatingRoles.length; i++)
	      {
	        if (highestPuzzleRating >= puzzleRatingRoles[i].rating)
	          highestPuzzleRatingRole = puzzleRatingRoles[i].id;
	
	        let index = fullRolesArray.indexOf(puzzleRatingRoles[i].id)
	
	        if(index != -1)
	          fullRolesArray.splice(index, 1);
	      }
	
	      for (let i = 0; i < titleRoles.length; i++) {
	        if (titleRoles[i].title == lichessTitle || titleRoles[i].title == chessTitle)
	          highestTitleRole = titleRoles[i].id;
	
	        let index = fullRolesArray.indexOf(titleRoles[i].id)
	
	        if (index != -1)
	          fullRolesArray.splice(index, 1);
	      }
		
		  let index = fullRolesArray.indexOf(verifyRole)
	
		  if (index != -1)
		  	fullRolesArray.splice(index, 1)
	
		  index = fullRolesArray.indexOf(titledRole)
	
		  if (index != -1)
		  	fullRolesArray.splice(index, 1)

		  // End of deleting every CELOR related role, now we readd the right ones.
	
	      if (highestRatingRole != null)
	        fullRolesArray.push(highestRatingRole)
	
	
	      if (highestPuzzleRatingRole != null)
	        fullRolesArray.push(highestPuzzleRatingRole)
	
	      if (highestTitleRole != null)
		  {
	        fullRolesArray.push(highestTitleRole)
	
			if(titledRole != undefined)
				fullRolesArray.push(titledRole)
		  }
	
		  if(verifyRole != null && (lichessAccount != null || chessComAccount != null) )
		  	fullRolesArray.push(verifyRole)
	
	      // Don't set if nothing was changed. If both accounts are undefined ( never linked ) then do nothing.

	      if (fullRolesArray != Array.from(fullRolesCache.keys()) && !(chessComAccount === undefined && lichessAccount === undefined))
	      {
	        try
	        {
	          interaction.member.roles.set(fullRolesArray).catch(() => null)
	        }
	        catch {}
	      }
	    }

		// Don't set the timestamp cooldown if nothing is even linked...
		if(!(chessComAccount === undefined && lichessAccount === undefined))
		{
			queues.push(queue);
		}

		if(interactions[0].remaining != undefined)
		{
			interactions[0].remaining = interactions.length - num - 1
		}
	}

	let finalQueue = [];
	
	for(let num=0;num < queues.length;num++)
	{
		// No clue which order to use...
		finalQueue = Object.assign(finalQueue, queues[num]);
	}

	await settings.setMany(finalQueue, true);
	
    return highestRating
}

async function deleteMessageAfterTime(message, time)
{
    setTimeout(async () => {
      message.delete().catch(() => null)
    }, time);
}

function getRoleFromMentionString(guild, str) {
    if (!str) return;

    if (str.startsWith('<@&') && str.endsWith('>')) {
        str = str.slice(3, -1);

        if (str.startsWith('!')) {
            str = str.slice(1);
        }

        return guild.roles.cache.get(str);
    }
}

function addEloCommand(message, ratingRoles, role, elo, guildRoles) {
    for (let i = 0; i < ratingRoles.length; i++) {
        if (ratingRoles[i].id == role.id)
            return undefined
    }

    let highestBotRole = message.guild.members.resolve(client.user).roles.highest
    let guildRole = guildRoles.get(role.id)

    if(highestBotRole.rawPosition < guildRole.rawPosition)
      return -1

    let template = { id: role.id, rating: elo };

    return template
}

function addPuzzleEloCommand(message, puzzleRatingRoles, role, elo, guildRoles) {
    for (let i = 0; i < puzzleRatingRoles.length; i++) {
        if (puzzleRatingRoles[i].id == role.id)
            return undefined
    }

    let highestBotRole = message.guild.members.resolve(client.user).roles.highest
    let guildRole = guildRoles.get(role.id)

    if(highestBotRole.rawPosition < guildRole.rawPosition)
      return -1

    let template = { id: role.id, rating: elo };

    return template
}

function addTitleCommand(message, titleRoles, role, title, guildRoles) {
    for (let i = 0; i < titleRoles.length; i++) {
        if (titleRoles[i].id == role.id)
            return undefined
    }

    let highestBotRole = message.guild.members.resolve(client.user).roles.highest
    let guildRole = guildRoles.get(role.id)

    if(highestBotRole.rawPosition < guildRole.rawPosition)
      return -1
    
    let template = { id: role.id, title: title };

    return template
}


function addModCommand(message, modRoles, role) {
    for (let i = 0; i < modRoles.length; i++) {
        if (modRoles[i].id == role.id)
            return undefined
    }

    return role.id
}

function addCommandToHelp(result, prefix, commandData) {
    return result + prefix + commandData + '\n\n'
}

async function isBotControlAdminByMessage(message, modRoles) {
    if (message.member.permissions.has("MANAGE_GUILD", true))
        return true;


    let roleCache = message.member.roles.cache

    for (let i = 0; i < modRoles.length; i++) {
        if(roleCache.has(modRoles[i]))
            return true;
    }

    return false;
}

async function isBotControlAdminByInteraction(interaction, modRoles) {
    if (interaction.member.permissions.has("MANAGE_GUILD", true))
        return true;


    let roleCache = interaction.member.roles.cache

    for (let i = 0; i < modRoles.length; i++) {
        if(roleCache.has(modRoles[i]))
            return true;
    }

    return false;
}


async function updateSlashCommandPermissionsByGuild(guild) {






	
	return false;








    let roles = await guild.roles.fetch()

 	let modRoles = await settings.get(`guild-bot-mods-${guild.id}`)

    if (modRoles == undefined) {
        modRoles = []
    }

	roles = roles.filter(role => {
		return role.permissions.has('MANAGE_GUILD') || modRoles.indexOf(role.id) != -1
	})

	let commands = await client.application.commands.fetch()

	for (const cmd of commands)
	{
		if(modCommands.indexOf(cmd[1].name) != -1)
		{
			console.log(cmd[1].name, guild.name)
			await cmd[1].edit({ defaultPermission: true }).catch(console.error);
			
			await cmd[1].permissions.set({ guild: guild, permissions: [] }).catch(console.error);
			let permissions = []
			for (const role of roles) {
				
				let cmdPerm = {}
				cmdPerm.id = role[1].id
				cmdPerm.type = 'ROLE'
				cmdPerm.permission = true
				permissions.push(cmdPerm)
			}

			await cmd[1].permissions.add({ guild: guild, permissions: permissions }).catch(console.error);
			
		}
	}
}

function botHasMessagingPermissionsByMessage(message)
{
    let hasViewPermission = message.channel.permissionsFor(message.guild.me)
    .has('VIEW_CHANNEL', false);

    let hasMessageHistoryPermission = message.channel.permissionsFor(message.guild.me)
    .has('READ_MESSAGE_HISTORY')

    let hasSendPermission = message.channel.permissionsFor(message.guild.me)
    .has('SEND_MESSAGES', false);

    if(hasViewPermission && hasMessageHistoryPermission && hasSendPermission)
        return true;

    return false;
}

function botHasBasicPermissionsByGuild(guild)
{

    let hasViewPermission = guild.me.permissions.has('VIEW_CHANNEL')

    let hasMessageHistoryPermission = guild.me.permissions.has('READ_MESSAGE_HISTORY')

    let hasSendPermission = guild.me.permissions.has('SEND_MESSAGES')

    let hasManageRolesPermission = guild.me.permissions.has('MANAGE_ROLES')

    if(hasViewPermission && hasSendPermission && hasManageRolesPermission && hasMessageHistoryPermission)
        return true;

    return false;
}


function botHasPermissionByGuild(guild, permission)
{

    let hasPermission = guild.me.permissions.has(permission)

    if(hasPermission)
        return true;

    return false;
}

function replyAccessDeniedByMessage(message)
{
  let embed = new MessageEmbed()
      .setColor('#0099ff')
      .setDescription(`Access Denied`)
  return message.reply({embeds: [embed], failIfNotExists: false })
}

function replyAccessDeniedByInteraction(interaction)
{
  let embed = new MessageEmbed()
      .setColor('#0099ff')
      .setDescription(`Access Denied`)

  return interaction.editReply({embeds: [embed], failIfNotExists: false, ephemeral: true })
}

function isBotSelfHosted()
{
    return client.guilds.cache.size == 1
}

async function buildCanvasForLichess(discordUsername)
{
  const canvas = Canvas.createCanvas(1302, 729);

  const context = canvas.getContext('2d');

  const background = await Canvas.loadImage('./images/Lichess-Canvas.png');

  // This uses the canvas dimensions to stretch the image onto the entire canvas
  context.drawImage(background, 0, 0, canvas.width, canvas.height);
  
  context.font = '14px arial';
	// Select the style that will be used to fill the text in
	context.fillStyle = '#ffffff';

  context.fillText(discordUsername, 795, 256);
  // Use the helpful Attachment class structure to process the file for you
  let attachment = new MessageAttachment(canvas.toBuffer(), 'profile-image.png');

  return attachment
}

async function buildCanvasForChessCom(discordUsername)
{
  const canvas = Canvas.createCanvas(1071, 817);

  const context = canvas.getContext('2d');

  const background = await Canvas.loadImage('./images/ChessCom-Canvas.png');

  // This uses the canvas dimensions to stretch the image onto the entire canvas
  context.drawImage(background, 0, 0, canvas.width, canvas.height);
  
  context.font = '12px arial';
	// Select the style that will be used to fill the text in
	context.fillStyle = '#ffffff';

  context.fillText(discordUsername, 541, 520);
  // Use the helpful Attachment class structure to process the file for you
  let attachment = new MessageAttachment(canvas.toBuffer(), 'profile-image.png');

  return attachment
}

// The order of declaration matters!!!
async function getCriticalData(interaction)
{
    let manyMuch = await settings.getMany([
      `guild-prefix-${interaction.guild.id}`,
      `guild-elo-roles-${interaction.guild.id}`,
      `guild-puzzle-elo-roles-${interaction.guild.id}`,
      `guild-title-roles-${interaction.guild.id}`,
      `guild-bot-mods-${interaction.guild.id}`,
      `guild-lichess-rating-equation-${interaction.guild.id}`,
      `guild-chesscom-rating-equation-${interaction.guild.id}`,
      `last-command-${interaction.user.id}`,
      `lichess-account-of-${interaction.user.id}`,
      `chesscom-account-of-${interaction.user.id}`,
      `cached-lichess-account-data-of-${interaction.user.id}`,
      `cached-chesscom-account-data-of-${interaction.user.id}`,
	  `guild-verify-role-${interaction.guild.id}`,
	  `guild-titled-role-${interaction.guild.id}`,
	  `guild-time-controls-${interaction.guild.id}`
    ])

    let ratingRoles = manyMuch[`guild-elo-roles-${interaction.guild.id}`]

    if (ratingRoles == undefined)
    {
        ratingRoles = []
    }

    let puzzleRatingRoles = manyMuch[`guild-puzzle-elo-roles-${interaction.guild.id}`]

    if (puzzleRatingRoles == undefined)
    {
        puzzleRatingRoles = []
    }

    let titleRoles = manyMuch[`guild-title-roles-${interaction.guild.id}`]

    if (titleRoles == undefined) {
        titleRoles = []
    }

    let lichessRatingEquation = manyMuch[`guild-lichess-rating-equation-${interaction.guild.id}`]

    if (lichessRatingEquation == undefined) {
        lichessRatingEquation = Constant_lichessDefaultRatingEquation
    }

    let chessComRatingEquation = manyMuch[`guild-chesscom-rating-equation-${interaction.guild.id}`]

    if (chessComRatingEquation == undefined) {
        chessComRatingEquation = Constant_chessComDefaultRatingEquation
    }

    let modRoles = manyMuch[`guild-bot-mods-${interaction.guild.id}`]

    if (modRoles == undefined) {
        modRoles = []
    }

    let timestamp = manyMuch[`last-command-${interaction.user.id}`]


    let lichessAccount = manyMuch[`lichess-account-of-${interaction.user.id}`]
    let chessComAccount = manyMuch[`chesscom-account-of-${interaction.user.id}`]

    let lichessAccountData = manyMuch[`cached-lichess-account-data-of-${interaction.user.id}`]
    let chessComAccountData = manyMuch[`cached-chesscom-account-data-of-${interaction.user.id}`]

	let verifyRole = manyMuch[`guild-verify-role-${interaction.guild.id}`]

	let titledRole = manyMuch[`guild-titled-role-${interaction.guild.id}`]
	
	let timeControlsBitwise = manyMuch[`guild-time-controls-${interaction.guild.id}`]

	if(timeControlsBitwise == undefined)
		timeControlsBitwise = Constant_BlitzBitwise | Constant_RapidBitwise | Constant_ClassicalBitwise | Constant_CorresBitwise

    return [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise]

    
}

async function wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)
{
    let guildRoles

    await interaction.guild.roles.fetch()
    .then(async (roles) => 
        {
            guildRoles = roles
            let highestBotRole = interaction.guild.members.resolve(client.user).roles.highest
            
            if(highestBotRole)
            {
                for (let i = 0; i < ratingRoles.length; i++)
                {
                    let role = roles.get(ratingRoles[i].id)

                    // if role doesn't exist or is above bot.
                    if (role == undefined || highestBotRole.rawPosition < role.rawPosition || role.permissions.any([Permissions.FLAGS.KICK_MEMBERS,
		Permissions.FLAGS.BAN_MEMBERS,
		Permissions.FLAGS.MANAGE_CHANNELS,
		Permissions.FLAGS.MANAGE_GUILD,
		Permissions.FLAGS.MANAGE_MESSAGES,
		Permissions.FLAGS.MUTE_MEMBERS, 
		Permissions.FLAGS.MOVE_MEMBERS, 
		Permissions.FLAGS.MANAGE_NICKNAMES, 
		Permissions.FLAGS.MANAGE_ROLES, 
		Permissions.FLAGS.MANAGE_WEBHOOKS, 
		Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS, 
		Permissions.FLAGS.MANAGE_THREADS]))
                    {
                        ratingRoles.splice(i, 1)
                        i--
                    }
                }

                for (let i = 0; i < puzzleRatingRoles.length; i++)
                {
                    let role = roles.get(puzzleRatingRoles[i].id)

                    // if role doesn't exist or is above bot.
                    if (role == undefined || highestBotRole.rawPosition < role.rawPosition || role.permissions.any([Permissions.FLAGS.KICK_MEMBERS,
		Permissions.FLAGS.BAN_MEMBERS,
		Permissions.FLAGS.MANAGE_CHANNELS,
		Permissions.FLAGS.MANAGE_GUILD,
		Permissions.FLAGS.MANAGE_MESSAGES,
		Permissions.FLAGS.MUTE_MEMBERS, 
		Permissions.FLAGS.MOVE_MEMBERS, 
		Permissions.FLAGS.MANAGE_NICKNAMES, 
		Permissions.FLAGS.MANAGE_ROLES, 
		Permissions.FLAGS.MANAGE_WEBHOOKS, 
		Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS, 
		Permissions.FLAGS.MANAGE_THREADS]))
                    {
                      puzzleRatingRoles.splice(i, 1)
                      i--
                    }
                }

                for (let i = 0; i < titleRoles.length; i++) {
                    let role = roles.get(titleRoles[i].id)


                    // if role doesn't exist or is above bot.
                    if (role == undefined || highestBotRole.rawPosition < role.rawPosition || role.permissions.any([Permissions.FLAGS.KICK_MEMBERS,
		Permissions.FLAGS.BAN_MEMBERS,
		Permissions.FLAGS.MANAGE_CHANNELS,
		Permissions.FLAGS.MANAGE_GUILD,
		Permissions.FLAGS.MANAGE_MESSAGES,
		Permissions.FLAGS.MUTE_MEMBERS, 
		Permissions.FLAGS.MOVE_MEMBERS, 
		Permissions.FLAGS.MANAGE_NICKNAMES, 
		Permissions.FLAGS.MANAGE_ROLES, 
		Permissions.FLAGS.MANAGE_WEBHOOKS, 
		Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS, 
		Permissions.FLAGS.MANAGE_THREADS]))
                    {
                      titleRoles.splice(i, 1)
                      i--
                    }
                }

				let role = roles.get(verifyRole)

				// if role doesn't exist or is above bot.
				if (role == undefined || highestBotRole.rawPosition < role.rawPosition || role.permissions.any([Permissions.FLAGS.KICK_MEMBERS,
		Permissions.FLAGS.BAN_MEMBERS,
		Permissions.FLAGS.MANAGE_CHANNELS,
		Permissions.FLAGS.MANAGE_GUILD,
		Permissions.FLAGS.MANAGE_MESSAGES,
		Permissions.FLAGS.MUTE_MEMBERS, 
		Permissions.FLAGS.MOVE_MEMBERS, 
		Permissions.FLAGS.MANAGE_NICKNAMES, 
		Permissions.FLAGS.MANAGE_ROLES, 
		Permissions.FLAGS.MANAGE_WEBHOOKS, 
		Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS, 
		Permissions.FLAGS.MANAGE_THREADS]))
					
					verifyRole = undefined

				role = roles.get(titledRole)

				// if role doesn't exist or is above bot.
				if (role == undefined || highestBotRole.rawPosition < role.rawPosition || role.permissions.any([Permissions.FLAGS.KICK_MEMBERS,
		Permissions.FLAGS.BAN_MEMBERS,
		Permissions.FLAGS.MANAGE_CHANNELS,
		Permissions.FLAGS.MANAGE_GUILD,
		Permissions.FLAGS.MANAGE_MESSAGES,
		Permissions.FLAGS.MUTE_MEMBERS, 
		Permissions.FLAGS.MOVE_MEMBERS, 
		Permissions.FLAGS.MANAGE_NICKNAMES, 
		Permissions.FLAGS.MANAGE_ROLES, 
		Permissions.FLAGS.MANAGE_WEBHOOKS, 
		Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS, 
		Permissions.FLAGS.MANAGE_THREADS]))
					titledRole = undefined
            }
        })
    .catch(() => null)

    ratingRoles.sort(function (a, b) { return a.rating - b.rating });
    puzzleRatingRoles.sort(function (a, b) { return a.rating - b.rating });
    
    let obj = {}

    obj.ratingRoles = ratingRoles
    obj.puzzleRatingRoles = puzzleRatingRoles
    obj.titleRoles = titleRoles
    obj.guildRoles = guildRoles
	obj.verifyRole = verifyRole
	obj.titledRole = titledRole
    return obj

}

async function getBotIntegrationRoleByInteraction(interaction)
{
  return interaction.guild.roles.botRoleFor(client.user)
}

function getEmojiFromTitle(title)
{
  if(!title)
    return ""

  let finalTitle = "**" + title + "**"


  finalTitle = finalTitle + " "
  return finalTitle 
}

function getEmojiFromPremiumLevel(level)
{
  if(!level)
    return ""

  if(level == 50)
  	return "<:chess_com_diamond:909056645131288606>"

  else if(level == 40)
  	return "<:chess_com_platinum:931232604542353478>"

  else if(level == 30)
  	return "<:chess_com_gold:931232604521373776>"

  return ""
}
function addStarForBestRating(highestRating, ratingToTest, ratingEquation)
{
  if(!isANumber(ratingToTest))
    return ratingToTest

  let result

  try {
    result = Math.round(Parser.evaluate(ratingEquation, { x: ratingToTest }))
  }

  catch { console.log(error)}

  //console.log(result + " " + highestRating)
  if(result != highestRating)
    return ratingToTest

  return ratingToTest + ' <:chess_com_best_move:898211774736785460>'

}

// Apparantly an empty string will make this return true, I don't care for now.
function isANumber(str){
  return !/\D/.test(str);
}

function getUserFullDiscordName(user)
{
  return user.username + "#" + user.discriminator
  
}

var sha256 = function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value>>>amount) | (value<<(32 - amount));
    };
    
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length'
    var i, j; // Used as a counter across the whole file
    var result = ''

    var words = [];
    var asciiBitLength = ascii[lengthProperty]*8;
    
    //* caching results is optional - remove/add slash from front of this line to toggle
    // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
    // (we actually calculate the first 64, but extra values are just ignored)
    var hash = sha256.h = sha256.h || [];
    // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
    var k = sha256.k = sha256.k || [];
    var primeCounter = k[lengthProperty];
    /*/
    var hash = [], k = [];
    var primeCounter = 0;
    //*/

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
            k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
        }
    }
    
    ascii += '\x80' // Append Ƈ' bit (plus zero padding)
    while (ascii[lengthProperty]%64 - 56) ascii += '\x00' // More zero padding
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j>>8) return; // ASCII check: only accept characters in range 0-255
        words[i>>2] |= j << ((3 - i)%4)*8;
    }
    words[words[lengthProperty]] = ((asciiBitLength/maxWord)|0);
    words[words[lengthProperty]] = (asciiBitLength)
    
    // process each chunk
    for (j = 0; j < words[lengthProperty];) {
        var w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
        var oldHash = hash;
        // This is now the undefinedworking hash", often labelled as variables a...g
        // (we have to truncate as well, otherwise extra entries at the end accumulate
        hash = hash.slice(0, 8);
        
        for (i = 0; i < 64; i++) {
            var i2 = i + j;
            // Expand the message into 64 words
            // Used below if 
            var w15 = w[i - 15], w2 = w[i - 2];

            // Iterate
            var a = hash[0], e = hash[4];
            var temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
                + ((e&hash[5])^((~e)&hash[6])) // ch
                + k[i]
                // Expand the message schedule if needed
                + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15>>>3)) // s0
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2>>>10)) // s1
                    )|0
                );
            // This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
            var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
                + ((a&hash[1])^(a&hash[2])^(hash[1]&hash[2])); // maj
            
            hash = [(temp1 + temp2)|0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
            hash[4] = (hash[4] + temp1)|0;
        }
        
        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i])|0;
        }
    }
    
    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            var b = (hash[i]>>(j*8))&255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
};

function getTimeDifference(dateFuture, dateNow) 
{
    let diffInSeconds = Math.abs(dateFuture - dateNow) / 1000;

    // calculate days
    const days = Math.floor(diffInSeconds / 86400);
    diffInSeconds -= days * 86400;

    // calculate hours
    const hours = Math.floor(diffInSeconds / 3600) % 24;
    diffInSeconds -= hours * 3600;

    // calculate minutes
    const minutes = Math.floor(diffInSeconds / 60) % 60;
    diffInSeconds -= minutes * 60;

    const seconds = Math.floor(diffInSeconds)
    let difference = '';
    if (days > 0) {
      difference += (days === 1) ? `${days} Days, ` : `${days} Days, `;
    }

    difference += (hours === 1) ? `${hours} Hour, ` : `${hours} Hours, `;

    difference += (minutes === 1) ? `${minutes} Minute` : `${minutes} Minutes, `; 

    difference += (seconds === 1) ? `${seconds} Second` : `${seconds} Seconds`;

    return difference;
}

const randomstring = require("randomstring");
const crypto = require("crypto");
const base64url = require("base64url");

function generateCodeVerifier()
{
    return randomstring.generate(128);
}

function generateCodeChallenge(code_verifier)
{
    const base64Digest = crypto
    .createHash("sha256")
    .update(code_verifier)
    .digest("base64");

    return base64url.fromBase64(base64Digest);
}

function parseJwt (jwtToken) {
    var base64Url = jwtToken.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

function areBitsContained (high, low) {
	if((high & low) == low)
		return true;

	return false;
};

async function getDebugChannel()
{
	return client.channels.cache.get(channelId);
}

async function logIfBotOwner(interaction, content)
	{
		if(interaction.user.id == "340586932998504449")
		{
			console.log(content)
		}
	}

client.login(token)

module.exports = { setModSlashCommands, generateEmbedForProfileByInteraction, updateProfileDataByInteraction, updateProfileDataByInteractionsArray, deleteMessageAfterTime, getRoleFromMentionString, addEloCommand, addPuzzleEloCommand, addTitleCommand, addModCommand, addCommandToHelp, isBotControlAdminByMessage, isBotControlAdminByInteraction, updateSlashCommandPermissionsByGuild, botHasMessagingPermissionsByMessage, botHasBasicPermissionsByGuild, botHasPermissionByGuild, replyAccessDeniedByMessage, replyAccessDeniedByInteraction, isBotSelfHosted, buildCanvasForLichess, buildCanvasForChessCom, getUserFullDiscordName, getCriticalData, wipeDeletedRolesFromDB, getBotIntegrationRoleByInteraction, getEmojiFromTitle, getEmojiFromPremiumLevel, addStarForBestRating, roleNamesToPurge, settings, client, app, sha256, generateCodeVerifier, generateCodeChallenge, parseJwt, getTimeDifference, bootDate, areBitsContained, Constant_lichessDefaultRatingEquation, Constant_chessComDefaultRatingEquation, Constant_ProvisionalRD, Constant_Lichess, Constant_ChessCom, Constant_BulletBitwise, Constant_BlitzBitwise, Constant_RapidBitwise, Constant_ClassicalBitwise, Constant_CorresBitwise, Constant_DefaultEmbedMessage, Constant_DefaultSelectUniqueRoleMessage, Constant_DefaultSelectManyRolesMessage, titleList, getDebugChannel }