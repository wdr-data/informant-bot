const { Expect } = require("../../lib/testing");
const facebook = require("../../lib/facebook");

const payload_faq = require("../payload_faq");

describe("payload_faq", () => {
  it("sends a specific faq", () => {
    // 371aead7acd8321bb6e576903f06a60f429ab295
    const chat = new facebook.Chat();
    return payload_faq(chat, {slug:"foo"}).then(() => {
      new Expect(chat).text("Foo", []);
    });
  });
});