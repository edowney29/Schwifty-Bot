const discord = require("discord.js");
const dnd = require("fantasy-content-generator");
const deathrolls = require("./deathrolls");

const { DISCORD_KEY } = process.env;

module.exports = () => {
  const client = new discord.Client();

  client.on("ready", () => {
    console.log("Ready!");
    // client.user.setActivity("the game of life");
  });

  client.on("message", message => {
    if (message.author.id === "330539844889477121") return;

    const string = message.content.toLowerCase();
    // console.log(
    //   `[${message.guild.name}] ${message.member.user.username}#${message.member.user.discriminator}: ${message.content}`
    // );

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
        if (rolls === 1) {
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
            if (i === rolls - 1) {
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
            if (dice === 20 && rolls === 1) {
              if (numArray.includes(20)) {
                message.reply(nat20[Math.floor(Math.random() * nat20.length)]);
              }
              if (numArray.includes(1)) {
                message.reply(nat1[Math.floor(Math.random() * nat1.length)]);
              }
            }
          })
          .catch(err => console.error(err));
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
        deathrolls
          .updateBattle(message.author.id, roll, max, message)
          .then(battle => {
            if (battle) {
              if (roll === 1) {
                deathrolls.updateGold(
                  message.author.id,
                  -Math.abs(battle.gold)
                );
                const otherid =
                  message.author.id === battle.offerid
                    ? battle.offerid
                    : battle.acceptid;
                deathrolls.updateGold(otherid, Math.abs(battle.gold));
              }
              message.channel
                .fetchMessage(battle.messageid)
                .then(mes => {
                  let str = mes.content;
                  str = str.concat(
                    `\n> ${message.author.username} rolls ${roll} (1-${max})`
                  );
                  mes.edit(str);
                })
                .catch(err => console.log(err));
            } else {
              message.channel.send(
                `${idToMention(message.author.id)} rolls ${roll} (1-${max})`
              );
            }
          })
          .catch(err => console.log(err));
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

    // if (string.includes("/offer")) {
    //   message.delete();
    //   const strArr = string.split(" ");
    //   if (strArr.length === 2) {
    //     const gold = getNumber(strArr[1]) || 100;
    //     message.channel.send(
    //       `${idToMention(message.author.id)} offers a ${gold} gold deathroll`
    //     );
    //     deathrolls.offers[message.author.id] = {
    //       username: message.author.username,
    //       guildid: message.guild.id,
    //       gold: gold
    //     };
    //   } else {
    //     message.author.send(
    //       "```Commands:\n/roll 100\n/offer 10\n/accept @SchwiftyBot\n/balance\n/help```"
    //     );
    //   }
    // }

    // if (string.includes("/accept")) {
    //   message.delete();
    //   const strArr = string.split(" ");
    //   if (strArr.length === 2) {
    //     const user = getUserFromMention(strArr[1]);
    //     if (!user || !deathrolls.offers[user.id]) {
    //       message.channel.send(
    //         `${idToMention(
    //           message.author.id
    //         )} no offer or user was found in this channel`
    //       );
    //     } else if (deathrolls.offers[user.id].guildid === message.guild.id) {
    //       message.channel
    //         .send(
    //           `> ${user.username}'s ${
    //           deathrolls.offers[user.id].gold
    //           } gold offer was accepted. ${
    //           message.author.username
    //           } /roll ${deathrolls.offers[user.id].gold * 10}`
    //         )
    //         .then(botmessage => {
    //           deathrolls.createUser(user);
    //           deathrolls.createUser(message.author);
    //           deathrolls.createBattle(
    //             user,
    //             message.author,
    //             botmessage,
    //             deathrolls.offers[user.id].gold
    //           );
    //           delete deathrolls.offers[user.id];
    //           delete deathrolls.offers[message.author.id];
    //         });
    //     } else {
    //       message.channel.send(`${user.username} doesn't have any offers`);
    //     }
    //   } else {
    //     message.author.send(
    //       "```Commands:\n/roll 100\n/offer 10\n/accept @SchwiftyBot\n/balance\n/help```"
    //     );
    //   }
    // }

    // if (string.includes("/balance")) {
    //   message.delete();
    //   deathrolls
    //     .fetchRecord(message.author, message)
    //     .then(res => {
    //       // let lastKey = battles['LastEvaluatedKey'] || null
    //       const battles = res[0];
    //       const user = res[1];
    //       const wins = [],
    //         losses = [];
    //       // accept won = 1 and isfrist --- offer won = 1 and !isfirst
    //       battles.Items.forEach(item => {
    //         const record = deathrolls.itemToObject(item);
    //         record.lastroll === 1 &&
    //           ((record.acceptid === message.author.id && record.isfirst) ||
    //             (record.offerid === message.author.id && !record.isfirst))
    //           ? wins.push(record)
    //           : losses.push(record);
    //       });

    //       let str = `${idToMention(message.author.id)} you have ${
    //         deathrolls.itemToObject(user.Item)["gold"]
    //         } gold`;
    //       wins.forEach(win => {
    //         str = str.concat(
    //           `\nYou won ${win.gold} gold from ${
    //           win.isfirst ? win.offer : win.accept
    //           }`
    //         );
    //       });
    //       losses.forEach(loss => {
    //         str = str.concat(
    //           `\nYou lost ${loss.gold} gold to ${
    //           !loss.isfirst ? loss.offer : loss.accept
    //           }`
    //         );
    //       });
    //       message.channel.send(str);
    //     })
    //     .catch(err => console.log(err));
    // }

    // if (string.includes("/help")) {
    //   message.delete();
    //   message.channel.send(
    //     "```Commands:\n/roll 100\n/offer 10\n/accept @SchwiftyBot\n/balance\n/help```"
    //   );
    // }

    if (string.includes("/dnditem")) {
      message.delete();
      message.channel.send(
        JSON.stringify(dnd.MagicItems.generate(), undefined, 2),
        {
          code: true
        }
      );
    }

    if (string.includes("/dndhook")) {
      message.delete();
      message.channel.send(
        JSON.stringify(dnd.Storyhooks.npcActs(), undefined, 2),
        {
          code: true
        }
      );
    }

    if (string.includes("/dndnpc")) {
      message.delete();
      message.channel.send(JSON.stringify(dnd.NPCs.generate(), undefined, 2), {
        code: true
      });
    }

    if (string.includes("/dndrandom")) {
      message.delete();
      message.channel.send(JSON.stringify(dnd.Loots.source(), undefined, 2), {
        code: true
      });
    }
  });

  client.on("error", error => console.log(error));

  client.login(DISCORD_KEY);

  const getUserFromMention = mention => {
    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return;
    const id = matches[1];
    return client.users.get(id);
  };
};

const getNumber = (string, parse = false) => {
  let number = null;
  if (parse) number = parseInt(string.match(/(|-?\d+)$/));
  else number = parseInt(string);
  return isNaN(number) ? null : number;
};

const numSum = (a, b) => a + b;

const idToMention = id => `<@${id}>`;

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
