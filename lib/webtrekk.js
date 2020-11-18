import request from 'request-promise-native';
import Raven from 'raven';

const TRACK_DOMAIN = process.env.TRACK_DOMAIN;
const TRACK_ID = process.env.TRACK_ID;
const TRACK_ORGANIZATION = process.env.TRACK_ORGANIZATION;
const TRACK_PLATFORM = process.env.TRACK_PLATFORM;
const TRACK_CHANNEL = process.env.TRACK_CHANNEL;

const TRACKING_SUSPENDED = process.env.TRACKING_SUSPENDED;

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

    makeWebtrekkParamP(category, event, label, subType) {
        const customParams = [
            TRACK_ORGANIZATION,
            TRACK_PLATFORM,
            TRACK_CHANNEL,
            category,
            event,
            label,
            subType,
        ].filter((item) => !!item
        ).map(encodeURIComponent
        ).join('_');
        return `441,${customParams}`;
    }

    makeWebtrekkContentGroups(category, event, label, subType) {
        const customParams = [
            [ 'cp31', TRACK_ORGANIZATION ],
            [ 'cp32', TRACK_PLATFORM ],
            [ 'cp33', TRACK_CHANNEL ],
            [ 'cg11', category ],
            [ 'cg12', event ],
            [ 'cg13', label ],
            [ 'cg14', subType ],
        ].filter(([ key, value ]) => !!value
        ).map(([ key, value ]) => [ key, encodeURIComponent(value) ]);
        return Object.fromEntries(customParams);
    }

    async track(params) {
        const {
            category,
            event,
            label,
            publicationDate,
            tags,
            actionSwitch,
            recipients,
            blocked,
            subType,
        } = params;
        const uri = `https://${TRACK_DOMAIN}/${TRACK_ID}/wt`;
        const qs = {
            'p': this.makeWebtrekkParamP(category, event, label, subType),
            'ceid': this.uuid,
            ...this.makeWebtrekkContentGroups(category, event, label, subType),
        };

        if (publicationDate) {
            qs['cp4'] = this.formatDate(publicationDate);
        }
        if (actionSwitch === 'on') {
            qs['ck101'] = 1;
        }
        if (actionSwitch === 'off') {
            qs['ck102'] = 1;
        }
        if (recipients) {
            qs['ck103'] = recipients;
        }
        if (blocked) {
            qs['ck104'] = blocked;
        }
        if (tags) {
            if (typeof tags === 'string') {
                qs['cp25'] = encodeURIComponent(tags);
            } else {
                qs['cp25'] = tags.map(encodeURIComponent).join(';');
            }
        }
        console.log(`tracking parameter: ${JSON.stringify(qs)}`);

        if (TRACKING_SUSPENDED) {
            return;
        }

        return request.get({
            uri,
            qs,
            timeout: 3000,
        }).catch(async (reason) => Raven.captureException(reason));
    }
}
