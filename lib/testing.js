const facebook = require("./facebook"); // eslint-disable-line no-unused-vars
const urls = require("./urls"); // eslint-disable-line no-unused-vars
jest.mock("./facebook");
jest.mock("./urls");

function getLastCallChat(expect_) {
  const call = expect_.chat.calls.shift();
  expect_.lastCallChat = call;
  return call;
}

module.exports.Expect = class {
  constructor(chat){
    this.chat = chat;
    this.lastCallChat = null;
  }

  text(text, quickReplies = null) {
    const call = getLastCallChat(this);
    expect(call.fn).toBe(this.chat.sendText);
    expect(call.params.text).toMatch(text);
    expect(call.params.quick_replies).toEqual(quickReplies);
    return this;
  }

  buttons(text, buttons) {
    const call = getLastCallChat(this);
    expect(call.fn).toBe(this.chat.sendButtons);
    expect(call.params.text).toMatch(text);
    expect(call.params.buttons).toEqual(buttons);
    return this;
  }

  list (elements, button = null, topElementStyle = 'compact') {
    const call = getLastCallChat(this);
    expect(call.fn).toBe(this.chat.sendList);
    expect(call.params.elements).toEqual(elements);
    expect(call.params.button).toEqual(button);
    expect(call.params.top_element_style).toMatch(topElementStyle);
    return this;
  }

  generic (elements) {
    const call = getLastCallChat(this);
    expect(call.fn).toBe(this.chat.sendGeneric);
    expect(call.params.elements).toEqual(elements);
    return this;
  }

  attachment (url, type = null) {
    const call = getLastCallChat(this);
    expect(call.fn).toBe(this.chat.sendAttachment);
    expect(call.params.url).toEqual(url);

    if (type === null) {
      expect(call.params.type).toEqual(type);
    } else {
      expect(call.params.type).toMatch(type);
    }
    return this;
  }

  labelAdded (label) {
    const call = getLastCallChat(this);
    expect(call.fn).toBe(this.chat.addLabel);
    expect(call.params.label).toMatch(label);
    return this;
  }

  labelRemoved (label) {
    const call = getLastCallChat(this);
    expect(call.fn).toBe(this.chat.removeLabel);
    expect(call.params.label).toMatch(label);
    return this;
  }

  labels () {
    const call = getLastCallChat(this);
    expect(call.fn).toBe(this.chat.getLabels);
    return this;
  }

  skipChat (skip = 1) {
    for (let i = 0; i < skip; i++){
      getLastCallChat(this);
    }
    return this;
  }

  skipChatWhile (fn) {
    while (this.chat.calls.length && fn(this.chat.calls[0])) {
      getLastCallChat(this);
    }
    return this;
  }

}
