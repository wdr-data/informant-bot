const request = require('request-promise-native');
const urls = require('../lib/urls');
const fragmentSender = require('../lib/fragmentSender');
const { buttonPostback, listElement } = require('../lib/facebook');

const newsAbout = (chat, payload) => {
    return searchId(payload)
        .then((id) => {
            return request({
                uri: urls.reports,
                json: true,
                qs: id,
            })
                .then((report) => {
                    if (report.length === 0) {
                        return chat.sendText(`Dazu habe ich leider keine Info...🤔`);
                    }

                    if (report.length === 1) {
                        const data = {
                            type: 'report',
                            report: report.id,
                        };
                        return chat.sendText(report[0].headline).then(() => {
                            fragmentSender(
                                chat,
                                report[0].next_fragments,
                                data,
                                report[0].text,
                                report[0].media);
                        });
                    }

                    const elements = [];
                    report.forEach((r) => {
                        elements.push(listElement(r.headline, r.text, buttonPostback(
                            'Lesen 📰',
                            {
                                action: 'report_start',
                                report: r.id,
                                type: 'report',
                            })
                        ));
                    });
                    return chat.sendList(elements.slice(0, 4));
                }).catch(() => {
                    return chat.sendText(`Dazu habe ich leider keine Info...🤔`);
                });
        });
};

const searchId = (payload) => {
    const searchParameter = [
        'genres',
        'topics',
        'tags',
    ];
    const map = {
        topics: 'topic',
        genres: 'genres',
        tags: 'tags',
    };

    return searchParameter.reduce((prev, key) => prev.catch(() => {
        if (payload[key].stringValue === '') {
            return Promise.reject();
        }
        return request({
            uri: urls[key](payload[key].stringValue),
            json: true,
        }).then((data) => {
            if (data.length === 0) {
                return Promise.reject();
            }
            return {
                [map[key]]: data[0].id,
            };
        });
    }), Promise.reject());
};

module.exports = {
    searchId,
    newsAbout,
};
