import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export default async (chat, payload) => {
    let url = null;
    if (payload.type === 'push' || payload.type === 'report') {
        url = `${urls.quizByReport(payload.report)}`;
    }

    if (url) {
        const options = await request({ uri: url, json: true });
        const chosenOption = options[options.findIndex((o) => o.id === payload.option)];
        payload.quiz = false;
        return fragmentSender(
            chat, undefined, payload, chosenOption.quiz_text, chosenOption.media);
    }
};
