const current_time = fbLib => psid => {
    const currentdate = new Date();
    const time = currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
    fbLib.sendTextMessage(psid, `Die exakte Uhrzeit lautet: ${time}`)
}

module.exports = current_time;
