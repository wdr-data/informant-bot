import { genericElement, buttonPostback } from '../lib/facebook';

export default async function(chat) {
    const elements = [
        genericElement(
            '🕵 WDR aktuell im Messenger.',
            'Warum gibt es diesen Service.',
            buttonPostback('Mehr', {
                action: 'faq',
                slug: 'about',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'WDR aktuell im Messenger',
                },
            })
        ),
        genericElement(
            '🛡 Datenschutz (Teil 1)',
            'Welche Daten speichern wir von Dir und wozu?',
            buttonPostback('Mehr', {
                action: 'faq',
                slug: 'datenschutz',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'Datenschutz (Teil 1)',
                },
            })
        ),
        genericElement(
            '📊 Datenschutz (Teil 2)',
            'Ein-/Ausschalten von von Mapp Intelligence (Webtrekk). Außerdem erklären wir, ' +
            'wie wir Tracking datenschutzkonform einsetzen.',
            buttonPostback('Mehr', {
                action: 'analyticsPolicy',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'Datenschutz (Teil 2)',
                },
            })
        ),
        genericElement(
            '📇 Impressum',
            'Wer ist für die Inhalte verantwortlich.',
            buttonPostback('Mehr', {
                action: 'faq',
                slug: 'impressum',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'Impressum',
                },
            })
        ),
    ];
    return chat.sendGenericTemplate(elements);
}
