import { buttonUrl, genericElement } from '../lib/facebook';
import { payloadFaq } from './payloadFaq';

export default async function(chat) {
    await payloadFaq(chat, { slug: 'share' });

    const shareUrl = 'https://m.me/wdraktuell?ref=sharingmenu';
    const title ='Immer auf dem laufenden';
    const subtitle = 'Kurz und Knapp informiert';
    const button = buttonUrl('Jetzt starten', shareUrl );
    const imageUrl = 'https://images.informant.einslive.de/17f48730-e271-4bc0-b2d1-2793118d5c18.png';
    const defaultAction = {
        type: 'web_url',
        url: shareUrl,
    };
    const element = genericElement(title, subtitle, button, imageUrl, defaultAction);
    return chat.sendGenericTemplate([ element ]);
}
