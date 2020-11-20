import moment from 'moment';
import 'moment-timezone';

import { buttonPostback } from '../lib/facebook';
import { byCities, byZipCodes } from '../data/locationMappings';
import { handleCity as handleCityCorona } from './actionLocationCorona';
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

    let buttonText = 'Regionale News';
    if (moment.now() - moment('2020-11-21')< 7*24*60*60*1000) {
        buttonText = '✨Neu✨ ' + buttonText;
    }
    const buttonRegions = buttonPostback(
        buttonText,
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


    const buttons = [
        buttonCorona,
        buttonRegions,
        buttonSchool,
    ];

    await chat.sendButtons(messageText, buttons);
};
