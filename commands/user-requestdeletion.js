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

let slashCommand = new SlashCommandBuilder()
		.setName('requestdeletionofmydata')
		.setDescription('Deletes every single piece of non rate limit data my bot collected about you')
		
		.addBooleanOption((option) =>
      option.setName('sure1').setDescription('Are you sure you want to delete every data my bot collected?').setRequired(true))

		.addBooleanOption((option) =>
      option.setName('sure2').setDescription('Are you sure you want to delete every data my bot collected?').setRequired(true))

		.addBooleanOption((option) =>
      option.setName('sure3').setDescription('Are you sure you want to delete every data my bot collected?').setRequired(true))

		.addBooleanOption((option) =>
      option.setName('sure4').setDescription('Are you sure you want to delete every data my bot collected?').setRequired(true))

		.addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Should only you see this message?').setRequired(true))

module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
	  if(!interaction.options.getBoolean('sure1') || !interaction.options.getBoolean('sure2') || !interaction.options.getBoolean('sure3') || !interaction.options.getBoolean('sure4'))
	  	return;

      let embed = undefined

	  let ephemeral = interaction.options.getBoolean('ephemeral');
	  
	  await settings.delete([`lichess-account-of-${interaction.user.id}`,
      `chesscom-account-of-${interaction.user.id}`,
      `cached-lichess-account-data-of-${interaction.user.id}`,
      `cached-chesscom-account-data-of-${interaction.user.id}`]);
	  embed = new EmbedBuilder()
			.setColor(0x0099ff)
			.setDescription(`Successfully deleted every data the bot 				has on you.`)

      if(embed)
      {
        await interaction.editReply({embeds: [embed], failIfNotExists: false, ephemeral: ephemeral});
      }
  }
}

function splitBy(text, delimiter) {
    var delimiterPATTERN = "(" + delimiter + ")",
        delimiterRE = new RegExp(delimiterPATTERN, "g");

    return text.split(delimiterRE).reduce(function (chunks, item) {
        if (item.match(delimiterRE)) {
            chunks[chunks.length - 1] += item;
        } else {
            chunks.push(item.trim());
        }
        return chunks;
    }, []);
}
