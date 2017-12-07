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