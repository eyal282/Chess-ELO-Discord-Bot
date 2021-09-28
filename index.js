// Critical Note: Changing the project or author names ( changing the team's name or forking the project ) demands you update your URL in Uptime Robot, as it changes as well.

// To do tomorrow: check every single bug from the massive optimization I made...

const mySecret = process.env['SECRET_BOT_TOKEN']

const express = require('express');
const app = express();
const port = 3000;
 
app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;

//const client = new Discord.Client({ partials: ["MESSAGE", "USER", "REACTION"] });
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES']} );
const Josh = require("@joshdb/core");
const provider = require("@joshdb/mongo");
const fetch = require('node-fetch');

let defaultPrefix = "!"

let Constant_lichessDefaultRatingEquation = "x"
let Constant_chessComDefaultRatingEquation = "0.75 * x + 650"
let Constant_ProvisionalRD = 110
//const bot = new Discord.Client();

const settings = new Josh({
  name: 'Chess ELO Role',
  provider,
  providerOptions: {
    collection: `settings`,
    url: `mongodb+srv://eyal282:${process.env['SECRET_MONGO_PASSWORD']}@chess-elo-role.dpqoj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
  }
});

settings.defer.then( async () => {
  let size = await settings.size;
  console.log(`Connected, there are ${size} rows in the database.`);
});

const { SlashCommandBuilder } = require('@discordjs/builders');

const command = new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!');

// Raw data that can be used to register a slash command
const rawData = command.toJSON();

client.on('ready', () => {
    console.log("Chess ELO Bot has been loaded.");

    client.user.setActivity(` ${client.guilds.cache.size} servers | Mention me to find the prefix`, { type: `WATCHING` });

    setTimeout(async () => {
	
      const Guilds = client.guilds.cache

      // For top.gg
      let GuildsMap = Guilds.map(guild => parseInt(guild.id))

      console.log(GuildsMap)

      let uniqueGuildOwners = []
      
      let GuildsArray = Array.from(Guilds.values());
      for(let i=0;i < GuildsArray.length;i++)
      {
        let guild = GuildsArray[i]
        let ownerMember = await guild.fetchOwner()
        let ownerUser = ownerMember.user
        let fullDiscordUsername = ownerUser.username + "#" + ownerUser.discriminator

        if(!uniqueGuildOwners.includes(fullDiscordUsername))
          uniqueGuildOwners.push(fullDiscordUsername)

        console.log(`${guild.id} ---> ${guild.name} ---> ${fullDiscordUsername}`);
      }

      console.log(`Guilds with unique owners count: ${uniqueGuildOwners.length}`)
      
    }, 2500);
});


/* Emitted whenever the bot joins a guild.
PARAMETER    TYPE         DESCRIPTION
guild        Guild        The created guild    */
client.on("guildCreate", async function(guild){
    console.log(`the client joins a guild: ${guild.id} ---> ${guild.name}`);

    client.user.setActivity(` ${client.guilds.cache.size} servers | Mention me to find the prefix`, { type: `WATCHING` });

    if(!botHasBasicPermissionsByGuild(guild))
    { 
        let targetMember = await guild.fetchOwner().catch(() => null)

        if(botHasPermissionByGuild(guild, "VIEW_AUDIT_LOG"))
        {
            const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: "BOT_ADD"}).catch(() => null);

            if(fetchedLogs)
            {
              const auditlog = fetchedLogs.entries.first();

              targetMember = auditlog.executor
            }
            
        }

        if(targetMember)
        {
          targetMember.send(`Bot needs the permissions of VIEW_CHANNELS, SEND_MESSAGES, READ_MESSAGE_HISTORY, MANAGE_ROLES to properly function.`).catch(() => null)
        }
    }
});

// guildDelete
/* Emitted whenever a guild is deleted/left.
PARAMETER    TYPE         DESCRIPTION
guild        Guild        The guild that was deleted    */
client.on("guildDelete", function(guild){
    console.log(`the client left a guild: ${guild.id} ---> ${guild.name}`);

    client.user.setActivity(` ${client.guilds.cache.size} servers | Mention me to find the prefix`, { type: `WATCHING` });
});

// On Button Pressed
client.on('interactionCreate', async(interaction) => {
	if (!interaction.isButton() || interaction.user.id != interaction.customId) return;

  let queue = []

  let bLichess = interaction.message.embeds[0].url.includes("lichess.org") || interaction.message.embeds[0].description.includes("lichess.org")

  let url = interaction.message.embeds[0].url

  url = url.replace('\\', '/')


  let splitURL = url.split('/')

  let username = splitURL[splitURL.length-1]


  let message = interaction.message

  message.author = interaction.user // We do a little trolling

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

	if(bLichess)
  {
    let timestamp = manyMuch[`last-command-${message.author.id}`]

    if ((timestamp == undefined || timestamp + 10 * 1000 < Date.now())) {
        queue[`last-command-${message.author.id}`] = Date.now()

        let result = await fetch(`https://lichess.org/api/user/${username}`).then(response => {
            if (response.status == 404) { // Not Found
                return null
            }
            else if (response.status == 429) { // Rate Limit
                return "Rate Limit"
            }
            else if (response.status == 200) { // Status OK
                return response.json()
            }
        })

        if (result == null) {
                                message.reply({content: `Username was not found!`, failIfNotExists: false})
        }
        else if (result == "Rate Limit") {
            let embed = new MessageEmbed()
              .setColor('#0099ff')
              .setURL(`https://lichess.org/@/${username}`)
              .setDescription('Rate Limit Encountered! Please try again!')

              const row = new MessageActionRow()
                .addComponents(
                  new MessageButton()
                    .setCustomId(interaction.user.id)
                    .setURL(`https://lichess.org/@/${username}`)
                    .setLabel(`Retry Link for ${username}`)
                    .setStyle('PRIMARY'),
                );
              interaction.reply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false })
        }
        else {
            // result.profile.location
            let fullDiscordUsername = message.author.username + "#" + message.author.discriminator

            if(result.profile && result.profile.location && fullDiscordUsername == result.profile.location) {
                queue[`lichess-account-of-${message.author.id}`] = result.username
                queue[`cached-lichess-account-data-of-${message.author.id}`] = result
                updateProfileDataByMessage(message, true)

                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully linked your [Lichess Profile](${result.url})`)

                interaction.reply({ embeds: [embed], failIfNotExists: false})

            }
            else {
                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setURL(result.url)
                    .setImage('https://i.ibb.co/4SmH8f2/Screenshot-88.png')
                    .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Lichess Profile](https://lichess.org/account/profile)')

                    const row = new MessageActionRow()
                      .addComponents(
                        new MessageButton()
                          .setCustomId(interaction.user.id)
                          .setLabel(`Retry Link for ${username}`)
                          .setStyle('PRIMARY'),
                      );

                      interaction.reply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false})
            }
        }
    }
    else {
      let embed = new MessageEmbed()
        .setColor('#0099ff')
        .setURL(`https://lichess.org/@/${username}`)
        .setDescription('Rate Limit Encountered! Please try again!')

        const row = new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId(interaction.user.id)
              .setLabel(`Retry Link for ${username}`)
              .setStyle('PRIMARY'),
          );
        interaction.reply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false })
    }
  }
  // If not lichess
  else
  {
      let timestamp = manyMuch[`last-command-${message.author.id}`]

      if ((timestamp == undefined || timestamp + 10 * 1000 < Date.now())) {
          queue[`last-command-${message.author.id}`] = Date.now()
          let result = await fetch(`https://api.chess.com/pub/player/${username}`).then(response => {
              if (response.status == 404) { // Not Found
                  return null
              }
              else if (response.status == 429) { // Rate Limit
                  return "Rate Limit"
              }
              else if (response.status == 200) { // Status OK
                  return response.json()
              }
          })


          if (result == null) {
              interaction.reply({ content: 'User was not found!', failIfNotExists: false })
          }
          else if (result == "Rate Limit") {
                let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setURL(`https://www.chess.com/member/${username}`)
                .setDescription('Rate Limit Encountered! Please try again!')

                const row = new MessageActionRow()
                  .addComponents(
                    new MessageButton()
                      .setCustomId(message.author.id)
                      .setLabel(`Retry Link for ${username}`)
                      .setStyle('PRIMARY'),
                  );
                interaction.reply({ embeds: [embed], components: [row], ephemeral: true,  failIfNotExists: false })
          }
          else {
              // result.profile.location
              let fullDiscordUsername = message.author.username + "#" + message.author.discriminator

              if (result.location && fullDiscordUsername == result.location) {
                  queue[`chesscom-account-of-${message.author.id}`] = result.username

                  // Unfortunately the endpoint of chess.com is different for getting location than the endpoint for getting stats, therefore we cannot use the line below.
                  //await settings.set(`cached-chesscom-account-data-of-${message.author.id}`, result)
                  updateProfileDataByMessage(message, true)

                  let embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setDescription(`Successfully linked your [Chess.com Profile](${result.url})`)


                    interaction.reply({ embeds: [embed], failIfNotExists: false })

              }
              else {
                  let embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setURL(`https://www.chess.com/member/${username}`)
                      .setImage(`https://i.ibb.co/8rTvD3R/Screenshot-89.png`)
                      .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Chess.com Profile](https://www.chess.com/settings)')

                        const row = new MessageActionRow()
                        .addComponents(
                          new MessageButton()
                            .setCustomId(message.author.id)
                            .setLabel(`Retry Link for ${username}`)
                            .setStyle('PRIMARY'),
                        );

                        interaction.reply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false })
              }
          }
      }
      else {
          let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setURL(`https://www.chess.com/member/${username}`)
            .setDescription('Rate Limit Encountered! Please try again!')

            const row = new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setCustomId(message.author.id)
                  .setLabel(`Retry Link for ${username}`)
                  .setStyle('PRIMARY'),
              );
            interaction.reply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false })
      }
  }

  await settings.setMany(queue, true)
});
// Messages without the prefix
client.on("messageCreate", async message => {
    if (message.author.bot) return;

    if (!botHasMessagingPermissionsByMessage(message)) return;

    let prefix = await settings.get(`guild-prefix-${message.guild.id}`)

    if (prefix == undefined) prefix = defaultPrefix

    if (message.content.indexOf(prefix) === 0) return;

    if (message.mentions.has(client.user) && message.mentions.users.size == 1) {
        message.reply('Prefix is `' + prefix + '`\nThis message will self destruct in 10 seconds.').then(msg =>
        {
            deleteMessageAfterTime(msg, 10000)
        })
        .catch(() => null)
    }
    else
    {
        let timestamp = await settings.get(`last-updated-${message.author.id}`)

        if ((timestamp == undefined || timestamp + 120 * 1000 < Date.now() || (isBotSelfHosted() && timestamp + 10 * 1000 < Date.now())))
        {
          updateProfileDataByMessage(message, false)
        }
    }
});

// Messages with the prefix
client.on("messageCreate", async message => {
    if (message.author.bot) return;

    if (!botHasMessagingPermissionsByMessage(message)) return;

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
  
    let prefix = manyMuch[`guild-prefix-${message.guild.id}`]

    if (prefix == undefined) prefix = defaultPrefix

    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

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

    let queue = {}

    // Add them to the queue in the end in case they get changed
    //queue[`guild-elo-roles-${message.guild.id}`] = ratingRoles
    //queue[`guild-puzzle-elo-roles-${message.guild.id}`] = puzzleRatingRoles
    //queue[`guild-title-roles-${message.guild.id}`] = titleRoles

    // Queue is set at the end, we already sorted anyawys.

    if (command == "help")
    {
        let result = ""

        result = addCommandToHelp(result, prefix, `lichess [username] ---> Tries to link your Lichess Account. Leave user empty to unlink`)
        result = addCommandToHelp(result, prefix, `chess [username] ---> Tries to link your Chess.com Account. Leave user empty to unlink`)
        result = addCommandToHelp(result, prefix, `profile [@user] ---> Shows the profile of a target user. Leave user empty to see your profile`)
        result = addCommandToHelp(result, prefix, `privacy ---> Privacy policy`)
        result = addCommandToHelp(result, prefix, `invite ---> Invite Link`)
        result = addCommandToHelp(result, prefix, `ping ---> Lag of the bot`)
        result = addCommandToHelp(result, prefix, `prefix [prefix] ---> Changes the bot's prefix, must mention the bot doing so`)
        result = addCommandToHelp(result, prefix, `addelo [elo] [@role] ---> Adds a new role milestone`)
        result = addCommandToHelp(result, prefix, `addpuzzleelo [elo] [@role] ---> Adds a new puzzle role milestone`)
        result = addCommandToHelp(result, prefix, `addtitle [title] [@role] ---> Adds a new role by title. Example: ${prefix}addtitle GM @Grandmaster IM @InterMaster NM @NatMaster`)
        result = addCommandToHelp(result, prefix, `getelo ---> Prints all role milestones`)
        result = addCommandToHelp(result, prefix, `getpuzzleelo ---> Prints all puzzle role milestones`)
        result = addCommandToHelp(result, prefix, `gettitle ---> Prints all titles that gain a role`)
        result = addCommandToHelp(result, prefix, `getmod ---> Prints all the bot's moderators`)
        result = addCommandToHelp(result, prefix, `resetelo ---> Deletes all role milestones. This command will send you a copy of what got reset`)
        result = addCommandToHelp(result, prefix, `resetpuzzleelo ---> Deletes all puzzle role milestones. This command will send you a copy of what got reset`)
        result = addCommandToHelp(result, prefix, `resettitle ---> Deletes all title role milestones. This command will send you a copy of what got reset`)
        result = addCommandToHelp(result, prefix, `setlichessequation ---> Sets the equation for inflating or deflating lichess rating, x = User's current rating. Default: '${Constant_lichessDefaultRatingEquation}'. Current: '${lichessRatingEquation}'`)
        result = addCommandToHelp(result, prefix, `setchessequation [equation] ---> Sets the equation for inflating or deflating chess.com rating, x = User's current rating. Default: '${Constant_chessComDefaultRatingEquation}'. Current: '${chessComRatingEquation}'`)
        result = addCommandToHelp(result, prefix, `addmod [@role] ---> Adds a role as a Moderator`)
        result = addCommandToHelp(result, prefix, `resetmod ---> Resets all Moderators.`)

        if(isBotSelfHosted())
        {
            result = addCommandToHelp(result, prefix, `forcelichess [username] [@user]  ---> Links a user to Lichess.org, ignoring linking condition`)
            result = addCommandToHelp(result, prefix, `forcechess [username] [@user] ---> Links a user to Chess.org, ignoring linking condition`)
        }

        result = result + "Note: -1 ELO stands for either unrated or provisonary elo (Shows (?) on Lichess))\n"
        result = result + "Note: Provisionary rating in Chess.com is artifically calculated by Lichess standards.\n"
        result = result + "Note: Due to Chess.com limits, only puzzle rating of Lichess is calculated at all.\n"
        result = result + "Title List: `GM` `WGM` `IM` `WIM` `FM` `WFM` `NM` `CM` `WCM` `WNM` `LM` `BOT`\n"
        message.reply({content: result, failIfNotExists: false})
    }
    else if (command == "lichess") {
        //deleteMessageAfterTime(message, 100);

        if (args[0]) {
            

            if (ratingRoles.length == 0) {
                message.reply({ content: 'The server has yet to setup any rating role milestones', failIfNotExists: false })
            }
            else
            {
              let timestamp = manyMuch[`last-command-${message.author.id}`]

              if ((timestamp == undefined || timestamp + 10 * 1000 < Date.now())) {
                  queue[`last-command-${message.author.id}`] = Date.now()

                  let result = await fetch(`https://lichess.org/api/user/${args[0]}`).then(response => {
                      if (response.status == 404) { // Not Found
                          return null
                      }
                      else if (response.status == 429) { // Rate Limit
                          return "Rate Limit"
                      }
                      else if (response.status == 200) { // Status OK
                          return response.json()
                      }
                  })

                  if (result == null) {
                    message.reply({ content: 'User was not found!', failIfNotExists: false })
                  }
                  else if (result == "Rate Limit") {
                      let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setURL(`https://lichess.org/@/${args[0]}`)
                        .setDescription('Rate Limit Encountered! Please try again!')

                        const row = new MessageActionRow()
                          .addComponents(
                            new MessageButton()
                              .setCustomId(message.author.id)
                              .setLabel(`Retry Link for ${args[0]}`)
                              .setStyle('PRIMARY'),
                          );
                        message.reply({ embeds: [embed], components: [row], failIfNotExists: false })
                  }
                  else {
                      // result.profile.location
                      let fullDiscordUsername = message.author.username + "#" + message.author.discriminator

                      if(result.profile && result.profile.location && fullDiscordUsername == result.profile.location) {
                          queue[`lichess-account-of-${message.author.id}`] = result.username
                          queue[`cached-lichess-account-data-of-${message.author.id}`] = result
                          updateProfileDataByMessage(message, true)

                          let embed = new MessageEmbed()
                              .setColor('#0099ff')
                              .setDescription(`Successfully linked your [Lichess Profile](${result.url})`)

                          message.reply({ embeds: [embed], failIfNotExists: false })

                      }
                      else {
                          let embed = new MessageEmbed()
                              .setColor('#0099ff')
                              .setURL(result.url)
                              .setImage('https://i.ibb.co/4SmH8f2/Screenshot-88.png')
                              .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Lichess Profile](https://lichess.org/account/profile)')

                              const row = new MessageActionRow()
                                .addComponents(
                                  new MessageButton()
                                    .setCustomId(message.author.id)
                                    .setLabel(`Retry Link for ${args[0]}`)
                                    .setStyle('PRIMARY'),
                                );

                                message.reply({ embeds: [embed], components: [row], failIfNotExists: false })
                      }
                  }
              }
              else {
                let embed = new MessageEmbed()
                  .setColor('#0099ff')
                  .setURL(`https://lichess.org/@/${args[0]}`)
                  .setDescription('Rate Limit Encountered! Please try again!')

                  const row = new MessageActionRow()
                    .addComponents(
                      new MessageButton()
                        .setCustomId(message.author.id)
                        .setLabel(`Retry Link for ${args[0]}`)
                        .setStyle('PRIMARY'),
                    );
                  message.reply({ embeds: [embed], components: [row], failIfNotExists: false })
              }
            }
        }
        else {

            queue[`lichess-account-of-${message.author.id}`] = undefined
            queue[`cached-lichess-account-data-of-${message.author.id}`] = undefined

            updateProfileDataByMessage(message, true)

            let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully unlinked your Lichess Profile`)

            message.reply({ embeds: [embed], failIfNotExists: false })

        }
    }
    else if (command == "chess") {

        if (ratingRoles.length == 0) {
            message.reply({ content: 'The server has yet to setup any rating role milestones', failIfNotExists: false })
        }
        else if (args[0]) {

            let timestamp = manyMuch[`last-command-${message.author.id}`]

            if ((timestamp == undefined || timestamp + 10 * 1000 < Date.now()) && ratingRoles.length > 0) {
                queue[`last-command-${message.author.id}`] = Date.now()
                let result = await fetch(`https://api.chess.com/pub/player/${args[0]}`).then(response => {
                    if (response.status == 404) { // Not Found
                        return null
                    }
                    else if (response.status == 429) { // Rate Limit
                        return "Rate Limit"
                    }
                    else if (response.status == 200) { // Status OK
                        return response.json()
                    }
                })


                if (result == null) {
                  message.reply({ content: 'User was not found!', failIfNotExists: false })
                }
                else if (result == "Rate Limit") {
                     let embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setURL(`https://www.chess.com/member/${args[0]}`)
                      .setDescription('Rate Limit Encountered! Please try again!')

                      const row = new MessageActionRow()
                        .addComponents(
                          new MessageButton()
                            .setCustomId(message.author.id)
                            .setLabel(`Retry Link for ${args[0]}`)
                            .setStyle('PRIMARY'),
                        );
                      message.reply({ embeds: [embed], components: [row], failIfNotExists: false })
                }
                else {
                    // result.profile.location
                    let fullDiscordUsername = message.author.username + "#" + message.author.discriminator

                    if (result.location && fullDiscordUsername == result.location) {
                        queue[`chesscom-account-of-${message.author.id}`] = result.username

                        // Unfortunately the endpoint of chess.com is different for getting location than the endpoint for getting stats, therefore we cannot use the line below.
                        //await settings.set(`cached-chesscom-account-data-of-${message.author.id}`, result)
                        updateProfileDataByMessage(message, true)

                        let embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setDescription(`Successfully linked your [Chess.com Profile](${result.url})`)


                         message.reply({ embeds: [embed], failIfNotExists: false })

                    }
                    else {
                        let embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setImage(`https://i.ibb.co/8rTvD3R/Screenshot-89.png`)
                            .setURL(`https://www.chess.com/member/${args[0]}`)
                            .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Chess.com Profile](https://www.chess.com/settings)')

                             const row = new MessageActionRow()
                              .addComponents(
                                new MessageButton()
                                  .setCustomId(message.author.id)
                                  .setLabel(`Retry Link for ${args[0]}`)
                                  .setStyle('PRIMARY'),
                              );

                              message.reply({ embeds: [embed], components: [row], failIfNotExists: false })
                    }
                }
            }
            else {
              let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setURL(`https://www.chess.com/member/${args[0]}`)
                .setDescription('Rate Limit Encountered! Please try again!')

                const row = new MessageActionRow()
                  .addComponents(
                    new MessageButton()
                      .setCustomId(message.author.id)
                      .setLabel(`Retry Link for ${args[0]}`)
                      .setStyle('PRIMARY'),
                  );
                message.reply({ embeds: [embed], components: [row], failIfNotExists: false })
            }
        }
        else {
            queue[`chesscom-account-of-${message.author.id}`] = undefined
            queue[`cached-chesscom-account-data-of-${message.author.id}`] = undefined

            updateProfileDataByMessage(message, true)

            let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully unlinked your Chess.com Profile`)

            message.reply({ embeds: [embed], failIfNotExists: false })
        }
    }
 else if (command == "profile") {
      //deleteMessageAfterTime(message, 2000);

      if (ratingRoles.length == 0) {
          message.reply({ content: 'The server has yet to setup any rating role milestones', failIfNotExists: false })
      }
      else
      {

        let lichessAccountData = manyMuch[`cached-lichess-account-data-of-${message.author.id}`]
        let chessComAccountData = manyMuch[`cached-chesscom-account-data-of-${message.author.id}`]

        // Soon chess.com steals every variable here.
        let result = lichessAccountData

        let lichessEmbed
        let chessComEmbed

        if(result)
        {
          let corresRating = "Unrated"
          let blitzRating = "Unrated"
          let rapidRating = "Unrated"
          let classicalRating = "Unrated"


          if (result.perfs.correspondence)
            corresRating = result.perfs.correspondence.rating.toString() + (result.perfs.correspondence.prov == undefined ? "" : "?")

          if (result.perfs.blitz)
            blitzRating = result.perfs.blitz.rating.toString() + (result.perfs.blitz.prov == undefined ? "" : "?")

          if (result.perfs.rapid)
            rapidRating = result.perfs.rapid.rating.toString() + (result.perfs.rapid.prov == undefined ? "" : "?")

          if (result.perfs.classical)
            classicalRating = result.perfs.classical.rating.toString() + (result.perfs.classical.prov == undefined ? "" : "?")

          lichessEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Lichess Stats')
            .setURL(result.url)
            .addFields(
              { name: '\u200B', value: '\u200B' },
              { name: 'Blitz Rating', value: blitzRating, inline: true },
              { name: 'Rapid Rating', value: rapidRating, inline: true },
              { name: 'Classical Rating', value: classicalRating, inline: true },
              { name: 'Correspondence Rating', value: corresRating, inline: true },
            )
        }
        else
        {
          lichessEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Lichess Stats')
            .setDescription('Could not find stats for user.')
        }

        // Now chess.com steals every variable!

        result = chessComAccountData

        if(result)
        {
          corresRating = "Unrated"
          blitzRating = "Unrated"
          rapidRating = "Unrated"
          classicalRating = "Unrated"

          if (result.chess_daily)
            corresRating = result.chess_daily.last.rating.toString() + (result.chess_daily.last.rd >= Constant_ProvisionalRD ? "" : "?")

          if (result.chess_blitz)
            blitzRating = result.chess_blitz.last.rating.toString() + (result.chess_blitz.last.rd >= Constant_ProvisionalRD ? "" : "?")

          if (result.chess_rapid)
            rapidRating = result.chess_rapid.last.rating.toString() + (result.chess_rapid.last.rd >= Constant_ProvisionalRD ? "" : "?")

          let chessComAccount = manyMuch[`chesscom-account-of-${message.author.id}`]

          chessComEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Chess.com Stats')
            .setURL(`https://www.chess.com/member/${chessComAccount}`)
            .addFields(
              { name: '\u200B', value: '\u200B' },
              { name: 'Blitz Rating', value: blitzRating, inline: true },
              { name: 'Rapid Rating', value: rapidRating, inline: true },
              { name: 'Classical Rating', value: classicalRating, inline: true },
              { name: 'Correspondence Rating', value: corresRating, inline: true },
            )
            .setFooter(`Note: Provisional rating is artifically calculated by Lichess standards.\nNote: Linking your account won't update your rating, you must send a message to update your rating`);
        }
        else
        {
          chessComEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Chess.com Stats')
            .setDescription('Could not find any stats for user.')
        }
        message.reply({ embeds: [lichessEmbed, chessComEmbed], failIfNotExists: false })

            
      }
   }
  	else if (command == "forcelichess" && isBotSelfHosted()) {
        //deleteMessageAfterTime(message, 2000);
	    	let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            replyAccessDeniedByMessage(message)
        }
        else if (args[0]) {

            if (ratingRoles.length == 0) {
                message.reply({ content: 'The server has yet to setup any rating role milestones', failIfNotExists: false })
            }
			
		      	else if (message.mentions.users.size != 1) {
                message.reply({ content: `${prefix}forcelichess [username] [@user]`, failIfNotExists: false })
            }
            else
            {

              let target = message.mentions.users.first()
              
              let timestamp = manyMuch[`last-command-${message.author.id}`]

              if ((timestamp == undefined || timestamp + 10 * 1000 < Date.now())) {
                  queue[`last-command-${message.author.id}`] = Date.now()

                  let result = await fetch(`https://lichess.org/api/user/${args[0]}`).then(response => {
                      if (response.status == 404) { // Not Found
                          return null
                      }
                      else if (response.status == 429) { // Rate Limit
                          return "Rate Limit"
                      }
                      else if (response.status == 200) { // Status OK
                          return response.json()
                      }
                  })

                  if (result == null) {
                      message.reply({content: `Username was not found!`, failIfNotExists: false})
                  }
                  else if (result == "Rate Limit") {
                      message.reply({content: `Rate Limit Encountered! Please try again!`, failIfNotExists: false})
                  }
                  else {
                      queue[`lichess-account-of-${target.id}`] = result.username

                      let embed = new MessageEmbed()
                          .setColor('#0099ff')
                          .setDescription(`Successfully linked [Lichess Profile](${result.url}) for ${target}`)

                      message.reply({ embeds: [embed], failIfNotExists: false })
                  }
              }
              else {
                  message.reply({content: `Rate Limit Encountered! Please try again!`, failIfNotExists: false})
              }
            }
        }
        else {
            message.reply({content: `${prefix}forcelichess [username] [@user]`, failIfNotExists: false})
        }
    }
    else if (command == "forcechess" && isSelfHostedBot()) {
	    	let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            replyAccessDeniedByMessage(message)
        }
		
        else if (args[0]) {

            if (ratingRoles.length == 0) {
                message.reply({ content: 'The server has yet to setup any rating role milestones', failIfNotExists: false })
            }
			
	      		else if (message.mentions.users.size != 1) {
              message.reply({content: `${prefix}forcechess [username] [@user]`, failIfNotExists: false})
            }
            else
            {

              let target = message.mentions.users.first()

              let timestamp = manyMuch[`last-command-${message.author.id}`]

              if ((timestamp == undefined || timestamp + 10 * 1000 < Date.now()) && ratingRoles.length > 0) {
                  queue[`last-command-${message.author.id}`] = Date.now()
                  let result = await fetch(`https://api.chess.com/pub/player/${args[0]}`).then(response => {
                      if (response.status == 404) { // Not Found
                          return null
                      }
                      else if (response.status == 429) { // Rate Limit
                          return "Rate Limit"
                      }
                      else if (response.status == 200) { // Status OK
                          return response.json()
                      }
                  })

                  if (result == null) {
                      message.reply({content: `Username was not found!`, failIfNotExists: false})
                  }
                  else if (result == "Rate Limit") {
                      message.reply({content: `Rate Limit Encountered! Please try again!`, failIfNotExists: false})
                  }
                  else {
                      queue[`chesscom-account-of-${target.id}`] = result.username

                      let embed = new MessageEmbed()
                          .setColor('#0099ff')
                          .setDescription(`Successfully linked [Chess.com Profile](${result.url}) for ${target}`)

                      message.reply({ embeds: [embed], failIfNotExists: false })
                  }
              }
              else {
                  message.reply({content: `Rate Limit Encountered! Please try again!`, failIfNotExists: false})
              }
            }
        }
        else {
            message.reply({content: `${prefix}forcechess [username] [@user]`, failIfNotExists: false})
        }
    }
    else if (command == "prefix")
    {
		let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            replyAccessDeniedByMessage(message)
        }

        else if (args[0].length > 5)
        {
            message.reply({content: `Prefix cannot exceed 5 characters!`, failIfNotExists: false})
        }

        else if (!message.mentions.has(client.user) || message.mentions.users.size != 1) {
            message.reply({content: `To avoid double changing prefixes, you must use this command instead:\n` + '```' + `${ prefix }prefix ${ args[0]} <@${ client.user.id }>` + '```', failIfNotExists: false})
        }
        else
        {
          queue[`guild-prefix-${message.guild.id}`] = args[0]
          message.reply({content: 'Prefix was successfully set to `' + args[0] + '`', failIfNotExists: false})
        }
    }
    else if(command == "addelo")
    {
	    	let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            replyAccessDeniedByMessage(message)
        }
        else if (args.length == 0 || args.length % 2 != 0) {
            message.reply({content: `${prefix}addelo [elo] [@role] (elo2) [@role2] ... ...`, failIfNotExists: false})
        }
        else
        {

          await message.reply({content: `Adding Roles...`, failIfNotExists: false}).then(async msg =>
          {
            let msgToSend = ""



            for (let i = 0; i < (args.length / 2); i++)
            {
                let role = getRoleFromMentionString(message.guild, args[2 * i + 1])

                let result = 'Could not find role'

                if(role)
                {
                    result = addEloCommand(message, ratingRoles, role, args[2 * i + 0])
                }

                if(result == undefined)
                  result = "This role was already added to the bot!"

                else
                {
                  ratingRoles.push(result)            
                  result = "Success."
                }

                msgToSend = msgToSend + (i + 1).toString() + ". " + result + " \n"
            }

            if (msgToSend == "") {
                msgToSend = "Internal Error, Cringe :("
            }

            msg.edit(msgToSend).catch(() => null)
          })
          .catch(() => null)
        }
    }
    else if (command == "getelo") {
        let msgToSend = ""

        for (let i = 0; i < ratingRoles.length; i++)
        {
            msgToSend = msgToSend + "<@&" + ratingRoles[i].id + "> ( " + ratingRoles[i].rating + " ELO ) \n "
        }

        if (msgToSend == "")
        {
            msgToSend = "None."
        }

        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(msgToSend)

        message.reply({ embeds: [embed], failIfNotExists: false })

    }

    else if (command == "resetelo") {
		let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            replyAccessDeniedByMessage(message)
        }
        else
        {
          let msgToSend = `${prefix}addelo `

          for (let i = 0; i < ratingRoles.length; i++) {
              msgToSend = msgToSend + ratingRoles[i].rating + " <@&" + ratingRoles[i].id + "> "
          }

          if (msgToSend == `${prefix}addelo `) {
            
              message.reply({content: `There were no role milestones to delete.`, failIfNotExists: false})
          }
          else {

              ratingRoles = undefined
              
              message.reply({content: `Successfully reset all elo related roles! Command to undo:\n` + '```' + msgToSend + '```', failIfNotExists: false})

              
              message.member.send(`Successfully reset all elo related roles! Command to 
              undo:\n` + '```' + msgToSend + '```').catch(() => null)
              
          }
        }
    }
    else if(command == "addpuzzleelo")
    {
	    	let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin)
		    {
            replyAccessDeniedByMessage(message)
        }
        else if (args.length == 0 || args.length % 2 != 0) {
            message.reply({content: `${prefix}addpuzzleelo [elo] [@role] (elo2) [@role2] ... ...`, failIfNotExists: false})
        }
        else
        {
          await message.reply({content: `Adding Roles...`, failIfNotExists: false}).then(async msg =>
          {
              let msgToSend = ""



              for (let i = 0; i < (args.length / 2); i++)
              {
                  let role = getRoleFromMentionString(message.guild, args[2 * i + 1])

                  let result = 'Could not find role'

                  if(role)
                  {
                      result = addPuzzleEloCommand(message, puzzleRatingRoles, role, args[2 * i + 0])
                  }

                  if(result == undefined)
                    result = "This role was already added to the bot!"

                  else
                  {
                    puzzleRatingRoles.push(result)            
                    result = "Success."
                  }

                  msgToSend = msgToSend + (i + 1).toString() + ". " + result + " \n"
              }

              if (msgToSend == "") {
                  msgToSend = "Internal Error, Cringe :("
              }

              msg.edit(msgToSend).catch(() => null)
          })
          .catch(() => null)
        }
    }
    else if (command == "getpuzzleelo") {
        let msgToSend = ""

        for (let i = 0; i < puzzleRatingRoles.length; i++)
        {
            msgToSend = msgToSend + "<@&" + puzzleRatingRoles[i].id + "> ( " + puzzleRatingRoles[i].rating + " ELO ) \n "
        }

        if (msgToSend == "")
        {
            msgToSend = "None."
        }

        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(msgToSend)

        message.reply({ embeds: [embed], failIfNotExists: false })

    }

    else if (command == "resetpuzzleelo") {
	    	let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            replyAccessDeniedByMessage(message)
        }

        let msgToSend = `${prefix}addpuzzleelo `

        for (let i = 0; i < puzzleRatingRoles.length; i++) {
            msgToSend = msgToSend + puzzleRatingRoles[i].rating + " <@&" + puzzleRatingRoles[i].id + "> "
        }

        if (msgToSend == `${prefix}addpuzzleelo `) {
            message.reply({content: `There were no role milestones to delete.`, failIfNotExists: false})
        }
        else {

            puzzleRatingRoles = undefined

            message.reply({content: `Successfully reset all puzzle elo related roles! Command to undo:\n` + '```' + msgToSend + '```', failIfNotExists: false})
            message.member.send(`Successfully reset all puzzle elo related roles! Command to undo:\n` + '```' + msgToSend + '```').catch(() => null)
        }
    }
    else if (command == "addtitle") {
	    	let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            replyAccessDeniedByMessage(message)
        }
        else if (args.length == 0 || args.length % 2 != 0) {
            message.reply({content: `${prefix}addtitle [title] [@role] (title2) [@role2] ... ...`, failIfNotExists: false})
        }
        else
        {


          await message.reply({content: `Adding Roles...`, failIfNotExists: false}).then(async msg =>
          {
            let msgToSend = ""

            for (let i = 0; i < (args.length / 2); i++) {
                let role = getRoleFromMentionString(message.guild, args[2 * i + 1])

                let result = 'Could not find role'

                if(role)
                {
                    result = addTitleCommand(message, titleRoles, role, args[2 * i + 0])
                }

                if(result == undefined)
                  result = "This role was already added to the bot!"

                else
                {
                  titleRoles.push(result)            
                  result = "Success."
                }

                msgToSend = msgToSend + (i + 1).toString() + ". " + result + " \n"
            }

            if (msgToSend == "") {
                msgToSend = "Internal Error, Cringe :("
            }

            msg.edit(msgToSend).catch(() => null)

          })
          .catch(() => null)
        }
    }
    else if (command == "gettitle") {
        let msgToSend = ""

        for (let i = 0; i < titleRoles.length; i++) {
            msgToSend = msgToSend + "<@&" + titleRoles[i].id + "> ( " + titleRoles[i].title + " ) \n "
        }

        if (msgToSend == "") {
            msgToSend = "None."
        }

        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(msgToSend)

        message.reply({ embeds: [embed], failIfNotExists: false })

    }

    else if (command == "resettitle" || command == "resettitles") {
		let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            replyAccessDeniedByMessage(message)
        }
        else
        {

          let msgToSend = `${prefix}addtitle `

          for (let i = 0; i < titleRoles.length; i++) {
              msgToSend = msgToSend + titleRoles[i].title + " <@&" + titleRoles[i].id + "> "
          }

          if (msgToSend == `${prefix}addtitle `) {
              message.reply({content: `There were no role milestones to delete.`, failIfNotExists: false})
          }
          else {

              titleRoles = undefined

              message.reply({content: `Successfully reset all title related roles! Command to undo:\n` + '```' + msgToSend + '```', failIfNotExists: false})
              message.member.send(`Successfully reset all title related roles! Command to undo:\n` + '```' + msgToSend + '```').catch(() => null)
          }
      }
    }

    else if (command == "setlichessequation") {
        if (!isBotControlAdminByMessage(message, modRoles)) {
            replyAccessDeniedByMessage(message)
        }
        else {
            if (args.length == 0)
            {
                queue[`guild-lichess-rating-equation-${message.guild.id}`] = undefined

                message.reply({content: `Successfully reset Lichess rating equation to default: ${Constant_lichessDefaultRatingEquation}`, failIfNotExists: false})
            }
            else
            {
              let argString = ""

              for (let i = 0; i < args.length; i++) {

                  argString + " " + args[i]
              }

              argString = argString.trim()

              try {
                  Parser.evaluate(argString, { x: 1000 })
                  Parser.evaluate(argString, { x: 0 })
                  Parser.evaluate(argString, { x: -1 })
              }
              catch (error) {
                  message.reply({content: `Invalid formula! Must support preset values of x = 1000, x = 0, x = -1\nError: ${error.message}`, failIfNotExists: false})

                  message.reply({content: `Successfully reset Lichess rating equation to default: ${Constant_lichessDefaultRatingEquation}`, failIfNotExists: false})

                  return;
              }

              queue[`guild-lichess-rating-equation-${message.guild.id}`] = argString
              message.reply(`Successfully set Lichess rating equation to: ${argString}`)
            }
        }
    }

    else if (command == "setchessequation") {
		let isAdmin = await isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            replyAccessDeniedByMessage(message)
        }
        else {
            if (args.length == 0) {
                queue[`guild-chesscom-rating-equation-${message.guild.id}`] = undefined

                message.reply(`Successfully reset Chess.com rating equation to default: ${Constant_chessComDefaultRatingEquation}`)
            }
            else
            {

              let argString = ""

              for (let i = 0; i < args.length; i++) {

                  argString + " " + args[i]
              }

              argString = argString.trim()

              try {
                  Parser.evaluate(argString, { x: 1000 })
                  Parser.evaluate(argString, { x: 0 })
                  Parser.evaluate(argString, { x: -1 })
              }
              catch (error) {
                  message.reply({content: `Invalid formula! Must support preset values of x = 1000, x = 0, x = -1\nError: ${error.message}`, failIfNotExists: false})

                  return;
              }

              queue[`guild-chesscom-rating-equation-${message.guild.id}`] = argString
              message.reply({content: `Successfully set Chess.com rating equation to: ${argString}`, failIfNotExists: false})
            }
        }
    }

    else if (command == "addmod") {
        if (!message.member.permissions.has("MANAGE_GUILD", true)) {
            replyAccessDeniedByMessage(message)
        }
        else {
            let role = getRoleFromMentionString(message.guild, args[0])

            if (!role)
            {
                message.reply(`$(prefix}addmod [@role]`)
            }
            else
            {
              modRoles.push(role.id)

              message.reply({content: `Successfully added the role as a moderator for this bot.`, failIfNotExists: false})
            }
        }
    }

    else if (command == "getmod" || command == "getmods") {
        let msgToSend = ""

        for (let i = 0; i < modRoles.length; i++) {
            msgToSend = msgToSend + "<@&" + modRoles[i] + "> \n "
        }

        if (msgToSend == "") {
            msgToSend = "None."
        }

        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(msgToSend)

        message.reply({ embeds: [embed], failIfNotExists: false })

    }

    else if (command == "resetmod" || command == "resetmods") {
        if (!message.member.permissions.has("MANAGE_GUILD", true)) {
            replyAccessDeniedByMessage(message)
        }
        else {
            
            modRoles = undefined

            message.reply({content: `Successfully removed all moderator roles from this bot.`, failIfNotExists: false})
        }
    }
    else if (command == "privacy") {
            
        message.reply({content: `Check or Enable your DM to see privacy policy`, failIfNotExists: false})

        message.member.send(`The privacy policy may be changed at any time without any warning prior or after the change.\n Data collected that cannot be deleted:\n1. Your Discord account's unique ID, linked to a timestamp of the last time you contacted any external API that I do not own (for now, the API of Chess.com and Lichess.org)\n2. Your Discord Account's unique ID, linked to default data assigned to them by the bot for optimization purposes.\n3. Any server's Guild ID that ever added the bot, linked to default data assigned to them by the bot for optimization purposes.\nData collected that can be deleted:\n1. Your Discord account's unique ID, linked to your account on Lichess.org and Chess.com. This data is saved after you successfully link your account to any of them. The only way to delete the data is unlinking the accounts, which is done by executing the same command used to link, but providing no arguments to the commands.\n2. Any data a server running the bot manually input with any command that contains the word "add" or "set", and can be manually deleted using either the available "reset" commands, or the related "set" command without any arguments.\nBelow is the source code of the bot that contains contact information, demonstrates why and how data is collected, along with who is given any of your data, or your server's data:\nhttps://github.com/eyal282/Chess-ELO-Discord-Bot`).catch(() => null)
    }
    else if (command == "invite") {
        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(`[Invite the Bot](https://discord.com/oauth2/authorize?client_id=886616669093503047&permissions=518014237889&scope=bot) or [Join the Support Server](https://discord.gg/tznbm6XVrJ)`)

        message.reply({ embeds: [embed], failIfNotExists: false })

        message.member.send({ embeds: [embed] }).catch(() => null)
    }
    else if (command == "ping") {
        message.channel.send(`🏓Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms\nThis message will self destruct in 10 seconds.`).then(msg =>
        {
            deleteMessageAfterTime(msg, 10000)
        })
        .catch(() => null)
    }


    queue[`guild-elo-roles-${message.guild.id}`] = ratingRoles
    queue[`guild-puzzle-elo-roles-${message.guild.id}`] = puzzleRatingRoles
    queue[`guild-title-roles-${message.guild.id}`] = titleRoles
    queue[`guild-bot-mods-${message.guild.id}`] = modRoles

    await settings.setMany(queue, true)
});

client.login(mySecret);

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

function addEloCommand(message, ratingRoles, role, elo) {
    for (let i = 0; i < ratingRoles.length; i++) {
        if (ratingRoles[i].id == role.id)
            return undefined
    }

    let template = { id: role.id, rating: elo };

    return template
}

function addPuzzleEloCommand(message, puzzleRatingRoles, role, elo) {
    for (let i = 0; i < puzzleRatingRoles.length; i++) {
        if (puzzleRatingRoles[i].id == role.id)
            return undefined
    }

    let template = { id: role.id, rating: elo };

    return template
}

function addTitleCommand(message, titleRoles, role, title) {
    for (let i = 0; i < titleRoles.length; i++) {
        if (titleRoles[i].id == role.id)
            return undefined
    }

    let template = { id: role.id, title: title };

    return template
}

function addCommandToHelp(result, prefix, commandData) {
    return result + prefix + commandData + '\n'
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
  return message.reply({ content: `Access Denied`, failIfNotExists: false })
}

function isBotSelfHosted()
{
    return client.guilds.cache.size == 1
}