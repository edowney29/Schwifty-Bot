'use strict'
const Database = require('better-sqlite3');
const db = new Database('deathroll.db', { verbose: console.log });
const table = db.prepare("SELECT count(*) FROM sqlite_master WHERE name='myTable' and type='table';").get();
if (!table['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    db.prepare("CREATE TABLE rollers (id TEXT PRIMARY KEY AUTOINCREMENT, discordid TINYTEXT NOT NULL UNIQUE, gold BIGINT, wins INT, losses INT);").run();
}

module.exports.getScore = () => {
    db.prepare("SELECT * FROM rollers WHERE discordid = ?");
}

function backupDatabase() {
    db.backup(`backup.db`)
        .then(() => {
            console.log('backup complete!');
        })
        .catch((err) => {
            console.log('backup failed:', err);
        });
}

setInterval(() => {
    if (new Date().getHours() === 4) { // 4 am
        backupDatabase()
    }
}, 3600000)
