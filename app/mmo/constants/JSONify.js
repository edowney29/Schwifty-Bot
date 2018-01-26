module.exports.User = (token, username, email, passhash, salt, status) => {
    var json = {
        token,
        username,
        email,
        passhash,
        salt,
        status
    }

    return JSON.stringify(json)
}

module.exports.Move = (username, positionX, positionY, moveH, moveV, lastMoveX, lastMoveY, world, zone) => {
    var json = {
        username,
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