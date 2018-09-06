import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export default async (chat, payload) => {
    let url = null;
    if (payload.type === 'push' || payload.type === 'report') {
        url = `${urls.quizByReport(payload.report)}`;
    }

    if (url) {
        const quiz = await request({ uri: url, json: true });
        const option = quiz.options[quiz.options.findIndex((o) => o.id === payload.option)];
        payload.quiz = false;
        return fragmentSender(
            chat, undefined, payload, option.quiz_text, option.media);
    }
};
