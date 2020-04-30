import { byCities, byStudios, byZipCodes } from '../data/locationMappings';
import { trackLink } from '../lib/utils';
import { getFaq } from './payloadFaq';
import { buttonUrl } from '../lib/facebook';

import request from 'request-promise-native';
import csvtojson from 'csvtojson';

const uriCityMAGS = 'https://coronanrw-prod.s3.eu-central-1.amazonaws.com/corona_mags_nrw.csv';
const uriNRWMAGS = 'https://coronanrw-staging.s3.eu-central-1.amazonaws.com/corona_mags_nrw_gesamt.csv';

export const handleLocation = async (chat, payload) => {
    if (!payload.location.structValue) {
        return chat.sendText(chat.dialogflowResponse);
    }
    const location = payload.location.structValue.fields;
    console.log(`Detected location: ${JSON.stringify(location)}`);
    const zipCode = location['zip-code'].stringValue;
    let city = location.city.stringValue;

    if (byZipCodes[zipCode]) {
        city = byZipCodes[zipCode].city;
    }
    if (city) {
        chat.track({
            category: 'Unterhaltung',
            event: 'Feature',
            label: 'Location',
            subType: byCities[city] ? city : `${city}-0`,
        });
    }
    if (byCities[city]) {
        return handleCity(chat, byCities[city]);
    }
    if (city || zipCode) {
        return chat.sendText(`${
            zipCode ? `Die Postleitzahl ${zipCode}` : city
        } liegt wohl nicht in NRW. Versuche es mit einer PLZ oder einem Ort aus NRW.`);
    }
    return chat.sendText(chat.dialogflowResponse);
};

export const handleCity = async (chat, cityFull) => {
    const covidText = await getFaq(`locationcovidnrw`);

    const covidDataCity = await getCovidCityMAGS(cityFull.district);
    const covidDataNRW = await getCovidNRWMAGS();

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

    const messageText = `Hier die aktuellen Corona-Fallzahlen für ${
        cityFull.keyCity.slice(-3) === '000' ? cityFull.city : 'den Landkreis ' + cityFull.district
    }:\n\tBestätigte Infektionen: ${
        covidDataCity.infected
    }\n\tGenesene: ${
        covidDataCity.recovered
    }\n\tTodesfälle: ${
        covidDataCity.dead
    }\n\tInfektionen je 100.000 Einwohner: ${
        covidDataCity.per100k
    }\n\nAktuelle Zahlen für NRW im Überblick:\n\tBestätigte Infektionen: ${
        covidDataNRW.infected
    }\n\tGenesene: ${
        covidDataNRW.recovered
    }\n\tTodesfälle: ${
        covidDataNRW.dead
    }\n\tInfektionen je 100.000 Einwohner: ${
        covidDataNRW.per100k
    }\n\n(Quelle: MAGS NRW, Stand: ${
        covidDataCity.publishedDate
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

export const getCovidCityMAGS = async (district) => {
    const response = await request.get({ uri: uriCityMAGS });
    const covidData = await csvtojson({ flatKeys: true }).fromString(response);

    const sorted = covidData.sort(
        (a, b) => a['Infizierte'] - b['Infizierte']
    );
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    for (const row of covidData) {
        if (row['Landkreis/ kreisfreie Stadt'] === district) {
            return {
                infected: row['Infizierte'],
                per100k: row['Infizierte pro 100.000'].split('.')[0],
                dead: row['Todesfälle'] || '0',
                publishedDate: row['Stand'],
                recovered: row['Genesene*'],
                max: {
                    district: max['Landkreis/ kreisfreie Stadt'],
                    infected: max['Infizierte'],
                    dead: max['Todesfälle'] || '0',
                    per100k: max['Infizierte pro 100.000'].split('.')[0],
                    recovered: max['Genesene*'],
                },
                min: {
                    district: min['Landkreis/ kreisfreie Stadt'],
                    infected: min['Infizierte'],
                    dead: min['Todesfälle'] || '0',
                    per100k: min['Infizierte pro 100.000'].split('.')[0],
                    recovered: min['Genesene*'],
                },
            };
        }
    }
    return;
};

export const getCovidNRWMAGS = async () => {
    const response = await request.get({ uri: uriNRWMAGS });
    console.log(response);
    const covidData = await csvtojson({ flatKeys: true }).fromString(response);
    console.log(covidData);
    const total = covidData[0];
    return {
        infected: total['Infizierte'],
        per100k: total['Infizierte pro 100.000'].split('.')[0],
        dead: total['Todesfälle'] || '0',
        publishedDate: total['Stand'],
        recovered: total['Genesene*'],
    };
};
