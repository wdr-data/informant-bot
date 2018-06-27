const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');

const currentNews = require('../actionCurrentNews').default;

describe('actionCurrentNews', () => {
    it('sends a specific message with a button and quick replies', async () => {
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
                    facebook.buttonPostback(
                        'Aktuelle Infos 🎧',
                        {
                            action: 'current_audio',
                        }),
                ],
                [
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            push: 4,
                            report: 2,
                            type: 'push',
                        },
                        title: 'Luft in einigen NRW-Städten ist besser geworden',
                    },
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            push: 4,
                            report: 253,
                            type: 'push',
                        },
                        title: 'Unfall löst Diskussion über selbstfahrende Autos aus',
                    },
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            push: 4,
                            report: 251,
                            type: 'push',
                        },
                        title: 'Public Viewing wird auch nach 22 Uhr erlaubt',
                    },
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            push: 4,
                            report: 254,
                            type: 'push',
                        },
                        title: 'Das Letzte: Deine Songs zum Glücklichsein',
                    },
                ]
            );
    });
});
