var later = require('later');
later.date.localTime();

var Config = require('./Config');
var Logger = require('./Log');
var RCON   = require('./RCON');
var Steam  = require('./Steam');

var Server = null;

var timers = {
    Update: null,
    Scheduler: []
};

exports.Init = function(server) {

    var self = this;
    Server = server;

    Config.Load(function (config) {

        // Should we check for Updates automatically?
        if (config.Server.AutoUpdate.Enabled) {
            // Schedule a check for updates every 3 minutes.
            var schedule = later.parse.text('every 30 mins');
            timers.Update = later.setInterval(function () {
                Server.IsRunning(function (game) {
                    if (!Server.timers.niceStop && !global.state.WaitForUpdate) {
                        Steam.UpdateAvailable(function (update) {
                            Server.CheckAutoUpdate(function (check) {
                                if (check.update) {
                                    global.state.WaitForUpdate = true;
                                    Server.StopNice("Client/Server Update v" + update.available + ", restarting.", function () {
                                        Server.Start(function () {
                                        });
                                    });
                                }
                            })
                        });
                    }
                });

            }, schedule);
            Logger.log('info', '[Scheduler] Added task for automatic updates.');
        }

        Object.keys(config.Server.Scheduler).forEach(function (key) {
            config.Server.Scheduler[key].forEach(function (task) {
                var schedule = later.parse.text('at ' + task.time);
                var timer = {
                    id: null,
                    action: key,
                    time: task.time,
                    message: (task.message ? task.message : null),
                    data: (task.data ? task.data : null),
                    later: null,
                };

                timers.Scheduler.push(timer);
                var id = timers.Scheduler.length - 1;
                timers.Scheduler[id].id = id;

                Logger.log('info', '[Scheduler] Task ID: ' + id + ' added, Action: ' + key + ' @ ' + task.time);

                timers.Scheduler[id].later = later.setInterval(function () {
                    self.Run(timers.Scheduler[id], function (callback) {
                        var date = new Date();
                        var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
                        var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
                        Logger.log('info', '[Scheduler] Task ID: ' + id + ' completed, Action: ' + key + ' @ ' + task.time + ' was completed at ' + hours + ':' + minutes);
                    });
                }, schedule);

            });
        });

    });
};

exports.Run = function(task, callback) {
    Logger.log('info', '[Scheduler] Task ID: ' + task.id + ' started, Action: ' + task.action + ' @ ' + task.time);

    if(task.action == "Restart") {
        Server.StopNice(task.message, function() {
            Server.Start(function(game) {
                callback();
            });
        });
    } else if(task.action == "Broadcast") {
        RCON.Command("broadcast " + task.message, function(res) {
            callback();
        });
    } else {
        Logger.log('info', "[Scheduler] Task ID: " + task.id + " makes no sense, incorrect configuration.");
        callback();
    }

};

exports.GetTimers = function(callback) {
    callback(timers);
};