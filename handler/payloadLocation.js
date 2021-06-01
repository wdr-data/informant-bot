import { handleCity as handleCityCorona } from './actionLocationCorona';
import { handleCity as handleCityWeather } from './actionLocationWeather';
import { handleAGS as handleAGSSchools } from './actionLocationSchools';
import { byAGS } from '../data/locationMappings';

export const handleLocationCorona = async (chat, payload) => {
    const location = byAGS[payload.ags];
    return handleCityCorona(chat, location);
};

export const handleLocationSchools = async (chat, payload) => {
    return handleAGSSchools(chat, payload.ags);
};

export const handleLocationWeather = async (chat, payload) => {
    const location = byAGS[payload.ags];
    return handleCityWeather(chat, location);
};
