const MongoClient = require('mongodb').MongoClient
const _ = require('lodash')
const uuidv1 = require('uuid/v1')

const enemyAI = require('./modules/enemyAI.js')
const MONGO_URI = process.env.MONGODB_URI

var database, io
var clients = []
var enemies = []
var counter = 0

module.exports.setSocketIO = (_io) => {
	io = _io

	MongoClient.connect(MONGO_URI, (err, db) => {
		if (err) throw err
		console.log('Connected to mongo')
		database = db
		startServer()
	})
}

function startServer() {

	io.on('connect', (socket) => {
		// Global for each socket connection
		var playerToken = null

		/** NETWORK MENU */
		socket.on('player-reg', playerReg)
		socket.on('player-login', playerLogin)
		socket.on('menu-disconnect', () => { socket.disconnect('true') })

		/** NETWORK PLAY */
		socket.on('start-up', startUp)
		socket.on('player-message', message)
		socket.on('player-attack', playerAttack)

		/** SOCKET EVENTS */
		socket.on('connecting', () => { console.log(`[RECV - New connection] : ${socket}`) })
		socket.on('disconnect', disconnect)
		socket.on('error', (error) => { console.log(`[RECV - Server error] : ${playerToken} : ${error}`) })

		function playerReg(json) {
			// username, email, password
			var data = JSON.parse(json)

			var newUser = {
				username: data.username,
				email: data.email,
				password: data.password,
				reg: false,
				positionx: 1297,
				positiony: -1125,
			}

			var usersDB = database.collection('users')
			usersDB.findOne({
				$or: [{
					username: username
				}, {
					email: email
				}]
			}, (err, doc) => {
				if (err) {
					socket.emit('player-menu', 'error')
				} else if (doc) {
					socket.emit('player-menu', 'dubplicate')
				} else {
					usersDB.insertOne(newUser, (err, res) => {
						if (err) {
							socket.emit('player-menu', 'error')
						} else {
							json = JSON.stringify('good')
							socket.emit('player-menu', 'good')
						}
					})
				}
			})
		}

		function playerLogin(json) {
			// username
			var data = JSON.parse(json)

			var client = _.find(clients, { username: data.username })
			// Is client already logged in?
			if (client) {
				password = false
				socket.emit('player-menu', 'logged')
				return
			}

			var usersDB = database.collection('users')
			usersDB.findOne({
				username: data.username
			}, (err, doc) => {
				if (err) {
					socket.emit('player-menu', 'error')
				} else if (doc) {
					socket.emit('player-menu', doc.password)
					playerToken = doc.username
				} else {
					socket.emit('player-menu', 'notfound')
				}
			})
		}

		function startUp(json) {
			// username
			var data = JSON.parse(json)

			if (data.username) {
				db.collection('movements').findOne({
					username: data.username,
				}, (err, doc) => {
					if (err) {

					} else {
						socket.join('start');
						var client = {
							username: doc.username,
							positionx: doc.positionx,
							positiony: doc.positiony,
							positionz: doc.positionz,
							rotationx: doc.rotationx,
							rotationy: doc.rotationy,
							rotationz: doc.rotationz,
							rotationw: doc.rotationw,
							health: 0,
							socket: socket,
							room: 'start'
						}
						// SETUP YOUR PLAYER
						// username,positionx, positiony, positionz, rotationx, rotationy, rotationz, rotationw, health
						var json = JSON.stringify(client)
						socket.emit('start-up', json)
						clients.push(client)
					}
				})
			}
		}

		function playerMove(json) {
			//username, positionx, positiony, playerMoving, moveH, moveV, lastmovex, lastmovey, world, zone
			var data = JSON.parse(json)

			var client = _.find(clients, { username: username })
			if (client) {
				client.username = data.username
				client.positionx = data.positionx
				client.positiony = data.positiony
				//client.world = data.world
				//client.zone = data.zone

				io.in(client.room).emit('player-move', json)
			}
		}

		function message(json) {
			// username, message
			var data = JSON.parse(json)

			var client = _.find(clients, { username: data.username })
			if (client) {
				io.in(client.room).emit('player-message', json)
			}
		}

		function playerAttack(json) {
			// username, attacking
			var data = JSON.parse(json)

			var client = _.find(clients, { username: data.username })
			if (client) {
				io.in(client.room).emit('player-attack', json)
			}
		}

		function disconnect(json) {
			// reason
			var data = JSON.parse(json)

			console.log(`[RECV - Player disconnected] : ${playerToken} : ${data.reason}`)
			socket.broadcast.emit('other-player-disconnected', playerToken)
			_.remove(clients, { username: playerToken })
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