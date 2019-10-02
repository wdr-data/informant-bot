const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');

const payloadFaq = require('../payloadFaq').default;

describe('payloadFaq', () => {
    it('sends a specific faq', () => {
        // c59fc898d8abbb9d04abca459eb928a2fbc18b54
        const chat = new facebook.Chat();
        return payloadFaq(chat, { slug: 'foo' }).then(() => {
            new Expect(chat).text('Foo', []);
        });
    });
});
