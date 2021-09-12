const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const { Permissions } = require('discord.js');

//const client = new Discord.Client({ partials: ["MESSAGE", "USER", "REACTION"] });
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES']} );
const enmap = require('enmap');
const fetch = require('node-fetch');

const { token } = require('./config.json');

let defaultPrefix = "!"
//const bot = new Discord.Client();


const settings = new enmap({
    name: "settings",
    autoFetch: true,
    cloneLevel: "deep",
    fetchAll: true
});


client.on('ready', () => {
    console.log("Chess ELO Bot has been loaded.");

    client.user.setActivity(`Mention me to find the prefix`, { type: `WATCHING` });
});

// Messages without the prefix
client.on('message', async message => {
    if (message.author.bot) return;

    let prefix = await settings.get(`guild-prefix-${message.guild.id}`)

    if (prefix === undefined) prefix = defaultPrefix

    if (message.content.indexOf(prefix) === 0) return;
   
    if (message.mentions.has(client.user)) {
        message.reply('Prefix is `' + prefix + '`')
    }
    else
    {
        let timestamp = await settings.get(`last-updated-${message.author.id}`)

        let ratingRoles = await settings.get(`guild-elo-roles-${message.guild.id}`)

        if ((timestamp === undefined || timestamp + 10 * 1000 < Date.now()) && ratingRoles !== undefined && ratingRoles.length > 0)
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
			
			let highestRating = 0
			let lichessHighestRating = 0
			
			if(result != null)
			{
                let bulletRating = 0
                let blitzRating = 0
                let rapidRating = 0
                let classicalRating = 0

                if (result.perfs.bullet.rating && result.perfs.bullet.prov === undefined) bulletRating = result.perfs.bullet.rating
                if (result.perfs.blitz.rating && result.perfs.blitz.prov === undefined) blitzRating = result.perfs.blitz.rating
                if (result.perfs.rapid.rating && result.perfs.rapid.prov === undefined) rapidRating = result.perfs.rapid.rating
                if (result.perfs.classical.rating && result.perfs.classical.prov === undefined) classicalRating = result.perfs.classical.rating
				
                lichessHighestRating = Math.max(bulletRating, blitzRating, rapidRating, classicalRating)
                highestRating = lichessHighestRating
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
                let bulletRating = 0
                let blitzRating = 0
                let rapidRating = 0

                if (result.chess_bullet) bulletRating = result.chess_bullet.last.rating
                if (result.chess_blitz) blitzRating = result.chess_blitz.last.rating
                if (result.chess_rapid) rapidRating = result.chess_rapid.last.rating

				highestRating = Math.max(lichessHighestRating, bulletRating, blitzRating, rapidRating)
			}

			let highestRole = ratingRoles[0];

			let rolesToRemove = []

			
			for (let i = 0; i < ratingRoles.length; i++)
			{
				if (highestRating >= ratingRoles[i].rating)
					highestRole = ratingRoles[i].id;

				if(message.member.roles.cache.has(ratingRoles[i].id))
				{
					rolesToRemove.push(ratingRoles[i].id);
				}
			}

			if (rolesToRemove.length > 0) message.member.roles.remove(rolesToRemove)

			message.member.roles.add(highestRole)
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


        if (command == "prefix")
        {
            if (!message.member.permissions.has("ADMINISTRATOR"))
            {
                return message.reply("Access Denied")
            }

            else if (args[0].length > 5)
            {
                return message.reply("Prefix cannot exceed 5 characters!")
            }

            settings.set(`guild-prefix-${message.guild.id}`, args[0])
            message.reply('Prefix was successfully set to `' + args[0] + '`')
        }
        else if(command == "addelo")
        {
            if (args.length < 2) {
                return message.reply(`${prefix}addelo [elo] [@role]`)
            }
            else if (message.mentions.roles.size != 1)
            {
                return message.reply(`${prefix}addelo [elo] [@role]`)
            }

            let elo = args[0]



            let template = []

            template.id = message.mentions.roles.first().id
            template.rating = elo


            await settings.set(`guild-elo-roles-${message.guild.id}`, template.toString())

            let roles = await settings.get(`guild-elo-roles-${message.guild.id}`)

            console.log(' a' + roles.toString())
            message.reply(`Success.`)

        }
        else if (command == "getelo") {

            let roles = await settings.get(`guild-elo-roles-${message.guild.id}`, 'id')

            if (roles === undefined)
                roles = []

            else
                console.log(' a' + roles)

            let msgToSend = ""

            for (let i = 0; i < roles.length; i++)
            {
                msgToSend = msgToSend + "<@" + roles[i].id + "> ( " + roles[i].rating + " ELO ) \n "
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
           settings.delete(`guild-elo-roles-${message.guild.id}`)
        }
        else if (command == "lichess") {
        //deleteMessageAfterTime(message, 2000);

        if (args[0]) {

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

               
                if (result.profile && result.profile.location && fullDiscordUsername == result.profile.location) {
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
        else
        {

            settings.delete(`lichess-account-of-${message.author.id}`)

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully unlinked your Lichess Profile`)

            message.reply({ embeds: [embed] })

        }
    }
	else if (command == "chess") {
        //deleteMessageAfterTime(message, 2000);

        if (args[0]) {

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
        else
        {
            settings.delete(`lichess-account-of-${message.author.id}`)

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`Successfully unlinked your Chess.com Profile`)

            message.reply({ embeds: [embed] })
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