const discord = require('discord.js')
const random = require('random-js')
const googleapi = require('googleapis')
const moment = require('moment-timezone');
const _ = require('lodash')
//const sqlite = require('sqlite')

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

	/*
	if (msg == 'stat1') {
		getData()
			.then(str => {
				message.reply(str)
			})
	}
	*/

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
		msg = _.toUpper(msg)
		var split = msg.split(',')
		var index = split.indexOf('TZ')
		var time = split[index + 1].split(':')
		var hour = parseInt(time[0])
		var minutes = parseInt(time[1])

		var tz = split[index + 2]
		var zone = getZone(tz)

		var now = new Date()
		// create date object with user inputted time in timezone
		var date = moment.tz(now.getFullYear() + '-' +
			(now.getMonth() < 10 ? '0' : '') + now.getMonth() + '-' +
			(now.getDate() < 10 ? '0' : '') + now.getDate() + ' ' +
			(hour < 10 ? '0' : '') + hour + ':' +
			(minutes < 10 ? '0' : '') + minutes,
			zone);

		if (zone === null) {
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

function getOffset(hour, offset) {

	var counter = offset;
	var isPosDir = true;
	if (offset < 0) {
		counter = offset * -1
		isPosDir = false;
	}

	for (var i = 0; i < counter; i++) {
		if (isPosDir) {
			hour = hour + 1;
			if (hour > 12)
				hour = 1
		} else {
			hour = hour - 1;
			if (hour < 1)
				hour = 12
		}
	}

	return hour;
}
/*
function getData() {
	return new Promise((resolve, reject) => {
		var sheets = google.sheets('v4')
		sheets.spreadsheets.values.get({
			auth: API_KEY,
			spreadsheetId: GOOGLE_KEY,
			range: 'GameHistory!A2:V2', // Example 
		}, (err, response) => {
			if (err) {
				reject('[ERROR]: ' + err)
			}
			var rows = response.values
			if (rows.length == 0) {
				reject('No data found')
			} else {
				for (var i = 0; i < rows.length; i++) {
					var row = rows[i]
					resolve(row.join(', '))
				}
			}
		})
	})
}
*/