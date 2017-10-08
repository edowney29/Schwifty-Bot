const discord = require('discord.js')
const random = require('random-js')
const google = require('googleapis')
const _ = require('lodash')

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
	var msg = message.content.toLowerCase()
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
		var time = split[index + 1].split(":")
		var hour = parseInt(time[0])

		var tz = split[index + 2]
		var dst = isDST();

		var dstwarning = ''
		if (!dst && (tz === 'EDT' || tz === 'CDT' || tz === 'MDT' || tz === 'PDT')) {
			tz = tz.substr(0, 1) + 'S' + tz.substr(2)
			dstwarning = 'Daylight savings is in effect, using ' + tz + '...'
		} else if (dst && (tz === 'EST' || tz === 'CST' || tz === 'MST' || tz === 'PST')) {
			tz = tz.substr(0, 1) + 'D' + tz.substr(2)
			dstwarning = 'Daylight savings is not in effect, using ' + tz + '...'
		}

		var offset = getZone(tz)

		if (offset === null) {
			message.reply('Unknown Timezone');
			return
		}

		var counter = offset;
		var isPosDir = false;
		if (offset < 0) {
			counter = offset * -1
			isPosDir = true;
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

		var est = getOffset(hour, getZone(dst ? 'EDT' : 'EST')).toString()
		var cst = getOffset(hour, getZone(dst ? 'CDT' : 'CST')).toString()
		var mst = getOffset(hour, getZone(dst ? 'MDT' : 'MST')).toString()
		var pst = getOffset(hour, getZone(dst ? 'PDT' : 'PST')).toString()
		var ist = getOffset(hour, getZone('IST')).toString()


		message.reply(
			dstwarning +
			'\n' + (dst ? 'EDT' : 'EST') + ': ' + est + ':' + time[1] +
			'\n' + (dst ? 'CDT' : 'CST') + ': ' + cst + ':' + time[1] +
			'\n' + (dst ? 'MDT' : 'MST') + ': ' + mst + ':' + time[1] +
			'\n' + (dst ? 'PDT' : 'PST') + ': ' + pst + ':' + time[1] +
			'\nIreland: ' + ist + ':' + time[1]
		)
	}

})

client.login(DISCORD_KEY)

function isDST() {
	var today = new Date();
	var jan = new Date(today.getFullYear(), 0, 1);

	return today.getTimezoneOffset() < jan.getTimezoneOffset();
}

function getZone(zone) {
	switch (zone) {
		case 'EDT':
			return -4;
			break;
		case 'EST':
		case 'CDT':
			return -5;
			break;
		case 'CST':
		case 'MDT':
			return -6;
			break;
		case 'MST':
		case 'PDT':
			return -7;
			break;
		case 'PST':
			return -8;
			break;
		case 'IST':
		case 'GMT':
			return 0;
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
					resolve(row.join(", "))
				}
			}
		})
	})
}