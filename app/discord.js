const discord = require("discord.js");
const _ = require("lodash");

const helper = require("./discordHelper");

const { DISCORD_KEY } = process.env;

const servers = [];

module.exports = () => {
  const client = new discord.Client();

  client.on("ready", () => {
    console.log("Ready!");
    //client.user.setActivity("the game of life");
  });

  // eslint-disable-next-line complexity
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
      `[${message.guild.name}] ${message.member.user.username}#${
        message.member.user.discriminator
      }: ${message.content}`
    );

    if (_.includes(string, "!join")) {
      if (message.member.voiceChannel) {
        if (message.member.voiceChannel.connection) {
          message.member.voiceChannel.connection.disconnect();
        }

        message.member.voiceChannel.join();
      } else {
        message.reply("You must be in a voice channel.");
      }
    }

    if (_.includes(string, "!play")) {
      if (message.member.voiceChannel) {
        let videoTitle = _.split(string, " ");
        videoTitle = _.drop(videoTitle, 1);
        videoTitle = _.join(videoTitle, " ");

        queueSong(videoTitle, index)
          .then(obj => {
            servers[index].queue.ids.push(obj.id);
            servers[index].queue.names.push(obj.name);
            const url = `http://www.youtube.com/watch?v=${
              servers[index].queue.ids[servers[index].queue.ids.length - 1]
            }`;
            message.reply(`Song queued: ${url}`);

            // Not sure what this did
            // var dispatcher = message.guild.voiceConnection.dispatcher
            // if (!dispatcher) {
            message.reply(`Downloading: ${servers[index].queue.names[0]}`);
            downloadSong(message.guild.id, url)
              .then(container => {
                const connection = message.guild.voiceConnection;
                const streamOptions = {
                  seek: 0,
                  volume: 0.1,
                  passes: 1,
                  bitrate: 32 * 1024
                };
                const streamDispatcher = connection.playFile(
                  `./public/${message.guild.id}.${container}`,
                  streamOptions
                );
                streamDispatcher.on("end", reason => {
                  console.log(reason);
                });
                streamDispatcher.on("start", () => {
                  message.reply("Playing!");
                  servers[index].queue.ids = _.drop(
                    servers[index].queue.ids,
                    1
                  );
                  servers[index].queue.names = _.drop(
                    servers[index].queue.names,
                    1
                  );
                });
                streamDispatcher.on("error", error => console.log(error));
              })
              .catch(err => console.log(err));
            // }
          })
          .catch(err => console.log(err));
      } else {
        message.reply("You must be in a voice channel.");
      }
    }

    if (_.includes(string, "!next")) {
      if (message.member.voiceChannel && servers[index].queue.ids.length > 0) {
        const url = `http://www.youtube.com/watch?v=${
          servers[index].queue.ids[0]
        }`;
        // Var dispatcher = message.guild.voiceConnection.dispatcher
        // if (dispatcher) {
        message.guild.voiceConnection.dispatcher.end();
        message.reply(`Downloading: ${servers[index].queue.names[0]}`);
        downloadSong(message.guild.id, url)
          .then(container => {
            const connection = message.guild.voiceConnection;
            const streamOptions = {
              seek: 0,
              volume: 0.2,
              passes: 1,
              bitrate: 48 * 1024
            };
            const streamDispatcher = connection.playFile(
              `./public/${message.guild.id}.${container}`,
              streamOptions
            );
            streamDispatcher.on("end", reason => {
              console.log(reason);
              // Message.reply('!next')
            });
            streamDispatcher.on("start", () => {
              message.reply("Playing!");
              servers[index].queue.ids = _.drop(servers[index].queue.ids, 1);
              servers[index].queue.names = _.drop(
                servers[index].queue.names,
                1
              );
            });
            streamDispatcher.on("error", error => console.log(error));
          })
          .catch(err => console.log(err));
        // }
      } else {
        message.reply("You must be in a voice channel.");
      }
    }

    if (_.includes(string, "!resume")) {
      if (message.member.voiceChannel) {
        let { dispatcher } = message.guild.voiceConnection;
        if (dispatcher) {
          if (dispatcher.paused) {
            dispatcher.resume();
            message.reply("Playing!");
          }
        }
      } else {
        message.reply("You must be in a voice channel.");
      }
    }

    if (_.includes(string, "!pause")) {
      if (message.member.voiceChannel) {
        let { dispatcher } = message.guild.voiceConnection;
        if (dispatcher) {
          if (!dispatcher.paused) {
            dispatcher.pause();
            message.reply("Paused!");
          }
        }
      } else {
        message.reply("You must be in a voice channel.");
      }
    }

    if (_.includes(string, "!check")) {
      if (message.member.voiceChannel) {
        const str = `${
          servers[index].queue.names.length
        } songs queued \n${_.join(servers[index].queue.names, "\n")}`;
        message.reply(str);
      }
    }

    if (_.includes(string, "!remove")) {
      if (message.member.voiceChannel) {
        const num = servers[index].queue.ids.length;
        if (num > 0) {
          message.reply(
            `Song removed:  + ${servers[index].queue.names[num - 1]}`
          );
          servers[index].queue.ids = _.drop(servers[index].queue.ids, 1);
          servers[index].queue.names = _.drop(servers[index].queue.names, 1);
        }
      } else {
        message.reply("You must be in a voice channel.");
      }
    }

    if (_.includes(string, "magic conch")) {
      const answers = [
        /*
        "Maybe.",
        "Certainly not.",
        "Not in your wildest dreams.",
        "Nah, fam.",
        "There is a good chance.",
        "Quite likely.",
        "I hope not.",
        "Without a doubt.",
        "I hope so.",
        "Never!",
        "Fuhgeddaboudit.",
        "Pfft.",
        "Very doubtful.",
        "Sorry, bucko.",
        "Hell, yes.",
        "Hell to the no.",
        "The future is bleak.",
        "The future is uncertain.",
        "I would rather not say.",
        "Who cares?",
        "Possibly.",
        "Never, ever, ever.",
        "There is a small chance.",
        "Yes!",
        "Obviously.",
        "42",
        */
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
      _.indexOf(string, " ") < 0
    ) {
      const strArray = _.split(string, "d");
      console.log;
      const rolls = getRolls(strArray[0]);
      const dice = parseInt(strArray[1].match(/\d+/)[0]);
      const numArray = [];

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
              message.reply(nat20[Math.floor(Math.random() * nat20.length)]);
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
  });

  client.login(DISCORD_KEY);
};

const getRolls = string => {
  const number = parseInt(string.match(/\d+$/));
  return isNaN(number) ? 1 : number;
};

const numSum = (a, b) => a + b;

const queueSong = (videoTitle, index) => {
  helper.searchVideos(videoTitle).then(videos => {
    helper.listVideos(videos).then(list => {
      helper.sortSongSearch(index, videoTitle, list).then(data => {
        return data;
      });
    });
  });
};

const downloadSong = (guildID, url) => {
  helper.getInfo(url).then(audioFormats => {
    helper.downloadSong(guildID, audioFormats).then(data => {
      return data;
    });
  });
};

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
