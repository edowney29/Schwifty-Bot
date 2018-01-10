const dotenv = require('dotenv').config()
const express = require('express')
const socketIO = require('socket.io')
const path = require('path')

const discord = require('./app/discord/discordbot.js')
const socket = require('./app/mmo/socketio.js')

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

const io = socketIO(server)
socket.setSocketIO(io)