/* eslint import/no-commonjs: 0 */

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
        'faq_list_of_features': require('./actionFaq').default('list_of_features'),
        'faq_onboarding': require('./actionFaq').default('onboarding'),
        'current_audio': require('./payloadCurrentAudio').default,
        'contact': require('./actionContact').contact,
        'location': require('./actionLocation').handleLocation,
        'location_corona': (chat, payload) =>
            require('./actionLocation').handleLocation(chat, payload, { type: 'corona' }),
        'location_schools': (chat, payload) =>
            require('./actionLocation').handleLocation(chat, payload, { type: 'schools' }),
        'newsfeed_corona': (chat, payload) =>
            require('./actionNewsfeed').newsfeedStart(chat, payload, { tag: 'Coronavirus' }),
        'newsfeed_curated': require('./actionNewsfeed').newsfeedStart,
        'location_region': (chat, payload) =>
            require('./actionLocation').handleLocation(chat, payload, { type: 'regions' }),
        'newsfeed_sophora_tag': require('./actionNewsfeed').handleSophoraTag,

    },
    payloads: {
        'report_start': require('./payloadReportStart').default,
        'fragment_next': require('./payloadFragmentNext').default,
        'quiz_response': require('./payloadQuizResponse').default,
        'faq': require('./payloadFaq').payloadFaq,
        'push_outro': require('./payloadPushOutro').default,
        'subscriptions': require('./payloadSubscribe').subscriptions,
        'subscribe': require('./payloadSubscribe').subscribe,
        'unsubscribe': require('./payloadSubscribe').unsubscribe,
        'share': require('./payloadShare.js').default,
        'current_news': require('./actionCurrentNews').default,
        'current_audio': require('./payloadCurrentAudio').default,
        'menu_details': require('./payloadMenu.js').default,
        'report_audio': require('./payloadAudio').default,
        'analyticsAccept': require('./payloadAnalytics').accept,
        'analyticsDecline': require('./payloadAnalytics').decline,
        'analyticsPolicy': require('./payloadAnalytics').policy,
        'analyticsChoose': require('./payloadAnalytics').choose,
        'contact': require('./actionContact').contact,
        'feedback_start': require('./actionContact').feedbackStart,
        'feedback_done': require('./actionContact').feedbackDone,
        'get_started': require('./payloadGetStarted').default,
        'survey': require('./payloadSurvey').surveyQuestions,
        'location_corona': require('./payloadLocation').handleLocationCorona,
        'location_schools': require('./payloadLocation').handleLocationSchools,
        'newsfeed_curated': require('./actionNewsfeed').newsfeedStart,
        'location_region': require('./actionNewsfeed').handleLocationRegions,
    },
};
