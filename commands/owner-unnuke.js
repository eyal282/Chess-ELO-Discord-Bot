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
		.setName('unnuke')
		.setDescription('Personal command of the developer. Unbans every member banned by target')

    .addUserOption((option) =>
      option.setName('user').setDescription('User that nuked the server. Will not ban him').setRequired(true)),
	
    async execute(client, interaction, settings, goodies) {

	  let embed = undefined
      let row = undefined
      let attachment = undefined
		
	  let owner = await interaction.guild.fetchOwner()

	  if(owner.user.id != interaction.user.id)
	  {
      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`**This command can only ever be executed by the server owner.**`)

      interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: false })

		  return;
	  }
      
    
	 await interaction.guild.bans.fetch().then(bans => {
    bans.forEach(ban => 
		 {
			 console.log(ban.client.user.id);
			 console.log(interaction.options.getUser('user').id);
			 if(ban.client.user.id == interaction.options.getUser('user').id)
			 {
				 interaction.guild.bans.remove(ban.user.id);
			 }
		 })})
		
      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`**Success.**`)

      interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: false })
    }
};