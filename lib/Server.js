var exec   = require('child_process').exec;
var spawn  = require('child_process').spawn;
var fs     = require('fs');
var ini    = require('ini');
var Logger = require('./Log');
var ARKBar = require('./ARKBar');
var Steam  = require('./Steam');
var Config = require('./Config');
var RCON   = require('./RCON');
var Query  = require('./Query');
var ps     = require('ps-node');
var later  = require('later');

var timers = {
    update: null,
    niceStop: null
};

// Initializing function
exports.Init = function() {
    var self = this;
    Config.Load(function(config) {

        // Check if the server should be started when API goes live
        if(config.Server.AutoStart) {
            // Check if the server is already running
            self.IsRunning(function(res) {
                if(!res.running) {
                    // Not running, let's start it.
                    self.Start(function (game) {
                        Logger.log('info', "[Server] Started");
                    });
                } else {
                    Logger.log('info', "[Server] Already running");
                }
            });
        }

        self.CheckUpdate();

    });
};

// Get ARK: Survival Evolved Server Settings
exports.GetConfig = function(callback) {
    Config.Load(function(config) {
        var gconf = ini.parse(fs.readFileSync(config.Server.Win64 + "\\..\\..\\Saved\\Config\\WindowsServer\\GameUserSettings.ini", 'utf-8'));
        callback(gconf);
    });
};

// Starts ARK: Survival Evolved Server
exports.Start = function(callback) {
    // Make sure it's not running
    this.IsRunning(function(res) {
        if(!res.running) {
            Config.Load(function(config) {
                var game = exec(config.Server.Win64 + "\\ShooterGameServer.exe " + config.Server.Params, { cwd: config.Server.Win64 });
                callback({running: true, pid: game.pid});
            });
        } else {
            callback(res);
        }
    });
};

// Stops ARK: Survival Evolved Server gracefully.
exports.Stop = function(callback) {
    if(timers.niceStop) {
        // Nice Stop already scheduled, cancelling.
        Logger.log('debug', "[Server] Canceled previous scheduled shutdown.");
        clearTimeout(timers.niceStop);
    }
    var self = this;
    // Load API Configuration
    Config.Load(function(config) {
        // Check if server is running
        self.IsRunning(function(res) {
            if(!res.running) {
                // Not running
                callback(true);
                return;
            } else if(res.running && !res.initialized) {
                // Server is running but not initialized yet.
                self.Kill(function() {
                    callback(true);
                });
            } else if(res.running && res.initialized) {
                // Server is running and initialized, save world, then kill.
                RCON.Command("saveworld", function(res) {
                   self.Kill(function()  {
                       callback(true);
                   }) ;
                });
            }
        });
    });
};

// Kills ARK: Survival Evolved Server process.
exports.Kill = function (callback) {
    Config.Load(function(config) {
        // Find processes that matches our running server.
        ps.lookup({command: "ShooterGameServer.exe"}, function (err, list) {
            var running = false;
            list.forEach(function (p) {
                if (p.command == config.Server.Win64 + "\\ShooterGameServer.exe") {
                    // Kill it with fire
                    process.kill(p.pid, "SIGTERM");
                }
            });
            callback();
        });
    });
};

// Checks if ARK: Survival Evolved Server is running.
exports.IsRunning = function(callback) {
    var self = this;

    var response = {
        running: false,
        process: null,
        initialized: false
    };

    // Load API Configuration
    Config.Load(function(config) {
        // Check if server is running
        ps.lookup({command: "ShooterGameServer.exe"}, function(err, list) {
            list.forEach(function(p) {
                if(p.command == config.Server.Win64 + "\\ShooterGameServer.exe") {
                    response.running = true;
                    response.process = p;
                }
            });
            if(!response.running) {
                // Not running
                Logger.log('debug', "[Server] Not running, stopped.");
                callback(response);
                return;
            } else {
                // Process is running
                Query.Run(function(data) {
                    if(!data) {
                        // Server has not been started properly yet.
                        Logger.log('debug', "[Server] Not properly started.");
                        callback(response);
                    } else{
                        Logger.log('debug', '[Server] Running and Initalized');
                        response.initialized = true;
                        callback(response);
                    }
                });
            }

        });
    });
};

// Schedules a graceful Stop of the ARK: Survival Evolved Server.
exports.StopNice = function(message, callback) {
    if(timers.niceStop) {
        // Nice Stop already scheduled, cancelling.
        Logger.log('debug', "[Server] Canceled previous scheduled shutdown.");
        clearTimeout(timers.niceStop);
        timers.niceStop = null;
    }
    var self = this;
    Logger.log('info', "[Server] Shutdown Scheduled: " + message);
    Config.Load(function(config) {
        self.IsRunning(function(res) {
           if(res.running && res.initialized) {
               RCON.Command("broadcast Server shutdown in 15 minutes, " + message, function (res) {
                   timers.niceStop = setTimeout(function () {
                       RCON.Command("broadcast Server shutdown in 10 minutes, " + message, function (res) {
                           timers.niceStop = setTimeout(function () {
                               RCON.Command("broadcast Server shutdown in 5 minutes, " + message, function (res) {
                                   timers.niceStop = setTimeout(function () {
                                       RCON.Command("broadcast Server shutdown in 3 minutes, " + message, function (res) {
                                           timers.niceStop = setTimeout(function () {
                                               RCON.Command("broadcast Server shutdown in 1 minute, " + message, function (res) {
                                                   timers.niceStop = setTimeout(function () {
                                                       RCON.Command("broadcast Server is shutting down now, " + message, function (res) {
                                                           self.Stop(function(stop) {
                                                               callback();
                                                           });
                                                       });
                                                   }, 60000);
                                               });
                                           }, 120000);
                                       });
                                   }, 120000);
                               });
                           }, 300000);
                       });
                   }, 300000);
               });
           } else {
               // Server is not running / initialized
               self.Stop(function() {
                   callback();
               });
           }
        });

    });
};

exports.CancelNiceStop = function(callback) {
    if(timers.niceStop) {
        Logger.log('debug', "[Server] Canceled previous scheduled shutdown.");
        clearTimeout(timers.niceStop);
        timers.niceStop = null;
        callback({status: true, message: "Scheduled shutdown cancelled"});
    } else {
        callback({status: false, message: "No scheduled Shutdowns"});
    }
};

exports.CheckUpdate = function() {
    var self = this;
    Logger.log('debug', "[AutoUpdate] Checking for updates.");
    Config.Load(function(config) {
        if(config.Server.AutoUpdate.Enabled) {
            Steam.UpdateAvailable(function(update) {
                if(update.status) {

                    var doUpdate = false;

                    if(config.Server.AutoUpdate.OnlyMajor && update.type == "major") {
                        // Only update on Major version change
                        doUpdate = true;
                        Logger.log('debug', "[Update] Major patch (v"+version.current+"), running upgrade.");
                    } else if(!config.AutoUpdate.OnlyMajor) {
                        // Update everything
                        doUpdate = true;
                        Logger.log('debug', "[Update] Patch (v"+version.current+") available, running upgrade.");
                    }

                    if(doUpdate) {
                        self.StopNice("Patch (v"+version.current+") available, running upgrade.", function() {
                            self.Update(function(u) {
                               self.Start(function(game) {
                                   timers.update = setTimeout(function() {
                                       self.CheckUpdate();
                                   }, 300000);
                               })
                            });
                        });
                    } else {
                        timers.update = setTimeout(function() {
                            self.CheckUpdate();
                        }, 300000);
                    }

                } else {
                    timers.update = setTimeout(function() {
                        self.CheckUpdate();
                    }, 300000);
                }
            });
        } else {
           // Auto Update Disabled, check again in 5 minutes.
            Logger.log('debug', '[Update] Auto Update disabled');
            timers.update = (function() {
                self.CheckUpdate();
            }, 300000);
        }
    });
};