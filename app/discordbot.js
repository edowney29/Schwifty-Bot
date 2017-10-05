const discord = require('discord.js');
const random = require('random-js');
const google = require('googleapis');
const _ = require('lodash')
const timezone = require('timezonecomplete');

const client = new discord.Client();
const GOOGLE_KEY = process.env.GOOGLE_KEY;
const DISCORD_KEY = process.env.DISCORD_KEY;

const engine = random.engines.mt19937().autoSeed();

const users;

client.on('ready', () => {
	var obj = client.users.map(u => `${u.username}#${u.discriminator};${u.id}`).join(';');
	var temp = _.toLower(obj);
	users = _.split(temp, ';');
	//console.log(users);
});

client.on('message', message => {

	var msg = message.content.toLowerCase();

	if (msg === 'ping') {
		message.reply('pong');
	}

	if (msg === 'stat1') {
		getData()
			.then(str => {
				message.reply(str);
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
		];
		var length = answers.length - 1;
		var distribution = random.integer(0, length);
		var answer = answers[distribution(engine)].toString();
		message.reply(answer);
	}

	if (msg === 'd20') {
		var distribution = random.integer(1, 20);
		var d20 = distribution(engine).toString();
		message.reply(d20);
	}

	if (_.includes(msg, 'tz')) {
		msg = msg.toUpperCase();
		var split = msg.split(' ');
		var time = '2020-09-11 ' + split[1] + ' ' + split[2];
		var str = new timezone.DateTime(time)
		if (str) {
			console.log(str)
			/*
			var est = str.tz('US/Eastern').format('h:mm')
			var cdt = str.tz('US/Central').format('h:mm')
			var mdt = str.tz('US/Mountain').format('h:mm')
			var pdt = str.tz('US/Pacific').format('h:mm')
			var ireland = str.tz('Europe/Dublin').format('h:mm')
			var germany = str.tz('Europe/Berlin').format('h:mm')
			message.reply(
				'\nEST: ' + est +
				'\nCDT: ' + cdt +
				'\nMDT: ' + mdt +
				'\nPDT: ' + pdt +
				'\nIreland: ' + ireland +
				'\nGermany: ' + germany
			);
		}
		*/
	}

});

client.login(DISCORD_KEY);

function getData() {
	return new Promise((resolve, reject) => {
		var sheets = google.sheets('v4');
		sheets.spreadsheets.values.get({
			auth: API_KEY,
			spreadsheetId: GOOGLE_KEY,
			range: 'GameHistory!A2:V2', // Example 
		}, (err, response) => {
			if (err) {
				reject('[ERROR]: ' + err);
			}
			var rows = response.values;
			if (rows.length === 0) {
				reject('No data found');
			} else {
				for (var i = 0; i < rows.length; i++) {
					var row = rows[i];
					resolve(row.join(", "));
				}
			}
		});
	})
}