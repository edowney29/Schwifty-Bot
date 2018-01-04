const _ = require('lodash')

var worldsAPI = require('../constants/worlds.js')

module.exports.updatePlayerZone = updatePlayerZone(username, zoneid, worldid)

function updatePlayerZone(username, zoneid, worldid) {
	var world = _.find(worldsAPI.worlds, { worldid: worldid })
	var zone = _.find(world.zones, { zoneid: zoneid })
	zone.players.push(username)

}