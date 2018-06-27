/* eslint-disable import/no-commonjs */
const facebook = require('./facebook').default; // eslint-disable-line no-unused-vars
const urls = require('./urls').default; // eslint-disable-line no-unused-vars
const ddb = require('./dynamodb').default;
const request = require('request-promise-native');
jest.mock('./facebook');
jest.mock('./urls');
jest.mock('./dynamodb');

function getLastCallChat(expect_) {
    const call = expect_.chat.calls.shift();
    expect_.lastCallChat = call;
    return call;
}

function getLastCallRequest(expect_) {
    const call = request.calls.shift();
    expect_.lastCallRequest = call;
    return call;
}

function getLastCallDynamoDB(expect_) {
    const call = ddb.calls.shift();
    expect_.lastCallDynamoDB = call;
    return call;
}

export class Expect {
    constructor(chat) {
        this.chat = chat;
        this.lastCallChat = null;
        this.lastCallRequest = null;
        this.lastCallDynamoDB = null;
    }

    text(text, quickReplies = null) {
        const call = getLastCallChat(this);
        expect(call.fn).toBe(this.chat.sendText);
        expect(call.params.text).toMatch(text);
        expect(call.params.quick_replies).toEqual(quickReplies);
        return this;
    }

    buttons(text, buttons, quickReplies = null) {
        const call = getLastCallChat(this);
        expect(call.fn).toBe(this.chat.sendButtons);
        expect(call.params.text).toMatch(text);
        expect(call.params.buttons).toEqual(buttons);
        expect(call.params.quick_replies).toEqual(quickReplies);
        return this;
    }

    list(elements, button = null, topElementStyle = 'compact') {
        const call = getLastCallChat(this);
        expect(call.fn).toBe(this.chat.sendList);
        expect(call.params.elements).toEqual(elements);
        expect(call.params.button).toEqual(button);
        expect(call.params.top_element_style).toMatch(topElementStyle);
        return this;
    }

    template(elements, templateType = 'generic') {
        const call = getLastCallChat(this);
        expect(call.fn).toBe(this.chat.sendTemplate);
        expect(call.params.elements).toEqual(elements);
        expect(call.params.templateType).toEqual(templateType);
        return this;
    }

    attachment(url, type = null) {
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

    labelAdded(label) {
        const call = getLastCallChat(this);
        expect(call.fn).toBe(this.chat.addLabel);
        expect(call.params.label).toMatch(label);
        return this;
    }

    labelRemoved(label) {
        const call = getLastCallChat(this);
        expect(call.fn).toBe(this.chat.removeLabel);
        expect(call.params.label).toMatch(label);
        return this;
    }

    labels() {
        const call = getLastCallChat(this);
        expect(call.fn).toBe(this.chat.getLabels);
        return this;
    }

    skipChat(skip = 1) {
        for (let i = 0; i < skip; i++) {
            getLastCallChat(this);
        }
        return this;
    }

    skipChatWhile(fn) {
        while (this.chat.calls.length && fn(this.chat.calls[0])) {
            getLastCallChat(this);
        }
        return this;
    }

    request(params = null) {
        const call = getLastCallRequest(this);
        if (params) {
            expect(call).toEqual(params);
        } else {
            expect(call).not.toBe(undefined);
        }
        return this;
    }

    dynamoPut(params) {
        const call = getLastCallDynamoDB(this);
        expect(call.fn).toBe(ddb.put);
        expect(call.params).toEqual(params);
        return this;
    }

    dynamoGet(params) {
        const call = getLastCallDynamoDB(this);
        expect(call.fn).toBe(ddb.get);
        expect(call.params).toEqual(params);
        return this;
    }

    dynamoDelete(params) {
        const call = getLastCallDynamoDB(this);
        expect(call.fn).toBe(ddb.delete);
        expect(call.params).toEqual(params);
        return this;
    }

    dynamoUpdate(params) {
        const call = getLastCallDynamoDB(this);
        expect(call.fn).toBe(ddb.update);
        expect(call.params).toEqual(params);
        return this;
    }
}
