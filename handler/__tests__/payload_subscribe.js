const { Expect } = require("../../lib/testing");
const facebook = require("../../lib/facebook");
const payloadSubscribe = require("../payload_subscribe");

const tableName = process.env.DYNAMODB_SUBSCRIPTIONS;

describe("payload_subscribe.subscribe", () => {
  // dynamodb: c3a20f370fae4beafdde6af472ff8bf63da9ef9b
  it("adds appropriate labels and replies with the correct text", () => {
    const chat = new facebook.Chat({sender: {id: "1"}});
    return payloadSubscribe.subscribe(chat, {subscription: "morning"}).then(() => {
      new Expect(chat)
      .labelAdded('push-breaking')
      .labelAdded('push-morning')
      .text(`Ich schick dir ab jetzt die Nachrichten, wie du sie bestellt hast. ` +
        `Wenn du die letzte Ausgabe sehen willst, schreib einfach "Leg los"`);
    });
  });

  it("adds a subscription to dynamodb", () => {
    const chat = new facebook.Chat({sender: {id: "1"}});
    return payloadSubscribe.subscribe(chat, {subscription: "morning"}).then(() => {
      new Expect(chat).dynamoPut({
        TableName: tableName,
        Item: {
          psid: "1",
          morning: 1,
          evening: 0
        },
        ConditionExpression: 'attribute_not_exists(psid)',
      });
    });
  });
});

describe("payload_subscribe.unsubscribe", () => {
  // dynamodb.update: 67136336f73537cfd8a1fede6db932bd94d20423
  // dynamodb.delete: 8779f7a74ed5e22f4aa569488b6779eb2bd1618f
  it("removes appropriate labels and replies with the correct text", () => {
    const chat = new facebook.Chat({sender: {id: "1"}}, ['push-morning']);
    return payloadSubscribe.unsubscribe(chat, {subscription: "morning"}).then(() => {
      new Expect(chat)
      .labels()
      .labelRemoved('push-morning')
      .labelRemoved('push-breaking')
      .text(`Schade. Deine Entscheidung. Ich bin hier, wenn Du mich brauchst.`);
    });
  });

  it("removes the subscription from dynamodb", () => {
    const chat = new facebook.Chat({sender: {id: "1"}});
    return payloadSubscribe.unsubscribe(chat, {subscription: "morning"}).then(() => {
      new Expect(chat).dynamoUpdate({
        TableName: tableName,
        Key: {
          psid: "1",
        },
        UpdateExpression: "SET #timing = :status",
        ExpressionAttributeNames:{
          "#timing": "morning",
        },
        ExpressionAttributeValues:{
          ":status": 0,
        },
        ReturnValues: "ALL_NEW",
      }).dynamoDelete({
        TableName: tableName,
        Key: {
          psid: "1",
        },
      });
    });
  });
});
