import { buttonPostback } from '../lib/facebook';


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

    const candidates = wahlkreis.kandidaten.map((c) => {
        return `  • ${c.vorname} ${c.nachname}, ${c.partei}`;
    });

    const moreUrl = `https://www1.wdr.de//kandidatencheck/2021/wdr-bundestagswahl/app/kandidatencheck144.html?wahlkreisid=${wahlkreis.id}&wt_mc=fb`;

    const text = `In deinem Wahlkreis „${
        wahlkreis.wahlkreisName
    }“ stellen sich diese Direkt-Kandidat:innen zur Wahl:\n\n${
        candidates.join('\n')
    }\n\nHier beantworten Kandidat:innen in Drei-Minuten-Videos Fragen zu Wahlkampf-Themen: ${
        moreUrl
    }`;

    const imageUrl = 'https://images.informant.einslive.de/MicrosoftTeams-image-0fd5c975-6c55-4f78-a49d-4cdd6bc4109b.png';

    await chat.sendAttachment(imageUrl);
    return chat.sendText(text);
};
