import request from 'request-promise-native';
import csvtojson from 'csvtojson';

import { trackLink } from '../lib/utils';
import { getFaq } from './payloadFaq';
import { buttonUrl } from '../lib/facebook';
import { byStudios } from '../data/locationMappings';


const uriCityRKI = 'https://coronanrw-prod.s3.eu-central-1.amazonaws.com/rki_ndr_districts_nrw.csv';
const uriNRWRKI = 'https://coronanrw-prod.s3.eu-central-1.amazonaws.com/rki_ndr_districts_nrw_gesamt.csv';


export const handleCity = async (chat, location) => {
    chat.track({
        category: 'Feature',
        event: 'Location',
        label: 'Corona-Fallzahlen',
        subType: location.city,
    });

    const covidText = await getFaq(`locationcovidnrw`);

    const covidDataCity = await getCovidCityRKI(location.district);
    const covidDataNRW = await getCovidNRWRKI();

    const studioUrl = await trackLink(byStudios[location.studio].linkCorona, {
        campaignType: 'unterhaltung',
        campaignName: `Corona Info Studio ${location.studio}`,
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

    let indicator = '';
    if (covidDataCity.lastSevenDaysPer100k >= 50) {
        indicator = '🟥';
    } else if (covidDataCity.lastSevenDaysPer100k >= 25) {
        indicator = '🟧';
    } else if (covidDataCity.lastSevenDaysPer100k > 10) {
        indicator = '🟨';
    }

    /* eslint-disable */
    const messageText = `Hier die aktuellen Corona-Fallzahlen für ${
        location.keyCity.slice(-3) === '000' ? location.city : 'den Landkreis ' + location.district
    }:\n\nGemeldete Infektionen in den vergangenen 7 Tagen pro 100.000 Einwohner: ${
        covidDataCity.lastSevenDaysPer100k
    } ${
        indicator
    }\nGemeldete Infektionen in den vergangenen 7 Tagen: ${
        covidDataCity.lastSevenDaysNew
    }\nBestätigte Infektionen seit Beginn: ${
        covidDataCity.infected
    }\nGenesene: ${
        covidDataCity.recovered
    }\nTodesfälle: ${
        covidDataCity.dead
    }\n\nSteigt die Zahl der Neuinfektionen in den vergangenen 7 Tagen pro 100.000 Einwohner über 50, dann muss der Ort Maßnahmen zur Eindämmung ergreifen.\n
Aktuelle Zahlen für NRW im Überblick:\nGemeldete Infektionen in den vergangenen 7 Tagen pro 100.000 Einwohner: ${
        covidDataNRW.lastSevenDaysPer100k
    }\nGemeldete Infektionen in den vergangenen 7 Tagen: ${
        covidDataNRW.lastSevenDaysNew
    }\nBestätigte Infektionen: ${
        covidDataNRW.infected
    }\nGenesene: ${
        covidDataNRW.recovered
    }\nTodesfälle: ${
        covidDataNRW.dead
    }\n\n(Quelle: RKI, Stand: ${
        covidDataCity.publishedDate
    })\n\n`;
    /* eslint-enable */

    await chat.sendText(messageText);
    return chat.sendButtons(
        `${covidText.text}`,
        [
            ddjLinkButton,
            studioLinkButton,
        ],
    );
};

export const getCovidCityRKI = async (district) => {
    const response = await request.get({ uri: uriCityRKI });
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
                lastSevenDaysNew: row['Neuinfektionen vergangene 7 Tage'],
                lastSevenDaysPer100k: row['7-Tage-Inzidenz'],
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

export const getCovidNRWRKI = async () => {
    const response = await request.get({ uri: uriNRWRKI });
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
        lastSevenDaysNew: total['Neuinfektionen vergangene 7 Tage'],
        lastSevenDaysPer100k: total['7-Tage-Inzidenz'],
    };
};
