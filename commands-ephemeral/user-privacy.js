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
		.setName('privacy')
		.setDescription('Privacy policy'
    ),
    async execute(client, interaction, settings, goodies) {
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`The privacy policy may be changed at any time without any warning prior or after the change.\nThe team of Chess ELO Role does not protect the privacy of the data you give us at all, and has intentions to allow developers to download the entire database of the data we collected so far to do whatever they want with it ( hopefully link your account in their bot )\nIf you really need your privacy to be protected by a tiny bot, maybe this bot isn't for you\n Data collected that cannot be deleted:\n1. Your Discord account's unique ID, linked to a timestamp of the last time you contacted any external API that I do not own (for now, the API of Chess.com and Lichess.org)\n2. Your Discord Account's unique ID, linked to default data assigned to them by the bot for optimization purposes.\n3. Any server's Guild ID that ever added the bot, linked to default data assigned to them by the bot for optimization purposes.\nData collected that can be deleted:\n1. Your Discord account's unique ID, linked to your account on Lichess.org and Chess.com. This data is saved after you successfully link your account to any of them. The only way to delete this data is unlinking the accounts, which is done by executing \`/embed\` and using the corresponding buttons.\n2. Any data a server running the bot manually input with any command that contains the word "add" or "set", and can be manually deleted using either the available "reset" commands, or the related "set" command without any arguments.\nBelow is the source code of the bot that contains contact information, demonstrates why and how data is collected, along with who is given any of your data, or your server's data:\nhttps://github.com/eyal282/Chess-ELO-Discord-Bot`)
        interaction.editReply({embeds: [embed], failIfNotExists: false, ephemeral: true})

        interaction.member.send({embeds: [embed]}).catch(() => null)
	},
};