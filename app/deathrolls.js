const AWS = require("aws-sdk");

const { AWS_ACCESS_KEY, AWS_SECRET_KEY } = process.env;

const ddb = new AWS.DynamoDB({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY
});

module.exports.offers = {};

module.exports.battles = {};

module.exports.createUser = user => {
  ddb
    .putItem({
      TableName: "deathroll-users",
      Item: {
        userid: { S: user.id },
        username: { S: user.username },
        gold: { N: 1 }
      },
      ConditionExpression: "attribute_not_exists(userid)"
    })
    .promise();
};

module.exports.updateUserBattles = (userid, battleid) => {
  return ddb
    .updateItem({
      TableName: "deathroll-users",
      Key: {
        userid
      },
      UpdateExpression: "set battleids = list_append(battleids, :battleid)",
      ExpressionAttributeValues: {
        ":battleid": battleid
      }
    })
    .promise();
};

module.exports.createBattle = (offerid, acceptid, message, gold) => {
  return ddb
    .putItem({
      TableName: "deathroll-battles",
      Item: {
        guildid: { S: message.guild.id },
        messageid: { S: message.id },
        offerid: { S: offerid },
        acceptid: { S: acceptid },
        gold: { N: gold },
        isfirst: { BOOL: true },
        ispayed: { BOOL: false },
        lastroll: { N: gold * 10 }
      }
    })
    .promise();
};

module.exports.updateBattle = async (userid, roll, lastroll, message) => {
  const battles = await ddb
    .query({
      TableName: "deathroll-battles",
      ExpressionAttributeValues: {
        ":guilid": { S: message.guild.id },
        ":lastroll": { N: lastroll },
        ":userid": { S: userid }
      },
      KeyConditionExpression: "guilid = :guilid",
      FilterExpression:
        "lastroll = :lastroll and (offerid = :userid or acceptid = :userid)",
      ScanIndexForward: false,
      Limit: 1
    })
    .promise();

  if (battles.Items.length > 0) {
    const battle = battles.Items[0];
    const isfirst = roll !== 0 ? !battle.isfirst : battle.isfirst;
    await ddb.updateItem({
      TableName: "deathroll-users",
      Key: {
        guilid: battle.guildid,
        messageid: battle.messageid
      },
      UpdateExpression: "set lastroll = :roll, isfirst = :isfirst",
      ExpressionAttributeValues: {
        ":roll": roll,
        ":isfirst": isfirst
      }
    });
    return battle;
  }
  return null;
};

setInterval(() => {
  if (new Date().getHours() === 4) {
    // 4 am
    console.log("test");
  }
}, 3600000);
