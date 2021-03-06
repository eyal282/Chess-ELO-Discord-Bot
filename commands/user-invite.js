const { SlashCommandBuilder } = require('discord.js');


const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { EmbedBuilder, MessageAttachment } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');

const jsGay = require('../util.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('Invite the bot')

    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Only you can see this message?')
    ),
    async execute(client, interaction, settings, goodies) {
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      let ephemeral = interaction.options.getBoolean('ephemeral');

      embed = new EmbedBuilder({description: `**[Invite the Bot](https://top.gg/bot/886616669093503047)** or **[Join the Support Server](https://discord.gg/tznbm6XVrJ)**\n\nFeel free to vote within the invite link!`})
          .setColor(0x0099ff)

      interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: ephemeral })

      interaction.member.send({ embeds: [embed] }).catch(() => null)
	},
};