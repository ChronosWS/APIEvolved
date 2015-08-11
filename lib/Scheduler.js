var later = require('later');
later.date.localTime();

var Config      = require('./Config');
var Logger      = require('./Log');
var RCON        = require('./RCON');
var Query       = require('./Query');
var Steam       = require('./Steam');
var GameData    = require('./GameData');
var moment      = require('moment');
var momenttz   = require('moment-timezone');


var Server = null;

var timers = {
    Update: null,
    GameData: null,
    QueryData: null,
    Scheduler: []
};

exports.Init = function(server) {

    var self = this;
    Server = server;

    Config.Load(function (config) {

        // Should we check for Updates automatically?
        if (config.Server.AutoUpdate.Enabled) {
            // Schedule a check for updates every 3 minutes.
            var update_scheduler = later.parse.text('every 30 mins');
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

            }, update_scheduler);
            Logger.log('info', '[Scheduler] Added task for automatic updates.');
        }

        // Refresh the QueryData

        var querydata_scheduler = later.parse.recur().every(15).second();
        timers.QueryData = later.setInterval(function() {
            Query.Run(function(data) {
               if(!data) {
                   global.QueryData = {online: false, server: null};
               } else {
                   global.QueryData = {online: true, server: data};
               }
            });
        }, querydata_scheduler);

        // Refresh GameData on Init and schedule auto-saves and refreshing of GameData
        GameData.Load(function(data){});
        var gamedata_scheduler = later.parse.text('every 10 mins');
        timers.GameData = later.setInterval(function() {
            RCON.Command("saveworld", function(res) {
                GameData.Load(function(data){});
            });
        }, gamedata_scheduler);


        Object.keys(config.Server.Scheduler).forEach(function (key) {
            config.Server.Scheduler[key].forEach(function (task) {
                var timer = {
                    id: null,
                    action: key,
                    cron: task.cron,
                    schedule: later.parse.cron(task.cron),
                    message: (task.message ? task.message : null),
                    data: (task.data ? task.data : null),
                    later: null,
                };

                timers.Scheduler.push(timer);
                var id = timers.Scheduler.length - 1;
                timers.Scheduler[id].id = id;

                Logger.log('info', '[Scheduler] Task ID: ' + id + ' added, Action: ' + key);

                timers.Scheduler[id].later = later.setInterval(function () {
                    self.Run(timers.Scheduler[id], function (callback) {
                        Logger.log('info', '[Scheduler] Task ID: ' + id + ' completed, Action: ' + key + ' @ ' + moment().format("HH:mm"));
                        return;
                    });
                }, timers.Scheduler[id].schedule);

            });
        });

    });
};

exports.Run = function(task, callback) {
    Logger.log('info', '[Scheduler] Task ID: ' + task.id + ' started, Action: ' + task.action + ' @ ' + moment().format("HH:mm"));

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

exports.GetSchedule = function(callback) {
    Config.Load(function(config) {
        var schedule = [];
        timers.Scheduler.forEach(function(task) {

            var next = later.schedule(task.schedule).next(3);
            var upcoming = [];

            for(var i in next) {
                upcoming.push(moment(next[i]).tz(config.Server.Timezone).format());
            }

            schedule.push({
                id: task.id,
                action: task.action,
                next: moment(next[0]).tz(config.Server.Timezone).format(),
                upcoming: upcoming,
                message: task.message
            });

        });

        schedule.sort(function(a, b) {
            return a.next - b.next;
        });

        callback(schedule);
    });
};