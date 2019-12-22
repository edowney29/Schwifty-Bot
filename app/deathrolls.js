const AWS = require("aws-sdk");

const { AWS_ACCESS_KEY, AWS_SECRET_KEY } = process.env;

const ddb = new AWS.DynamoDB({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: "us-east-1"
});

module.exports.offers = new Map();

module.exports.createUser = user => {
  ddb
    .putItem({
      TableName: "deathroll-users",
      Item: {
        userid: { S: user.id },
        username: { S: user.username },
        gold: { N: "10" },
        seed: { S: null }
      },
      ConditionExpression: "attribute_not_exists(userid)"
    })
    .send();
};

module.exports.createBattle = (offer, accept, message, gold) => {
  ddb
    .putItem({
      TableName: "deathroll-battles",
      Item: {
        guildid: { S: message.guild.id },
        messageid: { S: message.id },
        offer: { S: offer.username },
        offerid: { S: offer.id },
        accept: { S: accept.username },
        acceptid: { S: accept.id },
        gold: { N: gold.toString() },
        lastroll: { N: (gold * 10).toString() },
        isfirst: { BOOL: true },
        ispayed: { BOOL: false }
      }
    })
    .send();
};

module.exports.updateBattle = async (userid, roll, lastroll, message) => {
  const battles = await ddb
    .query({
      TableName: "deathroll-battles",
      ExpressionAttributeValues: {
        ":lastroll": { N: lastroll.toString() },
        ":guildid": { S: message.guild.id },
        ":userid": { S: userid },
        ":one": { N: "1" }
      },
      KeyConditionExpression: "guildid = :guildid",
      FilterExpression:
        "lastroll = :lastroll and lastroll > :one and (offerid = :userid or acceptid = :userid)",
      ScanIndexForward: false,
      Limit: 1
    })
    .promise();
  if (battles.Items.length > 0) {
    const battle = this.itemToObject(battles.Items[0]);
    const isfirst = !battle.isfirst;
    ddb
      .updateItem({
        TableName: "deathroll-battles",
        Key: {
          guildid: { S: battle.guildid },
          messageid: { S: battle.messageid }
        },
        UpdateExpression: "set lastroll = :roll, isfirst = :isfirst",
        ExpressionAttributeValues: {
          ":roll": { N: roll.toString() },
          ":isfirst": { BOOL: isfirst }
        }
      })
      .promise()
      .then(value => console.log(value))
      .catch(error => console.error(error));
    return battle;
  }
  return null;
};

module.exports.fetchRecord = (user, message, lastKey = null) => {
  return ddb
    .query({
      TableName: "deathroll-battles",
      ExpressionAttributeValues: {
        ":guildid": { S: message.guild.id },
        ":userid": { S: user.id },
        ":one": { N: "1" }
      },
      KeyConditionExpression: "guildid = :guildid",
      FilterExpression:
        "lastroll = :one and (offerid = :userid or acceptid = :userid)",
      ScanIndexForward: false,
      ExclusiveStartKey: lastKey ? { S: lastKey } : null
    })
    .promise();
};

module.exports.itemToObject = item => {
  return AWS.DynamoDB.Converter.unmarshall(item);
};

module.exports.objectToItem = object => {
  return AWS.DynamoDB.Converter.marshall(object);
};