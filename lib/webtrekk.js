import request from 'request-promise-native';

const TRACK_DOMAIN = process.env.TRACK_DOMAIN;
const TRACK_ID = process.env.TRACK_ID;
const TRACK_ORGANIZATION = process.env.TRACK_ORGANIZATION;
const TRACK_PLATFORM = process.env.TRACK_PLATFORM;
const TRACK_CHANNEL = process.env.TRACK_CHANNEL;

export default class Webtrekk {
    constructor(uuid) {
        this.uuid = uuid;
        return;
    }

    formatDate(date) {
        if (typeof date === 'object') {
            return date.toISOString().split('T')[0];
        } else if (typeof date === 'string') {
            if (date.length === 10) {
                return date;
            } else {
                return date.split('T')[0];
            }
        } else {
            return date.toString();
        }
    }

    makeWebtrekkParams(category, action, label) {
        const customParams = [
            TRACK_ORGANIZATION,
            TRACK_PLATFORM,
            TRACK_CHANNEL,
            category,
            action,
            label,
        ].filter((item) => !!item
        ).map(encodeURIComponent
        ).join('_');
        return `441,${customParams}`;
    }

    makeWebtrekkContentGroups(category, action, label) {
        const customParams = [
            [ 'cg1', TRACK_ORGANIZATION ],
            [ 'cg2', TRACK_PLATFORM ],
            [ 'cg3', TRACK_CHANNEL ],
            [ 'cg4', category ],
            [ 'cg5', action ],
            [ 'cg6', label ],
        ].filter(([ key, value ]) => !!value
        ).map(([ key, value ]) => [ key, encodeURIComponent(value) ]);
        return Object.fromEntries(customParams);
    }

    async track(category, action, label, publicationDate) {
        const uri = `https://${TRACK_DOMAIN}/${TRACK_ID}/wt`;
        const qs = {
            'p': this.makeWebtrekkParams(category, action, label),
            'ceid': this.uuid,
            ...this.makeWebtrekkContentGroups(category, action, label),
        };

        if (publicationDate) {
            qs['cp4'] = this.formatDate(publicationDate);
        }
        console.log(`tracking parameter: ${qs}`);
        return request.get({
            uri,
            qs,
        });
    }
}
