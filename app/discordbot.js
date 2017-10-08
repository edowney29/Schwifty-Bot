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
	if (_.includes(msg, 'magic conch')) {
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
		
		var offset = getZone(split[index + 2])
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

		var est = getOffset(hour, getZone('EST')).toString()
		var cst = getOffset(hour, getZone('CST')).toString()
		var mst = getOffset(hour, getZone('MST')).toString()
		var pst = getOffset(hour, getZone('PST')).toString()
		var ist = getOffset(hour, getZone('IST')).toString()


		message.reply(
			'\nEST: ' + est + ':' + time[1] +
			'\nCST: ' + cst + ':' + time[1] +
			'\nMST: ' + mst + ':' + time[1] +
			'\nPST: ' + pst + ':' + time[1] +
			'\nIreland: ' + ist + ':' + time[1]
		)
	}

})

client.login(DISCORD_KEY)

function getZone(zone) {
	if (zone == 'EST')
		return -5
	if (zone == 'CST')
		return -6
	if (zone == 'MST')
		return -7
	if (zone == 'PST')
		return -8
	if (zone == 'IST')
		return 0
	if (zone == 'GMT')
		return 0
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