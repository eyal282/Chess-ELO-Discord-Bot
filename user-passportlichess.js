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

const passport = require('passport')

var LichessStrategy = require('passport-lichess').Strategy;

const lichess_secret = process.env['LICHESS_OAUTH2']

passport.use(new LichessStrategy({
    clientID: `Eyal282-Chess-ELO-Role-Bot-${jsGay.client.id}`,
    callbackURL: "http://127.0.0.1:3000/auth/lichess/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ lichessId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

let embed
let row
let attachment

module.exports = {
	data: new SlashCommandBuilder()
		.setName('passportlichess')
		.setDescription('Links your Lichess in OAuth2. Does not work')

    .addStringOption((option) =>
      option.setName('username').setDescription('Your Lichess Username')
    ),
    async execute(client, interaction, settings, goodies) {

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
        embed = new MessageEmbed()
              .setColor('#0099ff')
              .setDescription(`Prove account ownership [here](https://lichess.org/oauth?response_type=code&client_id=Eyal282-Chess-ELO-Role-Bot-${client.id}&redirect_uri=https://chess-elo-discord-bot.chess-elo-role-bot.repl.co/auth/lichess/callback&state=folhsruqgnuewkagqpiabbzoaldybieoznnlratvenhgifilcfpksmbjmdiycoxr&code_challenge_method=S256&code_challenge=${BASE64URL(SHA256(code_verifier))})`)
        app.get('/auth/lichess/callback',
          passport.authenticate('lichess', { failureRedirect: '/' }),
          function(req, res) {
            // Successful authentication, redirect home.

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
