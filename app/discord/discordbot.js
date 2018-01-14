import { Message } from 'discord.js';

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
	console.log(message.content)
	var string = _.toLower(message.content)

	if (_.includes(string, '!join')) {
		message.delete()
		if (message.member.voiceChannel) {
			message.member.voiceChannel.join()
		} else {
			message.reply('You must be in a voice channel.')
		}
	}

	if (_.includes(string, '!play')) {
		message.delete()
		var videoTitle = _.split(string, ' ')
		videoTitle = _.drop(videoTitle, 1)
		videoTitle = _.join(videoTitle, ' ')
		searchVideos(videoTitle)
			.then(videos => {
				listVideos(videos)
					.then(list => {
						var views = 0, id = '', name = ''
						_.forEach(list.items, item => {
							if (views < parseInt(item.statistics.viewCount)) {
								views = parseInt(item.statistics.viewCount)
								id = item.id
								name = item.snippet.title
							}
						})
						queueIds.push(id)
						queueNames.push(name)
						message.reply(`Song queued: http://www.youtube.com/watch?v=${id}`)

						if (!message.member.voiceChannel.connection.dispatcher) {
							var url = `http://www.youtube.com/watch?v=${queueIds[0]}`
							playSong(message, url)
						}
					})
			})
	}

	if (_.includes(string, '!next')) {
		message.delete()
		if (queueIds.length > 0) {
			var url = `http://www.youtube.com/watch?v=${queueIds[0]}`
			var dispatcher = message.member.voiceChannel.connection.dispatcher
			if (dispatcher) {
				dispatcher.end()
			}
			playSong(message, url)
		}
		else {
			message.reply('No songs queued.')
		}
	}

	if (_.includes(string, '!resume')) {
		message.delete()
		var dispatcher = message.member.voiceChannel.connection.dispatcher
		if (dispatcher.paused) {
			dispatcher.resume()
		}
	}

	if (_.includes(string, '!pause')) {
		message.delete()
		var dispatcher = message.member.voiceChannel.connection.dispatcher
		if (!dispatcher.paused) {
			dispatcher.pause()
		}
	}

	if (_.includes(string, '!check')) {
		message.delete()
		var str = `${queueNames.length} songs queued \n${_.join(queueNames, '\n')}`
		message.reply(str)
	}

	if (_.includes(string, '!remove')) {
		message.delete()
		if (queueIds.length > 0) {
			message.reply(`Song removed:  + ${queueNames[queueNames.length - 1]}`)
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

function searchVideos(videoTitle) {
	new Promise((resolve, reject) => {
		var youtube = googleapis.youtube({
			version: 'v3',
			auth: GOOGLE_KEY
		})

		youtube.search.list({
			part: 'snippet',
			q: videoTitle,
			maxResults: 50,
			type: 'video'
		}, (err, res) => {
			if (err) {
				reject(err)
			}
			else {
				resolve(res)
			}
		})
	})
}

function listVideos(videos) {
	new Promise((resolve, reject) => {
		var ids = []
		_.forEach(videos.items, item => {
			ids.push(item.id.videoId)
		})
		var idstring = _.join(ids, ',')

		youtube.videos.list({
			id: idstring,
			part: 'snippet,contentDetails,statistics'
		}, (err, res) => {
			if (err) {
				reject(err)
			}
			else {
				resolve(res)
			}
		})
	})
}

function playSong(message, url) {
	ytdl.getInfo(url, (err, info) => {
		if (err) {
			console.log(err)
			return
		}
		else {
			var audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
			var fileurl = audioFormats[0].url
			request
				.get(fileurl)
				.on('error', err => {
					console.log(err)
					return
				})
				.on('end', () => {
					var streamOptions = { seek: 0, volume: 0.2, passes: 1, bitrate: 64 * 1024 }
					var connection = message.member.voiceChannel.connection
					var sd = connection.playFile(`./public/${message.guild}.${audioFormats[0].container}`, streamOptions)
					sd.on('error', err => {
						console.log(err)
					})
					sd.on('start', () => {
						message.reply('Playing: ' + queueNames[0])
						queueIds = _.drop(queueIds, 1)
						queueNames = _.drop(queueNames, 1)
					})
				})
				.pipe(fs.createWriteStream(`./public/${message.guild}.${audioFormats[0].container}`))
		}
	})
}