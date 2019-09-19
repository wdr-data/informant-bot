export class Chat {
    constructor(event) {
        this.event = event;
        this.psid = event && event.sender && event.sender.id;

        this.calls = [];
    }

    send(params) {
        return Promise.resolve(this.calls.push(params));
    }

    sendText(text, quickReplies = null) {
        return this.send({ fn: this.sendText, params: { text, 'quick_replies': quickReplies } });
    }

    sendButtons(text, buttons, quickReplies = null) {
        return this.send({
            fn: this.sendButtons,
            params: { text, buttons, 'quick_replies': quickReplies },
        });
    }

    sendGenericList(elements) {
        return this.send({
            fn: this.sendGenericList,
        });
    }

    sendTemplate(elements, templateType = 'generic') {
        return this.send({ fn: this.sendTemplate, params: { elements, templateType } });
    }

    sendAttachment(url, type = null) {
        return this.send({ fn: this.sendAttachment, params: { url, type } });
    }
}

export function quickReply(title, payload, imageUrl = null) {
    return { title, payload, imageUrl };
}

export function buttonPostback(title, payload) {
    return { title, payload };
}

export function buttonShare(genericElement = null) {
    return { genericElement };
}

export function buttonUrl(title, url, webviewHeightRatio = 'full') {
    return { title, url, webviewHeightRatio };
}

export function listElement(title, subtitle = null, buttons = null, imageUrl = null) {
    return { title, subtitle, buttons, imageUrl };
}

export function genericElement(title, subtitle = null, imageUrl = null, buttons = null) {
    return { title, subtitle, imageUrl, buttons };
}
