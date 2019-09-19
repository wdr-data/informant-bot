import { genericElement, buttonPostback, buttonUrl, buttonShare } from '../lib/facebook';

export default async function(chat) {

    const elements = [
        genericElement(
            '🔧 An-/Abmelden',
            'Verwarte deine Push-Einstellungen.',
            buttonPostback('Mehr', { action: 'subscriptions' })
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
            '📇 Impressum',
            null,
            buttonPostback('Mehr', { action: 'faq', slug: 'impressum' })
        ),
    ];
    return chat.sendGenericTemplate(elements);
}
