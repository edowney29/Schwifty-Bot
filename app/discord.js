const discord = require("discord.js");

// const helper = require("./helper");

const { DISCORD_KEY } = process.env;

// const servers = [];
const deathrolls = {
  offers: {},
  battles: [],
  payments: []
};

module.exports = () => {
  const client = new discord.Client();

  client.on("ready", () => {
    console.log("Ready!");
    // client.user.setActivity("the game of life");
  });

  client.on("message", message => {
    // let index = servers.findIndex(elem => elem.id === message.guild.id);
    // if (index === -1) {
    //   const server = {
    //     id: message.guild.id,
    //     queue: {
    //       ids: [],
    //       names: []
    //     }
    //   };
    //   servers.push(server);
    //   index = servers.length - 1;
    // }
    if (message.author.id === "330539844889477121") return;

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
      // let other = getNumber(strArray[4], true);
      if (!rolls) rolls = 1;

      const numArray = [];
      if (rolls <= 100 && [4, 6, 8, 10, 12, 20, 100].includes(dice)) {
        let str = `Rolled: `;
        if (rolls == 1) {
          const number = Math.floor(Math.random() * dice) + 1;
          numArray.push(number);
          const sum = numArray.reduce(numSum);
          if (plus)
            str += ` ${sum} (${plus >= 0 ? `+${plus}` : `${plus}`}) = **${sum +
              plus}**`;
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
            str += ` ${sum} (${plus >= 0 ? `+${plus}` : `${plus}`}) = **${sum +
              plus}**`;
          else str += `**${sum}**`;
        }

        message
          .reply(str)
          .then(() => {
            if (dice == 20 && rolls == 1) {
              if (numArray.includes(20)) {
                message.reply(nat20[Math.floor(Math.random() * nat20.length)]);
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
      message.delete();
      const strArr = string.split(" ");
      if (strArr.length === 1) {
        const roll = Math.floor(Math.random() * 100) + 1;
        message.channel.send(
          `${idToMention(message.author.id)} rolls ${roll} (1-100)`
        );
      } else if (strArr.length === 2) {
        const max = getNumber(strArr[1]);
        const roll = Math.floor(Math.random() * max) + 1;
        message.channel.send(
          `${idToMention(message.author.id)} rolls ${roll} (1-${max})`
        );
        doBattleStep(message.author.id, roll, max, message);
      } else if (strArr.length === 3) {
        const min = getNumber(strArr[1]);
        const max = getNumber(strArr[2]);
        const roll = Math.floor(Math.random() * max) + min;
        message.channel.send(
          `${idToMention(message.author.id)} rolls ${roll} (${min}-${max})`
        );
      } else {
        message.channel.send("oof try again");
      }
    }

    if (string.includes("/offer")) {
      message.delete();
      const index = getBattleIndex(message.author.id);
      if (~index) {
        message.channel.send(
          `${idToMention(message.author.id)} you're in a deathroll with ${
            message.author.id === deathrolls.battles[index].offer
              ? idToMention(deathrolls.battles[index].accept)
              : idToMention(deathrolls.battles[index].offer)
          }`
        );
      } else {
        const strArr = string.split(" ");
        if (strArr.length === 1) {
          message.channel.send(
            `${idToMention(message.author.id)} add a gold amount /offer 100`
          );
        } else if (strArr.length === 2) {
          const gold = getNumber(strArr[1]) || 100;
          if (deathrolls.offers[message.author.id])
            message.channel.send(
              `${idToMention(
                message.author.id
              )} new offer: ${gold} gold deathroll`
            );
          else
            message.channel.send(
              `${idToMention(
                message.author.id
              )} offers a ${gold} gold deathroll`
            );
          deathrolls.offers[message.author.id] = gold;
        } else {
          message.channel.send("oof try again");
        }
      }
    }

    if (string.includes("/accept")) {
      message.delete();
      const index = getBattleIndex(message.author.id);
      if (~index) {
        message.channel.send(
          `${idToMention(message.author.id)} you're in a deathroll with ${
            message.author.id === deathrolls.battles[index].offer
              ? idToMention(deathrolls.battles[index].accept)
              : idToMention(deathrolls.battles[index].offer)
          }`
        );
      } else {
        const strArr = string.split(" ");
        if (strArr.length === 1) {
          message.channel.send(
            `${idToMention(
              message.author.id
            )} add a username /accept @SchwifyBot`
          );
        } else if (strArr.length === 2) {
          const user = getUserFromMention(strArr[1]);
          if (!user) {
            message.channel.send(
              `${idToMention(message.author.id)} no user was found`
            );
          } else if (deathrolls.offers[user.id]) {
            deathrolls.battles.push({
              accept: message.author.id,
              offer: user.id,
              gold: deathrolls.offers[user.id],
              firstroll: true,
              lastroll: null
            });
            message.channel.send(
              `${idToMention(user.id)} ${
                deathrolls.offers[user.id]
              } gold offer was accepted. ${idToMention(
                message.author.id
              )} /roll ${deathrolls.offers[user.id] * 10}`
            );
            delete deathrolls.offers[message.author.id];
            delete deathrolls.offers[user.id];
          } else {
            message.channel.send(
              `${idToMention(user.id)} doesn't have any offers`
            );
          }
        } else {
          message.channel.send("oof try again");
        }
      }
    }

    if (string.includes("/surrender")) {
      const index = getBattleIndex(message.author.id);
      if (~index) {
        deathrolls.battles.splice(index, 1);
      }
    }

    if (string.includes("/give")) {
      message.delete();
      message.channel.send("oof try again");
    }

    if (string.includes("/leger")) {
      message.delete();
      message.channel.send("oof try again");
    }
  });

  client.on("error", error => console.log(error));

  client.login(DISCORD_KEY);

  const getUserFromMention = mention => {
    // The id is the first and only match found by the RegEx.
    const matches = mention.match(/^<@!?(\d+)>$/);

    // If supplied variable was not a mention, matches will be null instead of an array.
    if (!matches) return;

    // However the first element in the matches array will be the entire mention, not just the ID,
    // so use index 1.
    const id = matches[1];

    return client.users.get(id);
  };

  const getBattleIndex = id => {
    return deathrolls.battles.findIndex(
      battle => battle.offer === id || battle.accept === id
    );
  };

  const doBattleStep = (id, roll, max, message = null) => {
    const index = getBattleIndex(id);
    if (~index) {
      if (
        deathrolls.battles[index].firstroll
          ? id === deathrolls.battles[index].accept
          : id === deathrolls.battles[index].offer
      ) {
        if (!deathrolls.battles[index].lastroll)
          deathrolls.battles[index].lastroll = roll;
        else if (deathrolls.battles[index].lastroll === max) {
          if (roll === 1) {
            message.channel.send(
              `${
                deathrolls.battles[index].firstroll
                  ? idToMention(deathrolls.battles[index].accept)
                  : idToMention(deathrolls.battles[index].offer)
              } is a loser and owes ${
                !deathrolls.battles[index].firstroll
                  ? idToMention(deathrolls.battles[index].accept)
                  : idToMention(deathrolls.battles[index].offer)
              } ${deathrolls.battles[index].gold} gold`
            );
            deathrolls.battles.splice(index, 1);
          } else {
            deathrolls.battles[index].firstroll = !deathrolls.battles[index]
              .firstroll;
            deathrolls.battles[index].lastroll = roll;
          }
        } else {
          message.channel.send(
            `${idToMention(message.author.id)} finish your deathroll with ${
              message.author.id === deathrolls.battles[index].offer
                ? idToMention(deathrolls.battles[index].accept)
                : idToMention(deathrolls.battles[index].offer)
            } /roll ${deathrolls.battles[index].lastroll}`
          );
        }
      }
    }
  };

  const idToMention = id => {
    return `<@${id}>`;
  };
};

const getNumber = (string, parse = false) => {
  let number = null;
  if (parse) number = parseInt(string.match(/(|-?\d+)$/));
  else number = parseInt(string);
  return isNaN(number) ? null : number;
};

const numSum = (a, b) => a + b;

const nat20 = [
  "https://media.giphy.com/media/meKPRINqUoQXC/giphy.gif",
  "https://media.giphy.com/media/Zw3oBUuOlDJ3W/giphy.gif",
  "https://media.giphy.com/media/b09xElu8in7Lq/giphy.gif",
  "https://media.giphy.com/media/Na33dsU2umStO/giphy.gif",
  "https://media.giphy.com/media/90F8aUepslB84/giphy.gif",
  "https://media.giphy.com/media/rmi45iyhIPuRG/giphy.gif",
  "https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif",
  "https://media.giphy.com/media/fDbzXb6Cv5L56/giphy.gif",
  "https://media.giphy.com/media/3o72FcJmLzIdYJdmDe/giphy.gif",
  "https://media.giphy.com/media/3o7btZTXDFpXjK6d56/giphy.gif",
  "https://media.giphy.com/media/wijMRo7UZXSqA/giphy.gif"
];

const nat1 = [
  "https://media.giphy.com/media/EXHHMS9caoxAA/giphy.gif",
  "https://media.giphy.com/media/QwZ4DVuJpkJZS/giphy.gif",
  "https://media.giphy.com/media/aGc9XBGiP9QqY/giphy.gif",
  "https://media.giphy.com/media/zraj11LOUptNsNDfTv/giphy.gif",
  "https://media.giphy.com/media/duexIlfr9yYwYE23UA/giphy.gif",
  "https://media.giphy.com/media/3ePb1CHEjfSRhn6r3c/giphy.gif",
  "https://media.giphy.com/media/dJEMs13SrsiuA/giphy.gif",
  "https://media.giphy.com/media/i4gLlAUz2IVIk/giphy.gif",
  "https://media.giphy.com/media/EFXGvbDPhLoWs/giphy.gif",
  "https://media.giphy.com/media/ONDEDdacIoNjy/giphy.gif",
  "https://media.giphy.com/media/UEkEipSYMWhoY/giphy.gif",
  "https://media.giphy.com/media/DsNFJLcZGuEAo/giphy.gif",
  "https://media.giphy.com/media/I4fvDjTDt7OWQ/giphy.gif",
  "https://media.giphy.com/media/HlTG1x1rzbTos/giphy.gif",
  "https://media.giphy.com/media/rGrxMSVaKvo2Y/giphy.gif",
  "https://media.giphy.com/media/5yaCPstUOV9Kw/giphy.gif",
  "https://media.giphy.com/media/xTk9ZWZR2J0lNIkkCY/giphy.gif",
  "https://media.giphy.com/media/kDmsG1ei4P1Yc/giphy.gif",
  "https://media.giphy.com/media/rW6CpFhDj9lkc/giphy.gif"
];
