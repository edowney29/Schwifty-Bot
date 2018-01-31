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
		console.log('New connection')

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
				positionX: 1297,
				positionY: -1125,
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
			}
			else {
				try {
					var doc = await mongo.playerLogin(data.username)
					playerToken = uuidv1()
					var json = jsonify.User(playerToken, doc.username, doc.email, doc.passhash, doc.salt, 'login')
					console.log(doc)
					socket.emit('player-menu', json)
				} catch (status) {
					var json = jsonify.User(null, null, null, null, null, status)
					socket.emit('player-menu', json)
				}
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

			var index = _.findIndex(clients, { token: data.token })
			if (playerToken == data.token && index >= 0) {
				clients[index].username = data.username
				clients[index].positionX = data.positionX
				clients[index].positionY = data.positionY
				clients[index].world = data.world
				clients[index].zone = data.zone
				data.token = null

				json = JSON.stringify(data)
				io.in(clients[index].room).emit('player-move', json)
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
		enemyUpdate()

		// Every 10 seconds
		if (counter == 100) {
			setDatabase()
			counter = 0
		}

		counter++
	}, 100)
}

function setDatabase() {
	var success = 0, errors = 0, promises = []
	_.forEach(clients, client => {
		var p = mongo.setDatabase(client)
			.then(doc => {
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
			//console.log(clients)
		})
}


function enemyUpdate() {
	// Spawn 10 enemies always
	while (enemies.length < 10) {
		currentEnemy = {
			username: uuidv1(),
			positionX: enemyAI.getRandomRange(1452),
			positionY: enemyAI.getRandomRange(-1433),
			zone: null,
			world: null,
			target: null
		}
		enemies.push(currentEnemy)
		//console.log(`[SERVER - Spawn Enemy] : ${currentEnemy.username}`)
	}

	/**
	 * Enemy AI
	 * Add more info
	 * (No bounds)
	 * 
	 */
	var enemy = enemies[counter % enemies.length] // Better enemy select?
	if (enemy.target == null) {
		var closest = 100, client = null
		_.forEach(clients, c => {
			var distance = enemyAI.getDistance(enemy.positionX, enemy.positionY, c.positionX, c.positionY)
			if (distance > closest) {
				enemy.target = c.username
				player = c
			}
		})

		if (client) {
			var radian = enemyAI.getRadian(enemy.positionX, enemy.positionY, client.positionX, client.positionY)
			enemy = enemyAI.checkMove(enemy, radian)
			var json = jsonify.EnemyMove(enemy.username, enemy.positionX, enemy.positionY, null, null, enemy.target)
			io.local.emit('enemy-move', json)
			//console.log(`[Server - Enemy move] : ${json}`)
		}
		else {
			var radian = Math.random() * (2 * Math.PI)
			enemy = enemyAI.checkMove(enemy, radian)
			var json = jsonify.EnemyMove(enemy.username, enemy.positionX, enemy.positionY, null, null, enemy.target)
			io.local.emit('enemy-move', json)
			//console.log(`[Server - Enemy move] : ${json}`)
		}
	}

	else {
		var client = _.find(clients, { username: enemy.target })
		if (client) {
			var distance = enemyAI.getDistance(enemy.positionX, enemy.positionY, client.positionX, client.positionY)
			if (distance > 200) {
				enemy.target = null
			}
		}

		if (enemy.target) {
			var radian = enemyAI.getRadian(enemy.positionX, enemy.positionY, player.positionX, player.positionY)
			enemy = enemyAI.checkMove(enemy, radian)
			var json = jsonify.EnemyMove(enemy.username, enemy.positionX, enemy.positionY, null, null, enemy.target)
			io.local.emit('enemy-move', json)
			//console.log(`[Server - Enemy move] : ${json}`)
		}
		else {
			var radian = Math.random() * (2 * Math.PI)
			enemy = enemyAI.checkMove(enemy, radian)
			var json = jsonify.EnemyMove(enemy.username, enemy.positionX, enemy.positionY, null, null, enemy.target)
			io.local.emit('enemy-move', json)
			//console.log(`[Server - Enemy move] : ${json}`)
		}
	}
}
