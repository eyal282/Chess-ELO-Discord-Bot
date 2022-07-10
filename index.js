// Critical Note: Changing the project or author names ( changing the team's name or forking the project ) demands you update your URL in Uptime Robot, as it changes as well.
	

const debugMode = false

const jsGay = require('./util.js')

const { clientId, guildId, chessComClientId, chessComEndOfWebsite, lichessEndOfWebsite, myWebsite } = require('./config.json');

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

let modCommands = []

var LichessStrategy = require('passport-lichess').Strategy;

const CustomStrategy = require('passport-custom').Strategy;

const lichess_secret = process.env['LICHESS_OAUTH2']

Canvas.registerFont('fonts/ARIAL.TTF', { family: 'arial' });

const { SlashCommandBuilder } = require('@discordjs/builders');

const fs = require('fs');

// deploySlashCommands() // Comment this line to avoid deploying the slash commands


// deployGlobalSlashCommands() // Comment this line to avoid deploying the global slash commands

const client = jsGay.client

const Josh = require("@joshdb/core");
const provider = require("@joshdb/mongo");
const fetch = require('node-fetch');


let defaultPrefix = "!"
//const bot = new Discord.Client();

let settings = jsGay.settings

client.on('ready', async () => {
	
	await settings.defer.then( async () => {
	    let size = await settings.size;
	    console.log(`Connected, there are ${size} rows in the database.`);
	});
  
  	await jsGay.app.use(passport.initialize());
  	await jsGay.app.use(passport.session());
  
  	await passport.serializeUser(function(user, done) {
	    done(null, user);
  	});

  	await passport.deserializeUser(function(user, done) {
    	done(null, user);
  	});


    await client.user.setActivity(` ${client.guilds.cache.size} servers`, { type: `WATCHING` });

	console.log("\033[0;32mChess ELO Role has been completely loaded and is ready to use\nChess ELO Role has been completely loaded and is ready to use\nChess ELO Role has been completely loaded and is ready to use");

	let channel = await jsGay.getDebugChannel();

	await channel.send("Bot loaded");

});

client.commands = new Collection();
let commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);

	if(file.startsWith('mod-'))
		modCommands.push(command.data.name)

	client.commands.set(command.data.name, command);
}

commandFiles = fs.readdirSync('./commands-ephemeral').filter(file => file.endsWith('.js'));

let ephemeralCommands = []

for (const file of commandFiles) {

	const command = require(`./commands-ephemeral/${file}`);

	if(file.startsWith('mod-'))
		modCommands.push(command.data.name)

	client.commands.set(command.data.name, command);

  ephemeralCommands.push(command)
}

jsGay.setModSlashCommands(modCommands)

function deploySlashCommands()
{
  const { REST } = require('@discordjs/rest');
  const { Routes } = require('discord-api-types/v9');

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

client.on("debug", function(info){
	const regex = /Limit +: +(.+)/;
	const found = info.match(regex);

	if(found && found[1] == Infinity)
	{
		// Cannot send messages, await will be done forever.
		//await jsGay.getDebugChannel().send("IP Banned. Killing process...");
		
		process.kill(1, 'SIGINT');
	}
});

process.on('unhandledRejection', async error => {
    await jsGay.getDebugChannel().send("Found Error:\n" + error);
});
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


// On Context Menu Command
client.on('interactionCreate', async interaction => {
	if (!interaction.isContextMenu()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	else if(!interaction.guild)
	{
			return interaction.reply({ content: 'This bot does not accept DM Context Menus', ephemeral: true });
	}

	try
  	{
		if(ephemeralCommands.indexOf(command) == -1)
		{
			await interaction.deferReply({ephemeral: false});
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

client.on("roleCreate", role => {
  const guild = role.guild

  if(role.permissions.has('MANAGE_GUILD'))
  {
  	jsGay.updateSlashCommandPermissionsByGuild(guild)
  }
});

// roleUpdate
/* Emitted whenever a guild role is updated.
PARAMETER      TYPE        DESCRIPTION
oldRole        Role        The role before the update
newRole        Role        The role after the update    */
client.on("roleUpdate", function(oldRole, newRole){
    const guild = newRole.guild

	if(oldRole.permissions.has('MANAGE_GUILD') != newRole.permissions.has('MANAGE_GUILD'))
	{
		jsGay.updateSlashCommandPermissionsByGuild(guild)
	}
});



// Someone joined the guild, we will give him the roles if he already linked.
client.on("guildMemberAdd", async function(member){
  
	let fakeInteraction = {}
	
	fakeInteraction.guild = message.guild
	fakeInteraction.user = message.author
	fakeInteraction.member = message.member

    let timestamp = await settings.get(`last-updated-${fakeMessage.author.id}`)

    if ((timestamp == undefined || timestamp + 120 * 1000 < Date.now() || (jsGay.isBotSelfHosted() && timestamp + 10 * 1000 < Date.now())))
    {
      // You can sneak a fake message if you assign .guild, .author and .member
      jsGay.updateProfileDataByInteraction(fakeInteraction, false)
    }
    else
    {
      // You can sneak a fake message if you assign .guild, .author and .member
      jsGay.updateProfileDataByInteraction(fakeInteraction, true)
    }
});
/* Emitted whenever the bot joins a guild.
PARAMETER    TYPE         DESCRIPTION
guild        Guild        The created guild    */
client.on("guildCreate", async function(guild){
    console.log(`the client joins a guild: ${guild.id} ---> ${guild.name}`);

    client.user.setActivity(` ${client.guilds.cache.size} servers`, { type: `WATCHING` });

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

    client.user.setActivity(` ${client.guilds.cache.size} servers`, { type: `WATCHING` });
});


// On Retry Link Button Pressed
client.on('interactionCreate', async(interaction) => {
	if (!interaction.isButton() || !interaction.customId.includes(interaction.user.id) || !interaction.customId.includes("retry-link")) return;

   await interaction.deferReply({ephemeral: true})
   
  let bUpdate = false

  let queue = {}

  let bLichess = interaction.message.embeds[0].url.includes("lichess.org") || interaction.message.embeds[0].description.includes("lichess.org")

  let url = interaction.message.embeds[0].url

  .replace('\\', '/')


  let splitURL = url.split('/')

  let username = splitURL[splitURL.length-1]

  let fakeInteraction = {}

  fakeInteraction.guild = message.guild
  fakeInteraction.user = message.author
  fakeInteraction.member = message.member
	
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

            if(result.profile && ((result.profile.location && result.profile.location.includes(fullDiscordUsername)) || (result.profile.bio && result.profile.bio.includes(fullDiscordUsername))))
            {
                queue[`lichess-account-of-${message.author.id}`] = result.username
                queue[`cached-lichess-account-data-of-${message.author.id}`] = result
                bUpdate = true

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
				  result2 = await fetch(`https://api.chess.com/pub/player/${result.username}/stats`).then(response => {
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
				
				  queue[`chesscom-account-of-${interaction.user.id}`] = result.username

				  queue[`cached-chesscom-account-data-of-${interaction.user.id}`] = Object.assign(result, result2) // stats are the most important thing!

				  bUpdate = true


                  let embed = new MessageEmbed()
                      .setColor('#0099ff')
                      .setDescription(`Successfully linked your [Chess.com Profile](${result.url})`)

                    interaction.editReply({ embeds: [embed], failIfNotExists: false })

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

  if(bUpdate)
  	await jsGay.updateProfileDataByInteraction(fakeInteraction, true)
});


// On Embed Button Pressed
client.on('interactionCreate', async(interaction) => {
	if (!interaction.isButton())
    return;

	
  let bCache = true
  let bUpdate = false

	let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData, verifyRole, titledRole, timeControlsBitwise] = await jsGay.getCriticalData(interaction)

  let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole, titledRole)

  ratingRoles = obj.ratingRoles
  puzzleRatingRoles = obj.puzzleRatingRoles
  titleRoles = obj.titleRoles
  let guildRoles = obj.guildRoles
  verifyRole = obj.verifyRole
  titledRole = obj.titledRole

  let queue = {}

    let code_verifier = jsGay.generateCodeVerifier()

    let code_challenge = jsGay.generateCodeChallenge(code_verifier)

  if(interaction.customId.startsWith("undo-unlink-lichess"))
  {
	await interaction.deferReply({ephemeral: true})

	  let oldAccount = interaction.customId.replace("undo-unlink-lichess-", "");
      queue[`lichess-account-of-${interaction.user.id}`] = oldAccount
      
      bUpdate = true
	  bCache = false

	embed = new MessageEmbed()
	.setColor('#0099ff')
	.setDescription(`Successfully linked your [Lichess Profile](https://lichess.org/@/${oldAccount})`)

	interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)
  }
  
  else if(interaction.customId.startsWith("undo-unlink-chesscom"))
  {
	await interaction.deferReply({ephemeral: true})

	  let oldAccount = interaction.customId.replace("undo-unlink-chesscom-", "");
      queue[`chesscom-account-of-${interaction.user.id}`] = oldAccount
      
      bUpdate = true
	  bCache = false

	embed = new MessageEmbed()
	.setColor('#0099ff')
	.setDescription(`Successfully linked your [Chess.com Profile](https://chess.com/member/${oldAccount})`)

	interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)
  }
  else if(interaction.customId.startsWith("link-lichess"))
  {
	  let state = jsGay.generateCodeVerifier()

	  	await interaction.deferReply({ephemeral: true})

		passport.use(new CustomStrategy(
				async function(req, done)
				{
					let code = req.query.code
					let state = req.query.state

					let lastState = await settings.get(`last-lichess-state-of-${interaction.user.id}`)

					

					if(state != lastState)
					{
						return;
					}

					let body = `grant_type=authorization_code&client_id=Eyal282-Chess-ELO-Role-Bot-${jsGay.client.user.id}&redirect_uri=${myWebsite}${lichessEndOfWebsite}&code=${code}&code_verifier=${code_verifier}`


					let response = await fetch(`https://lichess.org/api/token`, {
					method: 'POST',
					body: body,
					headers: {'Content-Type': 'application/x-www-form-urlencoded' }
					})

					response = await response.json()

					if(!response.access_token)
						return;
					
 					let result = await fetch(`https://lichess.org/api/account`, {
						method: 'GET',
						headers: {'Authorization': `Bearer ${response.access_token}`}

					 }).then(response => {
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

					if(result && result.id)
					{
						let userName = result.id
						
						await settings.set(`lichess-account-of-${interaction.user.id}`, result.id)

						done(null, "Success");
					}

					return;

				})
			);      
		jsGay.app.get(lichessEndOfWebsite,
			passport.authenticate("custom", { failureRedirect: '/fail' }),
				async function(req, res) {
				// Successful authentication, redirect home.

				res.redirect('/');
				
				console.log(interaction.user.id)
				await jsGay.updateProfileDataByInteraction(interaction, false)
				
				let userName = await settings.get(`lichess-account-of-${interaction.user.id}`)

				embed = new MessageEmbed()
					.setColor('#0099ff')
					.setDescription(`Successfully linked your [Lichess Profile](https://lichess.org/@/${userName})`)
				
				interaction.editReply({ embeds: [embed], failIfNotExists: true, ephemeral: true }).catch(console.error)

				return
				}
		);

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles
	  queue[`last-lichess-state-of-${interaction.user.id}`] = state

      await settings.setMany(queue, true)

      embed = new MessageEmbed()
        .setColor('#0099ff')
        .setDescription(`Sign in with Lichess by pressing the button below:`)

      row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setLabel(`Sign in with Lichess`)
            .setURL(`https://lichess.org/oauth?response_type=code&redirect_uri=${myWebsite}${lichessEndOfWebsite}&code_challenge=${code_challenge}&code_challenge_method=S256&state=${state}&client_id=Eyal282-Chess-ELO-Role-Bot-${jsGay.client.user.id}`)
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

				let lastState = await settings.get(`last-chesscom-state-of-${interaction.user.id}`)

                if(state != lastState)
                    return;

                let body = `grant_type=authorization_code&client_id=${chessComClientId}&redirect_uri=${myWebsite}${chessComEndOfWebsite}&code=${code}&code_verifier=${code_verifier}`


                let response = await fetch(`https://oauth.chess.com/token`, {
                method: 'POST',
                body: body,
                headers: {'Content-Type': 'application/x-www-form-urlencoded' }
                })

                response = await response.json()

				if(!response.id_token)
					return;
                
                let decryptedResult = jsGay.parseJwt(response.id_token)
              
                if(decryptedResult && decryptedResult.preferred_username)
                {
                    let userName = decryptedResult.preferred_username
                    
                    console.log(userName)
                    await settings.set(`chesscom-account-of-${interaction.user.id}`, userName)

                    done(null, "Success");
                }

                return;

            })
        );      
      jsGay.app.get(chessComEndOfWebsite,
         passport.authenticate("custom", { failureRedirect: '/fail' }),
            async function(req, res) {
              // Successful authentication, redirect home.

              res.redirect('/');

              await jsGay.updateProfileDataByInteraction(interaction, false)
              
              let userName = await settings.get(`chesscom-account-of-${interaction.user.id}`)

              embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully linked your [Chess.com Profile](https://chess.com/member/${userName})`)
			
              interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)

              return
            }
      );
      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles
      queue[`last-chesscom-state-of-${interaction.user.id}`] = state
    
      await settings.setMany(queue, true)

      embed = new MessageEmbed()
        .setColor('#0099ff')
        .setDescription(`Sign in with Chess.com by pressing the button below:`)

      row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setLabel(`Sign in with Chess.com`)
            .setURL(`https://oauth.chess.com/authorize?client_id=${chessComClientId}&redirect_uri=${myWebsite}${chessComEndOfWebsite}&response_type=code&scope=openid%20profile&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`)
            .setStyle('LINK')
      );
  
      await interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false, ephemeral: true }).catch(() => null)
  }
  
  else if(interaction.customId.startsWith("unlink-lichess"))
  {
	  await interaction.deferReply({ephemeral: true})
		if(lichessAccount != null && lichessAccount != undefined)
		{
			queue[`lichess-account-of-${interaction.user.id}`] = null
			queue[`cached-lichess-account-data-of-${interaction.user.id}`] = undefined
		
			bUpdate = true

			embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Successfully unlinked your Lichess Profile`)

			row = new MessageActionRow()
					.addComponents(
					new MessageButton()
					.setCustomId(`undo-unlink-lichess-${lichessAccount}`)
					.setLabel(`Relink as ${lichessAccount}`)
					.setStyle('PRIMARY')
			);
		}
		else
		{
			row = undefined
			
			embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Could not find a linked Lichess Profile`)
		}

		if(row != undefined)
		{
      		await interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false, ephemeral: true }).catch(() => null)
		}
		else
		{
      		await interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)
		}
  }

  else if(interaction.customId.startsWith("unlink-chesscom"))
  {
		 await interaction.deferReply({ephemeral: true})
		if(lichessAccount != null && lichessAccount != undefined)
		{
			queue[`chesscom-account-of-${interaction.user.id}`] = null
			queue[`cached-chesscom-account-data-of-${interaction.user.id}`] = undefined
		
			bUpdate = true

			embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Successfully unlinked your Chess.com Profile`)

			row = new MessageActionRow()
					.addComponents(
					new MessageButton()
					.setCustomId(`undo-unlink-chesscom-${chessComAccount}`)
					.setLabel(`Relink as ${chessComAccount}`)
					.setStyle('PRIMARY')
			);
		}
		else
		{
			row = undefined

			embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Could not find a linked Chess.com Profile`)
		}

		if(row != undefined)
		{
      		await interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false, ephemeral: true }).catch(() => null)
		}
		else
		{
      		await interaction.editReply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)
		}
  }

  await settings.setMany(queue, true)


  if(bUpdate)
  {
    jsGay.updateProfileDataByInteraction(interaction, bCache)
  }
});


// On Select Role Menu Pressed
client.on('interactionCreate', async(interaction) => {
	if (!interaction.isSelectMenu())
   	 return;

	if(!interaction.customId == "select-role")
		return;


  	let roleID = interaction.values[0]

  	let options = interaction.component.options

	let fullRolesCache = interaction.member.roles.cache

    let fullRolesArray = Array.from(fullRolesCache.keys());

	// Remove every role the user has in the select menu before we give every role he selected.
	// Because options also contain values, we can use this moment to strike down any role that we cannot access.
  	for(let i=0;i < options.length;i++)
	{
		let roleID = options[i].value

		let role = interaction.guild.roles.cache.get(roleID);

		if(!role)
		{
  			embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Error: role ${options[i].label} was not found, please recreate the menu!`)

  			return interaction.reply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)		
		}
		else if(!role.editable)
		{
  			embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Error: I cannot give / remove the role <@&${role.id}> to other players. Please ensure the role is below my highest role`)

  			return interaction.reply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)		
		}

		if(role.permissions.any([Permissions.FLAGS.KICK_MEMBERS,
		Permissions.FLAGS.BAN_MEMBERS,
		Permissions.FLAGS.MANAGE_CHANNELS,
		Permissions.FLAGS.MANAGE_GUILD,
		Permissions.FLAGS.MANAGE_MESSAGES,
		Permissions.FLAGS.MUTE_MEMBERS, 
		Permissions.FLAGS.MOVE_MEMBERS, 
		Permissions.FLAGS.MANAGE_NICKNAMES, 
		Permissions.FLAGS.MANAGE_ROLES, 
		Permissions.FLAGS.MANAGE_WEBHOOKS, 
		Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS, 
		Permissions.FLAGS.MANAGE_THREADS]))
		{
  			embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Error: The role <@&${role.id}> has moderation capabilities, and cannot be given or taken`)

  			return interaction.reply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)	
		}
        let index = fullRolesArray.indexOf(role.id)

        if(index != -1)
          fullRolesArray.splice(index, 1);		
	}

	let selectedValues = interaction.values

	for(let i=0;i < selectedValues.length;i++)
	{
		fullRolesArray.push(selectedValues[i])
	}


	// Don't set if nothing was changed.
	if (fullRolesArray != Array.from(fullRolesCache.keys()))
	{
		try
		{
			interaction.member.roles.set(fullRolesArray).catch(() => null)
		}
		catch {}
	}


	if(interaction.values.length == 0)
	{
			embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`Successfully removed all roles you have in this menu.`)

			return interaction.reply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)
	}
	else if(interaction.values.length == 1)
	{

  		embed = new MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`Successfully received <@&${interaction.values[0]}>, and removed all unselected roles in the menu.`)
	}
	else
	{

  		embed = new MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`Successfully received all selected roles, and removed all unselected roles in the menu.`)
	}

  	interaction.reply({ embeds: [embed], failIfNotExists: false, ephemeral: true }).catch(() => null)

})


if(debugMode)
{
	client.on("debug", async info => {
		console.log(info)
	});
}
// All messages.
client.on("messageCreate", async message => {
    if (message.author.bot) return;

	let fakeInteraction = {}

	fakeInteraction.guild = message.guild
	fakeInteraction.user = message.author
	fakeInteraction.member = message.member
	
    let timestamp = await settings.get(`last-updated-${message.author.id}`)

    if ((timestamp == undefined || timestamp + 120 * 1000 < Date.now() || (jsGay.isBotSelfHosted() && timestamp + 10 * 1000 < Date.now())))
    {
        jsGay.updateProfileDataByInteraction(fakeInteraction, false)
    }
});