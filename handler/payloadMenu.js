import { genericElement, buttonPostback } from '../lib/facebook';

export default async function(chat) {
    const elements = [
        genericElement(
            '💌 Teilen',
            'Du findest den Service von WDRaktuell gut? Teile ihn mit deinen Freunden!',
            buttonPostback('Mehr', {
                action: 'share',
                track: {
                    category: 'payload',
                    event: 'menu',
                    label: 'Teilen',
                },
            })
        ),
        genericElement(
            '💬 Feedback',
            'Anregungen, Fragen, Kritik? Immer her damit',
            buttonPostback('Mehr', {
                action: 'contact',
                track: {
                    category: 'payload',
                    event: 'menu',
                    label: 'Feedback',
                },
            })
        ),
        genericElement(
            '🕵 WDR aktuell im Messenger.',
            'Warum gibt es diesen Service.',
            buttonPostback('Mehr', {
                action: 'faq',
                slug: 'about',
                track: {
                    category: 'payload',
                    event: 'menu',
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
                    category: 'payload',
                    event: 'menu',
                    label: 'Datenschutz (Teil 1)',
                },
            })
        ),
        genericElement(
            '📊 Datenschutz (Teil 2)',
            'Ein-/Ausschalten von Google Analytics. Außerdem erklären wir, ' +
            'wie wir Analytics datenschutzkonform einsetzen.',
            buttonPostback('Mehr', {
                action: 'analyticsPolicy',
                track: {
                    category: 'payload',
                    event: 'menu',
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
                    category: 'payload',
                    event: 'menu',
                    label: 'Impressum',
                },
            })
        ),
    ];
    return chat.sendGenericTemplate(elements);
}
