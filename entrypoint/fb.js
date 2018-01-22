module.exports.main = (event, context, callback) => {
    console.log(event);
    callback(null, {
        statusCode: 200,
        body: 'Hallo Welt!',
    });
}