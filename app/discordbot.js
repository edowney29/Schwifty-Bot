const discord = require('discord.js')
const random = require('random-js')
const google = require('googleapis')
const _ = require('lodash')

const client = new discord.Client()
const GOOGLE_KEY = 'MzMwNTM5ODQ0ODg5NDc3MTIx.DDijpw.McCPms6FKHgvjLW9fCl8NQacWfg'//process.env.GOOGLE_KEY
const DISCORD_KEY = 'AIzaSyCu_jTK-L3GLefF337NJmmK4ksoI8YJxnc'//process.env.DISCORD_KEY

const engine = random.engines.mt19937().autoSeed()

var users

client.on('ready', () => {
	var obj = client.users.map(u => `${u.username}#${u.discriminator}${u.id}`).join('')
	var temp = _.toLower(obj)
	users = _.split(temp, '')
	console.log(users)
})

client.on('message', message => {

	var msg = message.content.toLowerCase()

	if (msg == 'ping') {
		message.reply('pong')
	}

	if (msg == 'stat1') {
		getData()
			.then(str => {
				message.reply(str)
			})
	}

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

	if (msg == 'd20') {
		var distribution = random.integer(1, 20)
		var d20 = distribution(engine).toString()
		message.reply(d20)
	}

	if (_.includes(msg, 'tz')) {
		_.toUpper(msg)
		var split = msg.split(' ')
		var index = split.indexOf('TZ')
		var time = split[index + 1].split(":")
		var hour = parseInt(time[0])

		var offset = getZone(split[index + 2])
		hour = (hour + (offset * -1)) % 12

		var est = (hour + getZone('EST')) % 12
		var cst = (hour + getZone('CST')) % 12
		var mdt = (hour + getZone('MST')) % 12
		var pdt = (hour + getZone('PST')) % 12
		var ist = (hour + getZone('IST')) % 12

		message.reply(
			'EST: ' + est + ':' + time[1] +
			'CST: ' + cst + ':' + time[1] +
			'MST: ' + mst + ':' + time[1] +
			'PST: ' + pst + ':' + time[1] +
			'IST: ' + ist + ':' + time[1]
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
		return 1
	if (zone == 'GMT')
		return 0
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