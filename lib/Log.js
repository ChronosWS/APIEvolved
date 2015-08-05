var Config = require('./Config');
var winston = require('winston');

Config.Load(function(config) {
    if(config.API.Debug) {
        winston.level = 'debug';
    }
});

winston.cli();
winston.add(winston.transports.File, { filename: 'api.log' });

exports.log = function(level, message) {
    if(!message) {
        message = level;
        winston.log("info", "[APIEvolved] " + message);
    } else {
        winston.log(level, "[APIEvolved] " + message);
    }
};
