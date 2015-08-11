var Config      = require('./Config');
var Logger      = require('./Log');
var RCON        = require('./RCON');
var Query       = require('./Query');
var Steam       = require('./Steam');
var GameData    = require('./GameData');
var moment      = require('moment');
var momenttz    = require('moment-timezone');
var cronjob     = require('cron').CronJob;


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
        timers.Update = new cronjob('0 */3 * * * *', function(){
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
                Logger.log('debug', '[Scheduler] Checked for updates');
            }, function () {

            },
            true,
            config.Server.Timezone
        );

        // Refresh the QueryData
        timers.QueryData = new cronjob('*/15 * * * * *', function(){
                Query.Run(function(data) {
                    if(!data) {
                        global.QueryData = {online: false, server: null};
                    } else {
                        global.QueryData = {online: true, server: data};
                    }
                    Logger.log('debug', '[Scheduler] Updated QueryData');
                });
            }, function () {

            },
            true,
            config.Server.Timezone
        );

        // Refresh GameData on Init and schedule auto-saves and refreshing of GameData

        GameData.Load(function(data){});

        timers.GameData = new cronjob('0 */10 * * * *', function(){
                RCON.Command("saveworld", function(res) {
                    GameData.Load(function(data){
                        Logger.log('debug', '[Scheduler] Updated GameData');
                    });
                });
            }, function () {

            },
            true,
            config.Server.Timezone
        );

        Object.keys(config.Server.Scheduler).forEach(function (key) {
            config.Server.Scheduler[key].forEach(function (task) {

                var timer = {
                    id: null,
                    action: key,
                    cron: task.cron,
                    message: (task.message ? task.message : null),
                    data: (task.data ? task.data : null),
                    job: null,
                };

                timers.Scheduler.push(timer);
                var id = timers.Scheduler.length - 1;
                timers.Scheduler[id].id = id;

                Logger.log('info', '[Scheduler] Task ID: ' + id + ' added, Action: ' + key);

                timers.Scheduler[id].job = new cronjob(task.cron, function(){
                        self.Run(timers.Scheduler[id], function (callback) {
                            Logger.log('info', '[Scheduler] Task ID: ' + id + ' completed, Action: ' + key + ' @ ' + moment().format("HH:mm"));
                        });
                    }, function () {

                    },
                    true,
                    config.Server.Timezone
                );

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

exports.GetJobs = function(callback) {
    var schedule = [];
    timers.Update.forEach(function(task) {
        schedule.push({
            action: task.action,
            message: task.message,
            cron: task.cron
        });
    });
    callback();
};