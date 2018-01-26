const MongoClient = require('mongodb').MongoClient
const _ = require('lodash')

const MONGO_URI = process.env.MONGODB_URI

var users

module.exports.setMongoClient = () => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(MONGO_URI, (err, db) => {
            if (err)
                reject(err)
            else {
                console.log('Connected to mongo')
                users = db.collection('users')
                resolve()
            }
        })
    })
}

module.exports.playerRegister = (newUser) => {
    return new Promise((resolve, reject) => {
        users.findOne({
            $or: [{
                username: newUser.username
            }, {
                email: newUser.email
            }]
        }, (err, doc) => {
            if (err)
                reject('error')
            if (doc)
                reject('duplicate')
            else {
                users.insertOne(newUser, (err, res) => {
                    if (err)
                        reject('error')
                    else
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
            if (err)
                reject('error')
            if (doc)
                resolve(doc)
            else
                reject('notfound')
        })
    })
}

module.exports.startUp = (username) => {
    return new Promise((resolve, reject) => {
        users.findOne({
            username: data.username,
        }, (err, doc) => {
            if (err)
                reject('error')
            if (doc)
                resolve(doc)
        })
    })
}

module.exports.setDatabase = (client) => {
    return new Promise((resolve, reject) => {
        users.updateOne({
            username: client.username,
        }, {
                username: client.username,
                positionx: client.positionx,
                positiony: client.positiony,
            }, (err, res) => {
                if (err)
                    reject(err)
                else
                    resolve()
            })
    })
}
