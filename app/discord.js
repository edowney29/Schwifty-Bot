const discord = require("discord.js");
const _ = require("lodash");

// const helper = require("./helper");

const { DISCORD_KEY } = process.env;

const servers = [];

module.exports = () => {
  try {
    const client = new discord.Client();

    client.on("ready", () => {
      console.log("Ready!");
      // client.user.setActivity("the game of life");
    });

    client.on("message", message => {
      let index = _.findIndex(servers, {
        id: message.guild.id
      });

      if (index === -1) {
        const server = {
          id: message.guild.id,
          queue: {
            ids: [],
            names: []
          }
        };
        servers.push(server);
        index = servers.length - 1;
      }

      const string = _.toLower(message.content);
      console.log(
        `[${message.guild.name}] ${message.member.user.username}#${message.member.user.discriminator}: ${message.content}`
      );

      if (_.includes(string, "magic conch")) {
        const answers = [
          // "Maybe.",
          // "Certainly not.",
          // "Not in your wildest dreams.",
          // "Nah, fam.",
          // "There is a good chance.",
          // "Quite likely.",
          // "I hope not.",
          // "Without a doubt.",
          // "I hope so.",
          // "Never!",
          // "Fuhgeddaboudit.",
          // "Pfft.",
          // "Very doubtful.",
          // "Sorry, bucko.",
          // "Hell, yes.",
          // "Hell to the no.",
          // "The future is bleak.",
          // "The future is uncertain.",
          // "I would rather not say.",
          // "Who cares?",
          // "Possibly.",
          // "Never, ever, ever.",
          // "There is a small chance.",
          // "Yes!",
          // "Obviously.",
          // "42",
          "Maybe someday.",
          "Nothing.",
          "Neither.",
          "Follow the seahorse.",
          "I don't think so.",
          "No.",
          "Yes.",
          "Try asking again.",
          "No.",
          "No.",
          "No."
        ];

        message.reply(answers[Math.floor(Math.random() * answers.length)]);
      }

      if (
        (_.includes(string, "d4") ||
          _.includes(string, "d6") ||
          _.includes(string, "d8") ||
          _.includes(string, "d10") ||
          _.includes(string, "d12") ||
          _.includes(string, "d20") ||
          _.includes(string, "d100")) &&
        !_.includes(string, " ") &&
        !_.includes(string, ":")
      ) {
        const strArray = _.split(string, "d");
        console.log;
        const rolls = getRolls(strArray[0]);
        const dice = parseInt(strArray[1].match(/\d+/)[0]);
        const numArray = [];

        if (rolls < 1000 && _.includes([4, 6, 8, 10, 12, 20, 100], dice)) {
          let str = `Rolled: `;
          if (rolls == 1) {
            const number = Math.floor(Math.random() * dice) + 1;
            numArray.push(number);
            str += `${number}`;
          } else {
            for (let i = 0; i < rolls; i++) {
              const number = Math.floor(Math.random() * dice) + 1;
              numArray.push(number);
              str += `${number} `;
              if (i == rolls - 1) {
                str += `= `;
              } else {
                str += `+ `;
              }
            }

            const sum = numArray.reduce(numSum);
            str += `${sum}`;
          }

          message
            .reply(str)
            .then(() => {
              if (dice == 20 && rolls == 1) {
                if (_.includes(numArray, 20)) {
                  message.reply(
                    nat20[Math.floor(Math.random() * nat20.length)]
                  );
                }
                if (_.includes(numArray, 1)) {
                  message.reply(nat1[Math.floor(Math.random() * nat1.length)]);
                }
              }
            })
            .catch(err => {
              console.error(err);
            });
        }
      }
    });

    client.login(DISCORD_KEY);
  } catch (err) {
    console.log(err);
  }
};

const getRolls = string => {
  const number = parseInt(string.match(/\d+$/));
  return isNaN(number) ? 1 : number;
};

const numSum = (a, b) => a + b;

const nat20 = [
  "https://media.giphy.com/media/3oriOiyS3y8fhg7m9i/giphy.gif",
  "https://media.giphy.com/media/meKPRINqUoQXC/giphy.gif",
  "https://media.giphy.com/media/Y91ljrKMxg4mc/giphy.gif",
  "https://media.giphy.com/media/Zw3oBUuOlDJ3W/giphy.gif"
];

const nat1 = [
  "https://media.giphy.com/media/aCMuJOsnihkwU/giphy.gif",
  "https://media.giphy.com/media/EXHHMS9caoxAA/giphy.gif"
];
