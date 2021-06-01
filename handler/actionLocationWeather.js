import request from 'request-promise-native';
import moment from 'moment';
import 'moment-timezone';

import { zipForCity } from '../data/locationMappings';
import { capitalizeWord } from '../lib/utils';

const EXPORT_WEATHER_URL = process.env.EXPORT_WEATHER_URL;


export const handleCity = async (chat, location) => {
    chat.track({
        category: 'Feature',
        event: 'Location',
        label: 'Wetter',
        subType: location.city,
    });

    const [
        weatherCurrent,
        weatherForecast,
    ] = await Promise.all([
        getWeather(location, 'current'),
        getWeather(location, 'forecast'),
    ]);

    const { place, data: dataCurrent } = weatherCurrent;
    const { data: dataForecast } = weatherForecast;
    const dataToday = dataForecast.forecasts[0];
    const dataTomorrow = dataForecast.forecasts[1];

    const textCurrent = `So sieht das Wetter gerade in ${place.name} aus:\n${
        dataCurrent.temperature} Grad, ${dataCurrent.status.description}`;

    const textTemperaturesDay = `Die Tagestemperaturen liegen zwischen ${
        dataToday.minimumTemperature} und ${dataToday.maximumTemperature} Grad.`;

    const textStatus =
`Morgens: ${capitalizeWord(dataToday.statusMorning.description)}
Nachmittags: ${capitalizeWord(dataToday.statusAfternoon.description)}
Abends: ${capitalizeWord(dataToday.statusEvening.description)}`;

    const textNight = `In der Nacht ${dataToday.statusNight.description} und Tiefstwert ${
        dataToday.minimumTemperatureNight} Grad.`;

    const dateTomorrow = moment(
        dataTomorrow.date,
    ).tz('Europe/Berlin').format('DD.MM.YY');
    const textTomorrow = `Die Wettervorhersage für morgen, den ${dateTomorrow}:\n${
        dataTomorrow.minimumTemperature} - ${dataTomorrow.maximumTemperature} Grad, ${
        dataTomorrow.statusDay.description}`;

    const dateLastUpdate = moment(
        dataCurrent.importedAt,
    ).tz('Europe/Berlin').format('DD.MM.YY, HH:mm');
    const textLastUpdate = `Zuletzt aktualisiert: ${dateLastUpdate}`;

    const messageText = `${textCurrent}\n\n${textTemperaturesDay}\n\n${textStatus}\n\n${
        textNight}\n\n${textTomorrow}\n\n${textLastUpdate}`;

    return chat.sendText(messageText);
};

const getWeather = async (location, controller) => {
    const zip = zipForCity[location.city];
    const response = await request.get({
        uri: `${EXPORT_WEATHER_URL}${controller}/getByQuery/${zip}`,
        json: true,
    });
    return response;
};
