var later = require('later');
later.date.localTime();

var Config = require('./Config');
var Logger = require('./Log');
var RCON   = require('./RCON');
var Server = null;

var timers = [];

exports.Init = function(server) {
    Server = server;
    Config.Load(function(config) {

        // Schedule Defined Restarts
        config.Server.Scheduler.Restart.forEach(function(time) {

            var schedule = later.parse.text('at '+time);
            var timer = {
                action: "Restart",
                time: time,
                data: null,
                later: null
            };
            timers.push(timer);
            var id = timers.length-1;
            Logger.log('info', '[Scheduler] Task ID: ' + id + ' added, Action: ' + timers[id].action + ' @ ' + timers[id].time);
            timers[id].later = later.setInterval(function() {
                Logger.log('info', '[Scheduler] Task ID: ' + id + ' started, Action: ' + timers[id].action + ' @ ' + timers[id].time);
                Server.StopNice("Automated restart", function() {
                    Server.Start(function(game) {
                        var date = new Date();
                        var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
                        var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
                        Logger.log('info', '[Scheduler] Task ID: ' + id + ' completed, Action: ' + timers[id].action + ' @ ' + timers[id].time + ' was completed at ' + hours + ':' + minutes);
                    });
                });
            }, schedule);

        });

        config.Server.Scheduler.Broadcast.forEach(function(broadcast) {
            var schedule = later.parse.text('at '+broadcast.time);
            var timer = {
                action: "Broadcast",
                time: broadcast.time,
                data: broadcast.message,
                later: null
            };
            timers.push(timer);
            var id = timers.length-1;
            Logger.log('info', '[Scheduler] Task ID: ' + id + ' added, Action: ' + timers[id].action + ' @ ' + timers[id].time);
            timers[id].later = later.setInterval(function() {
                Logger.log('info', '[Scheduler] Task ID: ' + id + ' started, Action: ' + timers[id].action + ' @ ' + timers[id].time);
                RCON.Command("broadcast " + timers[id].data, function(res) {
                    var date = new Date();
                    var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
                    var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
                    Logger.log('info', '[Scheduler] Task ID: ' + id + ' completed, Action: ' + timers[id].action + ' @ ' + timers[id].time + ' was completed at ' + hours + ':' + minutes);
                });
            }, schedule);
        });

    });
};

exports.GetTimers = function(callback) {
    callback(timers);
};