const discord = require('discord.js')
const random = require('random-js')
const moment_tz = require('moment-timezone')
const moment = require('moment')
const _ = require('lodash')
const ytdl = require('ytdl-core')
const googleapis = require('googleapis')
const request = require('request')
const fs = require('fs')

const client = new discord.Client()
const DISCORD_KEY = process.env.DISCORD_KEY
const GOOGLE_KEY = process.env.GOOGLE_KEY

const engine = random.engines.mt19937().autoSeed()

var queueIds = [], queueNames = []

client.on('ready', () => {

})

client.on('message', message => {
	var string = _.toLower(message.content)
	console.log(string)

	if (_.includes(string, 'ping')) {
		message.reply('pong')
	}

	if (_.includes(string, '!join')) {
		if (message.member.voiceChannel) {
			message.member.voiceChannel.join()
		} else {
			message.reply('You must be in a voice channel!')
		}
	}

	if (_.includes(string, '!play')) {
		if (queueIds.length > 0) {
			var url = 'https://www.youtube.com/watch?v=' + queueIds[0]
			// var streamOptions = { seek: 0, volume: 1, passes: 1, bitrate: 48000 }
			// var stream = ytdl(url, { filter: 'audio', highWaterMark: 48000 })
			// var connection = message.member.voiceChannel.connection
			// var sd = connection.playStream(stream, streamOptions)

			// 'http://youtube.com/get_video_info?video_id=' + queueIds[0]
			ytdl.getInfo(url, (err, info) => {
				if (err) throw err
				var audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
				var file = audioFormats[0].url
				var stream = fs.createReadStream(
					request
						.get(file)
						.on('error', err => {
							console.log(err)
							message.reply('Error getting file!')
						})
				)
				stream.on('end', () => {
					var connection = message.member.voiceChannel.connection
					var streamOptions = { seek: 0, volume: 1, passes: 1, bitrate: 48000 }
					var sd = connection.playStream(stream, streamOptions)
				})
				stream.on('error', () => {
					console.log(err)
					message.reply('Error streaming!')
				})
			})

			message.reply('Playing: ' + queueNames[0])
			queueIds = _.drop(queueIds, 1)
			queueNames = _.drop(queueNames, 1)
		}
		else if (message.member.voiceChannel.connection) {
			message.reply('Join a voice channel first.')
		}
		else {
			message.reply('No songs queued.')
		}
	}

	if (_.includes(string, '!queue')) {
		var msg = _.split(string, ' ')
		msg = _.drop(msg, 1)
		msg = _.join(msg, ' ')

		var youtube = googleapis.youtube({
			version: 'v3',
			auth: GOOGLE_KEY
		})

		youtube.search.list({
			part: 'snippet',
			q: msg,
			maxResults: 50,
			type: 'video'
		}, (err, res1) => {
			if (err) {
				console.log(err);
				message.reply('youtube.search.list error')
			}
			else if (res1) {
				var ids = []
				_.forEach(res1.items, item => {
					ids.push(item.id.videoId)
				})
				var idstring = _.join(ids, ',')

				youtube.videos.list({
					id: idstring,
					part: 'snippet,contentDetails,statistics'
				}, (err, res2) => {
					if (err) {
						console.log(err);
						message.reply('youtube.videos.list error')
					}
					else if (res2) {
						var views = 0, id = '', name = ''
						_.forEach(res2.items, item => {
							if (views < parseInt(item.statistics.viewCount)) {
								views = parseInt(item.statistics.viewCount)
								id = item.id
								name = item.snippet.title
							}
						})
						queueIds.push(id)
						queueNames.push(name)
						message.reply('Song queued: https://www.youtube.com/watch?v=' + id)
					}
				})
			}
		})
	}

	if (_.includes(string, '!check')) {
		var str = _.join(queueNames, '\n')
		message.reply(str)
	}

	if (_.includes(string, '!remove')) {
		if (queueIds.length > 0) {
			message.reply('Song remove: ' + queueNames[queueNames.length - 1])
			queueIds = _.drop(queueIds, 1)
			queueNames = _.drop(queueNames, 1)
		}
	}

	if (_.includes(string, 'magic') && _.includes(string, 'conch')) {
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
		var answer = _.toString(answers[distribution(engine)])
		message.reply(answer)
	}

	if (_.includes(string, 'd20')) {
		var distribution = random.integer(1, 20)
		var d20 = _.toString(distribution(engine))
		message.reply(d20)
	}

	if (_.includes(string, 'tz')) {
		var msg = _.toUpper(string)
		msg = _.split(msg, ' ')

		var index = msg.indexOf('TZ')

		var time = msg[index + 1].split(':')
		var hour = parseInt(time[0])
		var minutes = parseInt(time[1])

		var tz = msg[index + 2]
		var zone = getZone(tz)

		/*
		var now = new Date()
		// create date object with user inputted time in timezone
		var date = moment_tz.tz(now.getFullYear() + '-' +
			(now.getMonth() < 10 ? '0' : '') + now.getMonth() + '-' +
			(now.getDate() < 10 ? '0' : '') + now.getDate() + ' ' +
			(hour < 10 ? '0' : '') + hour + ':' +
			(minutes < 10 ? '0' : '') + minutes,
			zone)
		*/

		var now = moment({ years: 2010, months: 10, date: 10, hours: hour + 12, minutes: minutes })
		var date = moment_tz.tz(now.toISOString(), zone);

		if (zone == null) {
			message.reply('Unknown Timezone')
			return
		} else {
			console.log(date)
		}

		// tz mutates date, does not return new one
		message.reply(
			'\n' + date.tz('America/New_York').zoneAbbr() + ':\t' + date.format('h:mm a') +
			'\n' + date.tz('America/Chicago').zoneAbbr() + ':\t' + date.format('h:mm a') +
			'\n' + date.tz('America/Denver').zoneAbbr() + ':\t' + date.format('h:mm a') +
			'\n' + date.tz('America/Los_Angeles').zoneAbbr() + ':\t' + date.format('h:mm a') +
			'\n' + date.tz('Europe/Dublin').zoneAbbr() + ':\t' + date.format('h:mm a')
		)
	}

})

client.login(DISCORD_KEY)

function getZone(zone) {
	switch (zone) {
		case 'EDT':
		case 'EST':
		case 'EASTERN':
			return 'America/New_York'
			break
		case 'CDT':
		case 'CST':
		case 'CENTRAL':
			return 'America/Chicago'
			break
		case 'MDT':
		case 'MST':
		case 'MOUNTAIN':
			return 'America/Denver'
			break
		case 'PST':
		case 'PDT':
		case 'PACIFIC':
			return 'America/Los_Angeles'
			break
		case 'GMT':
		case 'IST':
		case 'IRELAND':
			return 'Europe/Dublin'
			break
		default:
			return null
			break
	}
}