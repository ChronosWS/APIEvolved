var request = require('request');

exports.Version = function(callback) {
    request('https://api.ark.bar/v1/version', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            data = JSON.parse(body);
            data.status = true;
            callback(data);
        } else {
            callback({status: false})
        }
    })
};