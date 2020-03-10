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
                            push: 4,
                            timing: 'evening',
                            report: 2,
                            type: 'push',
                            track: {
                                category: 'push-classic-evening-2018-03-20',
                                event: 'report-Luft in einigen NRW-Städten ist besser geworden',
                                label: 'intro',
                            },
                        }),
                    facebook.buttonPostback(
                        'Aktuelle Infos 🎧',
                        {
                            action: 'current_audio',
                            track: {
                                category: 'push-evening-2018-03-20',
                                event: 'current audio',
                                label: 'wdr aktuell',
                            },
                        }),
                ],
                [
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            push: 4,
                            timing: 'evening',
                            report: 2,
                            type: 'push',
                            track: {
                                category: 'push-evening-2018-03-20',
                                event: 'report-Luft in einigen NRW-Städten ist besser geworden',
                                label: 'intro',
                            },
                        },
                        title: '➡ Bessere Luft',
                    },
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            push: 4,
                            timing: 'evening',
                            report: 253,
                            type: 'push',
                            track: {
                                category: 'push-evening-2018-03-20',
                                event: 'report-Unfall löst Diskussion aus',
                                label: 'intro',
                            },
                        },
                        title: '➡ Unfall',
                    },
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            push: 4,
                            timing: 'evening',
                            report: 251,
                            type: 'push',
                            track: {
                                category: 'push-evening-2018-03-20',
                                event: 'report-Public Viewing wird auch nach 22 Uhr erlaubt',
                                label: 'intro',
                            },
                        },
                        title: '➡ Public Viewing',
                    },
                    {
                        imageUrl: null,
                        payload: {
                            action: 'report_start',
                            before: [],
                            push: 4,
                            timing: 'evening',
                            report: 254,
                            type: 'push',
                            track: {
                                category: 'push-evening-2018-03-20',
                                event: 'report-Das Letzte: Deine Songs zum Glücklichsein',
                                label: 'intro',
                            },
                        },
                        title: '➡ Das Letzte',
                    },
                ]
            );
    });
});
