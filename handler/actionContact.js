import DynamoDbCrud from '../lib/dynamodbCrud';
import { getFaq, payloadFaq } from './payloadFaq';
import { buttonPostback } from '../lib/facebook';

export async function contact(chat) {
    const contact = await getFaq('contact', true);

    const buttons = [
        buttonPostback(
            'Feedback zum Service',
            {
                action: 'feedback_start',
                track: {
                    category: 'Menüpunkt',
                    event: 'Feebdack-Menü',
                    label: 'Kontakt aufnehmen',
                },
            },
        ),
        buttonPostback(
            'Thema vorschlagen',
            {
                action: 'faq',
                slug: 'yes_to_contact',
                track: {
                    category: 'Menüpunkt',
                    event: 'Feedback-Menü',
                    label: 'Thema vorschlagen',
                },
            },
        ),
        buttonPostback(
            'Einfach Danke sagen',
            {
                action: 'faq',
                slug: 'no_to_contact',
                track: {
                    category: 'Menüpunkt',
                    event: 'Feedback-Menü',
                    label: 'Danke sagen',
                },
            },
        ),
    ];

    return chat.sendFullNewsBaseWithButtons(contact, buttons);
}

export async function feedbackStart(chat, payload) {
    // start 1 hours of feedback conversation
    const lastDefaultReplies = new DynamoDbCrud(process.env.DYNAMODB_LASTDEFAULTREPLIES, 'psid');
    const ttl = Math.floor(Date.now() / 1000) + 1*60*60;
    try {
        await lastDefaultReplies.create(chat.psid, { ttl });
        console.log('Enable feedback mode.');
    } catch (e) {
        await lastDefaultReplies.update(chat.psid, 'ttl', ttl);
    }

    return payloadFaq(chat, { slug: 'feedback_start' });
}

export async function feedbackMode(chat) {
    const feedbackMode = await getFaq('feedback_mode', true);

    const buttons = [
        buttonPostback(
            'Alles gesagt, danke!',
            {
                action: 'feedback_done',
                track: {
                    category: 'Menüpunkt',
                    event: 'Feedback-Menü',
                    label: 'Feedback-Beendet',
                },
            },
        ),
    ];

    return chat.sendFullNewsBaseWithButtons(feedbackMode, buttons);
}

export async function feedbackDone(chat) {
    const lastDefaultReplies = new DynamoDbCrud(process.env.DYNAMODB_LASTDEFAULTREPLIES, 'psid');
    await lastDefaultReplies.remove(chat.psid);
    console.log('Disable feedback mode.');
    return payloadFaq(chat, { slug: 'feedback_done' });
}

export async function contactWithLink(chat) {
    return payloadFaq(chat, { slug: 'feedback_msg_with_link' });
}
