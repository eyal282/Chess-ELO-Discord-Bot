const { SlashCommandBuilder } = require('discord.js');


const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { EmbedBuilder, MessageAttachment } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
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
      embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setDescription(`**This command can only ever be executed by the server owner and <@340586932998504449>**`)

      interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: false })

		  return;
	  }
      
    
		let timestamp = await settings.get(`last-refreshed-${interaction.user.id}`)

		if(timestamp != undefined && timestamp + 600 * 1000 > Date.now() && interaction.user.id != "340586932998504449")
		{
      		embed = new EmbedBuilder()
          		.setColor(0x0099ff)
          		.setDescription(`**This command has a 10 minute cooldown. It can be re-used in ${((timestamp + 600 * 1000) - Date.now()) / 1000} seconds.**`)

			    interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: false })

			return;

			
		}

		await settings.set(`last-refreshed-${interaction.user.id}`, Date.now())

		const members = await client.guilds.cache.get(interaction.guild.id).members.fetch();
	
		let interactions = [];

		let percents = 0

		let memberCount = members.size;
		
		await Promise.all(members.map(async (member) => {
			let fakeInteraction = {}
	
			fakeInteraction.guild = interaction.guild
			fakeInteraction.user = member.user
			fakeInteraction.member = member

			// This is unique to updateProfileDataByInteractionsArray, is the amount of members remaining
			fakeInteraction.remaining = memberCount

			// This is unique to updateProfileDataByInteractionsArray, is the original interaction to send followUps

			fakeInteraction.original = interaction
			interactions.push(fakeInteraction)
		}))

		jsGay.updateProfileDataByInteractionsArray(interactions, true)

		let interval = setInterval(() =>
			{
				let remaining = interactions[0].remaining

				if(remaining <= 0)
				{
					embed = new EmbedBuilder()
						.setColor(0x0099ff)
						.setDescription(`**Sucessfully refreshed everybody's roles.**`)
					
					interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: false })

					clearInterval(interval)
				}
				else
				{
					embed = new EmbedBuilder()
						.setColor(0x0099ff)
						.setDescription(`**Refreshing roles...\nProgress: ${(((memberCount - remaining) / memberCount) * 100.0).toFixed(2)}%**`)
					
					interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: false })
				}
			}, 3000)

    }
};