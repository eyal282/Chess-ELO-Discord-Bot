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

// deploySlashCommands() // Comment this line to avoid deploying the slash commands


// deployGlobalSlashCommands() // Comment this line to avoid deploying the global slash commands

client.on('ready', () => {
    console.log("Chess ELO Bot has been loaded.");

    client.user.setActivity(` ${client.guilds.cache.size} servers | Try /invite`, { type: `WATCHING` });

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

    client.user.setActivity(` ${client.guilds.cache.size} servers | Try /invite`, { type: `WATCHING` });

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

    client.user.setActivity(` ${client.guilds.cache.size} servers | Try /invite`, { type: `WATCHING` });
});


// On Retry Link Button Pressed
client.on('interactionCreate', async(interaction) => {
	if (!interaction.isButton() || !interaction.customId.includes(interaction.user.id) || !interaction.customId.includes("retry-link")) return;

   await interaction.deferReply({ephemeral: true})
   

  let queue = {}

  let bLichess = interaction.message.embeds[0].url.includes("lichess.org") || interaction.message.embeds[0].description.includes("lichess.org")

  let url = interaction.message.embeds[0].url

  .replace('\\', '/')


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
                      interaction.editReply({embeds: [embed], failIfNotExists: false, ephemeral: true})
        }
        else if (result == "Rate Limit") {
            let embed = new MessageEmbed()
              .setColor('#0099ff')
              .setURL(`https://lichess.org/@/${username}`)
              .setDescription('Rate Limit Encountered! Please try again!')

              const row = new MessageActionRow()
                .addComponents(
                  new MessageButton()
                    .setCustomId(`retry-link-${interaction.user.id}`)
                    .setURL(`https://lichess.org/@/${username}`)
                    .setLabel(`Retry Link for ${username}`)
                    .setStyle('PRIMARY'),
                );


              interaction.editReply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false })
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

                interaction.editReply({ embeds: [embed], failIfNotExists: false})

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
                          .setCustomId(`retry-link-${interaction.user.id}`)
                          .setLabel(`Retry Link for ${username}`)
                          .setStyle('PRIMARY'),
                      );
					

					interaction.editReply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false, files: [attachment]})
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
              .setCustomId(`retry-link-${interaction.user.id}`)
              .setLabel(`Retry Link for ${username}`)
              .setStyle('PRIMARY'),
          );


        interaction.editReply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false })
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
              interaction.editReply({ embeds: [embed], failIfNotExists: false })
          }
          else if (result == "Rate Limit") {
                let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setURL(`https://www.chess.com/member/${username}`)
                .setDescription('Rate Limit Encountered! Please try again!')

                const row = new MessageActionRow()
                  .addComponents(
                    new MessageButton()
                      .setCustomId(`retry-link-${interaction.user.id}`)
                      .setLabel(`Retry Link for ${username}`)
                      .setStyle('PRIMARY'),
                  );

                interaction.editReply({ embeds: [embed], components: [row], ephemeral: true,  failIfNotExists: false })
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

                    interaction.repeditReplyy({ embeds: [embed], failIfNotExists: false })

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
                            .setCustomId(`retry-link-${interaction.user.id}`)
                            .setLabel(`Retry Link for ${username}`)
                            .setStyle('PRIMARY'),
                        );

                        interaction.editReply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false, files: [attachment] })
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
                  .setCustomId(`retry-link-${interaction.user.id}`)
                  .setLabel(`Retry Link for ${username}`)
                  .setStyle('PRIMARY'),
              );

            interaction.editReply({ embeds: [embed], components: [row], ephemeral: true, failIfNotExists: false })
      }
  }

  await settings.setMany(queue, true)
});


// On Embed Button Pressed
client.on('interactionCreate', async(interaction) => {
	if (!interaction.isButton())
    return;

	
 
  let bUpdate = false

  let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole] = await jsGay.getCriticalData(interaction)

  let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole)

  ratingRoles = obj.ratingRoles
  puzzleRatingRoles = obj.puzzleRatingRoles
  titleRoles = obj.titleRoles
  let guildRoles = obj.guildRoles
  verifyRole = obj.verifyRole

  let queue = {}

    let code_verifier = jsGay.generateCodeVerifier()

    let code_challenge = jsGay.generateCodeChallenge(code_verifier)


  if(interaction.customId.startsWith("link-lichess"))
  {
	  	await interaction.deferReply({ephemeral: true})
      passport.use(new LichessStrategy({
          clientID: `Eyal282-Chess-ELO-Role-Bot-${jsGay.client.user.id}`,
          callbackURL: `https://Chess-ELO-Discord-Bot.chess-elo-role-bot.repl.co/auth/lichess/callback/${code_challenge}`
        },
        function(accessToken, refreshToken, profile, cb)
        {
            if(profile.id)
              return cb(null, profile.id);

            else
              return cb(404, "Authentication failed")
        }
      ));        
       jsGay.app.get(`/auth/lichess/callback/${code_challenge}`,
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

              interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)

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
            .setURL(`https://chess-elo-discord-bot.chess-elo-role-bot.repl.co/auth/lichess/callback/${code_challenge}`)
            .setStyle('LINK')
      );
  
      await interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false, ephemeral: true }).catch(() => null)
  }
  
  else if(interaction.customId.startsWith("link-chesscom"))
  {
	  await interaction.deferReply({ephemeral: true})

      let state = jsGay.generateCodeVerifier()

		passport.use(new CustomStrategy(
            async function(req, done)
            {
                let code = req.query.code
                let state = req.query.state

				let lastState = await settings.get(`last-state-of-${interaction.user.id}`)

                if(state != lastState)
                    return;

                let body = `grant_type=authorization_code&client_id=3169b266-35d3-11ec-885b-3b9e2d963eb0&redirect_uri=https://chess-elo-discord-bot.chess-elo-role-bot.repl.co/auth/chesscom/callback&code=${code}&code_verifier=${code_verifier}`


                let response = await fetch(`https://oauth.chess.com/token`, {
                method: 'POST',
                body: body,
                headers: {'Content-Type': 'application/x-www-form-urlencoded' }
                })

                response = await response.json()

				if(!response.id_token)
				{
					console.log(response)

					return;
				}
                
                let decryptedResult = jsGay.parseJwt(response.id_token)
              
                if(decryptedResult?.preferred_username)
                {
                    let userName = decryptedResult.preferred_username
                    
                    console.log(userName)
                    await settings.set(`chesscom-account-of-${interaction.user.id}`, userName)

                    done(null, "Success");
                }

                return;

            })
        );      
      jsGay.app.get(`/auth/chesscom/callback`,
         passport.authenticate("custom", { failureRedirect: '/' }),
            async function(req, res) {
              // Successful authentication, redirect home.

              res.redirect('/');

              await jsGay.updateProfileDataByInteraction(interaction, false)
              
              let userName = await settings.get(`chesscom-account-of-${interaction.user.id}`)

              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully linked your [Chess.com Profile](chess.com/member/${userName})`)
			
              interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)

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
            .setURL(`https://oauth.chess.com/authorize?client_id=3169b266-35d3-11ec-885b-3b9e2d963eb0&redirect_uri=https://chess-elo-discord-bot.chess-elo-role-bot.repl.co/auth/chesscom/callback&response_type=code&scope=openid%20profile&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`)
            .setStyle('LINK')
      );
  
      await interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false, ephemeral: true }).catch(() => null)
  }
  
  else if(interaction.customId.startsWith("unlink-lichess"))
  {
	  await interaction.deferReply({ephemeral: true})

      queue[`lichess-account-of-${interaction.user.id}`] = null
      queue[`cached-lichess-account-data-of-${interaction.user.id}`] = undefined
      
      bUpdate = true

      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`Successfully unlinked your Lichess Profile`)

      await interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)
  }
  else if(interaction.customId.startsWith("unlink-chesscom"))
  {
	  await interaction.deferReply({ephemeral: true})

      queue[`chesscom-account-of-${interaction.user.id}`] = null
      queue[`cached-chesscom-account-data-of-${interaction.user.id}`] = undefined

      bUpdate = true

      embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`Successfully unlinked your Chess.com Profile`)

      await interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)
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

    let timestamp = await settings.get(`last-updated-${message.author.id}`)

    if ((timestamp == undefined || timestamp + 120 * 1000 < Date.now() || (jsGay.isBotSelfHosted() && timestamp + 10 * 1000 < Date.now())))
    {
        jsGay.updateProfileDataByMessage(message, false)
    }
});

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