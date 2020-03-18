const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');

const currentNews = require('../actionCurrentNews').default;

describe('actionCurrentNews', () => {
    it('sends a specific message with a button and quick replies', async () => {
        // 6921ba6efc959572aee6c963d0720b711c1e1abf
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
                            preview: false,
                            push: 4,
                            timing: 'evening',
                            report: 2,
                            type: 'push',
                            track: {
                                category: 'Abend-Push-Klassik',
                                event: 'Meldung',
                                label: 'Luft in einigen NRW-Städten ist besser geworden',
                                publicationDate: '2018-03-20',
                                subType: '1.Bubble',
                            },
                        }),
                    facebook.buttonPostback(
                        'Aktuelle Infos 🎧',
                        {
                            action: 'current_audio',
                            track: {
                                category: 'Abend-Push',
                                event: 'Hörfunknachrichten',
                                label: 'WDR aktuell',
                                subType: 'Audio',
                                publicationDate: '2018-03-20',
                            },
                        }),
                ],
                [
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            preview: false,
                            push: 4,
                            timing: 'evening',
                            report: 2,
                            type: 'push',
                            track: {
                                category: 'Abend-Push',
                                event: 'Meldung',
                                label: 'Luft in einigen NRW-Städten ist besser geworden',
                                publicationDate: '2018-03-20',
                                subType: '1.Bubble',
                            },
                        },
                        title: '➡ Bessere Luft',
                    },
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            preview: false,
                            push: 4,
                            timing: 'evening',
                            report: 253,
                            type: 'push',
                            track: {
                                category: 'Abend-Push',
                                event: 'Meldung',
                                label: 'Unfall löst Diskussion aus',
                                publicationDate: '2018-03-20',
                                subType: '1.Bubble',
                            },
                        },
                        title: '➡ Unfall',
                    },
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            preview: false,
                            push: 4,
                            timing: 'evening',
                            report: 251,
                            type: 'push',
                            track: {
                                category: 'Abend-Push',
                                event: 'Meldung',
                                label: 'Public Viewing wird auch nach 22 Uhr erlaubt',
                                publicationDate: '2018-03-20',
                                subType: '1.Bubble',
                            },
                        },
                        title: '➡ Public Viewing',
                    },
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            preview: false,
                            push: 4,
                            timing: 'evening',
                            report: 254,
                            type: 'push',
                            track: {
                                category: 'Abend-Push',
                                event: 'Meldung',
                                label: 'Deine Songs zum Glücklichsein',
                                publicationDate: '2018-03-20',
                                subType: '1.Bubble',
                            },
                        },
                        title: '⚗ Teste das Letzte',
                    },
                ]
            );
    });
});
