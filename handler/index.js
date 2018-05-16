
export default {
    actions: {
        'current_time': require('./actionCurrentTime').default,
        'current_news': require('./actionCurrentNews').default,
        'subscriptions': require('./payloadSubscribe').subscriptions,
        'news_about': require('./actionNewsAbout').newsAbout,
        'share': require('./payloadShare.js').default,
        'faq_data_protection': require('./actionFaq').default('datenschutz'),
        'faq_imprint': require('./actionFaq').default('impressum'),
        'faq_how_to': require('./actionFaq').default('how_to'),
        'faq_about': require('./actionFaq').default('about'),
        'faq_onboarding': require('./actionFaq').default('onboarding'),
    },
    payloads: {
        'report_start': require('./payloadReportStart').default,
        'fragment_next': require('./payloadFragmentNext').default,
        'faq': require('./payloadFaq').default,
        'push_outro': require('./payloadPushOutro').default,
        'subscriptions': require('./payloadSubscribe').subscriptions,
        'subscribe': require('./payloadSubscribe').subscribe,
        'unsubscribe': require('./payloadSubscribe').unsubscribe,
        'share': require('./payloadShare.js').default,
        'current_news': require('./actionCurrentNews').default,
    },
};
