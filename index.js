const mySecret = process.env['SECRET_BOT_TOKEN']

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const { Permissions } = require('discord.js');
const Parser = require('expr-eval').Parser;

//const client = new Discord.Client({ partials: ["MESSAGE", "USER", "REACTION"] });
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES']} );
const enmap = require('enmap');
const fetch = require('node-fetch');

let defaultPrefix = "!"

let Constant_lichessDefaultRatingEquation = "x"
let Constant_chessComDefaultRatingEquation = "0.75 * x + 650"
let Constant_ProvisionalRD = 110
//const bot = new Discord.Client();


const settings = new enmap({
    name: "settings",
    autoFetch: true,
    cloneLevel: "deep",
    fetchAll: true
});


client.on('ready', () => {
    console.log("Chess ELO Bot has been loaded.");

  client.user.setActivity(` {Guilds} | Mention me to find the prefix`, { type: `WATCHING` });

    setTimeout(async () => {
	
      const Guilds = client.guilds.cache.forEach(async function(guild)
      {
        let ownerMember = await guild.fetchOwner()
        let ownerUser = ownerMember.user
        let fullDiscordUsername = ownerUser.username + "#" + ownerUser.discriminator

        console.log(`${guild.id} ---> ${guild.name} ---> ${fullDiscordUsername}`);
      } 
      );
    }, 2500);
});


/* Emitted whenever the bot joins a guild.
PARAMETER    TYPE         DESCRIPTION
guild        Guild        The created guild    */
client.on("guildCreate", function(guild){
    console.log(`the client joins a guild: ${guild.id} ---> ${guild.name}`);
});

// guildDelete
/* Emitted whenever a guild is deleted/left.
PARAMETER    TYPE         DESCRIPTION
guild        Guild        The guild that was deleted    */
client.on("guildDelete", function(guild){
    console.log(`the client left a guild: ${guild.id} ---> ${guild.name}`);
});

// Messages without the prefix
client.on('message', async message => {
    if (message.author.bot) return;

    let prefix = await settings.get(`guild-prefix-${message.guild.id}`)

    if (prefix === undefined) prefix = defaultPrefix

    if (message.content.indexOf(prefix) === 0) return;

    if (message.mentions.has(client.user) && message.mentions.users.size == 1) {
        message.reply('Prefix is `' + prefix + '`')
    }
    else
    {
        let timestamp = await settings.get(`last-updated-${message.author.id}`)

        if ((timestamp === undefined || timestamp + 120 * 1000 < Date.now() || (client.guilds.cache.size == 1 && timestamp + 10 * 1000 < Date.now())))
        {

            let ratingRoles = await settings.get(`guild-elo-roles-${message.guild.id}`)

            if (ratingRoles === undefined)
            {
                ratingRoles = []
            }
    
            let puzzleRatingRoles = await settings.get(`guild-puzzle-elo-roles-${message.guild.id}`)
    
            if (puzzleRatingRoles === undefined)
            {   
                puzzleRatingRoles = []
            }
    
            let titleRoles = await settings.get(`guild-title-roles-${message.guild.id}`)
    
    
            if (titleRoles === undefined) {
                titleRoles = []
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
	    .catch(console.error);

                
            ratingRoles.sort(function (a, b) { return a.rating - b.rating });
            puzzleRatingRoles.sort(function (a, b) { return a.rating - b.rating });
            
            settings.set(`guild-elo-roles-${message.guild.id}`, ratingRoles)
            settings.set(`guild-puzzle-elo-roles-${message.guild.id}`, puzzleRatingRoles)
            settings.set(`guild-title-roles-${message.guild.id}`, titleRoles)
    
            let lichessRatingEquation = await settings.get(`guild-lichess-rating-equation-${message.guild.id}`)
    
            if (lichessRatingEquation === undefined) {
                settings.set(`guild-lichess-rating-equation-${message.guild.id}`, Constant_lichessDefaultRatingEquation)
                lichessRatingEquation = Constant_lichessDefaultRatingEquation
            }
    
            let chessComRatingEquation = await settings.get(`guild-chesscom-rating-equation-${message.guild.id}`)
    
            if (chessComRatingEquation === undefined) {
                settings.set(`guild-chesscom-rating-equation-${message.guild.id}`, Constant_chessComDefaultRatingEquation)
                chessComRatingEquation = Constant_chessComDefaultRatingEquation
            }
    
            try {
                Parser.evaluate(lichessRatingEquation, { x: 1000 })
                Parser.evaluate(lichessRatingEquation, { x: 0 })
                Parser.evaluate(lichessRatingEquation, { x: -1 })
    
                Parser.evaluate(chessComRatingEquation, { x: 1000 })
                Parser.evaluate(chessComRatingEquation, { x: 0 })
                Parser.evaluate(chessComRatingEquation, { x: -1 })
            }
            catch {}
    
            let modRoles = await settings.get(`guild-bot-mods-${message.guild.id}`)
    
            if (modRoles === undefined) {
                settings.set(`guild-bot-mods-${message.guild.id}`, [])
                modRoles = []
            }
            settings.set(`last-updated-${message.author.id}`, Date.now())

            let lichessAccount = await settings.get(`lichess-account-of-${message.author.id}`)
			let chessComAccount = await settings.get(`chesscom-account-of-${message.author.id}`)

           
            let result

            if (lichessAccount === undefined) {
                result = null;
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
			
            let highestRating = -1
            let highestPuzzleRating = -1
            let lichessHighestRating = -1
            let lichessPuzzleRating = -1
            let lichessTitle = ""
            let chessTitle = ""
			
			if(result != null)
            {
                let corresRating = -1
                let blitzRating = -1
                let rapidRating = -1
                let classicalRating = -1

                let puzzleRating = -1

                if (result.perfs.correspondence && result.perfs.correspondence.prov === undefined) corresRating = result.perfs.correspondence.rating
                if (result.perfs.blitz && result.perfs.blitz.prov === undefined) blitzRating = result.perfs.blitz.rating
                if (result.perfs.rapid && result.perfs.rapid.prov === undefined) rapidRating = result.perfs.rapid.rating
                if (result.perfs.classical && result.perfs.classical.prov === undefined) classicalRating = result.perfs.classical.rating

                if (result.perfs.puzzle && result.perfs.puzzle.prov === undefined) puzzleRating = result.perfs.puzzle.rating

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
			
            if (chessComAccount === undefined) {
                result = null;
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
			if(result != null)
			{
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

            if (!fullRolesCache)
                return;

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
            if (fullRolesArray != Array.from(fullRolesCache.keys())) message.member.roles.set(fullRolesArray)

        }
    }
});

// Messages with the prefix
client.on('message', async message => {
    if (message.author.bot) return;

    let prefix = await settings.get(`guild-prefix-${message.guild.id}`)

    if (prefix === undefined) prefix = defaultPrefix

    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    let ratingRoles = await settings.get(`guild-elo-roles-${message.guild.id}`)

    if (ratingRoles === undefined)
    {
        ratingRoles = []
    }

    let puzzleRatingRoles = await settings.get(`guild-puzzle-elo-roles-${message.guild.id}`)

    if (puzzleRatingRoles === undefined)
    {
        puzzleRatingRoles = []
    }

    let titleRoles = await settings.get(`guild-title-roles-${message.guild.id}`)

    if (titleRoles === undefined) {
        ratingRoles = []
    }

    let lichessRatingEquation = await settings.get(`guild-lichess-rating-equation-${message.guild.id}`)

    if (lichessRatingEquation === undefined) {
        settings.set(`guild-lichess-rating-equation-${message.guild.id}`, Constant_lichessDefaultRatingEquation)
        lichessRatingEquation = Constant_lichessDefaultRatingEquation
    }

    let chessComRatingEquation = await settings.get(`guild-chesscom-rating-equation-${message.guild.id}`)

    if (chessComRatingEquation === undefined) {
        settings.set(`guild-chesscom-rating-equation-${message.guild.id}`, Constant_chessComDefaultRatingEquation)
        chessComRatingEquation = Constant_chessComDefaultRatingEquation
    }

    let modRoles = await settings.get(`guild-bot-mods-${message.guild.id}`)

    if (modRoles === undefined) {
        settings.set(`guild-bot-mods-${message.guild.id}`, [])
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
    .catch(console.error);

    ratingRoles.sort(function (a, b) { return a.rating - b.rating });
    puzzleRatingRoles.sort(function (a, b) { return a.rating - b.rating });

    settings.set(`guild-elo-roles-${message.guild.id}`, ratingRoles)
    settings.set(`guild-puzzle-elo-roles-${message.guild.id}`, puzzleRatingRoles)
    settings.set(`guild-title-roles-${message.guild.id}`, titleRoles)

    if (command == "help")
    {
        let result = ""

        result = addCommandToHelp(result, prefix, `lichess [username] ---> Tries to link your Lichess Account. Leave user empty to unlink`)
        result = addCommandToHelp(result, prefix, `chess [username] ---> Tries to link your Chess.com Account. Leave user empty to unlink`)
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
        result = addCommandToHelp(result, prefix, `lichessequation ---> Sets the equation for inflating or deflating lichess rating, x = User's current rating. Default: '${Constant_lichessDefaultRatingEquation}'. Current: '${lichessRatingEquation}'`)
        result = addCommandToHelp(result, prefix, `chessequation ---> Sets the equation for inflating or deflating chess.com rating, x = User's current rating. Default: '${Constant_chessComDefaultRatingEquation}'. Current: '${chessComRatingEquation}'`)
        result = addCommandToHelp(result, prefix, `addmod ---> Adds a role as a Moderator`)
        result = addCommandToHelp(result, prefix, `resetmod ---> Resets all Moderators.`)

        result = result + "Note: -1 ELO stands for either unrated or provisonary elo (Shows (?) on Lichess))\n"
        result = result + "Note: Provisionary rating in Chess.com is artifically calculated by Lichess standards.\n"
        result = result + "Note: Due to Chess.com limits, only puzzle rating of Lichess is calculated at all.\n"
        result = result + "Title List: `GM` `WGM` `IM` `WIM` `FM` `WFM` `NM` `CM` `WCM` `WNM` `LM` `BOT`\n"
        message.reply(result)
    }
    else if (command == "lichess") {
        //deleteMessageAfterTime(message, 2000);

        if (args[0]) {

            if (ratingRoles.length == 0) {
                return message.reply('The server has yet to setup any rating role milestones')
            }
            let timestamp = await settings.get(`last-command-${message.author.id}`)

            if ((timestamp === undefined || timestamp + 10 * 1000 < Date.now())) {
                settings.set(`last-command-${message.author.id}`, Date.now())

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
                    message.reply("User was not found!")
                }
                else if (result == "Rate Limit") {
                    message.reply("Rate Limit Encountered! Please try again!")
                }
                else {
                    // result.profile.location
                    let fullDiscordUsername = message.author.username + "#" + message.author.discriminator

                    if(result.profile && result.profile.location && fullDiscordUsername == result.profile.location) {
                        settings.set(`lichess-account-of-${message.author.id}`, result.username)

                        const embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setDescription(`Successfully linked your [Lichess Profile](${result.url})`)

                        message.reply({ embeds: [embed] })

                    }
                    else {
                        const embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Lichess Profile](https://lichess.org/account/profile)')

                        message.reply({ embeds: [embed] })
                    }
                }
            }
            else {
                message.reply("Rate Limit Encountered! Please try again!")
            }
        }
        else {

            settings.delete(`lichess-account-of-${message.author.id}`)

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully unlinked your Lichess Profile`)

            message.reply({ embeds: [embed] })

        }
    }
    else if (command == "chess") {
        //deleteMessageAfterTime(message, 2000);
        if (ratingRoles.length == 0) {
            return message.reply('The server has yet to setup any rating role milestones')
        }
        if (args[0]) {

            let timestamp = await settings.get(`last-command-${message.author.id}`)

            if ((timestamp === undefined || timestamp + 10 * 1000 < Date.now()) && ratingRoles.length > 0) {
                settings.set(`last-command-${message.author.id}`, Date.now())
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
                    message.reply("User was not found!")
                }
                else if (result == "Rate Limit") {
                    message.reply("Rate Limit Encountered! Please try again!")
                }
                else {
                    // result.profile.location
                    let fullDiscordUsername = message.author.username + "#" + message.author.discriminator

                    if (result.location && fullDiscordUsername == result.location) {
                        settings.set(`chesscom-account-of-${message.author.id}`, result.username)

                        const embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setDescription(`Successfully linked your [Chess.com Profile](${result.url})`)

                        message.reply({ embeds: [embed] })

                    }
                    else {
                        const embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setDescription('You need to put `' + message.author.username + "#" + message.author.discriminator + '` in `Location` in your [Chess.com Profile](https://www.chess.com/settings)')

                        message.reply({ embeds: [embed] })
                    }
                }
            }
            else {
                message.reply("Rate Limit Encountered! Please try again!")
            }
        }
        else {
            settings.delete(`chesscom-account-of-${message.author.id}`)

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully unlinked your Chess.com Profile`)

            message.reply({ embeds: [embed] })
        }
    }
	else if (command == "forcelichess") {
        //deleteMessageAfterTime(message, 2000);
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin) {
            return message.reply("Access Denied")
        }
        if (args[0]) {

            if (ratingRoles.length == 0) {
                return message.reply('The server has yet to setup any rating role milestones')
            }
			
			if (message.mentions.users.size != 1) {
                message.reply(`${prefix}forcelichess [username] [@user]`)
            }

            let target = message.mentions.users.first()
            
            let timestamp = await settings.get(`last-command-${message.author.id}`)

            if ((timestamp === undefined || timestamp + 10 * 1000 < Date.now())) {
                settings.set(`last-command-${message.author.id}`, Date.now())

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
                    message.reply("User was not found!")
                }
                else if (result == "Rate Limit") {
                    message.reply("Rate Limit Encountered! Please try again!")
                }
                else {
                    settings.set(`lichess-account-of-${target.id}`, result.username)

                    const embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Successfully linked [Lichess Profile](${result.url}) for ${target}`)

                    message.reply({ embeds: [embed] })
                }
            }
            else {
                message.reply("Rate Limit Encountered! Please try again!")
            }
        }
        else {
            message.reply(`${prefix}forcelichess [username] [@user]`)
        }
    }
    else if (command == "forcechess") {
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin) {
            return message.reply("Access Denied")
        }
		
        if (args[0]) {

            if (ratingRoles.length == 0) {
                return message.reply('The server has yet to setup any rating role milestones')
            }
			
			if (message.mentions.users.size != 1) {
                message.reply(`${prefix}forcechess [username] [@user]`)
            }

            let target = message.mentions.users.first()

            let timestamp = await settings.get(`last-command-${message.author.id}`)

            if ((timestamp === undefined || timestamp + 10 * 1000 < Date.now()) && ratingRoles.length > 0) {
                settings.set(`last-command-${message.author.id}`, Date.now())
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
                    message.reply("User was not found!")
                }
                else if (result == "Rate Limit") {
                    message.reply("Rate Limit Encountered! Please try again!")
                }
                else {
                    settings.set(`chesscom-account-of-${target.id}`, result.username)

                    const embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription(`Successfully linked [Chess.com Profile](${result.url}) for ${target}`)

                    message.reply({ embeds: [embed] })
                }
            }
            else {
                message.reply("Rate Limit Encountered! Please try again!")
            }
        }
        else {
            message.reply(`${prefix}forcelichess [username] [@user]`)
        }
    }
    else if (command == "prefix")
    {
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin) {
            return message.reply("Access Denied")
        }

        else if (args[0].length > 5)
        {
            return message.reply("Prefix cannot exceed 5 characters!")
        }

        else if (!message.mentions.has(client.user) || message.mentions.users.size != 1) {
            return message.reply(`To avoid double changing prefixes, use this command instead:\n` + '```' + `${ prefix }prefix ${ args[0]} <@${ client.user.id }>` + '```')
        }

        settings.set(`guild-prefix-${message.guild.id}`, args[0])
        message.reply('Prefix was successfully set to `' + args[0] + '`')
    }
    else if(command == "addelo")
    {
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin) {
            return message.reply("Access Denied")
        }
        else if (args.length == 0 || args.length % 2 != 0) {
            return message.reply(`${prefix}addelo [elo] [@role] (elo2) [@role2] ... ...`)
        }

        let msgToSend = ""



        for (let i = 0; i < (args.length / 2); i++)
        {
            let role = getRoleFromMentionString(message.guild, args[2 * i + 1])

            let result = 'Could not find role'

            if(role)
                result = addEloCommand(message, ratingRoles, role, args[2 * i + 0])

            msgToSend = msgToSend + (i + 1).toString() + ". " + result + " \n"
        }

        if (msgToSend == "") {
            msgToSend = "Internal Error, Cringe :("
        }

        message.reply(msgToSend)
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

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(msgToSend)

        message.reply({ embeds: [embed] })

    }

    else if (command == "resetelo") {
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin) {
            return message.reply("Access Denied")
        }

        let msgToSend = `${prefix}addelo `

        for (let i = 0; i < ratingRoles.length; i++) {
            msgToSend = msgToSend + ratingRoles[i].rating + " <@&" + ratingRoles[i].id + "> "
        }

        if (msgToSend == `${prefix}addelo `) {
            message.reply(`There were no role milestones to delete.`)
        }
        else {

            settings.delete(`guild-elo-roles-${message.guild.id}`)
            message.reply(`Successfully reset all elo related roles! Command to undo:\n` + '```' + msgToSend + '```')
            message.member.send(`Successfully reset all elo related roles! Command to undo:\n` + '```' + msgToSend + '```').catch()
        }
    }
    else if(command == "addpuzzleelo")
    {
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin)
		{
            return message.reply("Access Denied")
        }
        else if (args.length == 0 || args.length % 2 != 0) {
            return message.reply(`${prefix}addpuzzleelo [elo] [@role] (elo2) [@role2] ... ...`)
        }

        let msgToSend = ""



        for (let i = 0; i < (args.length / 2); i++)
        {
            let role = getRoleFromMentionString(message.guild, args[2 * i + 1])

            let result = 'Could not find role'

            if(role)
                result = addPuzzleEloCommand(message, puzzleRatingRoles, role, args[2 * i + 0])

            msgToSend = msgToSend + (i + 1).toString() + ". " + result + " \n"
        }

        if (msgToSend == "") {
            msgToSend = "Internal Error, Cringe :("
        }

        message.reply(msgToSend)
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

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(msgToSend)

        message.reply({ embeds: [embed] })

    }

    else if (command == "resetpuzzleelo") {
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin) {
            return message.reply("Access Denied")
        }

        let msgToSend = `${prefix}addpuzzleelo `

        for (let i = 0; i < puzzleRatingRoles.length; i++) {
            msgToSend = msgToSend + puzzleRatingRoles[i].rating + " <@&" + puzzleRatingRoles[i].id + "> "
        }

        if (msgToSend == `${prefix}addpuzzleelo `) {
            message.reply(`There were no role milestones to delete.`)
        }
        else {

            settings.delete(`guild-puzzle-elo-roles-${message.guild.id}`)
            message.reply(`Successfully reset all puzzle elo related roles! Command to undo:\n` + '```' + msgToSend + '```')
            message.member.send(`Successfully reset all puzzle elo related roles! Command to undo:\n` + '```' + msgToSend + '```').catch()
        }
    }
    else if (command == "addtitle") {
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin) {
            return message.reply("Access Denied")
        }
        else if (args.length == 0 || args.length % 2 != 0) {
            return message.reply(`${prefix}addtitle [title] [@role] (title2) [@role2] ... ...`)
        }

        let msgToSend = ""

        for (let i = 0; i < (args.length / 2); i++) {
            let role = getRoleFromMentionString(message.guild, args[2 * i + 1])

            let result = 'Could not find role'

            if (role)
                result = addTitleCommand(message, titleRoles, role, args[2 * i + 0])

            msgToSend = msgToSend + (i + 1).toString() + ". " + result + " \n"
        }

        if (msgToSend == "") {
            msgToSend = "Internal Error, Cringe :("
        }

        message.reply(msgToSend)
    }
    else if (command == "gettitle") {
        let msgToSend = ""

        for (let i = 0; i < titleRoles.length; i++) {
            msgToSend = msgToSend + "<@&" + titleRoles[i].id + "> ( " + titleRoles[i].title + " ) \n "
        }

        if (msgToSend == "") {
            msgToSend = "None."
        }

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(msgToSend)

        message.reply({ embeds: [embed] })

    }

    else if (command == "resettitle" || command == "resettitles") {
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin) {
            return message.reply("Access Denied")
        }

        let msgToSend = `${prefix}addtitle `

        for (let i = 0; i < titleRoles.length; i++) {
            msgToSend = msgToSend + titleRoles[i].title + " <@&" + titleRoles[i].id + "> "
        }

        if (msgToSend == `${prefix}addtitle `) {
            message.reply(`There were no role milestones to delete.`)
        }
        else {

            settings.delete(`guild-title-roles-${message.guild.id}`)
            message.reply(`Successfully reset all title related roles! Command to undo:\n` + '```' + msgToSend + '```')
            message.member.send(`Successfully reset all title related roles! Command to undo:\n` + '```' + msgToSend + '```').catch()
        }
    }

    else if (command == "lichessequation") {
        if (!isBotControlAdminByMessage(message)) {
            return message.reply("Access Denied")
        }
        else {
            if (args.length == 0)
            {
                settings.set(`guild-lichess-rating-equation-${message.guild.id}`, Constant_lichessDefaultRatingEquation)

                message.reply(`Successfully reset Lichess rating equation to default: ${Constant_lichessDefaultRatingEquation}`)

                return;
            }

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
                message.reply(`Invalid formula! Must support preset values of x = 1000, x = 0, x = -1\nError: ${error.message}`)

                return;
            }

            settings.set(`guild-lichess-rating-equation-${message.guild.id}`, argString)
            message.reply(`Successfully set Lichess rating equation to: ${argString}`)
        }
    }

    else if (command == "chessequation") {
		let isAdmin = await isBotControlAdminByMessage(message)
		
        if (!isAdmin) {
            return message.reply("Access Denied")
        }
        else {
            if (args.length == 0) {
                settings.set(`guild-chesscom-rating-equation-${message.guild.id}`, Constant_chessComDefaultRatingEquation)

                message.reply(`Successfully reset Chess.com rating equation to default: ${Constant_chessComDefaultRatingEquation}`)

                return;
            }

            let argString = ""

            for (let i = 0; i < args.length; i++) {

                argString = argString + " " + args[i]
            }

            argString = argString.trim()

            try {
                Parser.evaluate(argString, { x: 1000 })
                Parser.evaluate(argString, { x: 0 })
                Parser.evaluate(argString, { x: -1 })
            }
            catch(error) {
                message.reply(`Invalid formula! Must support preset values of x = 1000, x = 0, x = -1\nError: ${error.message}`)

                return;
            }

            settings.set(`guild-chesscom-rating-equation-${message.guild.id}`, argString)
            message.reply(`Successfully set Chess.com rating equation to: ${argString}`)
        }
    }

    else if (command == "addmod") {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.reply("Access Denied")
        }
        else {
            let role = getRoleFromMentionString(message.guild, args[0])

            if (!role)
            {
                return message.reply(`$(prefix}addmod [@role]`)
            }

            settings.push(`guild-bot-mods-${message.guild.id}`, role.id)
            message.reply(`Successfully added the role as a moderator for this bot.`)
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

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(msgToSend)

        message.reply({ embeds: [embed] })

    }

    else if (command == "resetmod" || command == "resetmods") {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.reply("Access Denied")
        }
        else {
            
            settings.delete(`guild-bot-mods-${message.guild.id}`)
            message.reply(`Successfully removed all moderator roles from this bot.`)
        }
    }
});

client.login(mySecret);

async function deleteMessageAfterTime(message, time)
{
    setTimeout(async () => {
        try {
            if (message.deleted === false) {
                await message.delete()
            }
        }
        catch {}
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
            return `This role was already added to the bot!`
    }

    let template = { id: role.id, rating: elo };

    settings.push(`guild-elo-roles-${message.guild.id}`, template)

    return `Success.`
}

function addPuzzleEloCommand(message, puzzleRatingRoles, role, elo) {
    for (let i = 0; i < puzzleRatingRoles.length; i++) {
        if (puzzleRatingRoles[i].id == role.id)
            return `This role was already added to the bot!`
    }

    let template = { id: role.id, rating: elo };

    settings.push(`guild-puzzle-elo-roles-${message.guild.id}`, template)

    return `Success.`
}

function addTitleCommand(message, titleRoles, role, title) {
    for (let i = 0; i < titleRoles.length; i++) {
        if (titleRoles[i].id == role.id)
            return `This role was already added to the bot!`
    }

    let template = { id: role.id, title: title };

    settings.push(`guild-title-roles-${message.guild.id}`, template)

    return `Success.`
}

function addCommandToHelp(result, prefix, commandData) {
    return result + prefix + commandData + '\n'
}

async function isBotControlAdminByMessage(message) {
    let modRoles = await settings.get(`guild-bot-mods-${message.guild.id}`)

    if (message.member.permissions.has("ADMINISTRATOR"))
        return true;


    let roleCache = message.member.roles.cache

    for (let i = 0; i < modRoles.length; i++) {
        if(roleCache.has(modRoles[i]))
            return true;
    }

    return false;
}
