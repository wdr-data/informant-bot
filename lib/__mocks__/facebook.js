module.exports.Chat = class {
  constructor(event, labels = []) {
    this.event = event;
    this.labels = labels;

    this.calls = [];
  }

  send(params) {
    return Promise.resolve(this.calls.push(params));
  }

  sendText(text, quickReplies = null) {
    return this.send({fn: this.sendText, params: {text, 'quick_replies': quickReplies}});
  }

  sendButtons(text, buttons) {
    return this.send({fn: this.sendButtons, params: {text, buttons}});
  }

  sendList (elements, button = null, topElementStyle='compact') {
    return this.send({
        fn: this.sendList,
        params: {elements, button, 'top_element_style': topElementStyle},
    });
  }

  sendGeneric (elements) {
    return this.send({fn: this.sendGeneric, params: elements});
  }

  sendAttachment (url, type = null) {
    return this.send({fn: this.sendAttachment, params: {url, type}});
  }

  addLabel (label) {
    return this.send({fn: this.addLabel, params: {label}});
  }

  removeLabel (label) {
    return this.send({fn: this.removeLabel, params: {label}});
  }

  getLabels () {
    this.send({fn: this.getLabels, params: {}});
    return Promise.resolve(this.labels);
  }
};

module.exports.quickReply = function (title, payload, imageUrl = null) {
  return {title, payload, imageUrl};
};

module.exports.buttonPostback = function (title, payload) {
  return {title, payload};
};

module.exports.buttonShare = function (genericElement = null) {
  return {genericElement};
};

module.exports.buttonUrl = function (title, url, webviewHeightRatio = 'full') {
  return {title, url, webviewHeightRatio};
};

module.exports.listElement = function (title, subtitle = null, buttons = null, imageUrl = null) {
  return {title, subtitle, buttons, imageUrl};
};

module.exports.genericElement = function (title, subtitle = null, imageUrl = null, buttons = null) {
  return {title, subtitle, imageUrl, buttons};
};

module.exports.getLabelId = function (name) {
  return name;
};
