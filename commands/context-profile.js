const { ApplicationCommandType } = require("discord-api-types/v9");
const { ContextMenuCommandBuilder } = require('@discordjs/builders');

const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');

const jsGay = require('../util.js')

let contextMenu = new ContextMenuCommandBuilder()
		.setType(ApplicationCommandType.User)
		.setName('Profile')
		.setDefaultPermission(true)


module.exports =
{
	data: contextMenu,
  async execute(client, interaction, settings, goodies)
  {  
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
