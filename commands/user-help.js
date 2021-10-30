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
		.setName('help')
		.setDescription('Help command')

    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Only you can see this message?')
    ),
    async execute(client, interaction, settings, goodies) {
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole] = await jsGay.getCriticalData(interaction)
      
      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole)
	  
	  ratingRoles = obj.ratingRoles
	  puzzleRatingRoles = obj.puzzleRatingRoles
	  titleRoles = obj.titleRoles
	  let guildRoles = obj.guildRoles
	  verifyRole = obj.verifyRole
      
      let ephemeral = interaction.options.getBoolean('ephemeral');

      let result = ""
      let prefix = '/'

      result = jsGay.addCommandToHelp(result, prefix, `embed ---> Sets up an embed for linking accounts. Best used by moderators`)
      result = jsGay.addCommandToHelp(result, prefix, `lichess [username] ---> Tries to link your Lichess Account. Leave user empty to unlink`)
      result = jsGay.addCommandToHelp(result, prefix, `chess [username] ---> Tries to link your Chess.com Account. Leave user empty to unlink`)
      result = jsGay.addCommandToHelp(result, prefix, `profile [@user] ---> Shows the profile of a target user. Leave user empty to see your profile`)
      result = jsGay.addCommandToHelp(result, prefix, `privacy ---> Privacy policy`)
      result = jsGay.addCommandToHelp(result, prefix, `invite ---> Invite Link`)
      result = jsGay.addCommandToHelp(result, prefix, `ping ---> Lag of the bot`)
      result = jsGay.addCommandToHelp(result, prefix, `addelo [elo] [@role] ---> Adds a new role milestone`)
      result = jsGay.addCommandToHelp(result, prefix, `addpuzzleelo [elo] [@role] ---> Adds a new puzzle role milestone`)
      result = jsGay.addCommandToHelp(result, prefix, `addtitle [title] [@role] ---> Adds a new role by title. Example: ${prefix}addtitle GM @Grandmaster IM @InterMaster NM @NatMaster`)
      result = jsGay.addCommandToHelp(result, prefix, `getelo ---> Prints all role milestones`)
      result = jsGay.addCommandToHelp(result, prefix, `getpuzzleelo ---> Prints all puzzle role milestones`)
      result = jsGay.addCommandToHelp(result, prefix, `gettitle ---> Prints all titles that gain a role`)
      result = jsGay.addCommandToHelp(result, prefix, `getmod ---> Prints all the bot's moderators`)
      result = jsGay.addCommandToHelp(result, prefix, `resetelo ---> Deletes all role milestones. This command will send you a copy of what got reset`)
      result = jsGay.addCommandToHelp(result, prefix, `resetpuzzleelo ---> Deletes all puzzle role milestones. This command will send you a copy of what got reset`)
      result = jsGay.addCommandToHelp(result, prefix, `resettitle ---> Deletes all title role milestones. This command will send you a copy of what got reset`)
      result = jsGay.addCommandToHelp(result, prefix, `setlichessequation ---> Sets the equation for inflating or deflating lichess rating, x = User's current rating. Default: '${jsGay.Constant_lichessDefaultRatingEquation}'. Current: '${lichessRatingEquation}'`)
      result = jsGay.addCommandToHelp(result, prefix, `setchessequation [equation] ---> Sets the equation for inflating or deflating chess.com rating, x = User's current rating. Default: '${jsGay.Constant_chessComDefaultRatingEquation}'. Current: '${chessComRatingEquation}'`)
      result = jsGay.addCommandToHelp(result, prefix, `addmod [@role] ---> Adds a role as a Moderator`)
      result = jsGay.addCommandToHelp(result, prefix, `resetmod ---> Resets all Moderators.`)

      if(jsGay.isBotSelfHosted())
      {
          result = jsGay.addCommandToHelp(result, prefix, `forcelichess [username] [@user]  ---> Links a user to Lichess.org, ignoring linking condition`)
          result = jsGay.addCommandToHelp(result, prefix, `forcechess [username] [@user] ---> Links a user to Chess.org, ignoring linking condition`)
      }

      result = result + "Note: -1 ELO stands for either unrated or provisonary elo (Shows (?) on Lichess))\n"
      result = result + "Note: Provisionary rating in Chess.com is artifically calculated by Lichess standards.\n"
      result = result + "Note: Due to Chess.com limits, only puzzle rating of Lichess is calculated at all.\n"
      result = result + "Note: Bot's access to a role is calculated from his special integration role, and not his highest role.\n"
      result = result + "Title List: `GM` `WGM` `IM` `WIM` `FM` `WFM` `NM` `CM` `WCM` `WNM` `LM` `BOT`\n"
      
      embed = new MessageEmbed()
              .setColor('#0099ff')
              .setDescription(result)
              
      interaction.editReply({embeds: [embed], failIfNotExists: false, ephemeral: ephemeral})
	},
};