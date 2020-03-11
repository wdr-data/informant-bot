import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export default async (chat, payload) => {
    let url = null;
    if (payload.type === 'push' || payload.type === 'report') {
        url = `${urls.reportFragment(payload.fragment)}?withNext=yes`;
    } else if (payload.type === 'faq') {
        url = `${urls.faqFragment(payload.fragment)}?withNext=yes`;
    }

    if (url) {
        const params = { uri: url, json: true };
        // Authorize so we can access unpublished items
        if (payload.preview) {
            params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
        }
        let fragment = await request(params);

        if (fragment.isArray) {
            fragment = fragment[0];
        }

        return fragmentSender(
            chat, fragment.next_fragments, payload, fragment.text, fragment.attachment);
    }
};
