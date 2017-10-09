const express = require('express');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
const assert = require('assert');
const _ = require('lodash');
const kmeans = require('node-kmeans');
const uuid = require('uuid');
const nodemailer = require('nodemailer');

const discord = require('./app/discordbot.js');

const PORT = process.env.PORT || 5000;
const INDEX = path.join(__dirname, 'index.html');
const MONGO_URI = process.env.MONGODB_URI;

const server = express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);
var clients = [];
var updates = [];
var clusters = [];
var database;
var ready = false;
var knum = 1;

for (var i = 0; i < knum; i++) {
  var fakes = {
    name: 'kmeans point: ' + (i + 1),
    positionx: (Math.random() * 1000),
    positiony: (Math.random() * 1000),
    positionz: (Math.random() * 1000),
    rotationx: 0,
    rotationy: 0,
    rotationz: 0,
    rotationw: 0,
    health: 0,
    socket: null,
    room: 'start'
  }
  clients.push(fakes);
}

MongoClient.connect(MONGO_URI, (err, db) => {
  assert.equal(null, err)
  console.log('Connected to mongo')
  database = db
  ready = true
});

io.on('connection', (socket) => {

  var playerName;

  socket.on('ping', () => {
    socket.emit('pong')
  });

  socket.on('player-reg', (name, email, pass) => {
    var newUser = {
      name,
      email,
      pass,
      reg: 0,
    }
    var newMovements = {
      name,
      positionx: 0.0,
      positiony: 0.0,
      positionz: 0.0,
      rotationx: 0.0,
      rotationy: 0.0,
      rotationz: 0.0,
      rotationw: 0.0
    }

    console.log('[RECV] Regsiter: ' + newUser);
    var users = database.collection('users');
    var movements = database.collection('movements');

    users.findOne({
      $or: [{
        name: name
      }, {
        email: email
      }]
    }, (err, doc) => {
      if (err) {
        socket.emit('player-menu', 'err');
      } else if (doc) {
        socket.emit('player-menu', 'dub');
      } else {
        users.insertOne(newUser, (err, res) => {
          movements.insertOne(newMovements, (err, res) => {
            if (err) {
              socket.emit('player-menu', 'err');
            } else {
              socket.emit('player-menu', 'good');
            }
          })
        });
      }
    })
  });

  socket.on('player-login', (name) => {
    var pass = true;
    _.forEach(clients, client => {
      if (name == client.name) {
        pass = false;
        socket.emit('player-menu', 'log');
      }
    })
    console.log('[RECV] Login: ' + name);
    if (pass) {
      var users = database.collection('users');
      users.findOne({
        name: name
      }, (err, doc) => {
        if (err) {
          socket.emit('player-menu', 'err');
        } else if (doc) {
          socket.emit('player-menu', doc.pass);
          playerName = name;
        } else {
          socket.emit('player-menu', 'not');
        }
      })
    }
  });

  // SPAWN OTHER PLAYER
  socket.on('player-connect', () => {
    console.log('[RECV]: Client connect');
    for (var i = 0; i < clients.length; i++) {
      var playerConnected = {
        name: clients[i].name,
        positionx: clients[i].positionx,
        positiony: clients[i].positiony,
        positionz: clients[i].positionz,
        rotationx: clients[i].rotationx,
        rotationy: clients[i].rotationy,
        rotationz: clients[i].rotationz,
        health: clients[i].health
      };
      // In your current game, server tells you about the other players
      socket.emit('other-player-connected',
        playerConnected.name,
        playerConnected.positionx,
        playerConnected.positiony,
        playerConnected.positionz,
        playerConnected.rotationx,
        playerConnected.rotationy,
        playerConnected.rotationz,
        playerConnected.health
      );
    }
  });

  // SPAWN THE PLAYER (Starting position)
  socket.on('start-up', (name) => {
    console.log('[RECV] Spawn player: ' + name);
    var movements = database.collection('movements');
    movements.findOne({
      name: name,
    }, (err, doc) => {
      if (err) {
        console.log('[ERROR] ' + err)
      } else {

        var client = {
          name: name,
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
        };

        // SETUP YOUR PLAYER
        socket.emit('start-up',
          name,
          client.positionx,
          client.positiony,
          client.positionz,
          client.rotationx,
          client.rotationy,
          client.rotationz,
          client.rotationw,
          client.health
        );

        socket.join('start');
        clients.push(client);
      }
    })
  });

  socket.on('player-move', (name, positionx, positiony, positionz, rotationx, rotationy, rotationz, rotationw) => {
    console.log('[RECV] Player move: ' + name);

    // Update clients array of move
    var index = _.findIndex(clients, {
      name: name
    });

    if (index) {
      clients[index].positionx = positionx;
      clients[index].positiony = positiony;
      clients[index].positionz = positionz;
      clients[index].rotationx = rotationx;
      clients[index].rotationy = rotationy;
      clients[index].rotationz = rotationz;
      clients[index].rotationw = rotationw;


      var movements = db.collection('movements');
      movements.updateOne({
        name: name,
      }, {
        name: name,
        positionx: positionx,
        positiony: positiony,
        positionz: positionz,
        rotationx: rotationx,
        rotationy: rotationy,
        rotationz: rotationz,
        rotationw: rotationw,
      }, (err, res) => {

        if (err) {
          console.log('[SERVER] Error:' + name)
        } else {
          console.log('[RECV] Update database:' + name)
        }
      });


      io.in(clients[index].room).emit('player-move',
        name,
        positionx,
        positiony,
        positionz,
        rotationx,
        rotationy,
        rotationz,
        rotationw
      );
    }
  });

  socket.on('player-message', (name, message) => {
    console.log('[RECV] Message: ' + playerName + message);
    socket.broadcast.emit('player-message', name, message)
  });

  socket.on('disconnect', () => {
    console.log('[RECV] Player disconnected: ' + playerName);
    socket.broadcast.emit('other-player-disconnected', playerName)
    //console.log(currentPlayer.name + ' bcst: other player disconnected ' + JSON.stringify(currentPlayer));
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].name == playerName) {
        clients.splice(i, 1);
      }
    }
  });
})

var counter = 0;
setInterval(() => {
  if (ready) {

    io.emit('time', new Date().toTimeString());

    if (counter % 500 == 0) {
      setDatabase();
    }
    if (counter == 1000) {
      getCluster();
      counter = 0;
      //var allRooms = _.map(clients, 'room');
      //console.log(_.uniq(allRooms));
    }
    counter++;
  }

}, 10);

// K MEANS CLUSTER
function getCluster() {
  let vectors = new Array();
  for (let i = 0; i < clients.length; i++) {
    vectors[i] = [clients[i].positionx, clients[i].positiony];
  }
  kmeans.clusterize(vectors, {
    k: knum
  }, (err, res) => {
    if (err) console.error(err);
    //else console.log(res);
    clusters = res;
    _.forEach(clusters, cluster => {
      for (var i = 0; i < cluster.clusterInd.length; i++) {
        var client = _.find(clients, {
          name: clients[cluster.clusterInd[i]].name,
        });
        if (client.socket) {
          client.socket.leaveAll();
          client.socket.join(cluster.centroid.toString());
          client.room = cluster.centroid.toString();
        }
      }
    })
  });
}

function setDatabase() {
  var movements = database.collection('movements');
  _.forEach(clients, client => {
    movements.update({
      name: client.name,
    }, {
      name: client.name,
      positionx: client.positionx,
      positiony: client.positiony,
      positionz: client.positionz,
      rotationx: client.rotationx,
      rotationy: client.rotationy,
      rotationz: client.rotationz,
      rotationw: client.rotationw,
    }, (err, res) => {
      if (err) {
        console.log('[ERROR]' + err)
      } else {
        //console.log('[RECV] Update database: ' + client.name)
      }
    });
  })
}