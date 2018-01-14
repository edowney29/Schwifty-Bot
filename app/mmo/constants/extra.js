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

/*
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
*/

/*
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
*/