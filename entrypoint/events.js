import Raven from 'raven';
import RavenLambdaWrapper from 'serverless-sentry-lib';

import { getAttachmentId } from '../lib/facebookAttachments';
import schoolData from '../data/schools';
import { generateImageUrl } from '../handler/actionLocationSchools';
import { sleep } from '../lib/utils';

export const uploadSchoolImages = RavenLambdaWrapper.handler(Raven, async (event) => {
    for (const [ ags, item ] of Object.entries(schoolData)) {
        if (ags === 'nrw') {
            continue;
        }
        const url = generateImageUrl(ags);
        console.log(`Resolving ${item['name']} with URL ${url}`);
        const id = await getAttachmentId(url);
        console.log(`Resolved to: ${id}`);
        await sleep(100);
    }
});
