import DynamoDbCrud from '../lib/dynamodbCrud';
import payloadFaq from './payloadFaq';
import { getFaq } from './payloadFaq';
import { buttonPostback } from '../lib/facebook';

export async function contact(chat) {
    const contact = await getFaq('contact', true);

    const buttons = [
        buttonPostback(
            'Feedback zum Service',
            { action: 'feedback_start' },
        ),
        buttonPostback(
            'Feedback zur Meldung',
            { action: 'faq', slug: 'yes_to_contact' },
        ),
        buttonPostback(
            'Einfach Danke sagen',
            { action: 'faq', slug: 'no_to_contact' },
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
            { action: 'feedback_done' },
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
