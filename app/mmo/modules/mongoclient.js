const MongoClient = require('mongodb').MongoClient

const MONGO_URI = process.env.MONGODB_URI

module.exports.setMongoClient = setMongoClient
module.exports.playerRegister = playerRegister
module.exports.playerLogin = playerLogin
module.exports.startUp = startUp

var users

const setMongoClient = () => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(MONGO_URI, (err, db) => {
            if (err) reject(err)
            console.log('Connected to mongo')
            users = db.collection('users')
            resolve()
        })
    })
}

const playerRegister = (newUser) => {
    return new Promise((resolve, reject) => {
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
                users.insertOne(newUser, (err, res) => {
                    if (err) reject('error')
                    resolve('registered')
                })
            }
        })
    })
}

const playerLogin = (username) => {
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

const startUp = (username) => {
    return new Promise((resolve, reject) => {
        users.findOne({
            username: data.username,
        }, (err, doc) => {
            if (err) reject('error')
            if (doc) resolve(doc)
        })
    })
}