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

var enemyspawnx = 643;
var enemyspawny = -793;
var minx = 0;
var maxx = 0;
var miny = 0;
var maxy = 0;

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

  var playerName
  console.log(`[RECV - New connection] : ${socket.toString()}`)

  socket.on('connecting', () => {
    console.log(`[RECV - New connection] : ${socket.toString()}`)
  })

  socket.on('test', () => {
    socket.emit('test')
  })

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

  // SPAWN THE PLAYER (Starting position)
  socket.on('start-up', (name) => {
    console.log('[RECV - Spawn player] : ' + name)
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
    var index = _.findIndex(clients, { 'name': name })

    clients[index].name = name
    clients[index].positionx = positionx
    clients[index].positiony = positiony

    io.in(clients[index].room).emit('player-move',
      name,
      positionx,
      positiony,
      playerMoving,
      moveH,
      moveV,
      lastmovex,
      lastmovey
    )
  })

  socket.on('player-message', (name, message) => {
    console.log('[RECV - Message] ' + name + ': ' + message)
    socket.broadcast.emit('player-message', name, message)
  })

  socket.on('menu-disconnect', (reason) => {
    socket.disconnect('true')
  })

  socket.on('disconnect', (reason) => {
    console.log(`[RECV - Player disconnected] : ${playerName} : ${reason}`)
    socket.broadcast.emit('other-player-disconnected', playerName)
    socket.disconnect('true')
    if (playerName) {
      _.remove(clients, { name: playerName })
    }
  })

  socket.on('error', (error) => {
    console.log(`[RECV - Server error] : ${playerName} : ${error}`)
  })
})

var counter = 0
setInterval(() => {
  if (ready) {
    io.emit('time', new Date().toTimeString())
    //enemyUpdate()

    if (counter == 1000) {
      setDatabase()
      //getCluster()
      //var allRooms = _.map(clients, 'room')
      //console.log(_.uniq(allRooms))
      counter = 0
    }
    counter++
  }
}, 10)

// K MEANS CLUSTER
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
    movements.update({
      name: client.name,
    }, {
        name: client.name,
        positionx: client.positionx,
        positiony: client.positiony,
      }, (err, res) => {
        if (err) {
          console.log('[ERROR - Server]: ' + err)
        } else {
          //console.log('[RECV - Update database]: ' + client.name)
        }
      })
  })
}

function enemyUpdate(counter) {
  if (enemies.length < 10) {
    console.log('Enemies Alive: ' + enemies.length)
    currentEnemy = {
      name: uuid.v1(),
      positionx: enemyspawnx,
      positiony: enemyspawny,
      health: 100,
      xDir: 0,
      yDir: 0
    }
    enemies.push(currentEnemy)
    console.log("Spawn Enemy: " + currentEnemy.name)
    io.emit('enemy-spawn',
      currentEnemy.name,
      currentEnemy.positionx,
      currentEnemy.positiony,
      currentEnemy.health
    )
  }

  if (counter == 100) {
    _.forEach(enemies, enemy => {
      var dirx = direction()
      var diry = direction()
      enemy.xDir = dirx
      enemy.yDir = diry
    })
  }

  _.forEach(enemies, enemy => {
    var name = enemy.name
    var positionx = enemy.positionx
    var positiony = enemy.positiony
    positionx += enemy.xDir
    positiony += enemy.yDir

    if (positionx > maxx) {
      positionx = maxx
    }
    if (positionx < minx) {
      positionx = minx
    }
    if (positiony > maxy) {
      positiony = maxy
    }
    if (positiony < miny) {
      positiony = miny
    }

    enemy.positionx = positionx
    enemy.positiony = positiony
    io.emit('enemy-move', name, positionx, positiony)
  })
}

function direction() {
  var pos;
  pos = Math.random();
  pos *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;
  return pos;
}

/*
for (var i = 0; i < clients.length; i++) {
  if (clients[i].name == playerName) {
    clients.splice(i, 1)
  }
}
*/

/*
// SPAWN OTHER PLAYER
socket.on('player-connect', () => {
  console.log('[RECV]: Client connect')
  _.forEach(clients, client => {
    var playerConnected = {
      name: client.name,
      health: client.health,
      positionx: client.positionx,
      positiony: client.positiony,
      //positionz: clients[i].positionz,
      //rotationx: clients[i].rotationx,
      //rotationy: clients[i].rotationy,
      //rotationz: clients[i].rotationz,
      //rotationw: clients[i].rotationw
    }
    // In your current game, server tells you about the other players
    socket.emit('other-player-connected',
      playerConnected.name,
      playerConnected.health,
      playerConnected.positionx,
      playerConnected.positiony,
      //playerConnected.positionz,
      //playerConnected.rotationx,
      //playerConnected.rotationy,
      //playerConnected.rotationz,
      //playerConnected.rotationw
    )
  })
})
*/
