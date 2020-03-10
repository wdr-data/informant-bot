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
            [ 'cg11', category ],
            [ 'cg12', action ],
            [ 'cg13', label ],
        ].filter(([ key, value ]) => !!value
        ).map(([ key, value ]) => [ key, encodeURIComponent(value) ]);
        return Object.fromEntries(customParams);
    }

    async track(params) {
        const {
            category,
            action,
            label,
            publicationDate,
            tags,
            switchOn,
            switchOff,
            recipients,
        } = params;
        const uri = `https://${TRACK_DOMAIN}/${TRACK_ID}/wt`;
        const qs = {
            'p': this.makeWebtrekkParams(category, action, label),
            'ceid': this.uuid,
            ...this.makeWebtrekkContentGroups(category, action, label),
        };

        if (publicationDate) {
            qs['cp4'] = this.formatDate(publicationDate);
        }
        if (switchOn) {
            qs['ck101'] = 1;
        }
        if (switchOff) {
            qs['ck102'] = 1;
        }
        if (recipients) {
            qs['cg14'] = recipients;
        }
        if (tags) {
            if (typeof tags === 'string') {
                qs['cp25'] = encodeURIComponent(tags);
            } else {
                qs['cp25'] = tags.map(encodeURIComponent).join(';');
            }
        }
        console.log(`tracking parameter: ${qs}`);
        return request.get({
            uri,
            qs,
        });
    }
}
