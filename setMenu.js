import request from 'request-promise-native';

const FB_PAGETOKEN = process.env.FB_PAGETOKEN;
const MESSENGER_PROFILE_URL = 'https://graph.facebook.com/v8.0/me/messenger_profile';

const GET_STARTED_PAYLOAD = {
    action: 'get_started',
};

const GET_STARTED_DATA = {
    'get_started':
    {
        payload: JSON.stringify(GET_STARTED_PAYLOAD),
    },
};

const greetings = [
    {
        locale: 'default',
        text: `Willkommen beim WDR aktuell Bot!\n` +
            `Hier bekommst du die wichtigsten und spannendsten Infos aus und für NRW. ` +
            `Interessiert dich ein Thema besonders, kannst du mehr darüber erfahren und ` +
            `den Bot auch danach fragen.`,
    },
];

const GREETING_DATA = {
    greeting: greetings,
};

if (FB_PAGETOKEN === undefined) {
    throw new Error("Please set 'FB_PAGETOKEN' environment variable.");
}


request.post({
    uri: MESSENGER_PROFILE_URL,
    qs: {
        'access_token': FB_PAGETOKEN,
    },
    json: true,
    body: GET_STARTED_DATA,
}).then(() => {
    console.log("Successfully set 'get started' button");
    request.post({
        uri: MESSENGER_PROFILE_URL,
        qs: {
            'access_token': FB_PAGETOKEN,
        },
        json: true,
        body: GREETING_DATA,
    }).then(() => {
        console.log('Successfully set greetings');
    }).catch((error) => {
        console.log('Setting greetings failed: ', error);
    });
}).catch((error) => {
    console.log("Setting 'get started' button failed: ", error);
});

