import request from 'request-promise-native';
import { buttonPostback } from '../lib/facebook';


import urls from '../lib/urls';
import wahlkreisById from '../data/wahlkreisById';
import wahlkreiseByCity from '../data/wahlkreiseByCity';
import wahlkreiseByZip from '../data/wahlkreiseByZip';


export const handleCity = async (chat, location) => {
    let wahlkreisIds;

    if (location.zipCode) {
        wahlkreisIds = wahlkreiseByZip[location.zipCode].wahlkreise;
    } else {
        wahlkreisIds = wahlkreiseByCity[location.keyCity].wahlkreise;
    }

    const wahlkreise = wahlkreisIds.map((wahlkreisId) => wahlkreisById[wahlkreisId]);

    if (wahlkreise.length === 1) {
        return handleWahlkreis_(chat, wahlkreise[0].id);
    } else if (wahlkreise.length === 0) {
        throw new Error('No wahlkreis found');
    }

    const buttons = wahlkreise.map((wahlkreis) =>
        buttonPostback(
            wahlkreis.wahlkreisName,
            {
                action: 'location_candidates_wk',
                wahlkreis: wahlkreis.id,
                track: {
                    category: 'Feature',
                    event: 'Kandidatencheck',
                    label: 'Choose-Wahlkreis',
                    subType: wahlkreis.name,
                },
            },
        )
    );

    const messageText = `Wähle deinen Wahlkreis:`;
    return chat.sendButtons(messageText, buttons.slice(0, 3));
};


export const handleWahlkreis = async (chat, payload) => {
    return handleWahlkreis_(chat, payload.wahlkreis);
};


const handleWahlkreis_ = async (chat, wahlkreisId) => {
    const wahlkreis = wahlkreisById[wahlkreisId];

    const response = await request.get({
        uri: urls.candidatesByWahlkreisId(wahlkreis.id),
        json: true,
    });

    const candidates = response.data.map((c) => {
        return `${c.kandidatVorname} ${c.kandidatName}, ${c.kandidatPartei}`;
    });

    const moreUrl = `https://www1.wdr.de//kandidatencheck/2021/wdr-bundestagswahl/app/kandidatencheck144.html?wahlkreisid=${wahlkreis.id}`;

    const text = `In deinem Wahlkreis „${
        wahlkreis.wahlkreisName
    }“ stellen sich diese Direkt-Kandidat:innen zur Wahl:\n\n${
        candidates.join('\n')
    }\n\nHier beantworten Kandidat:innen in Drei-Minuten-Videos Fragen zu Wahlkampf-Themen: ${
        moreUrl
    }`;

    return chat.sendText(text);
};
