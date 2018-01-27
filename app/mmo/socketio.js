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
		socket.on('player-register', playerRegister)
		socket.on('player-login', playerLogin)
		socket.on('menu-disconnect', () => { socket.disconnect('true') })

		/** NETWORK PLAY */
		socket.on('start-up', startUp)
		socket.on('player-move', playerMove)
		socket.on('player-message', playerMessage)
		socket.on('player-attack', playerAttack)

		/** SOCKET EVENTS */
		socket.on('test', () => { console.log('[TEST]') })
		socket.on('disconnect', disconnect)
		socket.on('error', error => { console.log(`[ERROR] : ${playerToken} : ${error}`) })

		async function playerRegister(json) {
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
				world: null,
				zone: null,
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

		async function playerLogin(json) {
			// username, email, passhash, salt, status, token, date
			var data = JSON.parse(json)
			console.log(`[LOGIN] : ${data.username}`)

			var index = _.findIndex(clients, { username: data.username })
			if (index >= 0) {
				var json = jsonify.User(null, null, null, null, null, 'logged')
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

		async function startUp(json) {
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
					world: doc.world,
					zone: doc.zone,
					room: 'start'
				}
				var json = jsonify.Move(client.username, client.positionX, client.positionY, 0, 0, 0, 0, client.world, client.zone)
				socket.join(client.room);
				socket.emit('start-up', json)
				clients.push(client)
			}
			catch (err) {

			}
		}

		function playerMove(json) {
			// token, username, positionX, positionY, moveH, moveV, lastMoveX, lastMoveY, world, zone
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

		function playerMessage(json) {
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

		function playerAttack(json) {
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

		function disconnect(reason) {
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

		if (counter == 1000) {
			setDatabase()
			console.log(clients)
			counter = 0
		}
		counter++
	}, 10)
}

function setDatabase() {
	var success = 0, errors = 0, promises = []
	_.forEach(clients, client => {
		var p = mongo.setDatabase(client)
			.then(() => {
				success += 1
			})
			.catch(err => {
				console.log(err)
				errors += 1
			})
		promises.push(p)
	})
	Promise.all(promises)
		.then(() => {
			console.log(`Successful: ${success} --- Errors: ${errors}`)
		})
}

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
					var json = jsonify.Move()
					io.local.emit('enemy-move', enemy.username, enemy.positionx, enemy.positiony)
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
					io.local.emit('enemy-move', enemy.username, enemy.positionx, enemy.positiony)
				}
			}
		}
	}
}
*/