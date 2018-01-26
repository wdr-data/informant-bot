const fbLibInit = require('../lib/facebook');
const fbLib = fbLibInit();

module.exports = {
    actions: {
        current_time: require('./action_current_time')(fbLib),
    },
}
