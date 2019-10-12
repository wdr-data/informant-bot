import { genericElement, buttonPostback } from '../lib/facebook';

export default async function(chat) {
    const elements = [
        genericElement(
            '💌 Teilen',
            'Du findest den Service von WDRaktuell gut? Teile ihn mit deinen Freunden!',
            buttonPostback('Mehr', {
                action: 'share',
                category: 'payload',
                event: 'menu',
                label: 'Teilen',
            })
        ),
        genericElement(
            '💬 Feedback',
            'Anregungen, Fragen, Kritik? Immer her damit',
            buttonPostback('Mehr', {
                action: 'contact',
                category: 'payload',
                event: 'menu',
                label: 'Feedback',
            })
        ),
        genericElement(
            '🕵 WDR aktuell im Messenger.',
            'Warum gibt es diesen Service.',
            buttonPostback('Mehr', {
                action: 'faq',
                slug: 'about',
                category: 'payload',
                event: 'menu',
                label: 'WDR aktuell im Messenger',
            })
        ),
        genericElement(
            '📄 Wie funktioniert das hier?',
            'Das kleine Chatbot 1x1 und ein Blick unter die Haube.',
            buttonPostback('...mehr!', {
                action: 'faq',
                slug: 'how_to',
                category: 'payload',
                event: 'menu',
                label: 'Wie funktioniert',
            })
        ),
        genericElement(
            '🛡 Datenschutz (Teil 1)',
            'Welche Daten speicher wir von Dir und wozu?',
            buttonPostback('Mehr', {
                action: 'faq',
                slug: 'datenschutz',
                category: 'payload',
                event: 'menu',
                label: 'Datenschutz (Teil 1)',
            })
        ),
        genericElement(
            '📊 Datenschutz (Teil 2)',
            'Ein-/Ausschalten von Google Analytics. Außerdem erklären wir, ' +
            'wie wir Analytics datenschutzkonform einsetzen.',
            buttonPostback('Mehr', {
                action: 'analyticsPolicy',
                category: 'payload',
                event: 'menu',
                label: 'Datenschutz (Teil 2)',
            })
        ),
        genericElement(
            '📇 Impressum',
            'Wer ist für die Inhalte verantwortlich.',
            buttonPostback('Mehr', {
                action: 'faq',
                slug: 'impressum',
                category: 'payload',
                event: 'menu',
                label: 'Impressum',
            })
        ),
    ];
    return chat.sendGenericTemplate(elements);
}
