const discord = require('discord.js')
const random = require('random-js')
const moment = require('moment-timezone')
const _ = require('lodash')
const ytdl = require('ytdl-core')
const googleapis = require('googleapis')

const client = new discord.Client()
const DISCORD_KEY = process.env.DISCORD_KEY
const GOOGLE_KEY = process.env.GOOGLE_KEY

const engine = random.engines.mt19937().autoSeed()

var queueIds = [], queueNames = [], connection

client.on('ready', () => {

})

client.on('message', message => {
	var string = _.toLower(message.content)
	var msg = _.split(string, ' ')
	console.log(msg)

	if (_.includes(msg, 'ping')) {
		message.reply('pong')
	}

	if (_.includes(msg, '!join')) {
		if (message.member.voiceChannel) {
			message.member.voiceChannel.join()
				.then(con => { // Connection is an instance of VoiceConnection
					connection = con
				})
				.catch(console.log)
		} else {
			message.reply('You need to join a voice channel first!')
		}
	}

	if (_.includes(msg, '!play')) {
		if (queueIds.length > 0) {
			var streamOptions = { seek: 0, volume: 1, passes: 1, bitrate: 48000 }
			var stream = ytdl(queueIds[0], { filter: 'audio', highWaterMark: 48000 })
			var dispatcher = connection.playStream(stream, streamOptions)
			message.reply('Playing: ' + queueNames[0])
			queueIds = _.drop(queueIds, 1)
			queueNames = _.drop(queueNames, 1)
		} else {
			message.reply('No songs queued.')
		}
	}

	if (_.includes(msg, '!queue')) {
		msg = _.drop(msg, 1)
		msg = _.join(msg, ' ')
		var ids = []
		var id = ''
		var name = ''

		var youtube = googleapis.youtube({
			version: 'v3',
			auth: GOOGLE_KEY
		})

		youtube.search.list({
			part: 'snippet',
			q: msg,
			maxResults: 10,
			type: 'video'
		}, (err, res1) => {
			if (err) {
				console.log('Search error: ' + err);
				message.reply('Fucking ERRORS @#%@!%@# ^__^ --- Search')
			}
			else if (res1) {
				_.forEach(res1.items, item => {
					ids.push(item.id.videoId)
				})
				var idstring = _.join(ids, ',')

				youtube.videos.list({
					id: idstring,
					part: 'snippet,contentDetails,statistics'
				}, (err, res2) => {
						if (err) {
							console.log('Videos error: ' + err);
							message.reply('Fucking ERRORS @#%@!%@# ^__^ --- Videos')
						}
						else if (res2) {
							var likes = 0
							_.forEach(res2.items, item => {
								if (likes < parseInt(item.statistics.likeCount)) {
									id = item.id
									name = item.snippet.title
								}
							})
							queueIds.push('https://www.youtube.com/watch?v=' + id)
							queueNames.push(name)
						}
					})
				message.reply(queueNames)
			}
		})

		/*

		})

		youtube.search.list({
			part: 'snippet',
			q: term,
			maxResults: 1,
			type: 'video'
		}, function (err, data) {
			if (err) {
				console.error('Error: ' + err)
				message.reply('Fucking ERRORS @#%@!%@# ^__^')
			}
			if (data) {
				console.log(data.toString())
				queue.push('https://www.youtube.com/watch?v=' + data.items[0].id.videoId)
			}
		})
		*/
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
		msg = _.join(msg, ' ')
		msg = _.toUpper(msg)
		msg = _.split(msg, ' ')

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
			zone)

		if (zone == null) {
			message.reply('Unknown Timezone')
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