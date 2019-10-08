import request from 'request-promise-native';

const FB_PAGETOKEN = process.env.FB_PAGETOKEN;
const MESSENGER_PROFILE_URL = 'https://graph.facebook.com/v4.0/me/messenger_profile';

const GET_STARTED_PAYLOAD = {
    action: 'get_started',
};

const MENU_ACTIONS = [
    {
        title: '📰 Gib mir die Infos',
        type: 'postback',
        payload: JSON.stringify({ action: 'current_news' }),
    },
    {
        title: '🔧 An-/Abmelden',
        type: 'postback',
        payload: JSON.stringify({ action: 'subscriptions' }),
    },
    {
        title: '🤟 Mehr',
        type: 'postback',
        payload: JSON.stringify({ action: 'menu_details' }),
    },
];


const PERSISTENT_MENU_DATA = {
    'persistent_menu':
        [
            {
                locale: 'default',
                'call_to_actions': MENU_ACTIONS,
            },
        ],
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
        text: `Hier sind Deine Nachrichten von WDR aktuell.
Die wichtigsten und spannendsten Themen aus und für Nordrhein-Westfalen, damit Du mitreden kannst.
        `,
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
        body: PERSISTENT_MENU_DATA,
    }).then(() => {
        console.log('Successfully set persistent menu');
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
        console.log('Setting persistent menu failed: ', error);
    });
}).catch((error) => {
    console.log("Setting 'get started' button failed: ", error);
});

