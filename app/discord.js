const discord = require('discord.js');
const moment_tz = require('moment-timezone');
const moment = require('moment');
const _ = require('lodash');

const helper = require('./discordHelper');

const { DISCORD_KEY } = process.env;
const client = new discord.Client();

const servers = [];

client.on('ready', () => {
  client.user.setActivity('the game of life');
});

// eslint-disable-next-line complexity
client.on('message', (message) => {
  let index = _.findIndex(servers, {
    id: message.guild.id,
  });

  if (index === -1) {
    const server = {
      id: message.guild.id,
      queue: {
        ids: [],
        names: [],
      },
    };
    servers.push(server);
    index = servers.length - 1;
  }

  const string = _.toLower(message.content);
  console.log(`[${message.guild.id}] ${message.member.id}: ${message.content}`);

  if (_.includes(string, '!join')) {
    if (message.member.voiceChannel) {
      if (message.member.voiceChannel.connection) {
        message.member.voiceChannel.connection.disconnect();
      }

      message.member.voiceChannel.join();
    } else {
      message.reply('You must be in a voice channel.');
    }
  }

  if (_.includes(string, '!play')) {
    if (message.member.voiceChannel) {
      let videoTitle = _.split(string, ' ');
      videoTitle = _.drop(videoTitle, 1);
      videoTitle = _.join(videoTitle, ' ');

      queueSong(videoTitle, index)
        .then((obj) => {
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
            .then((container) => {
              const connection = message.guild.voiceConnection;
              const streamOptions = {
                seek: 0,
                volume: 0.2,
                passes: 1,
                bitrate: 48 * 1024,
              };
              const streamDispatcher = connection.playFile(
                `./public/${message.guild.id}.${container}`,
                streamOptions,
              );
              streamDispatcher.on('end', (reason) => {});
              streamDispatcher.on('start', () => {
                message.reply('Playing!');
                servers[index].queue.ids = _.drop(servers[index].queue.ids, 1);
                servers[index].queue.names = _.drop(
                  servers[index].queue.names,
                  1,
                );
              });
              streamDispatcher.on('error', error => console.log(error));
            })
            .catch(err => console.log(err));
          // }
        })
        .catch(err => console.log(err));
    } else {
      message.reply('You must be in a voice channel.');
    }
  }

  if (_.includes(string, '!next')) {
    if (message.member.voiceChannel && servers[index].queue.ids.length > 0) {
      const url = `http://www.youtube.com/watch?v=${
        servers[index].queue.ids[0]
      }`;
      // Var dispatcher = message.guild.voiceConnection.dispatcher
      // if (dispatcher) {
      message.guild.voiceConnection.dispatcher.end();
      message.reply(`Downloading: ${servers[index].queue.names[0]}`);
      downloadSong(message.guild.id, url)
        .then((container) => {
          const connection = message.guild.voiceConnection;
          const streamOptions = {
            seek: 0,
            volume: 0.2,
            passes: 1,
            bitrate: 48 * 1024,
          };
          const streamDispatcher = connection.playFile(
            `./public/${message.guild.id}.${container}`,
            streamOptions,
          );
          streamDispatcher.on('end', (reason) => {
            // Message.reply('!next')
          });
          streamDispatcher.on('start', () => {
            message.reply('Playing!');
            servers[index].queue.ids = _.drop(servers[index].queue.ids, 1);
            servers[index].queue.names = _.drop(servers[index].queue.names, 1);
          });
          streamDispatcher.on('error', error => console.log(error));
        })
        .catch(err => console.log(err));
      // }
    } else {
      message.reply('You must be in a voice channel.');
    }
  }

  if (_.includes(string, '!resume')) {
    if (message.member.voiceChannel) {
      var { dispatcher } = message.guild.voiceConnection;
      if (dispatcher) {
        if (dispatcher.paused) {
          dispatcher.resume();
          message.reply('Playing!');
        }
      }
    } else {
      message.reply('You must be in a voice channel.');
    }
  }

  if (_.includes(string, '!pause')) {
    if (message.member.voiceChannel) {
      var { dispatcher } = message.guild.voiceConnection;
      if (dispatcher) {
        if (!dispatcher.paused) {
          dispatcher.pause();
          message.reply('Paused!');
        }
      }
    } else {
      message.reply('You must be in a voice channel.');
    }
  }

  if (_.includes(string, '!check')) {
    if (message.member.voiceChannel) {
      const str = `${servers[index].queue.names.length} songs queued \n${_.join(
        servers[index].queue.names,
        '\n',
      )}`;
      message.reply(str);
    }
  }

  if (_.includes(string, '!remove')) {
    if (message.member.voiceChannel) {
      const num = servers[index].queue.ids.length;
      if (num > 0) {
        message.reply(
          `Song removed:  + ${servers[index].queue.names[num - 1]}`,
        );
        servers[index].queue.ids = _.drop(servers[index].queue.ids, 1);
        servers[index].queue.names = _.drop(servers[index].queue.names, 1);
      }
    } else {
      message.reply('You must be in a voice channel.');
    }
  }

  if (_.includes(string, 'magic') && _.includes(string, 'conch')) {
    const answers = [
      'Maybe.',
      'Certainly not.',
      'Not in your wildest dreams.',
      'Nah, fam.',
      'There is a good chance.',
      'Quite likely.',
      'I hope not.',
      'Without a doubt.',
      'I hope so.',
      'Never!',
      'Fuhgeddaboudit.',
      'Pfft.',
      'Very doubtful.',
      'Sorry, bucko.',
      'Hell, yes.',
      'Hell to the no.',
      'The future is bleak.',
      'The future is uncertain.',
      'I would rather not say.',
      'Who cares?',
      'Possibly.',
      'Never, ever, ever.',
      'There is a small chance.',
      'Yes!',
      'Obviously.',
      'No.',
      '42',
    ];
    const length = answers.length - 1;
    const distribution = random.integer(0, length);
    const answer = _.toString(answers[distribution(engine)]);
    message.reply(answer);
  }

  if (_.includes(string, 'd20')) {
    const number = Math.random() * (20 - 1) + 1;
    const d20 = _.toString(number);
    message.reply(d20);
  }

  /* Not needed anymore
	if (_.includes(string, 'tz ')) {
		var msg = _.toUpper(string);
		msg = _.split(msg, ' ');

		var index = msg.indexOf('TZ');

		var time = msg[index + 1].split(':');
		var hours = parseInt(time[0]);
		var minutes = parseInt(time[1]);

		var tz = msg[index + 2];
		var zone = getZone(tz);

		if (zone == null) {
			message.reply('Unknown Timezone');
			return;
		}

		// Create date object with user inputted time in timezone
		var now = moment_tz.tz(moment().utc(), zone);
		var date = moment(now);
		date.set('hours', hours + 12);
		date.set('minutes', minutes);

		// Tz mutates date, does not return new one
		message.reply(
			'\n' + date.tz('America/New_York').zoneAbbr() + ':\t' + date.format('h:mm a') +
			'\n' + date.tz('America/Chicago').zoneAbbr() + ':\t' + date.format('h:mm a') +
			'\n' + date.tz('America/Denver').zoneAbbr() + ':\t' + date.format('h:mm a') +
			'\n' + date.tz('America/Los_Angeles').zoneAbbr() + ':\t' + date.format('h:mm a') +
			'\n' + date.tz('Europe/Dublin').zoneAbbr() + ':\t' + date.format('h:mm a')
		);
	}
	*/
});

client.login(DISCORD_KEY);

const getZone = (zone) => {
  switch (zone) {
    case 'EDT':
    case 'EST':
    case 'EASTERN':
      return 'America/New_York';
    case 'CDT':
    case 'CST':
    case 'CENTRAL':
      return 'America/Chicago';
    case 'MDT':
    case 'MST':
    case 'MOUNTAIN':
      return 'America/Denver';
    case 'PST':
    case 'PDT':
    case 'PACIFIC':
      return 'America/Los_Angeles';
    case 'GMT':
    case 'IST':
    case 'IRELAND':
      return 'Europe/Dublin';
    default:
      return null;
  }
};

const queueSong = async (videoTitle, index) => {
  try {
    const videos = await helper.searchVideos(videoTitle);
    const list = await helper.listVideos(videos);
    return await helper.sortSongSearch(index, videoTitle, list);
  } catch (err) {
    console.log(err);
    return err;
  }
};

const downloadSong = async (guildID, url) => {
  try {
    const audioFormats = await helper.getInfo(url);
    return await helper.downloadSong(guildID, audioFormats);
  } catch (err) {
    console.log(err);
    return err;
  }
};
