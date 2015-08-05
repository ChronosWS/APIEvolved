var fs = require('fs');
var Logger = require('./Log');

exports.Init = function(callback) {
    var self = this;
    fs.readFile(__dirname + "/../config.json", 'utf8', function(err, data) {
        data = JSON.parse(data);
        if(!err) {
            if(data.API.Secret.length == 0) {
                self.GenerateSecret(function(key) {
                    data.API.Secret = key;
                    self.Save(data, function(err, res) {
                        if(!err) {
                            data = res;
                        }
                    });
                });

                Logger.log("info", "API Secret Generated: " + data.API.Secret);
            }
            callback(data);

        } else {
            callback(false);
            console.log("Failed reading config.json: " +err.message);
            console.log("Configuration error, stopping.");
            process.exit(1);
        }
    });
};

exports.Load = function(callback) {
    var self = this;
    fs.readFile(__dirname + "/../config.json", 'utf8', function(err, data) {
        data = JSON.parse(data);
        if(!err) {
            callback(data);
        } else {
            callback(false);
            console.log("Failed reading config.json: " +err.message);
            console.log("Configuration error, stopping.");
            process.exit(1);
        }
    });
};

exports.Save = function(data, callback) {
    fs.writeFile(__dirname + "/../config.json", JSON.stringify(data, null, 4), function(err) {
        if(err) {
            console.log("Failed saving configuration: " + err.message);
            callback(false, data);
        } else {
            callback(true, data);
        }
    });
};

exports.GenerateSecret = function(callback) {
    var key = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        key += possible.charAt(Math.floor(Math.random() * possible.length));

    callback(key);
};