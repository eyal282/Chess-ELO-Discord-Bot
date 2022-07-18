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
		.setName('donate')
		.setDescription('Donate Link')

    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Only you can see this message?')
    ),
    async execute(client, interaction, settings, goodies) {
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`The bot is using a free hosting, but I can improve it at the price of $74 for 12 months or $7 per month\n\nThe bot will be incapable of shutting down if I upgrade, and it will be faster.\n\nIf you send over $7, specify whether you want to save for 12 months, or activate 1 month immediately.\n\nhttps://paypal.me/ChessEloRole`)
        interaction.editReply({embeds: [embed], failIfNotExists: false, ephemeral: true})
	},
};