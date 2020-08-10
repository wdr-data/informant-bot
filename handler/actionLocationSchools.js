
import schoolsByAGS from '../data/schools';
import { trackLink } from '../lib/utils';
import { buttonUrl } from '../lib/facebook';

export const generateImageUrl = (ags) => `${process.env.MEDIA_BASE_URL}assets/schools/${ags}.png`;

export const handleLocation = async (chat, payload) => {
    return handleAGS(chat, payload.ags);
};

export const handleAGS = async (chat, ags) => {
    const schoolData = schoolsByAGS[ags];

    chat.track({
        category: 'Feature',
        event: 'Location',
        label: 'IFG Schule',
        subType: schoolData.name,
    });

    const schoolDataNRW = schoolsByAGS['nrw'];
    console.log(ags);
    console.log(schoolData);

    // Track featured called with city
    chat.track({
        category: 'Feature',
        event: 'Location',
        label: 'IFG Schule',
        subType: schoolData.name,
    });

    let intro = `${
        schoolData.name
    } hat als eine von 87 Kommunen nicht auf unsere IFG-Anfrage geantwortet.`;
    let allDevice = ``;
    let fiber = '';

    if (schoolData.responded) {
        intro = `In ${
            schoolData.name
        } gehen ${
            schoolData.numStudentsTotal
        } Schüler*innen auf ${
            schoolData.numSchoolsTotal === 1 ?
                `eine Schule` : `${schoolData.numSchoolsTotal} Schulen`
        }.`;

        const noDevice = [];
        const noAnswer = [];
        const device = [];
        if (schoolData.answeredDevices) {
            for (const [ keys, values ] of [
                [
                    [ 'studentsPerLaptop', 'laptopsPer100' ],
                    [ 'Laptops', 'Schüler*innen einen Laptop' ],
                ],
                [
                    [ 'studentsPerTablet', 'tabletsPer100' ],
                    [ 'Tablets', 'Schüler*innen ein Tablet' ],
                ],
                [
                    [ 'studentsPerDesktop', 'desktopsPer100' ],
                    [ 'Desktoprechner', 'Schüler*innen einen Desktoprechner' ],
                ],
                [
                    [ 'studentsPerWhiteboard', 'whiteboardsPer100' ],
                    [ 'Whiteboards', 'Schüler*innen ein Whiteboard' ],
                ],
            ]) {
                const [ perDeviceKey, perStudentKey ] = keys;
                const [ name, studentName ] = values;

                if (schoolData[perDeviceKey] !== null) {
                    device.push(`${schoolData[perDeviceKey]} ${studentName}`);
                } else if (schoolData[perStudentKey] !== null) {
                    noDevice.push(name);
                } else {
                    noAnswer.push(name);
                }
            }
            if (device.length) {
                allDevice += 'An den Schulen teilen sich im Schnitt\n' + device.join(',\n') + '.';
            }
            if (noAnswer.length) {
                allDevice += '\nZu ' + noAnswer.join(', ') + ' wurden keine Angaben gemacht.';
            }
            if (noDevice.length) {
                allDevice += '\n' + noDevice.join(', ') + ' sind keine vorhanden.';
            }
        } else {
            allDevice = `Leider hat ${
                schoolData.name
            } keine Angaben zu digitalen Geräten an den Schulen gemacht.`;
        }
        allDevice += `\n\nIm Vergleich dazu teilen sich in ganz NRW\n${
            schoolDataNRW.studentsPerLaptop
        } Schüler*innen einen Laptop,\n${
            schoolDataNRW.studentsPerTablet
        } Schüler*innen ein Tablet,\n${
            schoolDataNRW.studentsPerDesktop
        } Schüler*innen einen Desktoprechner,\n${
            schoolDataNRW.studentsPerWhiteboard
        } Schüler*innen ein Whiteboard.\n`;

        if ( schoolData.couldEvaluateFiber ) {
            fiber = `${
                schoolData.numSchoolsFiber
            } von ${
                schoolData.numSchoolsTotal
            } Schulen haben einen Glasfaseranschluss (> 100 MBit/s).`;
        } else if (schoolData.answeredFiber) {
            fiber = `Leider konnte die Antwort von ${
                schoolData.name
            } bezüglich des Glasfaseranschluss an Schulen nicht ausgewertet werden.`;
        }
        fiber += `\nIm Schnitt ist in NRW jede dritte Schule ans Glasfasernetz angeschlossenen.`;
    }

    const outro = `\nFür die Daten hat das WDR Newsroom-Team ` +
        `alle 396 Kommunen in NRW im Juli 2020 per IFG angefragt.`;

    const ddjUrl = trackLink(
        'https://www1.wdr.de/nachrichten/digitalisierung-schulen-umfrage-kommunen-100.html', {
            campaignType: 'unterhaltung',
            campaignName: `Zahlen Digitalisierung Schulen`,
            campaignId: 'feature',
        });

    const caption = `${intro}\n\n${allDevice}\n${fiber}`;

    /*
    const caption = Object.entries(schoolData).map(
        ([ k, v ]) => `<b>${escapeHTML(k.toString())}:</b> ${escapeHTML(v.toString())}`
    ).join('\n');
    */

    const imageUrl = generateImageUrl(ags);
    const ddjButton = buttonUrl('🔗 Weitere Ergebnisse', ddjUrl);

    await chat.sendAttachment(imageUrl);
    await chat.sendText(caption);
    return chat.sendButtons(outro, [ ddjButton ]);
};
