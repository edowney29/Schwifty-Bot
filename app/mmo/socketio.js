const _ = require('lodash')
const uuidv1 = require('uuid/v1')

const enemyAI = require('./modules/enemyAI')
const mongo = require('./modules/mongoclient')
const jsonify = require('./constants/JSONify')

var io
var clients = []
var enemies = []
var counter = 0

module.exports.setSocketIO = (_io) => {
	io = _io
	mongo.setMongoClient()
		.then(() => {
			startServer()
		})
		.catch(err => {
			throw err
		})
}

function startServer() {

	io.on('connect', (socket) => {
		// Global for each socket connection
		var playerToken = null

		/** NETWORK MENU */
		socket.on('player-register', playerRegister)
		socket.on('player-login', playerLogin)
		socket.on('menu-disconnect', () => { socket.disconnect('true') })

		/** NETWORK PLAY */
		socket.on('start-up', startUp)
		socket.on('player-message', playerMessage)
		socket.on('player-attack', playerAttack)

		/** SOCKET EVENTS */
		socket.on('test')
		socket.on('connecting', () => { console.log(`[RECV - New connection] : ${socket}`) })
		socket.on('disconnect', disconnect)
		socket.on('error', (error) => { console.log(`[RECV - Server error] : ${playerToken} : ${error}`) })

		function playerRegister(json) {
			// username, email, passhash, salt, status, token, date
			var data = JSON.parse(json)

			var newUser = {
				username: data.username,
				email: data.email,
				passhash: data.passhash,
				salt: data.salt,
				registered: false,
				positionx: 1297,
				positiony: -1125,
				health: 100,
				createdAt: Date.now().toString(),
				updatedAt: Date.now().toString()
			}

			mongo.playerRegister(newUser)
				.then(status => {
					var json = jsonify.User(null, null, null, null, null, status)
					socket.emit('player-menu', json)
					// Add api console log handler
				})
				.catch(status => {
					var json = jsonify.User(null, null, null, null, null, status)
					socket.emit('player-menu', json)
					// Add api console log handler
				})
		}

		function playerLogin(json) {
			// username, email, passhash, salt, status, token, date
			var data = JSON.parse(json)

			var client = _.find(clients, { username: data.username })
			// Is client already logged in?
			if (client) {
				var json = jsonify.User(null, null, null, null, null, 'logged')
				socket.emit('player-menu', json)
				return
			}

			mongo.playerLogin(data.username)
				.then(doc => {
					playerToken = uuidv1()
					var json = jsonify.User(doc.username, doc.email, doc.passhash, doc.salt, 'login')
					json.token = playerToken;
					socket.emit('player-menu', json)
				})
				.catch(status => {
					var json = jsonify.User(null, null, null, null, status)
					socket.emit('player-menu', json)
				})
		}

		function startUp(json) {
			// username, email, positionX, positionY
			var data = JSON.parse(json)

			if (playerToken == data.token) {
				mongo.playerLogin(data.username)
					.then(doc => {
						var client = {
							token: data.token,
							username: doc.username,
							email: doc.email,
							positionX: doc.positionX,
							positionY: doc.positionY,
							world: null,
							zone: null,
							room: 'start'
						}
						var json = jsonify.User(client.username, client.email, client.positionx, client.positiony)
						socket.join(client.room);
						socket.emit('start-up', json)
						clients.push(client)
					})
					.catch(err => {

					})
			}
		}

		function playerMove(json) {
			// token, username, positionX, positionY, playerMoving, moveH, moveV, lastMoveX, lastMoveY, world, zone
			var data = JSON.parse(json)

			if (playerToken == data.token) {
				var index = _.findIndex(clients, { token: token })
				if (index >= 0) {
					clients[index].username = data.username
					clients[index].positionx = data.positionX
					clients[index].positiony = data.positionY
					clients[index].world = data.world
					clients[index].zone = data.zone

					data.token = null
					json = JSON.stringify(data)
					io.in(client.room).emit('player-move', json)
				}
			}
		}

		function playerMessage(json) {
			// token, username, message
			var data = JSON.parse(json)

			var index = _.findIndex(clients, { token: data.token })
			if (index >= 0) {
				data.token = null
				json = JSON.stringify(data)
				io.in(client.room).emit('player-message', json)
			}
		}

		function playerAttack(json) {
			// token, username, attacking
			var data = JSON.parse(json)

			var index = _.findIndex(clients, { token: data.token })
			if (index >= 0) {
				data.token = null
				json = JSON.stringify(data)
				io.in(client.room).emit('player-attack', json)
			}
		}

		function disconnect(reason) {
			// reason
			var index = _.findIndex(clients, { token: playerToken })
			if (index >= 0) {
				console.log(`[RECV - Player disconnected] : ${clients[index].username} : ${reason}`)
				var json = jsonify.User(clients[index].username, null, null, null, null)
				socket.broadcast.emit('other-player-disconnected', json)
				_.remove(clients, { token: playerToken })
			}
		}
	})

	setInterval(() => {
		io.emit('time', new Date().toTimeString())
		enemyUpdate()

		if (counter == 200) {
			setDatabase()
			counter = 0
		}
		counter++
	}, 50)
}

function setDatabase() {
	var usersDB = database.collection('users')
	_.forEach(clients, client => {
		usersDB.updateOne({
			username: client.username,
		}, {
				username: client.username,
				positionx: client.positionx,
				positiony: client.positiony,
			}, (err, res) => {
				if (err) {
					console.log(`[SERVER - Error]: ${err}`)
				} else {
					console.log(`[RECV - Update database]: ${client.username}`)
				}
			})
	})
}

function enemyUpdate() {
	if (enemies.length < 10) {
		currentEnemy = {
			username: uuidv1(),
			positionx: getRandomRange(1452),
			positiony: getRandomRange(-1433),
			health: 100,
			target: ''
		}
		enemies.push(currentEnemy)
		console.log(`[SERVER - Spawn Enemy] : ${currentEnemy.username}`)
	}

	// Enemy AI
	var enemy = enemies[counter % enemies.length]
	if (Math.random() >= 0.25) {
		if (enemy.target == '') {
			var client = clients[Math.floor(Math.random() * clients.length)]
			if (client) {
				var distance = enemyAI.getDistance(enemy.positionx, enemy.positiony, client.positionx, client.positiony)
				if (distance < 100) {
					enemy.target = client.username
				} else {
					enemy.target = ''
					var radian = Math.random() * (2 * Math.PI)
					enemy = enemyAI.checkMove(enemy, radian)
					//console.log(`[Server - Enemy random] : ${enemy.username} -> ${client.username}`)
					io.local.emit('enemy-move', enemy.username, enemy.positionx, enemy.positiony, enemy.target)
				}
			}
		}
		else {
			var client = _.find(clients, { username: enemy.target })
			if (client) {
				var distance = enemyAI.getDistance(enemy.positionx, enemy.positiony, client.positionx, client.positiony)
				if (distance > 200) {
					enemy.target = ''
				} else {
					enemy.target = client.username
					var radian = enemyAI.getRadian(enemy.positionx, enemy.positiony, client.positionx, client.positiony)
					enemy = enemyAI.checkMove(enemy, radian)
					//console.log(`[Server - Enemy target] : ${enemy.username} -> ${client.username}`)
					io.local.emit('enemy-move', enemy.username, enemy.positionx, enemy.positiony, enemy.target)
				}
			}
		}
	}
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomRange(number) {
	var min = number - 100
	var max = number + 100
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}