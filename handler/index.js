
module.exports = {
    actions: {
        current_time: require('./action_current_time'),
        current_news: require('./action_current_news'),
    },
    payloads: {
        report_start: require('./payload_report_start'),
        fragment_next: require('./payload_fragment_next'),
    },
    menu: {
        onboarding: require('./payload_faq'),
        how_to: require('./payload_faq'),
        about: require('./payload_faq'),
        impressum: require('./payload_faq'),
        datenschutz: require('./payload_faq'),
    }
};
