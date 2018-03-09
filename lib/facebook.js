const rp = require('request-promise-native');
const path = require('path');
const getAttachmentId = require('./facebookAttachments').getAttachmentId;

module.exports.Chat = class Chat {
  constructor(event) {
    this.event = event;
  }

  send(payload) {
    payload.recipient = {id: this.event.sender.id};
    payload.messaging_type = "RESPONSE";

    console.log(JSON.stringify(payload, null, 2));

    return rp.post(
      {
        uri: "https://graph.facebook.com/v2.12/me/messages",
        json: true,
        qs: {
          access_token: process.env.FB_PAGETOKEN,
        },
        body: payload,
    });
  }

  sendText(text, quick_replies = null) {
    const message = {text: text};
    if (quick_replies !== null && quick_replies.length > 0) {
      message.quick_replies = quick_replies;
    }

    const payload = {
      message: message,
    };

    return this.send(payload);
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

    return this.send(payload);
  }

  sendList(elements, button = null, top_element_style='compact') {
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

    return this.send(payload);
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

    return this.send(payload);
  }

  sendAttachment(url, type = null) {
    if (type === null) {
      type = guessAttachmentType(url)
    }

    return new Promise((resolve, reject) => {
      getAttachmentId(url, type).then(
        (attachment_id) => {
          console.log(`received ${attachment_id} from getAttachmentId`);

          this.send({
            message: {
              attachment: {
                type: type,
                payload: {
                  attachment_id,
                },
              }
            }
          }).then((response) => {
            resolve(response);
          }).catch((error) => {
            reject(error);
          });
        }
      )
    });
  }

  addLabel(label) {
    return getLabelID(label).then(label_id => {
      rp.post(
        {
          uri: `https://graph.facebook.com/v2.11/${label_id}/label`,
          json: true,
          qs: {
            access_token: process.env.FB_PAGETOKEN,
          },
          body: {
            user: this.event.sender.id,
          },
        }).then(() => {
        console.log(`Labeled ${this.event.sender.id} with ${label}`);
      }).catch(error => {
        console.log('Labeling user failed: ' + error);
      })
    }).catch(error => {
      console.log(error);
    })
  }

  removeLabel(label) {
    getLabelID(label).then(label_id => {
      rp.delete(
        {
          uri: `https://graph.facebook.com/v2.11/${label_id}/label`,
          json: true,
          qs: {
            access_token: process.env.FB_PAGETOKEN,
          },
          body: {
            user: this.event.sender.id,
          },
        }).then(() => {
        console.log(`Removed label ${label} from ${this.event.sender.id}`);
      }).catch(error => {
        console.log('Removing label from user failed: ' + error);
      })
    }).catch(error => {
      console.log(error);
    })
  }

  getLabels() {
    // Returns Promise that passes list of labels `then`
    return new Promise((resolve, reject) => {
      rp.get(
        {
          uri: `https://graph.facebook.com/v2.11/${this.event.sender.id}/custom_labels`,
          qs: {
            fields: 'name',
            access_token: process.env.FB_PAGETOKEN,
          },
        }).then(body => {
          resolve(JSON.parse(body).data.map(o => { return o.name; }));
      }).catch(error => {
        reject('Retrieving labels for user failed: ' + error);
      });
    });
  }
};

module.exports.quickReply = function quickReply(title, payload, imageUrl = null) {
  if (typeof(payload) !== 'string') {
    payload = JSON.stringify(payload);
  }

  const payload_ = {
    content_type: 'text',
    title: title,
    payload: payload,
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

const guessAttachmentType = function(filename) {
    //Guesses the attachment type from the file extension
    const ext = path.extname(filename).toLowerCase();
    const types = {
        '.jpg': 'image',
        '.jpeg': 'image',
        '.png': 'image',
        '.gif': 'image',
        '.mp4': 'video',
        '.mp3': 'audio',
    };

    return types[ext] || null;
};
module.exports.guessAttachmentType = guessAttachmentType;

// Broadcast API
function createAndSendBroadcast(payload, label = null) {
  console.log("Creating Broadcast...");
  return new Promise((resolve, reject) => {
    rp.post(
      {
        uri: "https://graph.facebook.com/v2.12/me/message_creatives",
        json: true,
        qs: {
          access_token: process.env.FB_PAGETOKEN,
        },
        body: payload,
      }).then(response => {
        const message_creative_id = response.message_creative_id;

        function sendBroadcast(label_id) {
          console.log("Sending Broadcast...");

          const payload = {
            message_creative_id: message_creative_id,
            tag: "NON_PROMOTIONAL_SUBSCRIPTION",
          };

          if (label_id !== null) {
            payload.custom_label_id = label_id
          }

          console.log(JSON.stringify(payload));

          rp.post({
            uri: "https://graph.facebook.com/v2.12/me/broadcast_messages",
            json: true,
            qs: {
              access_token: process.env.FB_PAGETOKEN,
            },
            body: payload,
          }).then(body => {
            resolve('Successfully sent broadcast: ' + JSON.stringify(body));
            setTimeout(() => {
              rp.get({
                uri: `https://graph.facebook.com/v2.12/${body.broadcast_id}/insights/messages_sent`,
                json: true,
                qs: {
                  access_token: process.env.FB_PAGETOKEN,
                }
              }).then(body => {
                console.log(JSON.stringify(body, null, 2));
              })
            }, 10000);
          }).catch(error => {
            reject('Error sending broadcast: ' + JSON.stringify(error));
          });
        }

        if (label !== null && label.length > 0) {
          getLabelID(label).then(sendBroadcast).catch(error => console.log(error));
        } else {
          sendBroadcast(null);
        }

      }).catch(error => {
        reject('Error creating broadcast: ' + JSON.stringify(error));
      }
    );
  });
}

function getLabelID(name) {
  // Returns a promise that passes the label ID to the `then`
  // Creates the label if it doesn't exist
  return new Promise((resolve, reject) => {
    rp.get({
      uri: "https://graph.facebook.com/v2.11/me/custom_labels",
      json: true,
      qs: {
        fields: 'name',
        access_token: process.env.FB_PAGETOKEN,
      },
    }).then(response => {
      for (const elem of response.data) {
        if (elem.name === name) {
          console.log(`Resolved label ${name} to ${elem.id}`);
          resolve(elem.id);
          return;
        }
      }
      // Still here - label does not exist yet
      rp.post({
        uri: "https://graph.facebook.com/v2.11/me/custom_labels",
        json: true,
        body: {
          name: name,
        },
        qs: {
          access_token: process.env.FB_PAGETOKEN,
        },
      }).then(response => {
        const label_id = response.id;
        console.log(`Resolved label ${name} to ${label_id}`);
        resolve(label_id);
      }).catch(error => {
        reject('Error creating unknown label: ' + error);
      });
    }).catch(error => {
      reject('Error loading list of labels: ' + error);
    });
  });
}

module.exports.sendBroadcastText = (text, quick_replies = null, label = null) => {
  const message = {text: text};

  if (quick_replies !== null && quick_replies.length > 0) {
    message.quick_replies = quick_replies;
  }

  const payload = {
    messages: [message],
  };

  return createAndSendBroadcast(payload, label);
};

module.exports.sendBroadcastButtons = (text, buttons, label = null) => {
  const payload = {
    messages: [
      {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text,
            buttons: buttons,
          }
        }
      },
    ]
  };

  return createAndSendBroadcast(payload, label);
};
