const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');

const currentNews = require('../actionCurrentNews').default;

describe('actionCurrentNews', () => {
    it('sends a specific message with a button', async () => {
    // e4d4c2941dd54f549393e9c3384e2d10900d36c7
        const chat = new facebook.Chat();
        await currentNews(chat, { intro: true });
        new Expect(chat)
            .text(
                'Hey, alles klar bei dir? Dein Informant ist wieder hier - ' +
                'und das habe ich für dich:',
            )
            .list([
                facebook.listElement(
                    'Luft in einigen NRW-Städten ist besser geworden',
                    null,
                    facebook.buttonPostback(
                        'Lesen 📰',
                        {
                            action: 'report_start',
                            push: 4,
                            report: 2,
                            type: 'push',
                        }
                    ),
                    '6ee31209-04e9-4cbd-ac3d-c24beb58c993.gif',
                ),
                facebook.listElement(
                    'Unfall löst Diskussion über selbstfahrende Autos aus',
                    null,
                    facebook.buttonPostback(
                        'Lesen 📰',
                        {
                            action: 'report_start',
                            push: 4,
                            report: 253,
                            type: 'push',
                        }
                    ),
                    null,
                ),
                facebook.listElement(
                    'Public Viewing wird auch nach 22 Uhr erlaubt',
                    null,
                    facebook.buttonPostback(
                        'Lesen 📰',
                        {
                            action: 'report_start',
                            push: 4,
                            report: 251,
                            type: 'push',
                        }
                    ),
                    '4522857d-9f8a-4128-898a-2bbd0475fb0e.jpg',
                ),
                facebook.listElement(
                    'Das Letzte: Deine Songs zum Glücklichsein',
                    null,
                    facebook.buttonPostback(
                        'Lesen 📰',
                        {
                            action: 'report_start',
                            push: 4,
                            report: 254,
                            type: 'push',
                        }
                    ),
                    null,
                ),
            ], facebook.buttonPostback(
                'Reich jetzt',
                {
                    action: 'push_outro',
                    push: 4,
                })
            );
        /* .buttons(
            'Hey, alles klar bei dir? Dein Informant ist wieder hier - ' +
            'und das habe ich für dich:\n' +
    '➡ Luft in einigen NRW-Städten ist besser geworden\n' +
    '➡ Unfall löst Diskussion über selbstfahrende Autos aus\n' +
    '➡ Public Viewing wird auch nach 22 Uhr erlaubt\n' +
    '➡ Das Letzte: Deine Songs zum Glücklichsein',
            [
                facebook.buttonPostback(
                    'Leg los',
                    {
                        action: 'report_start',
                        push: 4,
                        report: 2,
                        type: 'push',
                    }),
            ]); */
    });
});
