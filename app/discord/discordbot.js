const discord = require('discord.js')
const random = require('random-js')
const moment_tz = require('moment-timezone')
const moment = require('moment')
const _ = require('lodash')
const ytdl = require('ytdl-core')
const googleapis = require('googleapis')
const request = require('request')
const fs = require('fs')
const levenshtein = require('fast-levenshtein')

const DISCORD_KEY = process.env.DISCORD_KEY
const GOOGLE_KEY = process.env.GOOGLE_KEY

const client = new discord.Client()
const engine = random.engines.mt19937().autoSeed()
const youtube = googleapis.youtube({
	version: 'v3',
	auth: GOOGLE_KEY
})

var servers = []

client.on('message', message => {
	var index = _.findIndex(servers, { id: message.guild.id })
	if (index == -1) {
		var server = {
			id: message.guild.id,
			queue: {
				ids: [],
				names: []
			}
		}
		servers.push(server)
		index = _.findIndex(servers, { id: message.guild.id })
	}

	var string = _.toLower(message.content)
	console.log(`[${message.guild.id}] ${message.member.id}: ${message.content}`)

	if (_.includes(string, '!join')) {
		if (message.member.voiceChannel) {
			if (message.member.voiceChannel.connection) {
				message.member.voiceChannel.connection.disconnect()
			}
			message.member.voiceChannel.join()
		} else {
			message.reply('You must be in a voice channel.')
		}
	}

	if (_.includes(string, '!play')) {
		if (message.member.voiceChannel) {
			var videoTitle = _.split(string, ' ')
			videoTitle = _.drop(videoTitle, 1)
			videoTitle = _.join(videoTitle, ' ')
			searchVideos(videoTitle)
				.then(videos => {
					listVideos(videos)
						.then(list => {
							sortSongSearch(index, videoTitle, list)
								.then(score => {
									var url = `http://www.youtube.com/watch?v=${servers[index].queue.ids.length - 1}`
									message.reply(`Song queued: ${url} [${score}% match]`)
									var dispatcher = message.guild.voiceConnection.dispatcher
									if (!dispatcher) {
										getInfo(url)
											.then(audioFormats => {
												playSong(message, audioFormats)
													.then(sd => {
														sd.on('end', () => {
															//message.reply('!next')
														})
														sd.on('start', () => {
															message.reply('Playing: ' + servers[index].queue.names[0])
															servers[index].queue.ids = _.drop(servers[index].queue.ids, 1)
															servers[index].queue.names = _.drop(servers[index].queue.names, 1)
														})
													})
											})
									}
								})
						})
				})
		}
	}

	if (_.includes(string, '!next')) {
		if (message.member.voiceChannel) {
			if (servers[index].queue.ids.length > 0) {
				var url = `http://www.youtube.com/watch?v=${servers[index].queue.ids[0]}`
				var dispatcher = message.guild.voiceConnection.dispatcher
				if (dispatcher) {
					if (!dispatcher.destroyed) {
						dispatcher.end()
					}
					getInfo(url)
						.then(audioFormats => {
							playSong(message, audioFormats)
								.then(sd => {
									sd.on('end', () => {
										//message.reply('!next')
									})
									sd.on('start', () => {
										message.reply('Playing: ' + servers[index].queue.names[0])
										servers[index].queue.ids = _.drop(servers[index].queue.ids, 1)
										servers[index].queue.names = _.drop(servers[index].queue.names, 1)
									})
								})
						})
				}
			}
		}
	}

	if (_.includes(string, '!resume')) {
		if (message.member.voiceChannel) {
			var dispatcher = message.guild.voiceConnection.dispatcher
			if (dispatcher) {
				if (dispatcher.paused) {
					dispatcher.resume()
				}
			}
		}
	}

	if (_.includes(string, '!pause')) {
		if (message.member.voiceChannel) {
			var dispatcher = message.guild.voiceConnection.dispatcher
			if (dispatcher) {
				if (!dispatcher.paused) {
					dispatcher.pause()
				}
			}
		}
	}

	if (_.includes(string, '!check')) {
		if (message.member.voiceChannel) {
			var str = `${servers[index].queue.names.length} songs queued \n${_.join(servers[index].queue.names, '\n')}`
			message.reply(str)
		}
	}

	if (_.includes(string, '!remove')) {
		if (message.member.voiceChannel) {
			var num = servers[index].queue.ids.length
			if (num > 0) {
				message.reply(`Song removed:  + ${servers[index].queue.names[num - 1]}`)
				_.drop(servers[index].queue.ids, 1)
				_.drop(servers[index].queue.names, 1)
			}
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
		var hours = parseInt(time[0])
		var minutes = parseInt(time[1])

		var tz = msg[index + 2]
		var zone = getZone(tz)

		if (zone == null) {
			message.reply('Unknown Timezone')
			return
		}

		// create date object with user inputted time in timezone
		var now = moment_tz.tz(moment().utc(), zone)
		var date = moment(now)
		date.set('hours', hours + 12)
		date.set('minutes', minutes)

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
	return new Promise((resolve, reject) => {
		youtube.search.list({
			part: 'snippet',
			q: videoTitle,
			maxResults: 10,
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
	return new Promise((resolve, reject) => {
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

function getInfo(url) {
	return new Promise((resolve, reject) => {
		ytdl.getInfo(url, (err, info) => {
			if (err) {
				console.log(err)
				reject(err)
			}
			else {

				resolve(ytdl.filterFormats(info.formats, 'audioonly'))
			}
		})
	})
}

function playSong(message, audioFormats) {
	return new Promise((resolve, reject) => {
		var fileurl = audioFormats[0].url
		request
			.get(fileurl)
			.on('error', err => {
				console.log(err)
				reject(err)
			})
			.on('end', () => {
				var streamOptions = { seek: 0, volume: 0.2, passes: 1, bitrate: 64 * 1024 }
				var connection = message.member.voiceChannel.connection
				resolve(connection.playFile(`./public/${message.guild.id}.${audioFormats[0].container}`, streamOptions))
			})
			.pipe(fs.createWriteStream(`./public/${message.guild.id}.${audioFormats[0].container}`))
	})
}

function sortSongSearch(index, videoTitle, list) {
	return new Promise((resolve, reject) => {
		var score = 0, id = '', name = ''
		_.forEach(list.items, item => {
			var s = levenshtein.get(videoTitle, item.snippet.localized.title)
			if (s > score) {
				score = s
				id = item.id
				name = item.snippet.localized.title
			}
		})

		if (score > 0) {
			servers[index].queue.ids.push(id)
			servers[index].queue.names.push(name)
			resolve(score)
		}
		else {
			reject(score)
		}

	})
}