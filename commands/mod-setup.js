// To do: progress bar.

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

let slashCommand = new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Quick setup of ELO roles. This WILL create more than 50 roles/purge to somewhat undo this command.')

module.exports =
{
	data: slashCommand,
  async execute(client, interaction, settings, goodies)
  {  
      let embed = undefined
      let row = undefined
      let attachment = undefined

      if(!jsGay.botHasPermissionByGuild(interaction.guild, "MANAGE_ROLES"))
      {
        embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`The bot is missing "Manage Roles" permission.`)

          await interaction.editReply({embeds: [embed], failIfNotExists: false})

          return
      }  

      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise] = await jsGay.getCriticalData(interaction)

      let ephemeral = false

      let botRole = await jsGay.getBotIntegrationRoleByInteraction(interaction)

      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)
	  
	  ratingRoles = obj.ratingRoles
	  puzzleRatingRoles = obj.puzzleRatingRoles
	  titleRoles = obj.titleRoles
	  let guildRoles = obj.guildRoles
	  verifyRole = obj.verifyRole
	  titledRole = obj.titledRole

      let queue = {}
      
      let isAdmin = await jsGay.isBotControlAdminByInteraction(interaction, modRoles)
    
      if (!isAdmin) {
          jsGay.replyAccessDeniedByInteraction(interaction)
      }
      else if (botRole.rawPosition != 1 || ratingRoles.length > 0 || puzzleRatingRoles.length > 0 || titleRoles.length > 0) {
              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Bot integration role must be the lowest position in the guild to execute this command\nAlso, no roles can be assigned to the bot besides moderator roles.\nNote: Sometimes discord forgets the bot's position, so play with it until you get it to the lowest role position and this should work.\nNote: \`/getelo /getpuzzleelo /gettitle\` are the commands to check if there are any roles left.`)

              ephemeral = true
      }
      else
      {
        let maxElo = 3000
        let minElo = 0
        let increment = 200

        // Title Setup!!!
        
        
        for(let i=0;i < jsGay.titleList.length;i++)
        {
            let title = jsGay.titleList[i]
            
            await interaction.guild.roles.create({
              name: title.roleName,
              reason: 'Setup command',
              hoist: true,
			  permissions: ""
            })
            .then(role => 
            {
                guildRoles.set(role.id, role)

                let result = jsGay.addTitleCommand(interaction, titleRoles, role, title.titleName, guildRoles)

                titleRoles.push(result)
            })
            .catch(console.error);
        }

        // Elo setup!!!
        await interaction.guild.roles.create({
          name: `${maxElo}+`,
          reason: 'Setup command',
          hoist: true, 			 
		  permissions: ""
        })
        .then(role => 
        {
            guildRoles.set(role.id, role)

            let result = jsGay.addEloCommand(interaction, ratingRoles, role, maxElo, guildRoles)

            ratingRoles.push(result)
        })
        .catch(console.error);

        
        for(let i=maxElo;i > minElo;i -= increment)
        {
            let nextElo = i - increment
            await interaction.guild.roles.create({
              name: `${nextElo}~${i}`,
              reason: 'Setup command',
              hoist: true, 
			  permissions: ""
            })
            .then(role => 
            {
                guildRoles.set(role.id, role)

                let result = jsGay.addEloCommand(interaction, ratingRoles, role, nextElo, guildRoles)

                ratingRoles.push(result)
            })
            .catch(console.error);
        }

        await interaction.guild.roles.create({
          name: `Unrated`,
          reason: 'Setup command',
          hoist: true,
		  permissions: ""
        })
        .then(role => 
        {
            guildRoles.set(role.id, role)

            let result = jsGay.addEloCommand(interaction, ratingRoles, role, -1, guildRoles)

            ratingRoles.push(result)
        })
        .catch(console.error);

        
        // Puzzles Setup!!!

        await interaction.guild.roles.create({
          name: `Puzzles ${maxElo}+`,
          reason: 'Setup command',
          hoist: true,
		  permissions: ""
        })
        .then(role => 
        {
            guildRoles.set(role.id, role)

            let result = jsGay.addPuzzleEloCommand(interaction, puzzleRatingRoles, role, maxElo, guildRoles)

            puzzleRatingRoles.push(result)
        })
        .catch(console.error);

        
        for(let i=maxElo;i > minElo;i -= increment)
        {
            let nextElo = i - increment
            await interaction.guild.roles.create({
              name: `Puzzles ${nextElo}~${i}`,
              reason: 'Setup command',
              hoist: true,
			  permissions: ""
            })
            .then(role => 
            {
                guildRoles.set(role.id, role)

                let result = jsGay.addPuzzleEloCommand(interaction, puzzleRatingRoles, role, nextElo, guildRoles)

                puzzleRatingRoles.push(result)
            })
            .catch(console.error);
        }

        await interaction.guild.roles.create({
          name: `Puzzles Unrated`,
          reason: 'Setup command',
          hoist: true,
		  permissions: ""
        })
        .then(role => 
        {
            guildRoles.set(role.id, role)

            let result = jsGay.addPuzzleEloCommand(interaction, puzzleRatingRoles, role, -1, guildRoles)

            puzzleRatingRoles.push(result)
        })
        .catch(console.error);
    
        embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`Successfully initiated quick setup.\n Use \`/getelo, /getpuzzleelo, /gettitle\` to see how it got set up.\nWarning: The bot cannot create more than 250 roles per 24 hours, don't abuse this or you will be forced to wait 24 hours.`)
      }

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)

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
