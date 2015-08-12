var Config = require('./Config');
var winston = require('winston');

Config.Load(function(config) {
    if(config.API.Debug) {
        winston.level = 'debug';
    }
});

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'debug',
            filename: 'api.log',
            handleExceptions: false,
            json: true,
            maxsize: 15242880, //15MB
            maxFiles: 5,
            colorize: false
        }),
        new (winston.transports.Console)({
            level: 'info',
            timestamp: function() {
                var date = new Date();
                var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
                var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
                return date.toLocaleDateString() + " " + hours + ":" + minutes;
            },
            formatter: function(options) {
                // Return string will be passed to logger.
                return options.timestamp() +' ['+ options.level.toUpperCase() +'] '+ (undefined !== options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
            }
        })
    ],
    exitOnError: false
});

winston.add(winston.transports.File, { filename: 'api.log' });

exports.log = function(level, message) {
    if(!message) {
        message = level;
        logger.log("info", "[APIEvolved] " + message);
    } else {
        logger.log(level, "[APIEvolved] " + message);
    }
};
