const { Expect } = require("../../lib/testing");
const facebook = require("../../lib/facebook");

const current_time = require("../action_current_time");

describe("action_current_time", () => {
  it("sends a message that contains a time", () => {
    const chat = new facebook.Chat();
    return current_time(chat).then(() => {
      new Expect(chat).text(/Die exakte Uhrzeit lautet: \d\d:\d\d:\d\d/);
    });
  });
});
