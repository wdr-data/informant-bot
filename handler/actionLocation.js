import { byCities, byStudios, byZipCodes } from '../data/locationMappings';
import { trackLink } from '../lib/utils';
import { getFaq } from './payloadFaq';
import { buttonUrl } from '../lib/facebook';

import request from 'request-promise-native';
import csvtojson from 'csvtojson';

const uri = 'https://covid19nrw.netlify.com/.netlify/functions/get_nrw';

export const handleLocation = async (chat, payload) => {
    const location = payload.location.structValue.fields;
    console.log(`Detected location: ${JSON.stringify(location)}`);
    let messageText = chat.dialogflowResponse;
    const zipCode = location['zip-code'].stringValue;
    let city = location.city.stringValue;

    if (byZipCodes[zipCode]) {
        city = byZipCodes[zipCode].city;
    }
    if (city) {
        chat.track({
            category: 'Unterhaltung',
            event: 'Dialogflow',
            label: 'Location-Feature',
            subType: city,
        });
    }
    if (byCities[city]) {
        return handleCity(chat, byCities[city]);
    }
    if (city || zipCode) {
        return chat.sendText(`${
            zipCode ? `Die Postleitzahl ${zipCode}` : city
        } liegt wohl nicht in NRW. Versuche es mit einer PLZ, einem Ort oder einer Stadt aus NRW.`);
    }
    return chat.sendText(messageText);
};

export const handleCity = async (chat, cityFull) => {
    const covidText = await getFaq(`locationcovidnrw`);

    const covidData = await getCovid(cityFull.district);

    const studioUrl = await trackLink(byStudios[cityFull.studio].linkCorona, {
        campaignType: 'unterhaltung',
        campaignName: `Corona Info Studio ${cityFull.studio}`,
        campaignId: 'covid',
    });
    const studioLinkButton = buttonUrl('🔗 Corona-Spezial', studioUrl);

    const ddjUrl = await trackLink(
        'https://www1.wdr.de/nachrichten/themen/coronavirus/corona-daten-nrw-100.html', {
            campaignType: 'unterhaltung',
            campaignName: `Zahlen Corona-Krise NRW`,
            campaignId: 'covid',
        });
    const ddjLinkButton = buttonUrl('🔗 Fallzahlen - NRW', ddjUrl);

    const messageText = `Hier die aktuellen Zahlen für ${
        cityFull.city
    }${
        cityFull.keyCity.slice(-1) === '0' ? '' : ' im Landkreis ' + cityFull.district
    }:\n${covidData.infected} positiv auf Covid19 getestete Menschen. Das sind ${
        covidData.per100k
    } Menschen pro 100.000 Einwohner.\n\nMit ${
        covidData.max.per100k
    } wurde die meisten positiven Tests pro 100.000 Einwohner in ${
        covidData.max.district
    } registriert.\nDie wenigsten positiven Tests in NRW wurden in ${
        covidData.min.district
    } mit ${
        covidData.min.per100k
    } pro 100.000 Einwohner gezählt.\n\n(Stand: ${
        covidData.publishedDate
    })\n\n`;

    return chat.sendButtons(
        `${messageText}\n${covidText.text}`,
        [
            ddjLinkButton,
            studioLinkButton,
        ],
    );
};

export const getCovid = async (district) => {
    const response = await request.get({ uri });
    console.log(response);
    const covidData = await csvtojson({ flatKeys: true }).fromString(response);
    console.log(covidData);

    const sorted = covidData.sort(
        (a, b) => a['Infizierte pro 100.000 Einwohner'] - b['Infizierte pro 100.000 Einwohner']
    );
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    for (const row of covidData) {
        if (row['Landkreis/Kreisfreie Stadt'] === district) {
            return {
                infected: row['Bestätigte Fälle'],
                per100k: row['Infizierte pro 100.000 Einwohner'].split('.')[0],
                publishedDate: row['Stand'],
                max: {
                    district: max['Landkreis/Kreisfreie Stadt'],
                    infected: max['Bestätigte Fälle'],
                    per100k: max['Infizierte pro 100.000 Einwohner'].split('.')[0],
                },
                min: {
                    district: min['Landkreis/Kreisfreie Stadt'],
                    infected: min['Bestätigte Fälle'],
                    per100k: min['Infizierte pro 100.000 Einwohner'].split('.')[0],
                },
            };
        }
    }
    return;
};
