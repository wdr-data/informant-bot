const rp = require('request-promise-native');
const path = require('path');
const getAttachmentId = require('./facebookAttachments').getAttachmentId;

module.exports.Chat = class Chat {
    constructor(event) {
        this.event = event;
    }

    send(payload) {
        payload.recipient = { id: this.event.sender.id };
        payload['messaging_type'] = 'RESPONSE';

        return rp.post({
            uri: 'https://graph.facebook.com/v2.12/me/messages',
            json: true,
            qs: {
                'access_token': process.env.FB_PAGETOKEN,
            },
            body: payload,
        });
    }

    sendText(text, quickReplies = null) {
        const message = { text: text };
        if (quickReplies !== null && quickReplies.length > 0) {
            message['quick_replies'] = quickReplies;
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
                        'template_type': 'button',
                        text: text,
                        buttons: buttons,
                    },
                },
            },
        };

        return this.send(payload);
    }

    sendList(elements, button = null, topElementStyle='compact') {
        const payload = {
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        'template_type': 'list',
                        'top_element_style': topElementStyle,
                        elements: elements,
                    },
                },
            },
        };

        if (button !== null) {
            payload.message.attachment.payload.buttons = [ button ];
        }

        return this.send(payload);
    }

    sendGeneric(elements) {
        const payload = {
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        'template_type': 'generic',
                        elements: elements,
                    },
                },
            },
        };

        return this.send(payload);
    }

    async sendAttachment(url, type = null) {
        if (type === null) {
            type = guessAttachmentType(url);
        }

        const attachmentId = await getAttachmentId(url, type);
        console.log(`received ${attachmentId} from getAttachmentId`);

        return this.send({
            message: {
                attachment: {
                    type: type,
                    payload: {
                        'attachment_id': attachmentId,
                    },
                },
            },
        });
    }

    async addLabel(label) {
        const labelId = await getLabelId(label);

        try {
            const result = await rp.post({
                uri: `https://graph.facebook.com/v2.11/${labelId}/label`,
                json: true,
                qs: {
                    'access_token': process.env.FB_PAGETOKEN,
                },
                body: {
                    user: this.event.sender.id,
                },
            });
            console.log(`Labeled ${this.event.sender.id} with ${label}`);
            return result;
        } catch (e) {
            console.log('Labeling user failed: ' + e.message);
            throw e;
        }
    }

    async removeLabel(label) {
        const labelId = await getLabelId(label);

        try {
            const result = await rp.delete(
                {
                    uri: `https://graph.facebook.com/v2.11/${labelId}/label`,
                    json: true,
                    qs: {
                        'access_token': process.env.FB_PAGETOKEN,
                    },
                    body: {
                        user: this.event.sender.id,
                    },
                });

            console.log(`Removed label ${label} from ${this.event.sender.id}`);
            return result;
        } catch (e) {
            console.log('Removing label from user failed: ' + e.message);
            throw e;
        }
    }

    async getLabels() {
        const body = await rp.get({
            uri: `https://graph.facebook.com/v2.11/${this.event.sender.id}/custom_labels`,
            qs: {
                fields: 'name',
                'access_token': process.env.FB_PAGETOKEN,
            },
            json: true,
        });
        return body.data.map((o) => o.name);
    }
};

module.exports.quickReply = function quickReply(title, payload, imageUrl = null) {
    if (typeof payload !== 'string') {
        payload = JSON.stringify(payload);
    }

    const payload_ = {
        'content_type': 'text',
        title: title,
        payload: payload,
    };

    if (imageUrl !== null && imageUrl.length > 0) {
        payload_['image_url'] = imageUrl;
    }

    return payload_;
};

module.exports.buttonPostback = function buttonPostback(title, payload) {
    if (typeof payload !== 'string') {
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
        payload['share_contents'] = {
            attachment: {
                type: 'template',
                payload: {
                    'template_type': 'generic',
                    elements: genericElement,
                },
            },
        };
    }

    return payload;
};

module.exports.buttonUrl = function buttonUrl(title, url, webviewHeightRatio = 'full') {
    const payload = {
        type: 'web_url',
        title: title,
        url: url,
        'webview_height_ratio': webviewHeightRatio,
    };

    return payload;
};

module.exports.listElement = function listElement(
    title, subtitle = null, buttons = null, imageUrl = null
) {
    const payload = {
        title: title,
    };

    if (subtitle !== null && subtitle.length > 0) {
        payload.subtitle = subtitle;
    }

    if (imageUrl !== null && imageUrl.length > 0) {
        payload['image_url'] = imageUrl;
    }

    if (buttons !== null) {
        if (!Array.isArray(buttons)) {
            buttons = [ buttons ];
        }
        if (buttons.length > 0) {
            payload.buttons = buttons;
        }
    }

    return payload;
};

module.exports.genericElement = function genericElement(
    title, subtitle = null, imageUrl = null, buttons = null
) {
    const payload = {
        title: title,
    };

    if (subtitle !== null && subtitle.length > 0) {
        payload.subtitle = subtitle;
    }

    if (imageUrl !== null && imageUrl.length > 0) {
        payload['image_url'] = imageUrl;
    }

    if (buttons !== null && buttons.length > 0) {
        payload.buttons = buttons;
    }

    return payload;
};

const guessAttachmentType = function(filename) {
    // Guesses the attachment type from the file extension
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
async function createAndSendBroadcast(payload, label = null) {
    console.log('Creating Broadcast...');
    try {
        const response = await rp.post(
            {
                uri: 'https://graph.facebook.com/v2.12/me/message_creatives',
                json: true,
                qs: {
                    'access_token': process.env.FB_PAGETOKEN,
                },
                body: payload,
            });

        const messageCreativeId = response.message_creative_id;

        // eslint-disable-next-line no-inner-declarations
        async function sendBroadcast(labelId) {
            console.log('Sending Broadcast...');

            const payload = {
                'message_creative_id': messageCreativeId,
                'messaging_type': 'MESSAGE_TAG',
                tag: 'NON_PROMOTIONAL_SUBSCRIPTION',
            };

            if (labelId !== null) {
                payload['custom_label_id'] = labelId;
            }

            try {
                const body = await rp.post({
                    uri: 'https://graph.facebook.com/v2.12/me/broadcast_messages',
                    json: true,
                    qs: {
                        'access_token': process.env.FB_PAGETOKEN,
                    },
                    body: payload,
                });


                setTimeout(async () => {
                    const body = await rp.get({
                        uri: `https://graph.facebook.com/v2.12/${body.broadcast_id}/insights/messages_sent`,
                        json: true,
                        qs: {
                            'access_token': process.env.FB_PAGETOKEN,
                        },
                    });

                    console.log(JSON.stringify(body, null, 2));
                }, 10000);

                return 'Successfully sent broadcast: ' + JSON.stringify(body);
            } catch (e) {
                throw Error('Error sending broadcast: ' + e.message);
            }
        }

        if (label !== null && label.length > 0) {
            getLabelId(label).then(sendBroadcast).catch((error) => console.log(error));
        } else {
            sendBroadcast(null);
        }
    } catch (e) {
        throw Error('Error creating broadcast: ' + e.message);
    }
}

async function getLabelId(name) {
    // Returns a promise that passes the label ID to the `then`
    // Creates the label if it doesn't exist

    try {
        const resolveLabelResponse = await rp.get({
            uri: 'https://graph.facebook.com/v2.11/me/custom_labels',
            json: true,
            qs: {
                fields: 'name',
                'access_token': process.env.FB_PAGETOKEN,
            },
        });
        for (const elem of resolveLabelResponse.data) {
            if (elem.name === name) {
                console.log(`Resolved label ${name} to ${elem.id}`);
                return elem.id;
            }
        }

        // Still here - label does not exist yet
        try {
            const createLabelResponse = await rp.post({
                uri: 'https://graph.facebook.com/v2.11/me/custom_labels',
                json: true,
                body: {
                    name: name,
                },
                qs: {
                    'access_token': process.env.FB_PAGETOKEN,
                },
            });
            const labelId = createLabelResponse.id;
            console.log(`Resolved label ${name} to ${labelId}`);
            return labelId;
        } catch (e) {
            throw Error('Error creating unknown label: ' + e.message);
        }
    } catch (e) {
        throw Error('Error loading list of labels: ' + e.message);
    }
}

module.exports.sendBroadcastText = (text, quickReplies = null, label = null) => {
    const message = { text: text };

    if (quickReplies !== null && quickReplies.length > 0) {
        message['quick_replies'] = quickReplies;
    }

    const payload = {
        messages: [ message ],
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
                        'template_type': 'button',
                        text: text,
                        buttons: buttons,
                    },
                },
            },
        ],
    };

    return createAndSendBroadcast(payload, label);
};
