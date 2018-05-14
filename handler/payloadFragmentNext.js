import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

const fragmentNext = async (chat, payload) => {
    let url = null;
    if (payload.type === 'push' || payload.type === 'report') {
        url = `${urls.reportFragment(payload.fragment)}?withNext=yes`;
    } else if (payload.type === 'faq') {
        url = `${urls.faqFragment(payload.fragment)}?withNext=yes`;
    }

    if (url) {
        let fragment = await request({ uri: url, json: true });
        if (fragment.isArray) {
            fragment = fragment[0];
        }

        return fragmentSender(
            chat, fragment.next_fragments, payload, fragment.text, fragment.media);
    }
};

module.exports = fragmentNext;
