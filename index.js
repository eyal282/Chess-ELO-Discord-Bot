// Critical Note: Changing the project or author names ( changing the team's name or forking the project ) demands you update your URL in Uptime Robot, as it changes as well.


const jsGay = require('./util.js')

const token = process.env["SECRET_BOT_TOKEN"]
const mongoPassword = process.env["SECRET_MONGO_PASSWORD"]

const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;

const Lichess = require('lichess-client')

const passport = require('passport')

var LichessStrategy = require('passport-lichess').Strategy;

const CustomStrategy = require('passport-custom').Strategy;

const lichess_secret = process.env['LICHESS_OAUTH2']

Canvas.registerFont('fonts/ARIAL.TTF', { family: 'arial' });
//const client = new Discord.Client({ partials: ["MESSAGE", "USER", "REACTION"] });

const client = jsGay.client

const Josh = require("@joshdb/core");
const provider = require("@joshdb/mongo");
const fetch = require('node-fetch');


let defaultPrefix = "!"
//const bot = new Discord.Client();

let settings = jsGay.settings

settings.defer.then( async () => {
    let size = await settings.size;
    console.log(`Connected, there are ${size} rows in the database.`);
});

client.on('ready', () => {
  
  jsGay.app.use(passport.initialize());
  jsGay.app.use(passport.session());
  
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
});

const { SlashCommandBuilder } = require('@discordjs/builders');
/*
const command = new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!');

// Raw data that can be used to register a slash command
const rawData = command.toJSON();
*/
const fs = require('fs');

client.commands = new Collection();
let commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

commandFiles = fs.readdirSync('./commands-ephemeral').filter(file => file.endsWith('.js'));

let ephemeralCommands = []

for (const file of commandFiles) {

	const command = require(`./commands-ephemeral/${file}`);
	client.commands.set(command.data.name, command);

  ephemeralCommands.push(command)
}

// On Slash Command
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

  else if(!interaction.guild)
  {
		return interaction.reply({ content: 'This bot does not accept DM Slash Commands', ephemeral: true });
  }
	try
  {
    if(ephemeralCommands.indexOf(command) == -1)
    {
      let ephemeral = interaction.options.getBoolean('ephemeral');

      await interaction.deferReply({ephemeral: ephemeral});
    }
    else
    {
      await interaction.deferReply({ephemeral: true});
    }
    
    let goodies = {}
		await command.execute(client, interaction, settings, goodies);
	} catch (error) {
		console.error(error);
		return interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

deploySlashCommands() // Comment this line to avoid deploying the slash commands

//deployGlobalSlashCommands() // Comment this line to avoid deploying the global slash commands

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


client.on("guildMemberAdd", async function(member){
  
    let fakeMessage = {}

    fakeMessage.guild = member.guild
    fakeMessage.author = member.user
    fakeMessage.member = member

    let timestamp = await settings.get(`last-updated-${fakeMessage.author.id}`)

    if ((timestamp == undefined || timestamp + 120 * 1000 < Date.now() || (jsGay.isBotSelfHosted() && timestamp + 10 * 1000 < Date.now())))
    {
      // You can sneak a fake message if you assign .guild, .author and .member
      jsGay.updateProfileDataByMessage(fakeMessage, false)
    }
    else
    {
      // You can sneak a fake message if you assign .guild, .author and .member
      jsGay.updateProfileDataByMessage(fakeMessage, true)
    }
});
/* Emitted whenever the bot joins a guild.
PARAMETER    TYPE         DESCRIPTION
guild        Guild        The created guild    */
client.on("guildCreate", async function(guild){
    console.log(`the client joins a guild: ${guild.id} ---> ${guild.name}`);

    client.user.setActivity(` ${client.guilds.cache.size} servers | Mention me to find the prefix`, { type: `WATCHING` });

    if(!jsGay.botHasBasicPermissionsByGuild(guild))
    { 
        let targetMember = await guild.fetchOwner().catch(() => null)

        if(jsGay.botHasPermissionByGuild(guild, "VIEW_AUDIT_LOG"))
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

// On Retry Link Button Pressed
client.on('interactionCreate', async(interaction) => {
	if (!interaction.isButton() || !interaction.customId.includes(interaction.user.id) || !interaction.customId.includes("retry-link")) return;

  let queue = {}

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
                                let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Username was not found!`)
                      message.reply({embeds: [embed], failIfNotExists: false})
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

            if(result.profile?.location?.includes(fullDiscordUsername) || result.profile?.bio?.includes(fullDiscordUsername))
            {
                queue[`lichess-account-of-${message.author.id}`] = result.username
                queue[`cached-lichess-account-data-of-${message.author.id}`] = result
                jsGay.updateProfileDataByMessage(message, true)

                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully linked your [Lichess Profile](${result.url})`)

                interaction.reply({ embeds: [embed], failIfNotExists: false})

            }
            else {
                let attachment = await jsGay.buildCanvasForLichess(message.author.username + "#" + message.author.discriminator)

                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setURL(result.url)
                    .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Lichess Profile](https://lichess.org/account/profile)')

                    const row = new MessageActionRow()
                      .addComponents(
                        new MessageButton()
                          .setCustomId(interaction.user.id)
                          .setLabel(`Retry Link for ${username}`)
                          .setStyle('PRIMARY'),
                      );

                      interaction.reply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false, files: [attachment]})
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
            let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`User was not found!'`)
              interaction.reply({ embeds: [embed], failIfNotExists: false })
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
                  jsGay.updateProfileDataByMessage(message, true)

                  let embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setDescription(`Successfully linked your [Chess.com Profile](${result.url})`)


                    interaction.reply({ embeds: [embed], failIfNotExists: false })

              }
              else {
                  let attachment = await jsGay.buildCanvasForChessCom(message.author.username + "#" + message.author.discriminator)

                  let embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setURL(`https://www.chess.com/member/${username}`)
                      .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Chess.com Profile](https://www.chess.com/settings)')

                        const row = new MessageActionRow()
                        .addComponents(
                          new MessageButton()
                            .setCustomId(message.author.id)
                            .setLabel(`Retry Link for ${username}`)
                            .setStyle('PRIMARY'),
                        );

                        interaction.reply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false, files: [attachment] })
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


// On Embed Button Pressed
client.on('interactionCreate', async(interaction) => {
	if (!interaction.isButton() || !interaction.customId.includes(interaction.user.id))
    return;
      
  let bUpdate = false

  let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, lastState] = await jsGay.getCriticalData(interaction)

  let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles)

  ratingRoles = obj.ratingRoles
  puzzleRatingRoles = obj.puzzleRatingRoles
  titleRoles = obj.titleRoles
  let guildRoles = obj.guildRoles

  let queue = {}

  let code_verifier = jsGay.randomSecureString()
  
  if(interaction.customId.startsWith("link-lichess"))
  {
      let state = jsGay.randomSecureString(21)

      let challenge = btoa(jsGay.sha256(code_verifier))


      let callbackEnd = btoa(jsGay.sha256(jsGay.randomSecureString(64)))
      
      passport.use(new LichessStrategy({
          clientID: `Eyal282-Chess-ELO-Role-Bot-${jsGay.client.user.id}`,
          callbackURL: `https://Chess-ELO-Discord-Bot.chess-elo-role-bot.repl.co/auth/lichess/callback/${callbackEnd}`
        },
        function(accessToken, refreshToken, profile, cb)
        {
            if(profile.id)
              return cb(null, profile.id);

            else
              return cb(404, "Authentication failed")
        }
      ));        
       jsGay.app.get(`/auth/lichess/callback/${callbackEnd}`,
         passport.authenticate('lichess', { failureRedirect: '/' }),
            async function(req, res) {
              // Successful authentication, redirect home.

              res.redirect('/');

              let userName = req.user

              await settings.set(`lichess-account-of-${interaction.user.id}`, userName)

              await jsGay.updateProfileDataByInteraction(interaction, false)
              
              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully linked your [Lichess Profile](https://lichess.org/@/${userName})`)

              interaction.followUp({ embeds: [embed], failIfNotExists: false, ephemeral: true })

              return
            }
      );

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)

      embed = new MessageEmbed()
        .setColor('#0099ff')
        .setDescription(`Sign in with Lichess by pressing the button below:`)

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setLabel(`Sign in with Lichess`)
            .setURL(`https://chess-elo-discord-bot.chess-elo-role-bot.repl.co/auth/lichess/callback/${callbackEnd}`)
            .setStyle('LINK')
      );
  
      await interaction.reply({ embeds: [embed], components: [row], failIfNotExists: false, ephemeral: true })
  }
  
  else if(interaction.customId.startsWith("link-chesscom"))
  {
      let state = jsGay.randomSecureString(64)

      let challenge = encodeURIComponent((jsGay.sha256(code_verifier)))

      let callbackEnd = challenge

        passport.use(new CustomStrategy(
            async function(req, done) {
                console.log(req)
                let code = req.query.code
                let body = `grant_type=authorization_code&client_id=3169b266-35d3-11ec-885b-3b9e2d963eb0&redirect_uri=https://chess-elo-discord-bot.chess-elo-role-bot.repl.co/auth/chesscom/callback&code=${code}&code_verifier=${jsGay.randomSecureString()}`

                const response = await fetch(`https://oauth.chess.com/token`, {
                method: 'POST',
                body: body,
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Host': 'https://oauth.chess.com' }
                });

                console.log(response)
                done(null, req);
                

            })
        );      
      jsGay.app.get(`/auth/chesscom/callback`,
         passport.authenticate("custom", { failureRedirect: '/' }),
            async function(req, res) {
              // Successful authentication, redirect home.

              //res.redirect('/');
             

              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully linked your [Chess.com Profile](chess.com/member/${"Test"})`)

              interaction.followUp({ embeds: [embed], failIfNotExists: false, ephemeral: true })

              return
            }
      );
      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles
      queue[`last-state-of-${interaction.user.id}`] = state

      await settings.setMany(queue, true)

      embed = new MessageEmbed()
        .setColor('#0099ff')
        .setDescription(`Sign in with Chess.com by pressing the button below:`)

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setLabel(`Sign in with Chess.com`)
            .setURL(`https://oauth.chess.com/authorize?client_id=3169b266-35d3-11ec-885b-3b9e2d963eb0&redirect_uri=https://chess-elo-discord-bot.chess-elo-role-bot.repl.co/auth/chesscom/callback&response_type=code&scope=profile&state=${state}&code_challenge=${callbackEnd}&code_challenge_method=S256`)
            .setStyle('LINK')
      );
  
      await interaction.reply({ embeds: [embed], components: [row], failIfNotExists: false, ephemeral: true })
  }
  
  else if(interaction.customId.startsWith("unlink-lichess"))
  {
      queue[`lichess-account-of-${interaction.user.id}`] = null
      queue[`cached-lichess-account-data-of-${interaction.user.id}`] = undefined
      
      bUpdate = true

      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`Successfully unlinked your Lichess Profile`)

      await interaction.reply({ embeds: [embed], failIfNotExists: false, ephemeral: true })
  }
  else if(interaction.customId.startsWith("unlink-chesscom"))
  {
      queue[`chesscom-account-of-${interaction.user.id}`] = null
      queue[`cached-chesscom-account-data-of-${interaction.user.id}`] = undefined

      bUpdate = true

      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`Successfully unlinked your Chess.com Profile`)

      await interaction.reply({ embeds: [embed], failIfNotExists: false, ephemeral: true })
  }

  await settings.setMany(queue, true)


  if(bUpdate)
  {
    jsGay.updateProfileDataByInteraction(interaction, true)
  }
});

// All messages.
client.on("messageCreate", async message => {
    if (message.author.bot) return;

  //  if (!jsGay.botHasMessagingPermissionsByMessage(message)) return;
    /*
    let prefix = await settings.get(`guild-prefix-${message.guild.id}`)

    if (prefix == undefined) prefix = defaultPrefix

    if (message.content.indexOf(prefix) === 0) return;
    */
    /*
    if (message.mentions.has(client.user) && message.mentions.users.size == 1) {
        let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription('Prefix is `' + prefix + '`\nThis message will self destruct in 10 seconds.')
        message.reply({embeds: [embed]}).then(msg =>
        {
            jsGay.deleteMessageAfterTime(msg, 10000)
        })
        .catch(() => null)
    }
    else
    */
    {
        let timestamp = await settings.get(`last-updated-${message.author.id}`)

        if ((timestamp == undefined || timestamp + 120 * 1000 < Date.now() || (jsGay.isBotSelfHosted() && timestamp + 10 * 1000 < Date.now())))
        {
          jsGay.updateProfileDataByMessage(message, false)
        }
    }
});
/*
// Messages with the prefix
client.on("messageCreate", async message => {
    if (message.author.bot) return;

    if (!jsGay.botHasMessagingPermissionsByMessage(message)) return;

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
        lichessRatingEquation = jsGay.Constant_lichessDefaultRatingEquation
    }

    let chessComRatingEquation = manyMuch[`guild-chesscom-rating-equation-${message.guild.id}`]

    if (chessComRatingEquation == undefined) {
        chessComRatingEquation = jsGay.Constant_chessComDefaultRatingEquation
    }

    let modRoles = manyMuch[`guild-bot-mods-${message.guild.id}`]

    if (modRoles == undefined) {
        modRoles = []
    }

    let guildRoles
    
    await message.guild.roles.fetch()
    .then(roles => 
        {
            guildRoles = roles
            
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
        result = jsGay.addCommandToHelp(result, prefix, `lichess [username] ---> Tries to link your Lichess Account. Leave user empty to unlink`)
        result = jsGay.addCommandToHelp(result, prefix, `chess [username] ---> Tries to link your Chess.com Account. Leave user empty to unlink`)
        result = jsGay.addCommandToHelp(result, prefix, `profile [@user] ---> Shows the profile of a target user. Leave user empty to see your profile`)
        result = jsGay.addCommandToHelp(result, prefix, `privacy ---> Privacy policy`)
        result = jsGay.addCommandToHelp(result, prefix, `invite ---> Invite Link`)
        result = jsGay.addCommandToHelp(result, prefix, `ping ---> Lag of the bot`)
        result = jsGay.addCommandToHelp(result, prefix, `prefix [prefix] ---> Changes the bot's prefix, must mention the bot doing so`)
        result = jsGay.addCommandToHelp(result, prefix, `addelo [elo] [@role] ---> Adds a new role milestone`)
        result = jsGay.addCommandToHelp(result, prefix, `addpuzzleelo [elo] [@role] ---> Adds a new puzzle role milestone`)
        result = jsGay.addCommandToHelp(result, prefix, `addtitle [title] [@role] ---> Adds a new role by title. Example: ${prefix}addtitle GM @Grandmaster IM @InterMaster NM @NatMaster`)
        result = jsGay.addCommandToHelp(result, prefix, `getelo ---> Prints all role milestones`)
        result = jsGay.addCommandToHelp(result, prefix, `getpuzzleelo ---> Prints all puzzle role milestones`)
        result = jsGay.addCommandToHelp(result, prefix, `gettitle ---> Prints all titles that gain a role`)
        result = jsGay.addCommandToHelp(result, prefix, `getmod ---> Prints all the bot's moderators`)
        result = jsGay.addCommandToHelp(result, prefix, `resetelo ---> Deletes all role milestones. This command will send you a copy of what got reset`)
        result = jsGay.addCommandToHelp(result, prefix, `resetpuzzleelo ---> Deletes all puzzle role milestones. This command will send you a copy of what got reset`)
        result = jsGay.addCommandToHelp(result, prefix, `resettitle ---> Deletes all title role milestones. This command will send you a copy of what got reset`)
        result = jsGay.addCommandToHelp(result, prefix, `setlichessequation ---> Sets the equation for inflating or deflating lichess rating, x = User's current rating. Default: '${jsGay.Constant_lichessDefaultRatingEquation}'. Current: '${lichessRatingEquation}'`)
        result = jsGay.addCommandToHelp(result, prefix, `setchessequation [equation] ---> Sets the equation for inflating or deflating chess.com rating, x = User's current rating. Default: '${jsGay.Constant_chessComDefaultRatingEquation}'. Current: '${chessComRatingEquation}'`)
        result = jsGay.addCommandToHelp(result, prefix, `addmod [@role] ---> Adds a role as a Moderator`)
        result = jsGay.addCommandToHelp(result, prefix, `resetmod ---> Resets all Moderators.`)

        if(jsGay.isBotSelfHosted())
        {
            result = jsGay.addCommandToHelp(result, prefix, `forcelichess [username] [@user]  ---> Links a user to Lichess.org, ignoring linking condition`)
            result = jsGay.addCommandToHelp(result, prefix, `forcechess [username] [@user] ---> Links a user to Chess.org, ignoring linking condition`)
        }

        result = result + "Note: -1 ELO stands for either unrated or provisonary elo (Shows (?) on Lichess))\n"
        result = result + "Note: Provisionary rating in Chess.com is artifically calculated by Lichess standards.\n"
        result = result + "Note: Due to Chess.com limits, only puzzle rating of Lichess is calculated at all.\n"
        result = result + "Title List: `GM` `WGM` `IM` `WIM` `FM` `WFM` `NM` `CM` `WCM` `WNM` `LM` `BOT`\n"
        let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(result)
        message.reply({embeds: [embed], failIfNotExists: false})
    }
    else if (command == "lichess") {
        //jsGay.deleteMessageAfterTime(message, 100);

        if (args[0]) {
            

            if (ratingRoles.length == 0) {
              let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription('The server has yet to setup any rating role milestones')
                message.reply({ embeds: [embed], failIfNotExists: false })
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
                    let embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setDescription('User was not found!')
                    message.reply({ embeds: [embed], failIfNotExists: false })
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
                          jsGay.updateProfileDataByMessage(message, true)

                          let embed = new MessageEmbed()
                              .setColor('#0099ff')
                              .setDescription(`Successfully linked your [Lichess Profile](${result.url})`)

                          message.reply({ embeds: [embed], failIfNotExists: false })

                      }
                      else {
                          let attachment = await jsGay.buildCanvasForLichess(message.author.username + "#" + message.author.discriminator)

                          let embed = new MessageEmbed()
                              .setColor('#0099ff')
                              .setURL(result.url)
                              .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Lichess Profile](https://lichess.org/account/profile)')

                              const row = new MessageActionRow()
                                .addComponents(
                                  new MessageButton()
                                    .setCustomId(message.author.id)
                                    .setLabel(`Retry Link for ${args[0]}`)
                                    .setStyle('PRIMARY'),
                                );

                                message.reply({ embeds: [embed], components: [row], failIfNotExists: false, files: [attachment] })
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

            jsGay.updateProfileDataByMessage(message, true)

            let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully unlinked your Lichess Profile`)

            message.reply({ embeds: [embed], failIfNotExists: false })

        }
    }
    else if (command == "chess") {

        if (ratingRoles.length == 0) {
            let embed = new MessageEmbed()
                  .setColor('#0099ff')
                  .setDescription('The server has yet to setup any rating role milestones')
            message.reply({ embeds: [embed], failIfNotExists: false })
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
                  let embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setDescription('User was not found!')
                  message.reply({ embeds: [embed], failIfNotExists: false })
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
                        jsGay.updateProfileDataByMessage(message, true)

                        let embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setDescription(`Successfully linked your [Chess.com Profile](${result.url})`)


                         message.reply({ embeds: [embed], failIfNotExists: false })

                    }
                    else {
 
                        let attachment = await jsGay.buildCanvasForChessCom(message.author.username + "#" + message.author.discriminator)

                      
                        let embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setURL(`https://www.chess.com/member/${args[0]}`)
                            .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Chess.com Profile](https://www.chess.com/settings)')

                             const row = new MessageActionRow()
                              .addComponents(
                                new MessageButton()
                                  .setCustomId(message.author.id)
                                  .setLabel(`Retry Link for ${args[0]}`)
                                  .setStyle('PRIMARY'),
                              );

                              message.reply({ embeds: [embed], components: [row], failIfNotExists: false, files: [attachment] })
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

            jsGay.updateProfileDataByMessage(message, true)

            let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully unlinked your Chess.com Profile`)

            message.reply({ embeds: [embed], failIfNotExists: false })
        }
    }
 else if (command == "profile") {
      //jsGay.deleteMessageAfterTime(message, 2000);

      if (ratingRoles.length == 0) {
          let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription('The server has yet to setup any rating role milestones')
          message.reply({ embeds: [embed], failIfNotExists: false })
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
            corresRating = result.chess_daily.last.rating.toString() + (result.chess_daily.last.rd >= jsGay.Constant_ProvisionalRD ? "" : "?")

          if (result.chess_blitz)
            blitzRating = result.chess_blitz.last.rating.toString() + (result.chess_blitz.last.rd >= jsGay.Constant_ProvisionalRD ? "" : "?")

          if (result.chess_rapid)
            rapidRating = result.chess_rapid.last.rating.toString() + (result.chess_rapid.last.rd >= jsGay.Constant_ProvisionalRD ? "" : "?")

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
  	else if (command == "forcelichess" && jsGay.isBotSelfHosted()) {
        //jsGay.deleteMessageAfterTime(message, 2000);
	    	let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByMessage(message)
        }
        else if (args[0]) {

            if (ratingRoles.length == 0) {
              let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription('The server has yet to setup any rating role milestones')
              message.reply({ embeds: [embed], failIfNotExists: false })
            }
			
		      	else if (message.mentions.users.size != 1) {
              let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`${prefix}forcelichess [username] [@user]`)
                message.reply({ embeds: [embed], failIfNotExists: false })
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
                      let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Username was not found!`)
                      message.reply({embeds: [embed], failIfNotExists: false})
                  }
                  else if (result == "Rate Limit") {
                    let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Rate Limit Encountered! Please try again!`)
                      message.reply({embeds: [embed], failIfNotExists: false})
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
                let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Rate Limit Encountered! Please try again!`)
                  message.reply({embeds: [embed], failIfNotExists: false})
              }
            }
        }
        else {
           let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`${prefix}forcelichess [username] [@user]`)
            message.reply({embeds: [embed], failIfNotExists: false})
        }
    }
    else if (command == "forcechess" && isSelfHostedBot()) {
	    	let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByMessage(message)
        }
		
        else if (args[0]) {

            if (ratingRoles.length == 0) {
              let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription('The server has yet to setup any rating role milestones')
                message.reply({ embeds: [embed], failIfNotExists: false })
            }
			
	      		else if (message.mentions.users.size != 1) {
              let embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setDescription(`${prefix}forcechess [username] [@user]`)
              message.reply({embeds: [embed], failIfNotExists: false})
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
                      let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Username was not found!`)
                      message.reply({embeds: [embed], failIfNotExists: false})
                  }
                  else if (result == "Rate Limit") {
                    let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Rate Limit Encountered! Please try again!`)
                      message.reply({embeds: [embed], failIfNotExists: false})
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
                  let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Rate Limit Encountered! Please try again!`)
                      message.reply({embeds: [embed], failIfNotExists: false})
              }
            }
        }
        else {
          let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`${prefix}forcechess [username] [@user]`)
            message.reply({embeds: [embed], failIfNotExists: false})
        }
    }
    else if (command == "prefix")
    {
		let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByMessage(message)
        }

        else if (args[0].length > 5)
        {
          let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Prefix cannot exceed 5 characters!`)
            message.reply({embeds: [embed], failIfNotExists: false})
        }

        else if (!message.mentions.has(client.user) || message.mentions.users.size != 1) {
            let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`To avoid double changing prefixes, you must use this command instead:\n` + '```' + `${ prefix }prefix ${ args[0]} <@${ client.user.id }>` + '```')
            message.reply({embeds: [embed], failIfNotExists: false})
        }
        else
        {
          queue[`guild-prefix-${message.guild.id}`] = args[0]
          let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription('Prefix was successfully set to `' + args[0] + '`')
          message.reply({embeds: [embed], failIfNotExists: false})
        }
    }
    else if(command == "addelo")
    {
	    	let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByMessage(message)
        }
        else if (args.length == 0 || args.length % 2 != 0) {
            let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`${prefix}addelo [elo] [@role] (elo2) [@role2] ... ...`)
            message.reply({embeds: [embed], failIfNotExists: false})
        }
        else
        {
          let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Adding Roles...`)
          await message.reply({embeds: [embed], failIfNotExists: false}).then(async msg =>
          {
            let msgToSend = ""



            for (let i = 0; i < (args.length / 2); i++)
            {
                let role = jsGay.getRoleFromMentionString(message.guild, args[2 * i + 1])

                let result = 'Could not find role'

                if(role)
                {
                    result = jsGay.addEloCommand(message, ratingRoles, role, args[2 * i + 0], guildRoles)
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
		let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByMessage(message)
        }
        else
        {
          let msgToSend = `${prefix}addelo `

          for (let i = 0; i < ratingRoles.length; i++) {
              msgToSend = msgToSend + ratingRoles[i].rating + " <@&" + ratingRoles[i].id + "> "
          }

          if (msgToSend == `${prefix}addelo `) {
              let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`There were no role milestones to delete.`)
              message.reply({embeds: [embed], failIfNotExists: false})
          }
          else {

              ratingRoles = undefined
              
              let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully reset all elo related roles! Command to undo:\n\`${msgToSend}\``)
              message.reply({embeds: [embed], failIfNotExists: false})

              message.member.send(`Successfully reset all elo related roles! Command to 
              undo:\n` + '```' + msgToSend + '```').catch(() => null)
              
          }
        }
    }
    else if(command == "addpuzzleelo")
    {
	    	let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin)
		    {
            jsGay.replyAccessDeniedByMessage(message)
        }
        else if (args.length == 0 || args.length % 2 != 0) {
            let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`${prefix}addpuzzleelo [elo] [@role] (elo2) [@role2] ... ...`)
            message.reply({embeds: [embed], failIfNotExists: false})
        }
        else
        {
          let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Adding Roles...`)
          await message.reply({embeds: [embed], failIfNotExists: false}).then(async msg =>
          {
              let msgToSend = ""



              for (let i = 0; i < (args.length / 2); i++)
              {
                  let role = jsGay.getRoleFromMentionString(message.guild, args[2 * i + 1])

                  let result = 'Could not find role'

                  if(role)
                  {
                      result = jsGay.addPuzzleEloCommand(message, puzzleRatingRoles, role, args[2 * i + 0], guildRoles)
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
	    	let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByMessage(message)
        }

        let msgToSend = `${prefix}addpuzzleelo `

        for (let i = 0; i < puzzleRatingRoles.length; i++) {
            msgToSend = msgToSend + puzzleRatingRoles[i].rating + " <@&" + puzzleRatingRoles[i].id + "> "
        }

        if (msgToSend == `${prefix}addpuzzleelo `) {
            let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`There were no role milestones to delete.`)
            message.reply({embeds: [embed], failIfNotExists: false})
        }
        else {

            puzzleRatingRoles = undefined

            let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully reset all puzzle elo related roles! Command to undo:\n` + '```' + msgToSend + '```')
            message.reply({embeds: [embed], failIfNotExists: false})
            message.member.send(`Successfully reset all puzzle elo related roles! Command to undo:\n` + '```' + msgToSend + '```').catch(() => null)
        }
    }
    else if (command == "addtitle") {
	    	let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByMessage(message)
        }
        else if (args.length == 0 || args.length % 2 != 0) {
          let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`${prefix}addtitle [title] [@role] (title2) [@role2] ... ...`)
            message.reply({embeds: [embed], failIfNotExists: false})
        }
        else
        {


          let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Adding Roles...`)
          await message.reply({embeds: [embed], failIfNotExists: false}).then(async msg =>
          {
            let msgToSend = ""

            for (let i = 0; i < (args.length / 2); i++) {
                let role = jsGay.getRoleFromMentionString(message.guild, args[2 * i + 1])

                let result = 'Could not find role'

                if(role)
                {
                    result = jsGay.addTitleCommand(message, titleRoles, role, args[2 * i + 0], guildRoles)
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
		let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByMessage(message)
        }
        else
        {

          let msgToSend = `${prefix}addtitle `

          for (let i = 0; i < titleRoles.length; i++) {
              msgToSend = msgToSend + titleRoles[i].title + " <@&" + titleRoles[i].id + "> "
          }

          if (msgToSend == `${prefix}addtitle `) {
              let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`There were no role milestones to delete.`)
              message.reply({embeds: [embed], failIfNotExists: false})
          }
          else {

              titleRoles = undefined

              let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully reset all title related roles! Command to undo:\n` + '```' + msgToSend + '```')
              message.reply({embeds: [embed], failIfNotExists: false})
              message.member.send(`Successfully reset all title related roles! Command to undo:\n` + '```' + msgToSend + '```').catch(() => null)
          }
      }
    }

    else if (command == "setlichessequation") {
        if (!jsGay.isBotControlAdminByMessage(message, modRoles)) {
            jsGay.replyAccessDeniedByMessage(message)
        }
        else {
            if (args.length == 0)
            {
                queue[`guild-lichess-rating-equation-${message.guild.id}`] = undefined

                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully reset Lichess rating equation to default: ${jsGay.Constant_lichessDefaultRatingEquation}`)
                message.reply({embeds: [embed], failIfNotExists: false})
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
                  let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Invalid formula! Must support preset values of x = 1000, x = 0, x = -1\nError: ${error.message}`)
                  message.reply({embeds: [embed], failIfNotExists: false})

                  embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully reset Lichess rating equation to default: ${jsGay.Constant_lichessDefaultRatingEquation}`)
                  message.reply({embeds: [embed], failIfNotExists: false})

                  return;
              }

              queue[`guild-lichess-rating-equation-${message.guild.id}`] = argString
              message.reply(`Successfully set Lichess rating equation to: ${argString}`)
            }
        }
    }

    else if (command == "setchessequation") {
		let isAdmin = await jsGay.isBotControlAdminByMessage(message, modRoles)
		
        if (!isAdmin) {
            jsGay.replyAccessDeniedByMessage(message)
        }
        else {
            if (args.length == 0) {
                queue[`guild-chesscom-rating-equation-${message.guild.id}`] = undefined

                message.reply(`Successfully reset Chess.com rating equation to default: ${jsGay.Constant_chessComDefaultRatingEquation}`)
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
                  let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Invalid formula! Must support preset values of x = 1000, x = 0, x = -1\nError: ${error.message}`)
                  message.reply({embeds: [embed], failIfNotExists: false})

                  return;
              }

              queue[`guild-chesscom-rating-equation-${message.guild.id}`] = argString
              let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully set Chess.com rating equation to: ${argString}`)
              message.reply({embeds: [embed], failIfNotExists: false})
            }
        }
    }

    else if (command == "addmod") {
        if (!message.member.permissions.has("MANAGE_GUILD", true)) {
            jsGay.replyAccessDeniedByMessage(message)
        }
        else {
            let role = jsGay.getRoleFromMentionString(message.guild, args[0])

            if (!role)
            {
                message.reply(`$(prefix}addmod [@role]`)
            }
            else
            {
              modRoles.push(role.id)

              let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully added the role as a moderator for this bot.`)
              message.reply({embeds: [embed], failIfNotExists: false})
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
            jsGay.replyAccessDeniedByMessage(message)
        }
        else {
            
            modRoles = undefined

            let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Successfully removed all moderator roles from this bot.`)
            message.reply({embeds: [embed], failIfNotExists: false})
        }
    }
    else if (command == "privacy") {
        let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription(`Check or Enable your DM to see privacy policy`)
        message.reply({embeds: [embed], failIfNotExists: false})

        message.member.send(`The privacy policy may be changed at any time without any warning prior or after the change.\n Data collected that cannot be deleted:\n1. Your Discord account's unique ID, linked to a timestamp of the last time you contacted any external API that I do not own (for now, the API of Chess.com and Lichess.org)\n2. Your Discord Account's unique ID, linked to default data assigned to them by the bot for optimization purposes.\n3. Any server's Guild ID that ever added the bot, linked to default data assigned to them by the bot for optimization purposes.\nData collected that can be deleted:\n1. Your Discord account's unique ID, linked to your account on Lichess.org and Chess.com. This data is saved after you successfully link your account to any of them. The only way to delete the data is unlinking the accounts, which is done by executing the same command used to link, but providing no arguments to the commands.\n2. Any data a server running the bot manually input with any command that contains the word "add" or "set", and can be manually deleted using either the available "reset" commands, or the related "set" command without any arguments.\nBelow is the source code of the bot that contains contact information, demonstrates why and how data is collected, along with who is given any of your data, or your server's data:\nhttps://github.com/eyal282/Chess-ELO-Discord-Bot`).catch(() => null)
    }
    else if (command == "invite") {
        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(`[Invite the Bot](https://discord.com/api/oauth2/authorize?client_id=886616669093503047&permissions=518014229697&scope=bot%20applications.commands) or [Join the Support Server](https://discord.gg/tznbm6XVrJ)`)

        message.reply({ embeds: [embed], failIfNotExists: false })

        message.member.send({ embeds: [embed] }).catch(() => null)
    }
    else if (command == "ping") {
      let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`🏓Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms\nThis message will self destruct in 10 seconds.`)
        message.channel.send({embeds: [embed]}).then(msg =>
        {
            jsGay.deleteMessageAfterTime(msg, 10000)
        })
        .catch(() => null)
    }


    queue[`guild-elo-roles-${message.guild.id}`] = ratingRoles
    queue[`guild-puzzle-elo-roles-${message.guild.id}`] = puzzleRatingRoles
    queue[`guild-title-roles-${message.guild.id}`] = titleRoles
    queue[`guild-bot-mods-${message.guild.id}`] = modRoles

    await settings.setMany(queue, true)
});
*/
function deploySlashCommands()
{
  const { REST } = require('@discordjs/rest');
  const { Routes } = require('discord-api-types/v9');
  const { clientId, guildId } = require('./config.json');

  const commands = [];
  
  let commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  
  commandFiles = fs.readdirSync('./commands-ephemeral').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands-ephemeral/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '9' }).setToken(token);

  rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Successfully registered guild application commands.'))
    .catch(console.error);
}


function deployGlobalSlashCommands()
{
  const { REST } = require('@discordjs/rest');
  const { Routes } = require('discord-api-types/v9');
  const { clientId, guildId } = require('./config.json');

  const commands = [];
  
  let commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  
  commandFiles = fs.readdirSync('./commands-ephemeral').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands-ephemeral/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '9' }).setToken(token);
  
  rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
    .then(() => console.log('Successfully unregistered guild application commands.'))
    .catch(console.error);

  rest.put(Routes.applicationCommands(clientId), { body: commands })
    .then(() => console.log('Successfully registered global application commands.'))
    .catch(console.error);
}

module.exports = { client }