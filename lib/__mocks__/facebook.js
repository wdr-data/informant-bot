export class Chat {
    constructor(event, labels = []) {
        this.event = event;
        this.labels = labels;

        this.calls = [];
    }

    send(params) {
        return Promise.resolve(this.calls.push(params));
    }

    sendText(text, quickReplies = null) {
        return this.send({ fn: this.sendText, params: { text, 'quick_replies': quickReplies } });
    }

    sendButtons(text, buttons) {
        return this.send({ fn: this.sendButtons, params: { text, buttons } });
    }

    sendList(elements, button = null, topElementStyle='compact') {
        return this.send({
            fn: this.sendList,
            params: { elements, button, 'top_element_style': topElementStyle },
        });
    }

    sendTemplate(elements, templateType = 'generic') {
        return this.send({ fn: this.sendTemplate, params: { elements, templateType } });
    }

    sendAttachment(url, type = null) {
        return this.send({ fn: this.sendAttachment, params: { url, type } });
    }

    addLabel(label) {
        return this.send({ fn: this.addLabel, params: { label } });
    }

    removeLabel(label) {
        return this.send({ fn: this.removeLabel, params: { label } });
    }

    getLabels() {
        this.send({ fn: this.getLabels, params: {} });
        return Promise.resolve(this.labels);
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

export function getLabelId(name) {
    return name;
}
