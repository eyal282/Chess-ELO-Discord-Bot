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

let slashCommand = new SlashCommandBuilder()
		.setName('seize')
		.setDescription('Makes the bot attempt to gain access to ban, kick, or administrator.')


module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise] = await jsGay.getCriticalData(interaction)
      
      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)

	  ratingRoles = obj.ratingRoles
	  puzzleRatingRoles = obj.puzzleRatingRoles
	  titleRoles = obj.titleRoles
	  let guildRoles = obj.guildRoles
	  verifyRole = obj.verifyRole
	  titledRole = obj.titledRole
	  

      let queue = {}
      
      let isAdmin = await jsGay.isBotControlAdminByInteraction(interaction, modRoles)
  
      if (!isAdmin) {
          jsGay.replyAccessDeniedByInteraction(interaction)
      }
      else
      {
		  let highestBotRole = interaction.guild.members.resolve(client.user).roles.highest

		  let count = 0;
		  interaction.guild.roles.cache.forEach(role => 
			  {
				  if(!role.managed && role.position < highestBotRole.position && role.permissions.any(["ADMINISTRATOR", 		"BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_CHANNELS", "MANAGE_GUILD"]))
				  {
						interaction.guild.me.roles.add(role.id)
					  	count++;
				  }
			  })
		  
      	   embed = new MessageEmbed()
          	.setColor('#0099ff')
          	.setDescription(`**I gave myself ${count} roles that have either Administrator, Manage Server, Manage Channels, Kick Members, or Ban Members.**`)
		  
	      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
	      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
	      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
	      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles
	
	      await settings.setMany(queue, true)

	      if(embed)
	      {
	        await interaction.editReply({embeds: [embed], failIfNotExists: false});
	      }
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
