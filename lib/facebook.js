const request = require('request');
const path = require('path');

module.exports.Chat = class Chat {
  constructor(event) {
    this.event = event;
  }

  send(payload) {
    payload.recipient = {id: this.event.sender.id};

    request.post(
      {
        uri: "https://graph.facebook.com/v2.6/me/messages",
        json: true,
        qs: {
          access_token: process.env.FB_PAGETOKEN,
        },
        body: payload,
    },
    (error, res, body) => {
      console.log('error: ' + error);
      console.log('res: ' + res);
      console.log('body: ' + body);
    })
  }

  sendText(text, quick_replies = null) {
    const message = {text: text};
    if (quick_replies !== null && quick_replies.length > 0) {
      message.quick_replies = quick_replies;
    }

    const payload = {
      message: message,
    };

    this.send(payload);
  }

  sendButtons(text, buttons) {
    const payload = {
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text,
            buttons: buttons,
          }
        }
      }
    };

    this.send(payload);
  }

  sendList(elements, top_element_style='compact', button = null) {
    const payload = {
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "list",
            top_element_style: top_element_style,
            elements: elements,
          }
        }
      }
    };

    if (button !== null) {
      payload.message.attachment.payload.buttons = [button];
    }

    this.send(payload);
  }

  sendGeneric(elements) {
    const payload = {
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: elements,
          }
        }
      }
    };

    this.send(payload);
  }

  sendAttachment(url, type = null) {
    if (type == null) {
      type = guessAttachmentType(url)
    }

    const payload = {
      message: {
        attachment: {
          type: type,
          payload: {
            url: url,
          }
        }
      }
    };

    this.send(payload);
  }
};

module.exports.quickReply = function quickReply(title, payload, imageUrl = null) {
  if (typeof(payload) === 'object') {
    stringPayload = JSON.stringify(payload);
  } else {
    stringPayload = payload;
  }

  const payload_ = {
    content_type: 'text',
    title: title,
    payload: stringPayload,
  };

  if (imageUrl !== null && imageUrl.length > 0) {
    payload_.image_url = imageUrl;
  }

  return payload_;
};

module.exports.buttonPostback = function buttonPostback(title, payload) {
  if (typeof(payload) !== 'string') {
    payload = JSON.stringify(payload);
  }

  const payload_ = {
    type: 'postback',
    title: title,
    payload: payload,
  };

  return payload_;
};

module.exports.buttonShare = function buttonShare(genericElement = null) {
  const payload = {
    type: 'element_share',
  };

  if (genericElement !== null) {
    payload.share_contents = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: genericElement,
        }
      }
    }
  }

  return payload;
};

module.exports.buttonUrl = function buttonUrl(title, url, webviewHeightRatio = 'full') {
  const payload = {
    type: 'web_url',
    title: title,
    url: url,
    webview_height_ratio: webviewHeightRatio,
  };

  return payload;
};

module.exports.listElement = function listElement(title, subtitle = null, buttons = null, imageUrl = null) {
  const payload = {
    title: title,
  };

  if (subtitle !== null && subtitle.length > 0) {
    payload.subtitle = subtitle;
  }

  if (imageUrl !== null && imageUrl.length > 0) {
    payload.image_url = imageUrl;
  }

  if (buttons !== null) {
    if (!Array.isArray(buttons)) {
      buttons = [buttons];
    }
    if (buttons.length > 0) {
      payload.buttons = buttons;
    }
  }

  return payload;
};

module.exports.genericElement = function genericElement(title, subtitle = null, imageUrl = null, buttons = null) {
  const payload = {
    title: title,
  };

  if (subtitle !== null && subtitle.length > 0) {
    payload.subtitle = subtitle;
  }

  if (imageUrl !== null && imageUrl.length > 0) {
    payload.image_url = imageUrl;
  }

  if (buttons !== null && buttons.length > 0) {
    payload.buttons = buttons;
  }

  return payload
};

module.exports.guessAttachmentType = function guessAttachmentType(filename) {
  //Guesses the attachment type from the file extension
  const ext = path.extname(filename).toLowerCase();
  types = {
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.gif': 'image',
      '.mp4': 'video',
      '.mp3': 'audio',
  };

  return types[ext] || null;
};
