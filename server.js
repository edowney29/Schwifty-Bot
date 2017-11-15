const express = require('express')
const bodyParser = require('body-parser')
const socketIO = require('socket.io')
const MongoClient = require('mongodb').MongoClient
const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const kmeans = require('node-kmeans')
const uuid = require('uuid')
const nodemailer = require('nodemailer')

const discord = require('./app/discordbot.js')

const PORT = process.env.PORT || 5000
const INDEX = path.join(__dirname, 'index.html')
const MONGO_URI = process.env.MONGODB_URI

const PI_FLOAT = 3.14159
const PIBY2_FLOAT = 1.57079

const server = express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

const io = socketIO(server)
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
    name: 'kmeans point: ' + (i + 1),
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

  var playerName // Global for each socket connection

  /** PING */
  socket.on('test', () => {
    console.log(`[RECV - New connection] : ${socket}`)
  })

  /** NETWORK MENU */
  socket.on('player-reg', (name, email, pass) => {
    var newUser = {
      name,
      email,
      pass,
      reg: false,
    }
    var newMovements = {
      name,
      positionx: 645.0,
      positiony: -504.0,
    }

    console.log('[RECV - Regsiter] : ' + newUser)
    var users = database.collection('users')
    var movements = database.collection('movements')

    users.findOne({
      $or: [{
        name: name
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
  })

  socket.on('player-login', (name) => {
    var pass = true
    _.forEach(clients, client => {
      if (name == client.name) {
        pass = false
        socket.emit('player-menu', 'log')
      }
    })
    console.log('[RECV - Login] : ' + name)
    if (pass) {
      var users = database.collection('users')
      users.findOne({
        name: name
      }, (err, doc) => {
        if (err) {
          socket.emit('player-menu', 'err')
        } else if (doc) {
          socket.emit('player-menu', doc.pass)
          playerName = name
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
  socket.on('start-up', (name) => {
    console.log('[RECV - Spawn player] : ' + name)
    playerName = name
    var movements = database.collection('movements')
    movements.findOne({
      name: name,
    }, (err, doc) => {
      if (err) {
        console.log('[ERROR - No login]:  ' + err)
      } else {

        var client = {
          name: doc.name,
          health: 0,
          positionx: doc.positionx,
          positiony: doc.positiony,
          socket: socket,
          room: 'start'
        }

        // SETUP YOUR PLAYER
        socket.emit('start-up',
          client.name,
          client.health,
          client.positionx,
          client.positiony,
        )

        socket.join('start')
        clients.push(client)
      }
    })
  })

  socket.on('player-move', (name, positionx, positiony, playerMoving, moveH, moveV, lastmovex, lastmovey) => {
    //console.log('[RECV - Player move] : ' + name)
    var client = _.find(clients, { name: name })

    if (client) {
      client.name = name
      client.positionx = positionx
      client.positiony = positiony

      io.in(client.room).emit('player-move',
        name,
        positionx,
        positiony,
        playerMoving,
        moveH,
        moveV,
        lastmovex,
        lastmovey
      )
    }
  })

  socket.on('player-message', (name, message) => {
    console.log('[RECV - Message] ' + name + ': ' + message)
    socket.broadcast.emit('player-message', name, message)
    socket.emit('player-message', name, message);
  })

  socket.on('player-attack', (name, attacking) => {
    //console.log('[RECV - Attack] ' + name + ': ' + attacking)
    var client = _.find(clients, { name: name })
    if (client) {
      io.in(client.room).emit('player-attack', name, attacking)
    }
  })

  /** SOCKET HANDLERS */
  socket.on('connecting', () => {
    console.log(`[RECV - New connection] : ${socket}`)
  })

  socket.on('disconnect', (reason) => {
    console.log(`[RECV - Player disconnected] : ${playerName} : ${reason}`)
    socket.broadcast.emit('other-player-disconnected', playerName)
    _.remove(clients, { name: playerName })
  })

  socket.on('error', (error) => {
    console.log(`[RECV - Server error] : ${playerName} : ${error}`)
  })
})

var counter = 0
setInterval(() => {
  if (ready) {
    io.emit('time', new Date().toTimeString())

    if (counter == 100) {
      enemyUpdate()
    }

    if (counter == 900) {
      setDatabase()
      //getCluster()
      //var allRooms = _.map(clients, 'room')
      //console.log(_.uniq(allRooms))
      counter = 0
    }
    counter++
  }
}, 10)

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
          name: clients[cluster.clusterInd[i]].name,
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
    if (!_.includes(client.name, 'kmeans')) {
      movements.update({
        name: client.name,
      }, {
          name: client.name,
          positionx: client.positionx,
          positiony: client.positiony,
        }, (err, res) => {
          if (err) {
            console.log('[SERVER - Error]: ' + err)
          } else {
            console.log('[RECV - Update database]: ' + client.name)
          }
        })
    }
  })
}

function enemyUpdate() {
  while (enemies.length < 10) {
    currentEnemy = {
      name: uuid.v1(),
      positionx: 0,
      positiony: 0,
      health: 100,
      target: ''
    }
    enemies.push(currentEnemy)
    console.log("[SERVER - Spawn Enemy] : " + currentEnemy.name)
  }

  if (clients.length > 0) {
    _.forEach(enemies, enemy => {
      if (enemy.target == '') {
        var client = clients[Math.floor(Math.random() * clients.length)]
        if (!_.includes(client.name, 'kmeans')) {
          var r = calculateMove(enemy.positionx, enemy.positiony, client.positionx, client.positiony)
          console.log(r)          
          if (r.distance < 500) {
            enemy.target = client.name
          } else {
            enemy.target = ''
          }
        }
      } else {
        var index = _.find(clients, { name: enemy.target })
        if (index) {
          var client = clients[index]
          var r = calculateMove(enemy.positionx, enemy.positiony, client.positionx, client.positiony)
          console.log(r)                    
          if (r.distance > 750) {
            enemy.target = ''
          } else {
            var movex = (-PI_FLOAT / 2 + r.radian * PI_FLOAT) * 50
            var movey = (r.radian * PI_FLOAT) * 50
            io.local.emit('enemy-move', enemy.name, movex, movey)
          }
        }
      }
    })
  }
}

function calculateMove(x1, y1, x2, y2) {
  var r = { distance: 0.0, radian: 0.0 }
  var axD = Math.abs(x2 - x1)
  var ayD = Math.abs(y2 - y1)
  var dD = Math.min([axD, ayD])
  r.distance += dD * 1.41421
  r.distance += (axD - dD) + (ayD - dD)
  r.radian = atan2_approximation2(x2 - x1, y2 - y1)
  return r
}

// |error| < 0.005
function atan2_approximation2(x, y) {
  if (x == 0.0) {
    if (y > 0.0) return PIBY2_FLOAT
    if (y == 0.0) return 0.0
    return -PIBY2_FLOAT
  }
  var atan
  var z = y / x;
  if (Math.abs(z) < 1.0) {
    atan = z / (1.0 + 0.28 * z * z)
    if (x < 0.0) {
      if (y < 0.0) return atan - PI_FLOAT
      return atan + PI_FLOAT
    }
  }
  else {
    atan = PIBY2_FLOAT - z / (z * z + 0.28)
    if (y < 0.0) return atan - PI_FLOAT
  }
  return atan
}