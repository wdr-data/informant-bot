const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');

const payloadFaq = require('../payloadFaq').default;

describe('payloadFaq', () => {
    it('sends a specific faq', () => {
    // 31f40b69de861319cab0f432a46b58212ce7030f
        const chat = new facebook.Chat();
        return payloadFaq(chat, { slug: 'foo' }).then(() => {
            new Expect(chat).text('Foo', []);
        });
    });
});
