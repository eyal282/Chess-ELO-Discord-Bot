

const { SlashCommandBuilder } = require('@discordjs/builders');


const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');

const jsGay = require('../util.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('selectrole')
		.setDescription('Creates a select menu to pick up roles, known as reaction roles')

		.addStringOption((option) =>
      	option.setName('roles').setDescription('Mention as many roles as you want to give users').setRequired(true))

		.addIntegerOption((option) =>
      	option.setName('min_roles').setDescription('Minimum amount of roles that you can pick'))

		.addIntegerOption((option) =>
      	option.setName('max_roles').setDescription('Maximum amount of roles that you can pick'))


		.addStringOption((option) =>
      	option.setName('message').setDescription('Optional message to use. Use `///n` for new line')),
    async execute(client, interaction, settings, goodies)
    {
      
      let embed = undefined
      let row = undefined
      let row2 = undefined
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

	  let message = interaction.options.getString('message');

	  let minRoles = interaction.options.getInteger('min_roles');
	  let maxRoles = interaction.options.getInteger('max_roles');

	  if(minRoles == 1 && maxRoles == 1 || minRoles > maxRoles)
	  {
		minRoles = null;
		maxRoles = null;
	  }
	  let args = interaction.options.getString('roles').replace(/`/g, "").trim().split(/ +/g)
	
	  if(!message)
	  {
		if(minRoles == null && maxRoles == null)
	  		message = jsGay.Constant_DefaultSelectUniqueRoleMessage

		else
			message = jsGay.Constant_DefaultSelectManyRolesMessage
	  }
	
	  message = message.replaceAll("///n", '\n');
	  message = message.replaceAll("{MAX_ROLES}", maxRoles);
		  
      embed = new MessageEmbed()
        .setColor('#0099ff')
        .setDescription(message)

	  let selectMenu = new MessageSelectMenu()
		  	.setCustomId('select-role')
			.setPlaceholder('Nothing selected')
			.setMinValues(minRoles)
			.setMaxValues(maxRoles)

	  let bAnyRoles = false;

	  for(let i=0;i < args.length;i++)
	  {
		let role = jsGay.getRoleFromMentionString(interaction.guild, args[i])

		if(role)
		{
			bAnyRoles = true

			selectMenu.addOptions([
				{
					label: role.name,
					value: role.id,
				}])
		}
	  }
	  
	  if(!bAnyRoles)
	  {
		embed = new MessageEmbed()
	        .setColor('#0099ff')
        	.setDescription("Could not find any valid roles!")

		return interaction.editReply({ embeds: [embed], failIfNotExists: false})
	  }
	  row = new MessageActionRow()
	  	.addComponents(selectMenu)

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)

      interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false})
    }
};
