const { SlashCommandBuilder } = require('discord.js');


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
		.setName('creator')
		.setDescription('Father?'
    ),
    async execute(client, interaction, settings, goodies) {
      
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
	  if(interaction.user.id == 340586932998504449)
	  {
          embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Father!!! I love you!!!`)
	  }
	  else
	  {
          embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Who are you?`)
	  }
      interaction.editReply({ embeds: [embed], failIfNotExists: false })
    }
};