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

const Crypto = require('crypto')

const passport = require('passport')

var LichessStrategy = require('passport-lichess').Strategy;
 
const lichess_secret = process.env['LICHESS_OAUTH2']

jsGay.client.on('ready', () => {

  passport.use(new LichessStrategy({
      clientID: `Eyal282-Chess-ELO-Role-Bot-${jsGay.client.user.id}`,
      callbackURL: "https://Chess-ELO-Discord-Bot.chess-elo-role-bot.repl.co/auth/lichess/callback"
    },
    function(accessToken, refreshToken, profile, cb) {
        if(profile.id)
        {
          console.log(profile.id)
          return cb(200, profile.id);
        }
        else
          return cb(404, "Authentication failed")
    }
  ));
})

module.exports = {
	data: new SlashCommandBuilder()
		.setName('passportlichess')
		.setDescription('Links your Lichess in OAuth2. Does not work')

    .addStringOption((option) =>
      option.setName('username').setDescription('Your Lichess Username')
    ),
    async execute(client, interaction, settings, goodies) {
      
      let embed = undefined
      let row = undefined
      let attachment = undefined

      let express = goodies.express
      let app = goodies.app
      let [ratingRoles, puzzleRatingRoles, titleRoles, lichessRatingEquation, chessComRatingEquation, modRoles, timestamp, lichessAccount, chessComAccount, lichessAccountData, chessComAccountData] = await jsGay.getCriticalData(interaction)

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

      let queue = {}

      let userName = interaction.options.getString('username');

      if (userName)
      {
          let code_verifier = randomSecureString()
          let state = randomSecureString(21)

          let challenge = btoa(jsGay.sha256(code_verifier))


        embed = new MessageEmbed()
              .setColor('#0099ff')
              .setDescription(`Prove account ownership [here](https://Chess-ELO-Discord-Bot.chess-elo-role-bot.repl.co/auth/lichess)`)

        app.get('/auth/lichess',
          passport.authenticate('lichess'));

        app.get('/auth/lichess/callback',
          passport.authenticate('lichess', { failureRedirect: '/' }),
          function(req, res) {
            // Successful authentication, redirect home.
            console.log("TESTTTTT")
            console.log(req, res)
            res.redirect('/');
          });
      }
      else
      {

          queue[`lichess-account-of-${interaction.user.id}`] = undefined
          queue[`cached-lichess-account-data-of-${interaction.user.id}`] = undefined

          jsGay.updateProfileDataByInteraction(interaction, true)

          embed = new MessageEmbed()
              .setColor('#0099ff')
              .setDescription(`Successfully unlinked your Lichess Profile`)

      }

      queue[`guild-elo-roles-${interaction.guild.id}`] = ratingRoles
      queue[`guild-puzzle-elo-roles-${interaction.guild.id}`] = puzzleRatingRoles
      queue[`guild-title-roles-${interaction.guild.id}`] = titleRoles
      queue[`guild-bot-mods-${interaction.guild.id}`] = modRoles

      await settings.setMany(queue, true)

      if(embed && row && attachment)
      {
        interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false, files: [attachment] })
      }
      else if(embed && row)
      {
        interaction.editReply({ embeds: [embed], components: [row], failIfNotExists: false })
      }
      else if(embed)
      {
        interaction.editReply({ embeds: [embed], failIfNotExists: false })
      }
    }
};

function randomSecureString(size = 21) {  
  return Crypto
    .randomBytes(size)
    .toString('base64')
    .slice(0, size)
}