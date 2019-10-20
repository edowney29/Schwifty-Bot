const discord = require("discord.js");

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
      let index = servers.findIndex(elem => elem.id === message.guild.id);
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

      const string = message.content.toLowerCase();
      console.log(
        `[${message.guild.name}] ${message.member.user.username}#${message.member.user.discriminator}: ${message.content}`
      );

      if (string.includes("magic conch")) {
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
        (string.includes("d4") ||
          string.includes("d6") ||
          string.includes("d8") ||
          string.includes("d10") ||
          string.includes("d12") ||
          string.includes("d20") ||
          string.includes("d100")) &&
        !string.includes(" ") &&
        !string.includes(":")
      ) {
        const strArray = string
          .match(/(\d*)(D\d*)((?:[+*-](?:\d+|\([A-Z]*\)))*)(?:\+(D\d*))?/i)
          .map(String);

        let rolls = getNumber(strArray[1], false);
        let dice = getNumber(strArray[2], true);
        let plus = getNumber(strArray[3], false);
        let other = getNumber(strArray[4], true);
        if (!rolls) rolls = 1;

        const numArray = [];
        if (rolls <= 100 && [4, 6, 8, 10, 12, 20, 100].includes(dice)) {
          let str = `Rolled: `;
          if (rolls == 1) {
            const number = Math.floor(Math.random() * dice) + 1;
            numArray.push(number);
            const sum = numArray.reduce(numSum);
            if (plus)
              str += ` ${sum} (${
                plus >= 0 ? `+${plus}` : `${plus}`
              }) = **${sum + plus}**`;
            else str += `**${sum}**`;
          } else {
            for (let i = 0; i < rolls; i++) {
              const number = Math.floor(Math.random() * dice) + 1;
              numArray.push(number);
              str += `${number} `;
              if (i == rolls - 1) {
                str += `--> `;
              } else {
                str += `- `;
              }
            }

            const sum = numArray.reduce(numSum);
            if (plus)
              str += ` ${sum} (${
                plus >= 0 ? `+${plus}` : `${plus}`
              }) = **${sum + plus}**`;
            else str += `**${sum}**`;
          }

          message
            .reply(str)
            .then(() => {
              if (dice == 20 && rolls == 1) {
                if (numArray.includes(20)) {
                  message.reply(
                    nat20[Math.floor(Math.random() * nat20.length)]
                  );
                }
                if (numArray.includes(1)) {
                  message.reply(nat1[Math.floor(Math.random() * nat1.length)]);
                }
              }
            })
            .catch(err => {
              console.error(err);
            });
        }
      }

      if (string.includes("/roll")) {
        const strArr = string.split(" ");
        if (strArr.length === 1) {
          message.reply(Math.floor(Math.random() * 100) + 1);
        } else if (strArr.length === 2) {
          const max = getNumber(strArr[1]);
          message.reply(Math.floor(Math.random() * max) + 1);
        } else if (strArr.length === 3) {
          const min = getNumber(strArr[1]);
          const max = getNumber(strArr[2]);
          message.reply(Math.floor(Math.random() * max) + min);
        } else {
          message.reply("oof");
        }
      }
    });

    client.login(DISCORD_KEY);
  } catch (err) {
    console.log(err);
  }
};

const getNumber = (string, parse = false) => {
  let number = null;
  if (parse) number = parseInt(string.match(/(|-?\d+)$/));
  else number = parseInt(string);
  return isNaN(number) ? null : number;
};

const numSum = (a, b) => a + b;

const nat20 = [
  "https://media.giphy.com/media/3oriOiyS3y8fhg7m9i/giphy.gif",
  "https://media.giphy.com/media/meKPRINqUoQXC/giphy.gif",
  "https://media.giphy.com/media/Y91ljrKMxg4mc/giphy.gif",
  "https://media.giphy.com/media/Zw3oBUuOlDJ3W/giphy.gif",
  "https://media.giphy.com/media/3oriNPdeu2W1aelciY/giphy.gif",
  "https://media.giphy.com/media/b09xElu8in7Lq/giphy.gif",
  "https://media.giphy.com/media/Na33dsU2umStO/giphy.gif",
  "https://media.giphy.com/media/90F8aUepslB84/giphy.gif",
  "https://media.giphy.com/media/rmi45iyhIPuRG/giphy.gif",
  "https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif",
  "https://media.giphy.com/media/fDbzXb6Cv5L56/giphy.gif",
  "https://media.giphy.com/media/3o72FcJmLzIdYJdmDe/giphy.gif"
];

const nat1 = [
  "https://media.giphy.com/media/aCMuJOsnihkwU/giphy.gif",
  "https://media.giphy.com/media/EXHHMS9caoxAA/giphy.gif",
  "https://media.giphy.com/media/wDgw1fJF8hzMY/giphy.gif",
  "https://media.giphy.com/media/QwZ4DVuJpkJZS/giphy.gif",
  "https://media.giphy.com/media/aGc9XBGiP9QqY/giphy.gif",
  "https://media.giphy.com/media/zraj11LOUptNsNDfTv/giphy.gif",
  "https://media.giphy.com/media/duexIlfr9yYwYE23UA/giphy.gif",
  "https://media.giphy.com/media/3ePb1CHEjfSRhn6r3c/giphy.gif",
  "https://media.giphy.com/media/dJEMs13SrsiuA/giphy.gif",
  "https://media.giphy.com/media/i4gLlAUz2IVIk/giphy.gif",
  "https://media.giphy.com/media/EFXGvbDPhLoWs/giphy.gif"
];
