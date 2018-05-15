const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');

const currentTime = require('../actionCurrentTime').default;

describe('actionCurrentTime', () => {
    it('sends a message that contains a time', async () => {
        const chat = new facebook.Chat();
        await currentTime(chat);
        new Expect(chat).text(/Die exakte Uhrzeit lautet: \d\d:\d\d:\d\d/);
    });
});
