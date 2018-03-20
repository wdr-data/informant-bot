const request = require('request-promise-native');
const urls = require('../lib/urls');
const fragmentSender = require('../lib/fragmentSender');
const { buttonPostback, listElement } = require('../lib/facebook');

const news_about = (chat, payload) => {
    console.log(`Dialogflow Payload:`, payload);
    search_id(payload).then(id => {
        console.log(id);
        request({
            uri: urls.reports,
            json: true,
            qs: id,
         }).then(report => {
            if (report.length === 0) {
                chat.sendText(`Dazu habe ich leider keine Info...🤔`)
            }
            else if (report.length === 1) {
                payload.type = 'report';
                chat.sendText(report[0].headline);
                fragmentSender(chat, report[0].next_fragments, payload, report[0].text, report[0].media);
            } else {
                const elements = [];
                report.forEach(r => {
                    elements.push(listElement(r.headline, r.text, buttonPostback(
                        'Lesen 📰', 
                        {
                            action: 'report_start',
                            report: r.id,
                            type: 'report',
                        })
                    ));
                })
                chat.sendList(elements);
            }
         }).catch(error => {
             console.log(error);
         });
    }).catch(() => {
        chat.sendText(`Dazu habe ich leider keine Info...🤔`)
    });
}

const search_id = payload => {
    const search_parameter = [
        'genres',
        'topics',
        'tags',
    ]
    const map = {
        topics: 'topic',
        genres: 'genres',
        tags: 'tags',
    }

    return search_parameter.reduce((prev, key) => prev.catch(() => {
        if (payload[key].stringValue === '') {
            return Promise.reject();
        }
        return request({
            uri: urls[key](payload[key].stringValue),
            json: true,
        }).then(data => {
            if (data.length === 0) {
                return Promise.reject();
            }
            return {
                [map[key]]: data[0].id,
            };
        }).catch(error => {
            console.log(error);
        });
    }), Promise.reject());
}

module.exports = {
    search_id,
    news_about,
};
