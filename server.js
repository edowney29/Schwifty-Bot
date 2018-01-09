const dotenv = require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const socketIO = require('socket.io')
const MongoClient = require('mongodb').MongoClient
const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const kmeans = require('node-kmeans')
const uuidv1 = require('uuid/v1')

const discord = require('./app/discordbot.js')
const socket = require('./app/socketio.js')
//const enemyAI = require('./app/modules/enemyAI.js')

const PORT = process.env.PORT || 5000
const INDEX = path.join(__dirname, 'index.html')

const server = express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

const io = socketIO(server)
socket.setSocketIO(io)