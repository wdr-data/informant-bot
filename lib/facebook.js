import uuidv4 from 'uuid/v4';
import path from 'path';

import rp from 'request-promise-native';

import { getAttachmentId } from './facebookAttachments';
import DynamoDbCrud from './dynamodbCrud';
import Webtrekk from './webtrekk';

export class Chat {
    constructor(event) {
        this.event = event;
        this.psid = event.sender.id;

        this.subscribed = undefined;
        this.subscriptions = undefined;

        this.feedbackMode = undefined;

        this.track = undefined;
        this.trackingEnabled = undefined;
        this.uuid = undefined;
    }

    async loadSettings() {
        try {
            const subscriptions = new DynamoDbCrud(process.env.DYNAMODB_SUBSCRIPTIONS, 'psid');
            const sub = await subscriptions.load(this.psid);
            this.subscribed = sub.morning || sub.evening || sub.breaking;
            this.subscriptions = sub;
        } catch (e) {
            this.subscribed = false;
        }

        try {
            const lastDefaultReplies = new DynamoDbCrud(
                process.env.DYNAMODB_LASTDEFAULTREPLIES,
                'psid'
            );
            const lastReply = await lastDefaultReplies.load(this.psid);
            this.feedbackMode = lastReply.ttl > Math.floor(Date.now() / 1000);
            console.log('Feedback mode enabled.');
        } catch (e) {
            this.feedbackMode = false;
        }

        const users = new DynamoDbCrud(process.env.DYNAMODB_USERS, 'psid');
        const usersItem = await users.load(this.psid);
        if (usersItem) {
            this.uuid = usersItem.uuid;
        } else {
            const uuid = uuidv4();
            await users.create(this.psid, { uuid });
            this.uuid = uuid;
        }

        try {
            const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING, 'psid');
            this.trackingEnabled = (await tracking.load(this.psid)).enabled;

            if (this.trackingEnabled) {
                this.webtrekk = new Webtrekk(
                    this.uuid,
                );
                this.track = (params) =>
                    this.webtrekk.track(params);
            }
        } catch (e) {
            console.log('User has not chosen tracking preferences yet.');
        }
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

    async sendFullNewsBase(newsBaseObj, quickReplies = null) {
        const fragments = [ newsBaseObj, ...newsBaseObj.next_fragments || [] ];
        const head = fragments.slice(0, -1);
        const tail = fragments.slice(-1)[0];

        for (const fragment of head) {
            if (fragment.media) {
                await this.sendAttachment(fragment.media);
            }
            await this.sendText(fragment.text);
        }

        if (tail.media) {
            await this.sendAttachment(tail.media);
        }
        return this.sendText(tail.text, quickReplies);
    }

    async sendFullNewsBaseWithButtons(newsBaseObj, buttons, quickReplies = null) {
        const fragments = [ newsBaseObj, ...newsBaseObj.next_fragments || [] ];
        const head = fragments.slice(0, -1);
        const tail = fragments.slice(-1)[0];

        for (const fragment of head) {
            if (fragment.media) {
                await this.sendAttachment(fragment.media);
            }
            await this.sendText(fragment.text);
        }

        if (tail.media) {
            await this.sendAttachment(tail.media);
        }
        return this.sendButtons(tail.text, buttons, quickReplies);
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
