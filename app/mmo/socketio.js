const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const _ = require('lodash')
const kmeans = require('node-kmeans')
const uuidv1 = require('uuid/v1')

const enemyAI = require('./modules/enemyAI.js')
const MONGO_URI = process.env.MONGODB_URI

var database, io
var clients = []
var enemies = []
//var updates = []
var clusters = []
var ready = false
var knum = 1
var counter = 0

module.exports.setSocketIO = (_io) => {
	io = _io
	startServer()
}

function startServer() {

	// Used for k-means points
	for (var i = 0; i < knum; i++) {
		var fakes = {
			username: 'kmeans point: ' + (i + 1),
			positionx: (Math.random() * 1000),
			positiony: (Math.random() * 1000),
			socket: null,
			room: 'start'
		}
		clients.push(fakes)
	}

	MongoClient.connect(MONGO_URI, (err, db) => {
		assert.equal(null, err)
		console.log('Connected to mongo')
		database = db
		ready = true
	})

	io.on('connect', (socket) => {

		var playerToken = null // Global for each socket connection

		/** PING */
		socket.on('test', () => { console.log(`[RECV - New connection] : ${socket}`) })

		/** NETWORK MENU */
		socket.on('player-reg', playerReg)
		socket.on('player-login', playerLogin)
		socket.on('menu-disconnect', () => { socket.disconnect('true') })

		/** NETWORK PLAY */
		socket.on('start-up', startUp)
		socket.on('player-message', message)
		socket.on('player-attack', playerAttack)

		/** SOCKET HANDLERS */
		socket.on('connecting', () => { console.log(`[RECV - New connection] : ${socket}`) })
		socket.on('disconnect', disconnect)
		socket.on('error', (error) => { console.log(`[RECV - Server error] : ${playerToken} : ${error}`) })

		function playerReg(username, email, pass) {
			var newUser = {
				username,
				email,
				pass,
				reg: false,
			}
			var newMovements = {
				username,
				positionx: 1297.0,
				positiony: -1125,
			}

			database.collection('users').findOne({
				$or: [{
					username: username
				}, {
					email: email
				}]
			}, (err, doc) => {
				if (err) {
					socket.emit('player-menu', 'err')
				} else if (doc) {
					socket.emit('player-menu', 'dub')
				} else {
					users.insertOne(newUser, (err, res) => {
						database.collection('movements').insertOne(newMovements, (err, res) => {
							if (err) {
								socket.emit('player-menu', 'err')
							} else {
								socket.emit('player-menu', 'good')
							}
						})
					})
				}
			})
		}

		function playerLogin(username) {
			var pass = true
			_.forEach(clients, client => {
				if (username == client.username) {
					pass = false
					socket.emit('player-menu', 'log')
				}
			})

			if (pass) {
				var users = database.collection('users')
				users.findOne({
					username: username
				}, (err, doc) => {
					if (err) {
						socket.emit('player-menu', 'err')
					} else if (doc) {
						socket.emit('player-menu', doc.pass)
						playerToken = username
					} else {
						socket.emit('player-menu', 'not')
					}
				})
			}
		}

		function startUp(username) {
			if (username) {
				db.collection('movements').findOne({
					username: username,
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
						socket.emit('start-up',
							client.username,
							client.positionx,
							client.positiony,
							client.positionz,
							client.rotationx,
							client.rotationy,
							client.rotationz,
							client.rotationw,
							client.health
						)
						clients.push(client)
					}
				})
			}
		}

		function playerMove(username, positionx, positiony, playerMoving, moveH, moveV, lastmovex, lastmovey, world, zone) {
			var client = _.find(clients, { username: username })

			if (client) {
				client.username = username
				client.positionx = positionx
				client.positiony = positiony
				//client.world = world
				//client.zone = zone

				io.in(client.room).emit('player-move',
					username,
					positionx,
					positiony,
					playerMoving,
					moveH,
					moveV,
					lastmovex,
					lastmovey
				)
				socket.emit('ack-move')
			}
		}

		function message(username, message) {
			var client = _.find(clients, { username: username })
			if (client) {
				io.in(client.room).emit('player-message', username, message)
			}
		}

		function playerAttack(username, attacking) {
			var client = _.find(clients, { username: username })
			if (client) {
				io.in(client.room).emit('player-attack', username, attacking)
			}
		}

		function disconnect(reason) {
			console.log(`[RECV - Player disconnected] : ${playerToken} : ${reason}`)
			socket.broadcast.emit('other-player-disconnected', playerToken)
			_.remove(clients, { username: playerToken })
		}
	})

	setInterval(() => {
		if (ready) {
			io.emit('time', new Date().toTimeString())
			enemyUpdate()

			if (counter == 100) {
				setDatabase()
				//getCluster()
				//var allRooms = _.map(clients, 'room')
				//console.log(_.uniq(allRooms))
				counter = 0
			}
			counter++
		}
	}, 100)
}

function getCluster() {
	let vectors = new Array()
	for (let i = 0; i < clients.length; i++) {
		vectors[i] = [clients[i].positionx, clients[i].positiony]
	}
	kmeans.clusterize(vectors, {
		k: knum
	}, (err, res) => {
		if (err) console.error(err)
		//else console.log(res)
		clusters = res
		_.forEach(clusters, cluster => {
			for (var i = 0; i < cluster.clusterInd.length; i++) {
				var client = _.find(clients, {
					username: clients[cluster.clusterInd[i]].username,
				})
				if (client.socket) {
					client.socket.leaveAll()
					client.socket.join(cluster.centroid.toString())
					client.room = cluster.centroid.toString()
				}
			}
		})
	})
}

function setDatabase() {
	var movements = database.collection('movements')
	_.forEach(clients, client => {
		if (!_.includes(client.username, 'kmeans')) {
			movements.update({
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
		}
	})
}

function enemyUpdate() {
	if (enemies.length < 10) {
		currentEnemy = {
			username: uuidv1(),
			positionx: 1452,
			positiony: -1433,
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
			if (!_.includes(client.username, 'kmeans')) {
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