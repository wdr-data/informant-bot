import { buttonPostback } from '../lib/facebook';
import { byCities, byZipCodes } from '../data/locationMappings';
import { handleCity as handleCityCorona } from './actionLocationCorona';
import { handleCity as handleCityWeather } from './actionLocationWeather';
import { handleCity as handleCityCandidates } from './actionLocationCandidates';
import { handleAGS as handleAGSSchools } from './actionLocationSchools';
import { newsfeedStart } from './actionNewsfeed';

export const handleLocation = async (chat, payload, options = {}) => {
    if (!payload.location.structValue) {
        return chat.sendText(chat.dialogflowResponse);
    }

    const locationDialogflow = payload.location.structValue.fields;

    console.log(`Detected location:`, locationDialogflow);

    const zipCode = locationDialogflow['zip-code'].stringValue;

    // locationDialogflow to city name
    let locationName = locationDialogflow.city.stringValue;
    if (byZipCodes[zipCode]) {
        locationName = byZipCodes[zipCode].city;
    }

    const location = byCities[locationName] && {
        ...byCities[locationName],
        zipCode: zipCode || undefined,
    };

    // If we didn't find the city, inform user about most likely cause if possible
    if (!location && (locationName || zipCode)) {
        return chat.sendText(`${
            zipCode ? `Zur Postleitzahl ${zipCode}` : `Zu ${locationName}`
        } liegen uns leider keine Daten vor.
Versuche es mal mit dem Namen deines Ortes oder mit einer anderen PLZ.
Den Service bieten wir außerdem nur für Orte in NRW.

Die Kolleg:innen von der Tagesschau bieten einen Bot mit bundesweiter PLZ-Abfrage an:
https://m.me/tagesschau`);
    } else if (!(locationName || zipCode)) {
        return chat.sendText(chat.dialogflowResponse);
    }

    // Trigger specific location feature
    if (options.type === 'corona') {
        return handleCityCorona(chat, location);
    } else if (options.type === 'weather') {
        return handleCityWeather(chat, location);
    } else if (options.type === 'schools') {
        return handleAGSSchools(chat, location.keyCity);
    } else if (options.type === 'candidates') {
        return handleCityCandidates(chat, location);
    } else if (options.type === 'regions' ) {
        return newsfeedStart(
            chat,
            payload,
            { tag: location.sophoraDistrictTag, location: location }
        );
    } else {
        return chooseLocation(chat, location);
    }
};


const chooseLocation = async (chat, location) => {
    const messageText = 'Was interessiert dich?';

    const buttonCandidates = buttonPostback(
        'Kandidatencheck',
        {
            action: 'location_candidates',
            ags: location.keyCity,
            zip: location.zipCode,
            track: {
                category: 'Feature',
                event: 'Location',
                label: 'Choose',
                subType: 'Kandidatencheck',
            },
        });

    const buttonCorona = buttonPostback(
        'Corona-Fallzahlen',
        {
            action: 'location_corona',
            ags: location.keyCity,
            track: {
                category: 'Feature',
                event: 'Location',
                label: 'Choose',
                subType: 'Corona-Fallzahlen',
            },
        });

    /*
    const buttonRegions = buttonPostback(
        'Regionale News',
        {
            action: 'location_region',
            ags: location.keyCity,
            track: {
                category: 'Feature',
                event: 'Location',
                label: 'Choose',
                subType: 'Regionale News',
            },
        });
    */

    const buttonWeather = buttonPostback(
        'Wetter',
        {
            action: 'location_weather',
            ags: location.keyCity,
            track: {
                category: 'Feature',
                event: 'Location',
                label: 'Choose',
                subType: 'Wetter',
            },
        });


    const buttons = [
        buttonCandidates,
        buttonCorona,
        buttonWeather,
    ];

    await chat.sendButtons(messageText, buttons);
};
