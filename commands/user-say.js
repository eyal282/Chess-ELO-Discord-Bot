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
		.setName('say')
		.setDescription('Forces the bot to repeat your message.')
    
      .addStringOption((option) =>
      option.setName('message').setDescription('The message I will say. Use `///n` for new line').setRequired(true)
      ),
    async execute(client, interaction, settings, goodies) {
      //let ephemeral = interaction.options.getBoolean('ephemeral');

      let embed = undefined

      let message = interaction.options.getString('message');

	  message = message.replaceAll("///n", '\n');
		
      let bError = false
      interaction.channel.send({content: message}).catch(() => {
        
        bError = true

        embed = new EmbedBuilder({description: `I cannot access this channel!`})
          .setColor(0x0099ff)

        interaction.editReply({embeds: [embed]}).then(msg =>
        {
            jsGay.deleteMessageAfterTime(msg, 4000)
        })
      })

      if(!bError)
      {
          embed = new EmbedBuilder({description: `Command executed successfully!`})
            .setColor(0x0099ff)

          interaction.editReply({embeds: [embed]}).then(msg =>
          {
              jsGay.deleteMessageAfterTime(msg, 4000)
          })
      }
	},
};