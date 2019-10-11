import { genericElement, buttonPostback } from '../lib/facebook';

export default async function(chat) {
    const elements = [
        genericElement(
            '💌 Teilen',
            'Du findest den Service von WDRaktuell gut? Teile ihn mit deinen Freunden!',
            buttonPostback('Mehr', { action: 'share' })
        ),
        genericElement(
            '💬 Feedback',
            'Anregungen, Fragen, Kritik? Immer her damit',
            buttonPostback('Mehr', { action: 'contact' })
        ),
        genericElement(
            '🕵 WDR aktuell im Messenger.',
            'Warum gibt es diesen Service.',
            buttonPostback('Mehr', { action: 'faq', slug: 'about' })
        ),
        genericElement(
            '📄 Wie funktioniert das hier?',
            'Das kleine Chatbot 1x1 und ein Blick unter die Haube.',
            buttonPostback('...mehr!', { action: 'faq', slug: 'how_to' })
        ),
        genericElement(
            '🛡 Datenschutz (Teil 1)',
            'Welche Daten speicher wir von Dir und wozu?',
            buttonPostback('Mehr', { action: 'faq', slug: 'datenschutz' })
        ),
        genericElement(
            '📊 Datenschutz (Teil 2)',
            'Ein-/Ausschalten von Google Analytics. Außerdem erklären wir, ' +
            'wie wir Analytics datenschutzkonform einsetzen.',
            buttonPostback('Mehr', { action: 'analyticsPolicy' })
        ),
        genericElement(
            '📇 Impressum',
            'Wer ist für die Inhalte verantwortlich.',
            buttonPostback('Mehr', { action: 'faq', slug: 'impressum' })
        ),
    ];
    return chat.sendGenericTemplate(elements);
}
