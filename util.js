const token = process.env["SECRET_BOT_TOKEN"]
const mongoPassword = process.env["SECRET_MONGO_PASSWORD"]

let Constant_lichessDefaultRatingEquation = "x"
let Constant_chessComDefaultRatingEquation = "0.75 * x + 650"
let Constant_ProvisionalRD = 110

const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;

const Josh = require("@joshdb/core");
const provider = require("@joshdb/mongo");
const fetch = require('node-fetch');

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES']} );

const settings = new Josh({
  name: 'Chess ELO Role',
  provider,
  providerOptions: {
    collection: `settings`,
    url: `mongodb+srv://eyal282:${mongoPassword}@chess-elo-role.dpqoj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
  }
});

async function updateProfileDataByMessage(message, useCacheOnly)
{
    if(!message.guild.me.permissions.has('MANAGE_ROLES'))
        return;

     let manyMuch = await settings.getMany([
      `guild-prefix-${message.guild.id}`,
      `guild-elo-roles-${message.guild.id}`,
      `guild-puzzle-elo-roles-${message.guild.id}`,
      `guild-title-roles-${message.guild.id}`,
      `guild-bot-mods-${message.guild.id}`,
      `guild-lichess-rating-equation-${message.guild.id}`,
      `guild-chesscom-rating-equation-${message.guild.id}`,
      `last-command-${message.author.id}`,
      `lichess-account-of-${message.author.id}`,
      `chesscom-account-of-${message.author.id}`,
      `cached-lichess-account-data-of-${message.author.id}`,
      `cached-chesscom-account-data-of-${message.author.id}`,
    ])
    
    let queue = []

    let ratingRoles = manyMuch[`guild-elo-roles-${message.guild.id}`]

    if (ratingRoles == undefined)
    {
        ratingRoles = []
    }

    let puzzleRatingRoles = manyMuch[`guild-puzzle-elo-roles-${message.guild.id}`]

    if (puzzleRatingRoles == undefined)
    {
        puzzleRatingRoles = []
    }

    let titleRoles = manyMuch[`guild-title-roles-${message.guild.id}`]

    if (titleRoles == undefined) {
        titleRoles = []
    }

    let lichessRatingEquation = manyMuch[`guild-lichess-rating-equation-${message.guild.id}`]

    if (lichessRatingEquation == undefined) {
        lichessRatingEquation = Constant_lichessDefaultRatingEquation
    }

    let chessComRatingEquation = manyMuch[`guild-chesscom-rating-equation-${message.guild.id}`]

    if (chessComRatingEquation == undefined) {
        chessComRatingEquation = Constant_chessComDefaultRatingEquation
    }

    let modRoles = manyMuch[`guild-bot-mods-${message.guild.id}`]

    if (modRoles == undefined) {
        modRoles = []
    }

    await message.guild.roles.fetch()
    .then(roles => 
    {
      let highestBotRole = message.guild.members.resolve(client.user).roles.highest

      if(highestBotRole)
      {
        for (let i = 0; i < ratingRoles.length; i++)
        {
          let role = roles.get(ratingRoles[i].id)

          // if role doesn't exist or is above bot.
          if (!role || highestBotRole.rawPosition < role.rawPosition)
          ratingRoles.splice(i, 1)
        }

        for (let i = 0; i < puzzleRatingRoles.length; i++)
        {
          let role = roles.get(puzzleRatingRoles[i].id)

          // if role doesn't exist or is above bot.
          if (!role || highestBotRole.rawPosition < role.rawPosition)
          puzzleRatingRoles.splice(i, 1)
        }

        for (let i = 0; i < titleRoles.length; i++) {
          let role = roles.get(titleRoles[i].id)

          // if role doesn't exist or is above bot.
          if (!role || highestBotRole.rawPosition < role.rawPosition)
          titleRoles.splice(i, 1)
        }
      }
    })
    .catch(() => null)

      
    ratingRoles.sort(function (a, b) { return a.rating - b.rating });
    puzzleRatingRoles.sort(function (a, b) { return a.rating - b.rating });

    try {
      Parser.evaluate(lichessRatingEquation, { x: 1000 })
      Parser.evaluate(lichessRatingEquation, { x: 0 })
      Parser.evaluate(lichessRatingEquation, { x: -1 })

      Parser.evaluate(chessComRatingEquation, { x: 1000 })
      Parser.evaluate(chessComRatingEquation, { x: 0 })
      Parser.evaluate(chessComRatingEquation, { x: -1 })
    }
    catch {}

    queue[`last-updated-${message.author.id}`] = Date.now()

    let lichessAccount = manyMuch[`lichess-account-of-${message.author.id}`]
    let chessComAccount = manyMuch[`chesscom-account-of-${message.author.id}`]
      
    let result

    if (lichessAccount == undefined) {
      result = null;
    }
    else
    {
      if(useCacheOnly) 
      {
        result = manyMuch[`cached-lichess-account-data-of-${message.author.id}`]
      }
      else
      {
        result = await fetch(`https://lichess.org/api/user/${lichessAccount}`).then(response => {
          if (response.status == 404) { // Not Found
            return null
          }
          else if (response.status == 200) { // Status OK
            return response.json()
          }
          else if(response.status == 429) { // Rate Limit
            return null
          }
        })
      }
    }
    
    let highestRating = -1
    let highestPuzzleRating = -1
    let lichessHighestRating = -1
    let lichessPuzzleRating = -1
    let lichessTitle = ""
    let chessTitle = ""
    
    if(result != null)
    {
      queue[`cached-lichess-account-data-of-${message.author.id}`] = result

      let corresRating = -1
      let blitzRating = -1
      let rapidRating = -1
      let classicalRating = -1

      let puzzleRating = -1

      if (result.perfs.correspondence && result.perfs.correspondence.prov == undefined) corresRating = result.perfs.correspondence.rating
      if (result.perfs.blitz && result.perfs.blitz.prov == undefined) blitzRating = result.perfs.blitz.rating
      if (result.perfs.rapid && result.perfs.rapid.prov == undefined) rapidRating = result.perfs.rapid.rating
      if (result.perfs.classical && result.perfs.classical.prov == undefined) classicalRating = result.perfs.classical.rating

      if (result.perfs.puzzle && result.perfs.puzzle.prov == undefined) puzzleRating = result.perfs.puzzle.rating

      lichessHighestRating = Math.max(corresRating, blitzRating, rapidRating, classicalRating)
      lichessPuzzleRating = puzzleRating

      let value = lichessHighestRating

      try {
        value = Math.round(Parser.evaluate(lichessRatingEquation, { x: lichessHighestRating }))
      }

      catch { console.log(error)}

      lichessHighestRating = value
      highestRating = lichessHighestRating
      highestPuzzleRating = lichessPuzzleRating

      if (result.title) {
        lichessTitle = result.title
      }
    }
    
    if (chessComAccount == undefined) {
      result = null;
    }
    else
    {
      if(useCacheOnly) 
      {
        result = manyMuch[`cached-chesscom-account-data-of-${message.author.id}`]
      }
      else
      {
        result = await fetch(`https://api.chess.com/pub/player/${chessComAccount}/stats`).then(response => {
          if (response.status == 404) { // Not Found
            return null
          }
          else if (response.status == 200) { // Status OK
            return response.json()
          }
          else if(response.status == 429) { // Rate Limit
            return null
          }
        })
      }
    }
    if(result != null)
    {
      queue[`cached-chesscom-account-data-of-${message.author.id}`] = result
      let corresRating = -1
      let blitzRating = -1
      let rapidRating = -1

      let puzzleRating = -1

      if (result.chess_daily && result.chess_daily.last.rd < Constant_ProvisionalRD) corresRating = result.chess_daily.last.rating
      if (result.chess_blitz && result.chess_daily.last.rd < Constant_ProvisionalRD) blitzRating = result.chess_blitz.last.rating
      if (result.chess_rapid && result.chess_daily.last.rd < Constant_ProvisionalRD) rapidRating = result.chess_rapid.last.rating

      if (result.tactics) puzzleRating = result.tactics.highest.rating

      let chessComHighestRating = Math.max(corresRating, blitzRating, rapidRating)

      let value = chessComHighestRating

      try {
        value = Math.round(Parser.evaluate(chessComRatingEquation, { x: chessComHighestRating }))
      }
      catch {}
      chessComHighestRating = value
      highestRating = Math.max(lichessHighestRating, chessComHighestRating)

      if (result.title)
        chessTitle = result.title
    }

    let highestRatingRole = null;
    let highestPuzzleRatingRole = null;
    let highestTitleRole = null;

    let fullRolesCache = message.member.roles.cache

    if (fullRolesCache)
    {
      let fullRolesArray = Array.from(fullRolesCache.keys());

      for (let i = 0; i < ratingRoles.length; i++)
      {
        if (highestRating >= ratingRoles[i].rating)
          highestRatingRole = ratingRoles[i].id;

        let index = fullRolesArray.indexOf(ratingRoles[i].id)

        if(index != -1)
          fullRolesArray.splice(index, 1);
      }

      for (let i = 0; i < puzzleRatingRoles.length; i++)
      {
        if (highestPuzzleRating >= puzzleRatingRoles[i].rating)
          highestPuzzleRatingRole = puzzleRatingRoles[i].id;

        let index = fullRolesArray.indexOf(puzzleRatingRoles[i].id)

        if(index != -1)
          fullRolesArray.splice(index, 1);
      }

      for (let i = 0; i < titleRoles.length; i++) {
        if (titleRoles[i].title == lichessTitle || titleRoles[i].title == chessTitle)
          highestTitleRole = titleRoles[i].id;

        let index = fullRolesArray.indexOf(titleRoles[i].id)

        if (index != -1)
          fullRolesArray.splice(index, 1);
      }

      if (highestRatingRole != null)
        fullRolesArray.push(highestRatingRole)


      if (highestPuzzleRatingRole != null)
        fullRolesArray.push(highestPuzzleRatingRole)

      if (highestTitleRole != null)
        fullRolesArray.push(highestTitleRole)

      // Don't set if nothing was changed.
      if (fullRolesArray != Array.from(fullRolesCache.keys()))
      {
        try
        {
          message.member.roles.set(fullRolesArray).catch(() => null)
        }
        catch {}
      }
    }
    await settings.setMany(queue, true)
}


async function updateProfileDataByInteraction(interaction, useCacheOnly)
{
    if(!interaction.guild.me.permissions.has('MANAGE_ROLES'))
        return;

     let manyMuch = await settings.getMany([
      `guild-prefix-${interaction.guild.id}`,
      `guild-elo-roles-${interaction.guild.id}`,
      `guild-puzzle-elo-roles-${interaction.guild.id}`,
      `guild-title-roles-${interaction.guild.id}`,
      `guild-bot-mods-${interaction.guild.id}`,
      `guild-lichess-rating-equation-${interaction.guild.id}`,
      `guild-chesscom-rating-equation-${interaction.guild.id}`,
      `last-command-${interaction.user.id}`,
      `lichess-account-of-${interaction.user.id}`,
      `chesscom-account-of-${interaction.user.id}`,
      `cached-lichess-account-data-of-${interaction.user.id}`,
      `cached-chesscom-account-data-of-${interaction.user.id}`,
    ])
    
    let queue = []

    let ratingRoles = manyMuch[`guild-elo-roles-${interaction.guild.id}`]

    if (ratingRoles == undefined)
    {
        ratingRoles = []
    }

    let puzzleRatingRoles = manyMuch[`guild-puzzle-elo-roles-${interaction.guild.id}`]

    if (puzzleRatingRoles == undefined)
    {
        puzzleRatingRoles = []
    }

    let titleRoles = manyMuch[`guild-title-roles-${interaction.guild.id}`]

    if (titleRoles == undefined) {
        titleRoles = []
    }

    let lichessRatingEquation = manyMuch[`guild-lichess-rating-equation-${interaction.guild.id}`]

    if (lichessRatingEquation == undefined) {
        lichessRatingEquation = Constant_lichessDefaultRatingEquation
    }

    let chessComRatingEquation = manyMuch[`guild-chesscom-rating-equation-${interaction.guild.id}`]

    if (chessComRatingEquation == undefined) {
        chessComRatingEquation = Constant_chessComDefaultRatingEquation
    }

    let modRoles = manyMuch[`guild-bot-mods-${interaction.guild.id}`]

    if (modRoles == undefined) {
        modRoles = []
    }

    await interaction.guild.roles.fetch()
    .then(roles => 
    {
      let highestBotRole = interaction.guild.members.resolve(client.user).roles.highest

      if(highestBotRole)
      {
        for (let i = 0; i < ratingRoles.length; i++)
        {
          let role = roles.get(ratingRoles[i].id)

          // if role doesn't exist or is above bot.
          if (!role || highestBotRole.rawPosition < role.rawPosition)
          ratingRoles.splice(i, 1)
        }

        for (let i = 0; i < puzzleRatingRoles.length; i++)
        {
          let role = roles.get(puzzleRatingRoles[i].id)

          // if role doesn't exist or is above bot.
          if (!role || highestBotRole.rawPosition < role.rawPosition)
          puzzleRatingRoles.splice(i, 1)
        }

        for (let i = 0; i < titleRoles.length; i++) {
          let role = roles.get(titleRoles[i].id)

          // if role doesn't exist or is above bot.
          if (!role || highestBotRole.rawPosition < role.rawPosition)
          titleRoles.splice(i, 1)
        }
      }
    })
    .catch(() => null)

      
    ratingRoles.sort(function (a, b) { return a.rating - b.rating });
    puzzleRatingRoles.sort(function (a, b) { return a.rating - b.rating });

    try {
      Parser.evaluate(lichessRatingEquation, { x: 1000 })
      Parser.evaluate(lichessRatingEquation, { x: 0 })
      Parser.evaluate(lichessRatingEquation, { x: -1 })

      Parser.evaluate(chessComRatingEquation, { x: 1000 })
      Parser.evaluate(chessComRatingEquation, { x: 0 })
      Parser.evaluate(chessComRatingEquation, { x: -1 })
    }
    catch {}

    queue[`last-updated-${interaction.user.id}`] = Date.now()

    let lichessAccount = manyMuch[`lichess-account-of-${interaction.user.id}`]
    let chessComAccount = manyMuch[`chesscom-account-of-${interaction.user.id}`]
      
    let result

    if (lichessAccount == undefined) {
      result = null;
    }
    else
    {
      if(useCacheOnly) 
      {
        result = manyMuch[`cached-lichess-account-data-of-${interaction.user.id}`]
      }
      else
      {
        result = await fetch(`https://lichess.org/api/user/${lichessAccount}`).then(response => {
          if (response.status == 404) { // Not Found
            return null
          }
          else if (response.status == 200) { // Status OK
            return response.json()
          }
          else if(response.status == 429) { // Rate Limit
            return null
          }
        })
      }
    }
    
    let highestRating = -1
    let highestPuzzleRating = -1
    let lichessHighestRating = -1
    let lichessPuzzleRating = -1
    let lichessTitle = ""
    let chessTitle = ""
    
    if(result != null)
    {
      queue[`cached-lichess-account-data-of-${interaction.user.id}`] = result

      let corresRating = -1
      let blitzRating = -1
      let rapidRating = -1
      let classicalRating = -1

      let puzzleRating = -1

      if (result.perfs.correspondence && result.perfs.correspondence.prov == undefined) corresRating = result.perfs.correspondence.rating
      if (result.perfs.blitz && result.perfs.blitz.prov == undefined) blitzRating = result.perfs.blitz.rating
      if (result.perfs.rapid && result.perfs.rapid.prov == undefined) rapidRating = result.perfs.rapid.rating
      if (result.perfs.classical && result.perfs.classical.prov == undefined) classicalRating = result.perfs.classical.rating

      if (result.perfs.puzzle && result.perfs.puzzle.prov == undefined) puzzleRating = result.perfs.puzzle.rating

      lichessHighestRating = Math.max(corresRating, blitzRating, rapidRating, classicalRating)
      lichessPuzzleRating = puzzleRating

      let value = lichessHighestRating

      try {
        value = Math.round(Parser.evaluate(lichessRatingEquation, { x: lichessHighestRating }))
      }

      catch { console.log(error)}

      lichessHighestRating = value
      highestRating = lichessHighestRating
      highestPuzzleRating = lichessPuzzleRating

      if (result.title) {
        lichessTitle = result.title
      }
    }
    
    if (chessComAccount == undefined) {
      result = null;
    }
    else
    {
      if(useCacheOnly) 
      {
        result = manyMuch[`cached-chesscom-account-data-of-${interaction.user.id}`]
      }
      else
      {
        result = await fetch(`https://api.chess.com/pub/player/${chessComAccount}/stats`).then(response => {
          if (response.status == 404) { // Not Found
            return null
          }
          else if (response.status == 200) { // Status OK
            return response.json()
          }
          else if(response.status == 429) { // Rate Limit
            return null
          }
        })
      }
    }
    if(result != null)
    {
      queue[`cached-chesscom-account-data-of-${interaction.user.id}`] = result
      let corresRating = -1
      let blitzRating = -1
      let rapidRating = -1

      let puzzleRating = -1

      if (result.chess_daily && result.chess_daily.last.rd < Constant_ProvisionalRD) corresRating = result.chess_daily.last.rating
      if (result.chess_blitz && result.chess_daily.last.rd < Constant_ProvisionalRD) blitzRating = result.chess_blitz.last.rating
      if (result.chess_rapid && result.chess_daily.last.rd < Constant_ProvisionalRD) rapidRating = result.chess_rapid.last.rating

      if (result.tactics) puzzleRating = result.tactics.highest.rating

      let chessComHighestRating = Math.max(corresRating, blitzRating, rapidRating)

      let value = chessComHighestRating

      try {
        value = Math.round(Parser.evaluate(chessComRatingEquation, { x: chessComHighestRating }))
      }
      catch {}
      chessComHighestRating = value
      highestRating = Math.max(lichessHighestRating, chessComHighestRating)

      if (result.title)
        chessTitle = result.title
    }

    let highestRatingRole = null;
    let highestPuzzleRatingRole = null;
    let highestTitleRole = null;

    let fullRolesCache = interaction.member.roles.cache

    if (fullRolesCache)
    {
      let fullRolesArray = Array.from(fullRolesCache.keys());

      for (let i = 0; i < ratingRoles.length; i++)
      {
        if (highestRating >= ratingRoles[i].rating)
          highestRatingRole = ratingRoles[i].id;

        let index = fullRolesArray.indexOf(ratingRoles[i].id)

        if(index != -1)
          fullRolesArray.splice(index, 1);
      }

      for (let i = 0; i < puzzleRatingRoles.length; i++)
      {
        if (highestPuzzleRating >= puzzleRatingRoles[i].rating)
          highestPuzzleRatingRole = puzzleRatingRoles[i].id;

        let index = fullRolesArray.indexOf(puzzleRatingRoles[i].id)

        if(index != -1)
          fullRolesArray.splice(index, 1);
      }

      for (let i = 0; i < titleRoles.length; i++) {
        if (titleRoles[i].title == lichessTitle || titleRoles[i].title == chessTitle)
          highestTitleRole = titleRoles[i].id;

        let index = fullRolesArray.indexOf(titleRoles[i].id)

        if (index != -1)
          fullRolesArray.splice(index, 1);
      }

      if (highestRatingRole != null)
        fullRolesArray.push(highestRatingRole)


      if (highestPuzzleRatingRole != null)
        fullRolesArray.push(highestPuzzleRatingRole)

      if (highestTitleRole != null)
        fullRolesArray.push(highestTitleRole)

      // Don't set if nothing was changed.
      if (fullRolesArray != Array.from(fullRolesCache.keys()))
      {
        try
        {
          interaction.member.roles.set(fullRolesArray).catch(() => null)
        }
        catch {}
      }
    }
    await settings.setMany(queue, true)
}

async function deleteMessageAfterTime(message, time)
{
    setTimeout(async () => {
      message.delete().catch(() => null)
    }, time);
}

function getRoleFromMentionString(guild, str) {
    if (!str) return;

    if (str.startsWith('<@&') && str.endsWith('>')) {
        str = str.slice(3, -1);

        if (str.startsWith('!')) {
            str = str.slice(1);
        }

        return guild.roles.cache.get(str);
    }
}

function addEloCommand(message, ratingRoles, role, elo, guildRoles) {
    for (let i = 0; i < ratingRoles.length; i++) {
        if (ratingRoles[i].id == role.id)
            return undefined
    }

    let highestBotRole = message.guild.members.resolve(client.user).roles.highest
    let guildRole = guildRoles.get(role.id)

    if(highestBotRole.rawPosition < guildRole.rawPosition)
      return -1

    let template = { id: role.id, rating: elo };

    return template
}

function addPuzzleEloCommand(message, puzzleRatingRoles, role, elo, guildRoles) {
    for (let i = 0; i < puzzleRatingRoles.length; i++) {
        if (puzzleRatingRoles[i].id == role.id)
            return undefined
    }

    let highestBotRole = message.guild.members.resolve(client.user).roles.highest
    let guildRole = guildRoles.get(role.id)

    if(highestBotRole.rawPosition < guildRole.rawPosition)
      return -1

    let template = { id: role.id, rating: elo };

    return template
}

function addTitleCommand(message, titleRoles, role, title, guildRoles) {
    for (let i = 0; i < titleRoles.length; i++) {
        if (titleRoles[i].id == role.id)
            return undefined
    }

    let highestBotRole = message.guild.members.resolve(client.user).roles.highest
    let guildRole = guildRoles.get(role.id)

    if(highestBotRole.rawPosition < guildRole.rawPosition)
      return -1
    
    let template = { id: role.id, title: title };

    return template
}

function addCommandToHelp(result, prefix, commandData) {
    return result + prefix + commandData + '\n\n'
}

async function isBotControlAdminByMessage(message, modRoles) {
    if (message.member.permissions.has("MANAGE_GUILD", true))
        return true;


    let roleCache = message.member.roles.cache

    for (let i = 0; i < modRoles.length; i++) {
        if(roleCache.has(modRoles[i]))
            return true;
    }

    return false;
}

async function isBotControlAdminByInteraction(interaction, modRoles) {
    if (interaction.member.permissions.has("MANAGE_GUILD", true))
        return true;


    let roleCache = interaction.member.roles.cache

    for (let i = 0; i < modRoles.length; i++) {
        if(roleCache.has(modRoles[i]))
            return true;
    }

    return false;
}

function botHasMessagingPermissionsByMessage(message)
{
    let hasViewPermission = message.channel.permissionsFor(message.guild.me)
    .has('VIEW_CHANNEL', false);

    let hasMessageHistoryPermission = message.channel.permissionsFor(message.guild.me)
    .has('READ_MESSAGE_HISTORY')

    let hasSendPermission = message.channel.permissionsFor(message.guild.me)
    .has('SEND_MESSAGES', false);

    if(hasViewPermission && hasMessageHistoryPermission && hasSendPermission)
        return true;

    return false;
}

function botHasBasicPermissionsByGuild(guild)
{

    let hasViewPermission = guild.me.permissions.has('VIEW_CHANNEL')

    let hasMessageHistoryPermission = guild.me.permissions.has('READ_MESSAGE_HISTORY')

    let hasSendPermission = guild.me.permissions.has('SEND_MESSAGES')

    let hasManageRolesPermission = guild.me.permissions.has('MANAGE_ROLES')

    if(hasViewPermission && hasSendPermission && hasManageRolesPermission && hasMessageHistoryPermission)
        return true;

    return false;
}


function botHasPermissionByGuild(guild, permission)
{

    let hasPermission = guild.me.permissions.has(permission)

    if(hasPermission)
        return true;

    return false;
}

function replyAccessDeniedByMessage(message)
{
  let embed = new MessageEmbed()
      .setColor('#0099ff')
      .setDescription(`Access Denied`)
  return message.reply({embeds: [embed], failIfNotExists: false })
}

function replyAccessDeniedByInteraction(interaction)
{
  let embed = new MessageEmbed()
      .setColor('#0099ff')
      .setDescription(`Access Denied`)

  return interaction.editReply({embeds: [embed], failIfNotExists: false, ephemeral: true })
}

function isBotSelfHosted()
{
    return client.guilds.cache.size == 1
}

async function buildCanvasForLichess(discordUsername)
{
  const canvas = Canvas.createCanvas(1302, 729);

  const context = canvas.getContext('2d');

  const background = await Canvas.loadImage('https://i.ibb.co/y5brqF1/Screenshot-93.png');

  // This uses the canvas dimensions to stretch the image onto the entire canvas
  context.drawImage(background, 0, 0, canvas.width, canvas.height);
  
  context.font = '14px arial';
	// Select the style that will be used to fill the text in
	context.fillStyle = '#ffffff';

  context.fillText(discordUsername, 795, 256);
  // Use the helpful Attachment class structure to process the file for you
  let attachment = new MessageAttachment(canvas.toBuffer(), 'profile-image.png');

  return attachment
}

async function buildCanvasForChessCom(discordUsername)
{
  const canvas = Canvas.createCanvas(1071, 817);

  const context = canvas.getContext('2d');

  const background = await Canvas.loadImage('https://i.ibb.co/Xb5rtWh/Screenshot-90.png');

  // This uses the canvas dimensions to stretch the image onto the entire canvas
  context.drawImage(background, 0, 0, canvas.width, canvas.height);
  
  context.font = '12px arial';
	// Select the style that will be used to fill the text in
	context.fillStyle = '#ffffff';

  context.fillText(discordUsername, 541, 520);
  // Use the helpful Attachment class structure to process the file for you
  let attachment = new MessageAttachment(canvas.toBuffer(), 'profile-image.png');

  return attachment
}

async function getCriticalData(interaction)
{
    let manyMuch = await settings.getMany([
      `guild-prefix-${interaction.guild.id}`,
      `guild-elo-roles-${interaction.guild.id}`,
      `guild-puzzle-elo-roles-${interaction.guild.id}`,
      `guild-title-roles-${interaction.guild.id}`,
      `guild-bot-mods-${interaction.guild.id}`,
      `guild-lichess-rating-equation-${interaction.guild.id}`,
      `guild-chesscom-rating-equation-${interaction.guild.id}`,
      `last-command-${interaction.user.id}`,
      `lichess-account-of-${interaction.user.id}`,
      `chesscom-account-of-${interaction.user.id}`,
      `cached-lichess-account-data-of-${interaction.user.id}`,
      `cached-chesscom-account-data-of-${interaction.user.id}`,
    ])

    let ratingRoles = manyMuch[`guild-elo-roles-${interaction.guild.id}`]

    if (ratingRoles == undefined)
    {
        ratingRoles = []
    }

    let puzzleRatingRoles = manyMuch[`guild-puzzle-elo-roles-${interaction.guild.id}`]

    if (puzzleRatingRoles == undefined)
    {
        puzzleRatingRoles = []
    }

    let titleRoles = manyMuch[`guild-title-roles-${interaction.guild.id}`]

    if (titleRoles == undefined) {
        titleRoles = []
    }

    let lichessRatingEquation = manyMuch[`guild-lichess-rating-equation-${interaction.guild.id}`]

    if (lichessRatingEquation == undefined) {
        lichessRatingEquation = Constant_lichessDefaultRatingEquation
    }

    let chessComRatingEquation = manyMuch[`guild-chesscom-rating-equation-${interaction.guild.id}`]

    if (chessComRatingEquation == undefined) {
        chessComRatingEquation = Constant_chessComDefaultRatingEquation
    }

    let modRoles = manyMuch[`guild-bot-mods-${interaction.guild.id}`]

    if (modRoles == undefined) {
        modRoles = []
    }

    let timestamp = manyMuch[`last-command-${interaction.user.id}`]


    let lichessAccount = manyMuch[`lichess-account-of-${interaction.user.id}`]
    let chessComAccount = manyMuch[`chesscom-account-of-${interaction.user.id}`]

    let lichessAccountData = manyMuch[`cached-lichess-account-data-of-${interaction.user.id}`]
    let chessComAccountData = manyMuch[`cached-chesscom-account-data-of-${interaction.user.id}`]
    
    return [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData]

    
}

function getUserFullDiscordName(user)
{
  return user.username + "#" + user.discriminator
  
}
client.login(token)

module.exports = { updateProfileDataByMessage, updateProfileDataByInteraction, deleteMessageAfterTime, getRoleFromMentionString, addEloCommand,addPuzzleEloCommand, addTitleCommand, addCommandToHelp, isBotControlAdminByMessage, isBotControlAdminByInteraction, botHasMessagingPermissionsByMessage, botHasBasicPermissionsByGuild, botHasPermissionByGuild, replyAccessDeniedByMessage, replyAccessDeniedByInteraction, isBotSelfHosted, buildCanvasForLichess,buildCanvasForChessCom, getUserFullDiscordName, getCriticalData, Constant_lichessDefaultRatingEquation, Constant_chessComDefaultRatingEquation, Constant_ProvisionalRD, settings, client }