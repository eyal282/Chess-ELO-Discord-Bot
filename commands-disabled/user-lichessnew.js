// Urgent todo for passport!!! Fix so that you can't leecch someone else's entry, probably clientID should become the author ID

const { SlashCommandBuilder } = require('@discordjs/builders');

const jsGay = require('../util.js')

const Discord = require('discord.js');
const { Collection } = require('discord.js');
const Canvas = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Permissions } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
const Parser = require('expr-eval').Parser;
const fetch = require('node-fetch');
const Lichess = require('lichess-client')

const passport = require('passport')

var LichessStrategy = require('passport-lichess').Strategy;
 
const lichess_secret = process.env['LICHESS_OAUTH2']

jsGay.client.on('ready', () => {
  
  jsGay.app.use(passport.initialize());
  jsGay.app.use(passport.session());
  
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
});

module.exports =
{
	data: new SlashCommandBuilder()
		.setName('lichessnew')
		.setDescription('Links your Lichess in OAuth2, which is "Sign in With Lichess"'

    ),
    async execute(client, interaction, settings, goodies)
    {
      
      let embed = undefined
      let row = undefined
      let attachment = undefined

      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)

      let obj = await jsGay.wipeDeletedRolesFromDB(interaction, ratingRoles, puzzleRatingRoles, titleRoles, verifyRole)
  
      ratingRoles = obj.ratingRoles
      puzzleRatingRoles = obj.puzzleRatingRoles
      titleRoles = obj.titleRoles
      let guildRoles = obj.guildRoles

      let queue = {}


      let code_verifier = jsGay.generateCodeVerifier()

      let challenge = jsGay.generateCodeVerifier(code_verifier)


      let callbackEnd = challenge

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

              await interaction.followUp({ embeds: [embed], failIfNotExists: false })

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
          .setDescription(`Prove account ownership in the link below this message.\nIf you send the link to anybody, he can force you to pretend you are him`)

        await interaction.editReply({ embeds: [embed], failIfNotExists: false })

        embed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`https://Chess-ELO-Discord-Bot.chess-elo-role-bot.repl.co/auth/lichess/callback/${callbackEnd}`)

        await interaction.followUp({ embeds: [embed], failIfNotExists: false, ephemeral: true })
    }
}