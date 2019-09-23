import fragmentSender from '../lib/fragmentSender';

export default async (chat, payload) => {
    await chat.sendAttachment(payload.audioUrl);

    if (payload.type === 'push' || payload.type === 'report') {
        const text = 'Stand der Meldung vom DATUM EINFÜGEN';
        return fragmentSender(chat, payload.nextFragments, payload, text, '');
    }
};
