const discord = require('discord.js')
const random = require('random-js')
const moment = require('moment-timezone');
const _ = require('lodash')
//const ffmpeg = require('ffmpeg')
const googleapis = require('googleapis');
const ytdl = require('ytdl-core');
const fs = require('fs')

const client = new discord.Client()
const DISCORD_KEY = process.env.DISCORD_KEY
const GOOGLE_KEY = process.env.GOOGLE_KEY

const engine = random.engines.mt19937().autoSeed()

var users

client.on('ready', () => {
	var obj = client.users.map(u => `${u.username}#${u.discriminator}${u.id}`).join('')
	var temp = _.toLower(obj)
	users = _.split(temp, ';')
	//console.log(users)
})

client.on('message', message => {
	var msg = _.toLower(message.content)
	msg = msg.split(' ')
	console.log(msg)

	if (_.includes(msg, 'ping')) {
		message.reply('pong')
	}

	if (_.includes(msg, '!play')) {
		_.drop(msg, 1)
		var term = msg.join(' ')

		var youtube = googleapis.youtube({
			version: 'v3',
			auth: GOOGLE_KEY
		});

		youtube.search.list({
			part: 'snippet',
			q: term,
			maxResults: 1,
			type: 'video'
		}, function (err, data) {
			if (err) {
				console.error('Error: ' + err);
				message.reply('Fucking ERRORS @#%@!%@# ^__^');
			}
			if (data) {
				if (message.member.voiceChannel) {
					message.member.voiceChannel.join()
						.then(connection => { // Connection is an instance of VoiceConnection
							var streamOptions = { seek: 0, volume: 1 };
							var stream = ytdl('https://www.youtube.com/watch?v=' + data[0].id.videoId, { filter: 'audioonly' });
							var dispatcher = connection.playStream(stream, streamOptions);
						})
						.catch(console.log);

				} else {
					message.reply('You need to join a voice channel first!');
				}
			}
		});
	}

	if (_.includes(msg, 'magic') && _.includes(msg, 'conch')) {
		var answers = [
			'Maybe.', 'Certainly not.', 'Not in your wildest dreams.', 'Nah, fam.',
			'There is a good chance.', 'Quite likely.', 'I hope not.', 'Without a doubt.',
			'I hope so.', 'Never!', 'Fuhgeddaboudit.', 'Pfft.', 'Very doubtful.',
			'Sorry, bucko.', 'Hell, yes.', 'Hell to the no.', 'The future is bleak.',
			'The future is uncertain.', 'I would rather not say.', 'Who cares?',
			'Possibly.', 'Never, ever, ever.', 'There is a small chance.', 'Yes!',
			'Obviously.', 'No.', '42',
		]
		var length = answers.length - 1
		var distribution = random.integer(0, length)
		var answer = answers[distribution(engine)].toString()
		message.reply(answer)
	}

	if (_.includes(msg, 'd20')) {
		var distribution = random.integer(1, 20)
		var d20 = distribution(engine).toString()
		message.reply(d20)
	}

	if (_.includes(msg, 'tz')) {
		var m = msg.join(' ')
		msg = _.toUpper(m)
		msg = msg.split(' ')

		var index = msg.indexOf('TZ')

		var time = msg[index + 1].split(':')
		var hour = parseInt(time[0])
		var minutes = parseInt(time[1])

		var tz = msg[index + 2]
		var zone = getZone(tz)

		var now = new Date()
		// create date object with user inputted time in timezone
		var date = moment.tz(now.getFullYear() + '-' +
			(now.getMonth() < 10 ? '0' : '') + now.getMonth() + '-' +
			(now.getDate() < 10 ? '0' : '') + now.getDate() + ' ' +
			(hour < 10 ? '0' : '') + hour + ':' +
			(minutes < 10 ? '0' : '') + minutes,
			zone);

		if (zone == null) {
			message.reply('Unknown Timezone');
			return
		}

		// tz mutates date, does not return new one
		message.reply(
			'\n' + date.tz('America/New_York').zoneAbbr() + ':\t' + date.format('h:mm') +
			'\n' + date.tz('America/Chicago').zoneAbbr() + ':\t' + date.format('h:mm') +
			'\n' + date.tz('America/Denver').zoneAbbr() + ':\t' + date.format('h:mm') +
			'\n' + date.tz('America/Los_Angeles').zoneAbbr() + ':\t' + date.format('h:mm') +
			'\n' + date.tz('Europe/Dublin').zoneAbbr() + ':\t' + date.format('h:mm')
		)
	}

})

client.login(DISCORD_KEY)

function getZone(zone) {
	switch (zone) {
		case 'EDT':
		case 'EST':
		case 'EASTERN':
			return 'America/New_York';
			break;
		case 'CDT':
		case 'CST':
		case 'CENTRAL':
			return 'America/Chicago';
			break;
		case 'MDT':
		case 'MST':
		case 'MOUNTAIN':
			return 'America/Denver';
			break;
		case 'PST':
		case 'PDT':
		case 'PACIFIC':
			return 'America/Los_Angeles';
			break;
		case 'GMT':
		case 'IST':
		case 'IRELAND':
			return 'Europe/Dublin';
			break;
		default:
			return null;
			break;
	}
}