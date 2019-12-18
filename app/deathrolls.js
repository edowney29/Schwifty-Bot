var AWS = require('aws-sdk');
var ddb = new AWS.DynamoDB();

module.exports.offers = {}

module.exports.battle = (id, roll, max, message) => {
    // const index = getBattleIndex(id);
    // if (~index) {
    //   if (
    //     this.offers.battles[index].firstroll
    //       ? id === this.deathrolls.battles[index].accept
    //       : id === this.deathrolls.battles[index].offer
    //   ) {
    //     if (!deathrolls.battles[index].lastroll)
    //       deathrolls.battles[index].lastroll = roll;
    //     else if (deathrolls.battles[index].lastroll === max) {
    //       if (roll === 1) {
    //         message.channel.send(
    //           `${
    //             deathrolls.battles[index].firstroll
    //               ? idToMention(deathrolls.battles[index].accept)
    //               : idToMention(deathrolls.battles[index].offer)
    //           } is a loser and owes ${
    //             !deathrolls.battles[index].firstroll
    //               ? idToMention(deathrolls.battles[index].accept)
    //               : idToMention(deathrolls.battles[index].offer)
    //           } ${deathrolls.battles[index].gold} gold`
    //         );
    //         deathrolls.battles.splice(index, 1);
    //       } else {
    //         deathrolls.battles[index].firstroll = !deathrolls.battles[index]
    //           .firstroll;
    //         deathrolls.battles[index].lastroll = roll;
    //       }
    //     } else {
    //       // message.channel.send(
    //       //   `${idToMention(message.author.id)} finish your deathroll with ${
    //       //   message.author.id === deathrolls.battles[index].offer
    //       //     ? idToMention(deathrolls.battles[index].accept)
    //       //     : idToMention(deathrolls.battles[index].offer)
    //       //   } /roll ${deathrolls.battles[index].lastroll}`
    //       // );
    //     }
    //   }
    // }
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

// const getBattleIndex = id => {
//     return deathrolls.battles.findIndex(
//       battle => battle.offer === id || battle.accept === id
//     );
//   };