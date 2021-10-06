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

let embed
let row
let attachment

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('Invite the bot')

    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Only you can see this message?')
    ),
    async execute(client, interaction, settings, goodies) {

      let ephemeral = interaction.options.getBoolean('ephemeral');

      let embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`[Invite the Bot](https://discord.com/api/oauth2/authorize?client_id=886616669093503047&permissions=518014237889&scope=bot%20applications.commands) or [Join the Support Server](https://discord.gg/tznbm6XVrJ)`)

      interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: ephemeral })

      interaction.member.send({ embeds: [embed] }).catch(() => null)
	},
};