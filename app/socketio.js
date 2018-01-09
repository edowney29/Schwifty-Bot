const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const _ = require('lodash')
const kmeans = require('node-kmeans')
const uuidv1 = require('uuid/v1')

var io;

module.exports.setSocketIO = (_io) => {
	this.io = _io;
	var clients = []
	var enemies = []
	var updates = []
	var clusters = []
	var database
	var ready = false
	var knum = 1

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
		socket.on('test', () => {
			console.log(`[RECV - New connection] : ${socket}`)
		})

		/** NETWORK MENU */
		socket.on('player-reg', playerReg(username, email, pass))

		socket.on('player-login', (username) => {
			var pass = true
			_.forEach(clients, client => {
				if (username == client.username) {
					pass = false
					socket.emit('player-menu', 'log')
				}
			})
			console.log('[RECV - Login] : ' + username)
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
		})

		socket.on('menu-disconnect', () => {
			socket.disconnect('true')
		})

		/** NETWORK PLAY */
		socket.on('start-up', (username) => {
			console.log('[RECV - Spawn player] : ' + username)
			playerToken = username
			var movements = database.collection('movements')
			movements.findOne({
				username: username,
			}, (err, doc) => {
				if (err) {
					console.log('[ERROR - No login]:  ' + err)
				} else {

					var client = {
						username: doc.username,
						health: 0, //doc.health
						positionx: doc.positionx,
						positiony: doc.positiony,
						socket: socket,
						world: null, //doc.world
						zone: null, //doc.zone
						room: 'start'
					}

					// SETUP YOUR PLAYER
					socket.emit('start-up',
						client.username,
						client.health,
						client.positionx,
						client.positiony
						//client.world
						//client.zone
					)

					socket.join('start')
					clients.push(client)
				}
			})
		})

		socket.on('player-move', (username, positionx, positiony, playerMoving, moveH, moveV, lastmovex, lastmovey, world, zone) => {
			//console.log('[RECV - Player move] : ' + username)
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
			}

			socket.emit('ack-move')
		})

		socket.on('player-message', (username, message) => {
			//console.log('[RECV - Message] ' + username + ': ' + message)
			socket.broadcast.emit('player-message', username, message)
			socket.emit('player-message', username, message);
		})

		socket.on('player-attack', (username, attacking) => {
			//console.log('[RECV - Attack] ' + username + ': ' + attacking)
			var client = _.find(clients, { username: username })
			if (client) {
				io.in(client.room).emit('player-attack', username, attacking)
			}
		})

		/** SOCKET HANDLERS */
		socket.on('connecting', () => {
			console.log(`[RECV - New connection] : ${socket}`)
		})

		socket.on('disconnect', (reason) => {
			console.log(`[RECV - Player disconnected] : ${playerToken} : ${reason}`)
			socket.broadcast.emit('other-player-disconnected', playerToken)
			_.remove(clients, { username: playerToken })
		})

		socket.on('error', (error) => {
			console.log(`[RECV - Server error] : ${playerToken} : ${error}`)
		})
	})

	var counter = 0
	setInterval(() => {
		if (ready) {
			io.emit('time', new Date().toTimeString())
			//enemyUpdate()

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

	console.log('[RECV - Regsiter] : ' + newUser)
	var users = database.collection('users')
	var movements = database.collection('movements')

	users.findOne({
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
				movements.insertOne(newMovements, (err, res) => {
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

function playerLogin() {

}
