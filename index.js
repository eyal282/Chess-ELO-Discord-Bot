const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const { Permissions } = require('discord.js');
const Parser = require('expr-eval').Parser;


// To do: Puzzle ratings

//const client = new Discord.Client({ partials: ["MESSAGE", "USER", "REACTION"] });
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES']} );
const enmap = require('enmap');
const fetch = require('node-fetch');


const { token } = require('./config.json');

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
	
	const Guilds = client.guilds.cache.map(guild => guild.id);
    console.log(Guilds);
	
    client.user.setActivity(`Mention me to find the prefix`, { type: `WATCHING` });
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

        let ratingRoles = await settings.get(`guild-elo-roles-${message.guild.id}`)


        if (ratingRoles === undefined)
        {
            settings.set(`guild-elo-roles-${message.guild.id}`, [])
            ratingRoles = []
        }

        ratingRoles.sort(function (a, b) { return a.rating - b.rating });

        let titleRoles = await settings.get(`guild-title-roles-${message.guild.id}`)


        if (titleRoles === undefined) {
            settings.set(`guild-title-roles-${message.guild.id}`, [])
            titleRoles = []
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

        try {
            Parser.evaluate(lichessRatingEquation, { x: 1000 })
            Parser.evaluate(lichessRatingEquation, { x: 0 })
            Parser.evaluate(lichessRatingEquation, { x: -1 })

            Parser.evaluate(chessComRatingEquation, { x: 1000 })
            Parser.evaluate(chessComRatingEquation, { x: 0 })
            Parser.evaluate(chessComRatingEquation, { x: -1 })
        }
        catch {}

        if ((timestamp === undefined || timestamp + 120 * 1000 < Date.now() || (client.guilds.cache.size == 1 && timestamp + 10 * 1000 < Date.now())) && ratingRoles.length > 0)
        {
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

                if (result.perfs.puzzle && result.perfs.puzzle.prov === undefined) puzzle = result.perfs.puzzle.rating

                lichessHighestRating = Math.max(corresRating, blitzRating, rapidRating, classicalRating)
                lichessPuzzleRating = puzzleRating

                let value = lichessHighestRating

                try {
                    value = Math.round(Parser.evaluate(lichessRatingEquation, { x: lichessHighestRating }))
                }

                catch { console.log(error)}

                lichessHighestRating = value
                highestRating = lichessHighestRating

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

            for (let i = 0; i < titleRoles.length; i++) {
                if (titleRoles[i].title == lichessTitle || titleRoles[i].title == chessTitle)
                    highestTitleRole = titleRoles[i].id;

                let index = fullRolesArray.indexOf(titleRoles[i].id)

                if (index != -1)
                    fullRolesArray.splice(index, 1);
            }

            if (highestRatingRole != null)
                fullRolesArray.push(highestRatingRole)

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
        settings.set(`guild-elo-roles-${message.guild.id}`, [])
        ratingRoles = []
    }

    let titleRoles = await settings.get(`guild-title-roles-${message.guild.id}`)

    if (titleRoles === undefined) {
        settings.set(`guild-title-roles-${message.guild.id}`, [])
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

    else if (command == "help")
    {
        let result = ""

        result = addCommandToHelp(result, prefix, `lichess [username] ---> Tries to link your Lichess Account. Leave user empty to unlink`)
        result = addCommandToHelp(result, prefix, `chess [username] ---> Tries to link your Chess.com Account. Leave user empty to unlink`)
        result = addCommandToHelp(result, prefix, `prefix [prefix] ---> Changes the bot's prefix, must mention the bot doing so`)
        result = addCommandToHelp(result, prefix, `addelo [elo] [@role] ---> Adds a new role milestone`)
        result = addCommandToHelp(result, prefix, `addtitle [title] [@role] ---> Adds a new role by title. Example: ${prefix}addtitle GM @Grandmaster IM @InterMaster NM @NatMaster`)
        result = addCommandToHelp(result, prefix, `getelo ---> Prints all role milestones`)
        result = addCommandToHelp(result, prefix, `gettitle ---> Prints all titles that gain a role`)
        result = addCommandToHelp(result, prefix, `resetelo ---> Deletes all role milestones. This command will send you a copy of what got reset`)
        result = addCommandToHelp(result, prefix, `resettitle ---> Deletes all title role milestones. This command will send you a copy of what got reset`)
        result = addCommandToHelp(result, prefix, `lichessequation ---> Sets the equation for inflating or deflating lichess rating, x = User's current rating. Default: '${Constant_lichessDefaultRatingEquation}'. Current: '${lichessRatingEquation}'`)
        result = addCommandToHelp(result, prefix, `chessequation --->Sets the equation for inflating or deflating chess.com rating, x = User's current rating. Default: '${Constant_chessComDefaultRatingEquation}'. Current: '${chessComRatingEquation}'`)

        result = result + "Note: -1 ELO stands for provisonary elo (Shows (?) on Lichess) or unrated)\n"
        result = result + "Note: Provisionary rating in Chess.com is artifically calculated by Lichess standards.\n"
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

                    if(message.author.id == '340586932998504449' || (result.profile && result.profile.location && fullDiscordUsername == result.profile.location)) {
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

                    if (message.author.id == '340586932998504449' || (result.location && fullDiscordUsername == result.location)) {
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
        if (!message.member.permissions.has("ADMINISTRATOR")) {
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
        if (!message.member.permissions.has("ADMINISTRATOR")) {
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
        if (!message.member.permissions.has("ADMINISTRATOR"))
        {
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
        if (!message.member.permissions.has("ADMINISTRATOR")) {
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
        if (!message.member.permissions.has("ADMINISTRATOR")) {
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
    else if (command == "addtitle") {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
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
        if (!message.member.permissions.has("ADMINISTRATOR")) {
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
        if (!message.member.permissions.has("ADMINISTRATOR")) {
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
        if (!message.member.permissions.has("ADMINISTRATOR")) {
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
});

client.login(token);

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