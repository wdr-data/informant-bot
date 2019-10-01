import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export default async (chat, payload) => {
    let url = null;
    if (payload.type === 'push' || payload.type === 'report') {
        url = `${urls.quizByReport(payload.report)}`;
    }

    if (url) {
        const params = { uri: url, json: true };
        // Authorize so we can access unpublished items
        if (payload.preview) {
            params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
        }
        const options = await request(params);
        const chosenOption = options[options.findIndex((o) => o.id === payload.option)];
        payload.quiz = false;
        return fragmentSender(
            chat, undefined, payload, chosenOption.quiz_text, chosenOption.media);
    }
};
