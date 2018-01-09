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

		function message(username, message) {
			//console.log('[RECV - Message] ' + username + ': ' + message)
			socket.broadcast.emit('player-message', username, message)
			socket.emit('player-message', username, message);
		}

		function playerAttack(username, attacking) {
			//console.log('[RECV - Attack] ' + username + ': ' + attacking)
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