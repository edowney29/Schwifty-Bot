module.exports.User = (username, email, passhash, salt, status) => {
    var json = {
        username,
        email,
        passhash,
        salt,
        status
    }

    return JSON.stringify(json)
}

module.exports.Move = (token, username, playerMoving, positionX, positionY, moveH, moveV, lastMoveX, lastMoveY, world, zone) => {
    var json = {
        token,
        username,
        playerMoving,
        positionX,
        positionY,
        moveH,
        moveV,
        lastMoveX,
        lastMoveY,
        world,
        zone
    }

    return JSON.stringify(json)
}