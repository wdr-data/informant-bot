
module.exports = {
    actions: {
        current_time: require('./action_current_time'),
        current_news: require('./action_current_news'),
        subscriptions: require('./payload_subscribe').subscriptions,
    },
    payloads: {
        report_start: require('./payload_report_start'),
        fragment_next: require('./payload_fragment_next'),
        faq: require('./payload_faq'),
        pushOutro: require('./payloadPushOutro'),
        subscriptions: require('./payload_subscribe').subscriptions,
        subscribe: require('./payload_subscribe').subscribe,
        unsubscribe: require('./payload_subscribe').unsubscribe,
        share: require('./payload_share.js'),
        current_news: require('./action_current_news'),
    },
};
