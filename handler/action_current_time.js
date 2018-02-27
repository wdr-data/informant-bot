const current_time = chat => {
    const currentdate = new Date();
    const time = currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
    chat.sendText(`Die exakte Uhrzeit lautet: ${time}`)
}

module.exports = current_time;
