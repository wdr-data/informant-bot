
module.exports = {
    actions: {
<<<<<<< HEAD
        current_time: require('./action_current_time'),
        current_news: require('./action_current_news'),
    },
    payloads: {
        report_start: require('./payload_report_start'),
        fragment_next: require('./payload_fragment_next'),
        pushOutro: require('./payloadPushOutro'),
=======
        current_time: require('./action_current_time')(fbLib),
        current_news: require('./action_current_news')(fbLib),
        subscribe: require('./payload_subscribe')(fbLib),
    },
    payloads: {
        report_start: require('./payload_report_start')(fbLib),
        fragment_next: require('./payload_fragment_next')(fbLib),
        subscribe: require('./payload_subscribe')(fbLib),
>>>>>>> :sparkles: Trigger subscribe feature by intent and payload
    },
};
