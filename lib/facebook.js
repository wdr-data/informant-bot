import rp from 'request-promise-native';
import path from 'path';
import { getAttachmentId } from './facebookAttachments';

export class Chat {
    constructor(event) {
        this.event = event;
        this.psid = event.sender.id;
    }

    send(payload, options) {
        const { timeout, messagingType } = options || {};

        payload.recipient = { id: this.psid };
        payload['messaging_type'] = messagingType || 'RESPONSE';

        return rp.post({
            uri: 'https://graph.facebook.com/v4.0/me/messages',
            json: true,
            qs: {
                'access_token': process.env.FB_PAGETOKEN,
            },
            body: payload,
            timeout: timeout || 10000,
        });
    }

    sendText(text, quickReplies = null, options) {
        const message = { text: text };
        if (quickReplies !== null && quickReplies.length > 0) {
            message['quick_replies'] = quickReplies;
        }

        const payload = {
            message: message,
        };

        return this.send(payload, options);
    }

    sendButtons(text, buttons, quickReplies = null, options) {
        const message = {
            attachment: {
                type: 'template',
                payload: {
                    'template_type': 'button',
                    text: text,
                    buttons: buttons,
                },
            },
        };
        if (quickReplies !== null && quickReplies.length > 0) {
            message['quick_replies'] = quickReplies;
        }

        const payload = {
            message: message,
        };

        return this.send(payload, options);
    }

    sendGenericTemplate(elements, options) {
        this.sendTemplate(elements, 'generic', options);
    }

    sendTemplate(elements, templateType = 'generic', options) {
        const payload = {
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        'template_type': templateType,
                        elements: elements,
                    },
                },
            },
        };

        return this.send(payload, options);
    }

    async sendAttachment(url, type = null, options) {
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
        }, options);
    }
}

export function quickReply(title, payload, imageUrl = null) {
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
}

export function buttonPostback(title, payload) {
    if (typeof payload !== 'string') {
        payload = JSON.stringify(payload);
    }

    const payload_ = {
        type: 'postback',
        title: title,
        payload: payload,
    };

    return payload_;
}

export function buttonShare(genericElement = null) {
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
}

export function buttonUrl(title, url, webviewHeightRatio = 'full') {
    const payload = {
        type: 'web_url',
        title: title,
        url: url,
        'webview_height_ratio': webviewHeightRatio,
    };

    return payload;
}

export function genericElement(title, subtitle = null, buttons = null, imageUrl = null) {
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
}

export function guessAttachmentType(filename) {
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
}
