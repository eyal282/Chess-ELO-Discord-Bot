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
		.setName('ping')
		.setDescription('Lag of the Bot'
    ),
    async execute(client, interaction, settings, goodies) {
      //let ephemeral = interaction.options.getBoolean('ephemeral');

      let embed = undefined
      let row = undefined
      let attachment = undefined

      embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`🏓Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms\nBot is running for ${jsGay.getTimeDifference(jsGay.bootDate, new Date())}`)
        interaction.editReply({embeds: [embed], ephemeral: true})
	},
};