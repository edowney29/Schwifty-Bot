const _ = require('lodash')
const uuidv1 = require('uuid/v1')

const enemyAI = require('./modules/enemyAI')
const mongo = require('./modules/mongoclient')
const jsonify = require('./constants/JSONify')

var io
var clients = []
var enemies = []
var counter = 0

module.exports.setSocketIO = async (_io) => {
	try {
		await mongo.setMongoClient()
		io = _io
		startServer()
	}
	catch (err) {
		throw err
	}
}

const startServer = () => {

	io.on('connect', socket => {
		// Global for each socket connection
		var playerToken = null

		/** NETWORK MENU */
		socket.on('player-register', playerRegister(json))
		socket.on('player-login', playerLogin(json))
		socket.on('menu-disconnect', () => { socket.disconnect('true') })

		/** NETWORK PLAY */
		socket.on('start-up', startUp(json))
		socket.on('player-move', playerMove(json))
		socket.on('player-message', playerMessage(json))
		socket.on('player-attack', playerAttack(json))

		/** SOCKET EVENTS */
		socket.on('test', () => { console.log('[TEST]') })
		socket.on('disconnect', disconnect(reson))
		socket.on('error', error => { console.log(`[ERROR] : ${playerToken} : ${error}`) })

		const playerRegister = async (json) => {
			// username, email, passhash, salt, status, token, date
			var data = JSON.parse(json)
			console.log(`[REGISTER] : ${data.username}`)

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

			try {
				var status = await mongo.playerRegister(newUser)
				var json = jsonify.User(null, null, null, null, null, null, status)
				socket.emit('player-menu', json)
				// Add api console log handler
			}
			catch (err) {
				var json = jsonify.User(null, null, null, null, null, null, err)
				socket.emit('player-menu', json)
				// Add api console log handler
			}
		}

		const playerLogin = async (json) => {
			// username, email, passhash, salt, status, token, date
			var data = JSON.parse(json)
			console.log(`[LOGIN] : ${data.username}`)

			var index = _.findIndex(clients, { username: data.username })
			if (index >= 0) {
				var json = jsonify.User(null, null, null, null, null, null, 'logged')
				socket.emit('player-menu', json)
				return
			}

			try {
				var doc = await mongo.playerLogin(data.username)
				playerToken = uuidv1()
				var json = jsonify.User(playerToken, doc.username, doc.email, doc.passhash, doc.salt, 'login')
				socket.emit('player-menu', json)
			} catch (status) {
				var json = jsonify.User(null, null, null, null, null, status)
				socket.emit('player-menu', json)
			}
		}

		const startUp = async (json) => {
			// token, username, email, positionX, positionY
			var data = JSON.parse(json)
			console.log(`[START] : ${data.username}`)
			playerToken = data.token

			try {
				var doc = await mongo.playerLogin(data.username)
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
				var json = jsonify.User(null, client.username, null, client.positionx, client.positiony, null)
				socket.join(client.room);
				socket.emit('start-up', json)
				clients.push(client)
			}
			catch (err) {

			}
		}

		const playerMove = async (json) => {
			// token, username, positionX, positionY, playerMoving, moveH, moveV, lastMoveX, lastMoveY, world, zone
			var data = JSON.parse(json)
			console.log(`[MOVE] : ${data.username}`)

			if (playerToken == data.token) {
				var index = _.findIndex(clients, { token: data.token })
				if (index >= 0) {
					clients[index].username = data.username
					clients[index].positionx = data.positionX
					clients[index].positiony = data.positionY
					clients[index].world = data.world
					clients[index].zone = data.zone

					data.token = null
					json = JSON.stringify(data)
					io.in(clients[index].room).emit('player-move', json)
				}
			}
		}

		const playerMessage = async (json) => {
			// token, username, message
			var data = JSON.parse(json)
			console.log(`[MESSAGE] : ${data.username}`)

			var index = _.findIndex(clients, { token: data.token })
			if (index >= 0) {
				data.token = null
				json = JSON.stringify(data)
				io.in(clients[index].room).emit('player-message', json)
			}
		}

		const playerAttack = async (json) => {
			// token, username, attacking
			var data = JSON.parse(json)
			console.log(`[ATTACK] : ${data.username}`)

			var index = _.findIndex(clients, { token: data.token })
			if (index >= 0) {
				data.token = null
				json = JSON.stringify(data)
				io.in(clients[index].room).emit('player-attack', json)
			}
		}

		const disconnect = async (reason) => {
			// reason
			console.log(`[DISCONNECT] : ${playerToken}`)

			var index = _.findIndex(clients, { token: playerToken })
			if (index >= 0) {
				console.log(`[DISCONNECT] : ${clients[index].username} : ${reason}`)
				var json = jsonify.User(null, clients[index].username, null, null, null, null)
				socket.broadcast.emit('player-disconnect', json)
				_.remove(clients, { token: playerToken })
			}
		}
	})

	setInterval(() => {
		io.emit('time', new Date().toTimeString())
		//enemyUpdate()

		if (counter == 200) {
			//setDatabase()
			counter = 0
		}
		counter++
	}, 50)
}

/*
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
*/

/*
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
*/