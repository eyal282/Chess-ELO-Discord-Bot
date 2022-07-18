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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Show Lichess / Chess.com profile of user')

    .addUserOption((option) =>
      option.setName('user').setDescription('User to check. Leave empty for your profile')
    )
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Only you can see this message?')
    ),
    async execute(client, interaction, settings, goodies) {
      
      let embed = undefined
      let row = undefined
      let attachment = undefined
      
      let trueUser = interaction.user
      let trueMember = interaction.member

      let fakeUser = interaction.options.getUser('user');
      let fakeMember = interaction.options.getMember('user');
      
      if(!fakeUser)
      {
          fakeUser = trueUser
      }

      if(!fakeMember)
      {
          fakeMember = trueMember
      }

      // We do a little trolling
      interaction.user = fakeUser
      interaction.member = fakeMember

	  embed = await jsGay.generateEmbedForProfileByInteraction(interaction)

	  interaction.user = trueUser
      interaction.member = trueMember
	  
      interaction.editReply({ embeds: [embed], failIfNotExists: false})
    }
};