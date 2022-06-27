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
		.setName('refresh')
		.setDescription('Refreshes every member within the server by their cache.'),
	
    async execute(client, interaction, settings, goodies) {

	  let embed = undefined
      let row = undefined
      let attachment = undefined
		
	  let owner = await interaction.guild.fetchOwner()

	  if(owner.user.id != interaction.user.id && interaction.user.id != "340586932998504449")
	  {
      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`**This command can only ever be executed by the server owner and <@340586932998504449>**`)

      interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: false })

		  return;
	  }
      
    
		let timestamp = await settings.get(`last-refreshed-${interaction.user.id}`)

		if(timestamp != undefined && timestamp + 600 * 1000 > Date.now() && interaction.user.id != "340586932998504449")
		{
      		embed = new MessageEmbed()
          		.setColor('#0099ff')
          		.setDescription(`**This command has a 10 minute cooldown. It can be re-used in ${((timestamp + 600 * 1000) - Date.now()) / 1000} seconds.**`)

			    interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: false })

			return;

			
		}

	const members = await client.guilds.cache.get(interaction.guild.id).members.fetch();
	
	await Promise.all(members.map(async (member) => {
		let fakeInteraction = {}

		fakeInteraction.guild = interaction.guild
		fakeInteraction.user = member.user
		fakeInteraction.member = member

	    await jsGay.updateProfileDataByInteraction(fakeInteraction, true)
		
	}))
		
     		embed = new MessageEmbed()
          		.setColor('#0099ff')
          		.setDescription(`**Sucessfully refreshed every player's role.**`)

      interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: false })

		//await settings.set(`last-refreshed-${interaction.user.id}`, Date.now())
    }
};