const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');

const currentNews = require('../actionCurrentNews');

describe('actionCurrentNews', () => {
  it('sends a specific message with a button', () => {
    // e4d4c2941dd54f549393e9c3384e2d10900d36c7
    const chat = new facebook.Chat();
    return currentNews(chat).then(() => {
      new Expect(chat).buttons(
        'Hey, alles klar bei dir? Dein Informant ist wieder hier - und das habe ich für dich:\n' +
        '➡ Luft in einigen NRW-Städten ist besser geworden\n' +
        '➡ Unfall löst Diskussion über selbstfahrende Autos aus\n' +
        '➡ Public Viewing wird auch nach 22 Uhr erlaubt\n' +
        '➡ Das Letzte: Deine Songs zum Glücklichsein',
        [
          facebook.buttonPostback(
            'Leg los',
            {
              action: 'report_start',
              push: 4,
              report: 2,
              type: 'push',
            }),
]);
    });
  });
});
