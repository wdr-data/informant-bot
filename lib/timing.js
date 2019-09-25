import moment from 'moment';

// Load moment plugins
import 'moment-timezone';
import 'moment-feiertage';

export default function(event, checkTime = true) {
    let timing = null;

    console.log(typeof event, event);

    if ('timing' in event) {
        timing = event.timing;

        if (!checkTime) {
            return timing;
        }

        // Confirm that this is the cron job for the current DST state
        const currentTime = moment.tz('Europe/Berlin');
        const currentDay = currentTime.isoWeekday(); // 1 -> Monday, 7 -> Sunday

        const isWeekend = 6 <= currentDay && currentDay <= 7;
        const isHoliday = currentTime.isHoliday('NRW');

        let expectedTime = null;

        console.log('Current time: ', currentTime.format('YYYY-MM-DD hh:mm:ss'));

        if (timing === 'morning') {
            if (isWeekend || isHoliday) {
                expectedTime = moment(currentTime).hour(9).minute(0).second(0).millisecond(0);
            } else {
                expectedTime = moment(currentTime).hour(7).minute(30).second(0).millisecond(0);
            }
        } else if (timing === 'evening') {
            expectedTime = moment(currentTime).hour(18).minute(30).second(0).millisecond(0);
        } else {
            return timing;
        }

        console.log('Expected time:', expectedTime);

        if (!currentTime.isBetween(
            moment(expectedTime).subtract(25, 'minutes'),
            moment(expectedTime).add(25, 'minutes'))
        ) {
            throw Error('Wrong cron job for current local time');
        }
    } else if (event.queryStringParameters && 'timing' in event.queryStringParameters) {
        timing = event.queryStringParameters.timing;
    } else {
        throw new Error("Missing parameter 'timing'");
    }

    return timing;
}
