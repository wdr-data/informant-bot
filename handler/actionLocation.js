import moment from 'moment';
import 'moment-timezone';

import { buttonPostback } from '../lib/facebook';
import { byCities, byZipCodes } from '../data/locationMappings';
import { handleCity as handleCityCorona } from './actionLocationCorona';
import { handleAGS as handleAGSSchools } from './actionLocationSchools';

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

    const location = byCities[locationName];

    // If we didn't find the city, inform user about most likely cause if possible
    if (!location && (locationName || zipCode)) {
        return chat.sendText(`${
            zipCode ? `Die Postleitzahl ${zipCode}` : locationName
        } liegt wohl nicht in NRW. Versuche es mit einer PLZ oder einem Ort aus NRW.`);
    } else if (!(locationName || zipCode)) {
        return chat.sendText(chat.dialogflowResponse);
    }

    // Feature is not Public before
    if (moment.tz('Europe/Berlin').isBefore(moment.tz('2020-08-11 06:00:00', 'Europe/Berlin'))) {
        return handleCityCorona(chat, location);
    }

    // Trigger specific location feature
    if (options.type === 'corona') {
        return handleCityCorona(chat, location);
    } else if (options.type === 'schools') {
        return handleAGSSchools(chat, location.keyCity);
    } else {
        return chooseLocation(chat, location);
    }
};


const chooseLocation = async (chat, location) => {
    const messageText = 'Was interessiert dich?';

    const buttonSchool = buttonPostback(
        'Schulumfrage',
        {
            action: 'location_schools',
            ags: location.keyCity,
            track: {
                category: 'Feature',
                event: 'Location',
                label: 'Choose',
                subType: 'Schulumfrage',
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

    const buttons = [
        buttonCorona,
        buttonSchool,
    ];

    await chat.sendButtons(messageText, buttons);
};
