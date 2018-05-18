const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');

const currentNews = require('../actionCurrentNews').default;

describe('actionCurrentNews', () => {
    it('sends a specific message with a button', async () => {
    // e4d4c2941dd54f549393e9c3384e2d10900d36c7
        const chat = new facebook.Chat();
        await currentNews(chat, { intro: true });
        new Expect(chat)
            .buttons(
                'Hey, alles klar bei dir? Dein Informant ist wieder hier - ' +
                'und das habe ich für dich:',
                [
                    facebook.buttonPostback(
                        'Alle Infos',
                        {
                            action: 'report_start',
                            push: 4,
                            report: 2,
                            type: 'push',
                        }),
                ],
            );
    });
});
