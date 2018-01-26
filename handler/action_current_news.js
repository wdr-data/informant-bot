const request = require('request') 

const url = `${process.env.CMS_API_URL}pushes/?limit=1`;

const current_news = fbLib => psid => {
  request(url, (error, res, body) => {
    const data = JSON.parse(body);
    console.log(data);
    const push = data.results[0];
    fbLib.sendTextMessage(psid, push.intro);
    const headlines = push.reports.map(r => r.headline).join(' +++ ');
    fbLib.sendTextMessage(psid, headlines);
  })  
}

module.exports = current_news;
