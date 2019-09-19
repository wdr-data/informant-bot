import { buttonShare, buttonUrl, genericElement } from '../lib/facebook';

export default async function(chat) {
    const text = 'Teile den Informanten mit deinen Freunden!';
    const title = 'Schon vom 1LIVE Informanten gehört? 😎';
    const subtitle = 'Erhalte die 1LIVE News und mehr im Facebook Messenger';

    const callToAction = 'Jetzt Kontakt aufnehmen';
    const informantUrl = 'https://www.m.me/1LIVE.Informant';

    const sharedContent = [
        genericElement(
            title,
            subtitle,
            [ buttonUrl(callToAction, informantUrl) ]),
    ];
    return chat.sendButtons(text, [ buttonShare(sharedContent) ]);
}
