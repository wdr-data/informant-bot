const moment = require('moment-timezone');

module.exports = function(event, checkTime = true) {
    let timing = null;

    if ('timing' in event) {
        timing = event.timing;

        if(!checkTime) {
            return timing;
        }

        // Confirm that this is the cron job for the current DST state
        const currentTime = moment.tz('Europe/Berlin');

        const currentDay = currentTime.isoWeekday();  // 1 = Monday, 7 = Sunday

        let expectedTime = null;

        if (timing === 'morning' && 1 <= currentDay <= 5) {
            expectedTime = moment(currentTime).hour(7).minute(30);
        } else if (timing === 'morning' && 6 <= currentDay <= 7) {
            expectedTime = moment(currentTime).hour(9).minute(0);
        } else if (timing === 'evening') {
            expectedTime = moment(currentTime).hour(18).minute(30);
        }

        console.log('Current time: ', currentTime);
        console.log('Expected time:', expectedTime);

        if (expectedTime &&
            !currentTime.isBetween(moment(expectedTime).subtract(5, 'minutes'), moment(expectedTime).add(5, 'minutes'))
        ) {
            throw Error("Wrong cron job for current local time");
        }
    } else if (event.queryStringParameters && 'timing' in event.queryStringParameters) {
        timing = event.queryStringParameters.timing;
    } else {
        throw new Error("Missing parameter 'timing'");
    }

    return timing;
};
