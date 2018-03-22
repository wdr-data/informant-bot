const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');

const { payloadFaq } = require('../payloadFaq');

describe('payloadFaq', () => {
    it('sends a specific faq', () => {
    // 371aead7acd8321bb6e576903f06a60f429ab295
        const chat = new facebook.Chat();
        return payloadFaq(chat, { slug: 'foo' }).then(() => {
            new Expect(chat).text('Foo', []);
        });
    });
});
