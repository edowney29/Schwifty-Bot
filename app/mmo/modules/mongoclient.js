const MongoClient = require('mongodb').MongoClient

const MONGO_URI = process.env.MONGODB_URI

var database, users

module.exports.setMongoClient = () => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(MONGO_URI, (err, db) => {
            if (err) reject(err)
            console.log('Connected to mongo')
            database = db
            setupTables()
            resolve()
        })
    })
}

module.exports.playerRegister = (newUser) => {
    return new Promise((resolve, reject) => {
        var usersDB = database.collection('users')
        users.findOne({
            $or: [{
                username: newUser.username
            }, {
                email: newUser.email
            }]
        }, (err, doc) => {
            if (err) reject('error')
            if (doc) reject('duplicate')
            else {
                usersDB.insertOne(newUser, (err, res) => {
                    if (err) reject('error')
                    resolve('registered')
                })
            }
        })
    })
}

module.exports.playerLogin = (username) => {
    return new Promise((resolve, reject) => {
        users.findOne({
            username: username
        }, (err, doc) => {
            if (err) reject('error')
            if (doc) resolve(doc)
            else reject('notfound')
        })
    })
}

module.exports.startUp = (username) => {
    return new Promise((resolve, reject) => {
        users.findOne({
            username: data.username,
        }, (err, doc) => {
            if (err) reject('error')
            if (doc) resolve(doc)
        })
    })
}


function setupTables() {
    users = database.collection('users')
}