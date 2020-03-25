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
        cityFull.keyCity.slice(-1) === '0' ? cityFull.city : 'den Landkreis ' + cityFull.district
    }:\n${covidData.infected} positiv auf das Coronavirus getestete Menschen. Das entspricht ${
        covidData.per100k
    } Menschen pro 100.000 Einwohner. An der Krankheit Covid-19 sind bisher ${
        covidData.dead
    } gestorben.\n\nMit ${
        covidData.max.per100k
    } wurde die meisten positiven Tests pro 100.000 Einwohner in ${
        covidData.max.district
    } (${
        covidData.max.dead
    } Tote) registriert.\nDie wenigsten positiven Tests in NRW wurden in ${
        covidData.min.district
    } mit ${
        covidData.min.per100k
    } (${
        covidData.min.dead
    } Tote) pro 100.000 Einwohner gezählt.\n\n(Stand: ${
        covidData.publishedDate
    })\n\n`;
    await chat.sendText(messageText);
    return chat.sendButtons(
        `${covidText.text}`,
        [
            ddjLinkButton,
            studioLinkButton,
        ],
    );
};

export const getCovid = async (district) => {
    const response = await request.get({ uri });
    const covidData = await csvtojson({ flatKeys: true }).fromString(response);
    console.log(`CovidData First Entry: ${covidData[0]}`);

    const sorted = covidData.sort(
        (a, b) => a['Infizierte pro 100.000 Einwohner'] - b['Infizierte pro 100.000 Einwohner']
    );
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    for (const row of covidData) {
        if (row['Landkreis/ kreisfreie Stadt'] === district) {
            return {
                infected: row['Infizierte'],
                per100k: row['Infizierte pro 100.000 Einwohner'].split('.')[0],
                dead: max['Tote'],
                publishedDate: row['Stand'],
                max: {
                    district: max['Landkreis/ kreisfreie Stadt'],
                    infected: max['Infizierte'],
                    dead: max['Tote'],
                    per100k: max['Infizierte pro 100.000 Einwohner'].split('.')[0],
                },
                min: {
                    district: min['Landkreis/ kreisfreie Stadt'],
                    infected: min['Infizierte'],
                    dead: min['Tote'],
                    per100k: min['Infizierte pro 100.000 Einwohner'].split('.')[0],
                },
            };
        }
    }
    return;
};
