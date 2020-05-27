import DynamoDbCrud from '../lib/dynamodbCrud';
import { getFaq } from './payloadFaq';
import { buttonPostback } from '../lib/facebook';
import surveyData from '../data/surveyQuestions';


export async function startSurvey(chat) {
    const unsubscribedSurvey = await getFaq('unsubscribed-survey', true);

    const userStates = new DynamoDbCrud(process.env.DYNAMODB_USERSTATES, 'psid');
    try {
        await userStates.create(chat.psid, { 'surveyTime': Math.floor( Date.now()/1000 ) } );
        console.log('Enable survey mode.');
    } catch (e) {
        await userStates.update(chat.psid, 'surveyTime', Math.floor( Date.now()/1000 ) );
        console.log('Update survey mode');
    }

    await chat.sendFullNewsBase(unsubscribedSurvey);
    return surveyQuestions(chat, { 'nextStep': 0 } );
}

export async function surveyQuestions(chat, payload) {
    if (payload.nextStep === surveyData.length) {
        return chat.sendFullNewsBase(
            await getFaq('unsubscribed-survey-done', true)
        );
    }
    const survey = surveyData[payload.nextStep];
    console.log(survey);
    let buttons = [];
    survey.answers.map(
        (answer) => buttons.push(
            buttonPostback(
                answer,
                {
                    action: 'survey',
                    nextStep: payload.nextStep + 1,
                    track: {
                        category: 'Umfrage',
                        event: 'Abmelden',
                        label: survey.question,
                        subType: answer,
                    },
                }
            )
        )
    );

    return chat.sendButtons(
        survey.question,
        buttons,
    );
}


