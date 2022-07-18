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

      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`**[Invite the Bot](https://top.gg/bot/886616669093503047)** or **[Join the Support Server](https://discord.gg/tznbm6XVrJ)**\n\nFeel free to vote within the invite link!`)

      interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: ephemeral })

      interaction.member.send({ embeds: [embed] }).catch(() => null)
	},
};