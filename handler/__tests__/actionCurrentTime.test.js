const { Expect } = require("../../lib/testing");
const facebook = require("../../lib/facebook");

const currentTime = require("../actionCurrentTime");

describe("actionCurrentTime", () => {
  it("sends a message that contains a time", () => {
    const chat = new facebook.Chat();
    return currentTime(chat).then(() => {
      new Expect(chat).text(/Die exakte Uhrzeit lautet: \d\d:\d\d:\d\d/);
    });
  });
});
