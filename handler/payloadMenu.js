import { genericElement, buttonPostback } from '../lib/facebook';

export default async function(chat) {
    const elements = [
        genericElement(
            '💌 Teilen',
            'Teile diesen Service mit deinen Freunden',
            buttonPostback('Mehr', { action: 'share' })
        ),
        genericElement(
            '💬 Feedback',
            'Anregungen, Fragen, Kritik? Immer her damit',
            buttonPostback('Mehr', { action: 'contact' })
        ),
        genericElement(
            '🕵 Informant?',
            'Was ist und macht der Informant, was kann er sonst noch und wo kommt er her?',
            buttonPostback('Mehr', { action: 'faq', slug: 'about' })
        ),
        genericElement(
            '📄 Wie funktioniert das hier?',
            'Du bist ja schon im Menu, das ist viel wert. Aber es geht noch...',
            buttonPostback('...mehr!', { action: 'faq', slug: 'how_to' })
        ),
        genericElement(
            '🛡 Datenschutz',
            'Ist mir wichtig. Und ja, es ist viel zum lesen.',
            buttonPostback('Mehr', { action: 'faq', slug: 'datenschutz' })
        ),
        genericElement(
            '📊 Analytics',
            null,
            buttonPostback('Mehr', { action: 'analyticsChoose' })
        ),
        genericElement(
            '📇 Impressum',
            null,
            buttonPostback('Mehr', { action: 'faq', slug: 'impressum' })
        ),
    ];
    return chat.sendGenericTemplate(elements);
}
