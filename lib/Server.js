var exec   = require('child_process').exec;
var fs     = require('fs');
var ini    = require('ini');
var Logger = require('./Log');
var Config = require('./Config');
var Steam  = require('./Steam');
var RCON   = require('./RCON');
var Query  = require('./Query');
var ps     = require('ps-node');

// Get ARK: Survival Evolved Server Settings
exports.GetConfig = function(callback) {
    Config.Load(function(config) {
        var gconf = ini.parse(fs.readFileSync(config.Server.Win64 + "\\..\\..\\Saved\\Config\\WindowsServer\\GameUserSettings.ini", 'utf-8'));
        callback(gconf);
    });
};


// Initializing function
exports.Init = function() {
    var self = this;

    self.timers = {
        update: null,
        niceStop: null
    };

    Config.Load(function(config) {
        if(config.Server.AutoStart) {
            // Server should start automatically.
            self.Start(function(game) {});
        }
    });

};


// Starts ARK: Survival Evolved Server
exports.Start = function(callback) {
    var self = this;
    // Make sure it's not running
    this.IsRunning(function(res) {
        if(!res.running) {

            Config.Load(function(config) {
                self.CheckAutoUpdate(function(check) {
                    if(check.update) {
                        global.state.WaitForUpdate = true;
                        // Update available
                        Logger.log('info', '[Update] Available, updating...');
                        Steam.Update(function() {
                            // Updated
                            var game = exec(config.Server.Win64 + "\\ShooterGameServer.exe " + config.Server.Params, { cwd: config.Server.Win64 });
                            Logger.log('info', "[Server] Started");
                            callback({running: true, pid: game.pid});
                        });
                    } else {
                        // No updates, start server.
                        var game = exec(config.Server.Win64 + "\\ShooterGameServer.exe " + config.Server.Params, { cwd: config.Server.Win64 });
                        Logger.log('info', "[Server] Started");
                        callback({running: true, pid: game.pid});
                    }
                });
            });
        } else {
            // Server is running
            Logger.log('info', "[Server] Running");
            callback(res);
        }
    });
};

exports.CheckAutoUpdate = function(callback) {
    Logger.log('debug', "[Update] Checking for updates.");

    var response = {
        update: false,
        message: null
    };

    Config.Load(function(config) {
        if (config.Server.AutoUpdate.Enabled) {
            // Automatic Updates Enabled

            // Check if there's any available updates
            Steam.UpdateAvailable(function(update) {

                if(update.status) {
                    // There is an update available, check if it matches our policy settings

                    if(config.Server.AutoUpdate.OnlyMajor) {
                        // We only want to update on major version
                        if(update.type == "major") {

                            response.update = true;
                            callback(response);

                        } else {

                            // This is not a major update.
                            callback(response);

                        }
                    } else {
                        // We're want both minor and major updates
                        response.update = true;
                        callback(response);
                    }

                } else {

                    // No update available
                    callback(response);

                }

            });

        } else {

            // Auto Updates Disabled
            callback(response);

        }
    });
};

// Stops ARK: Survival Evolved Server gracefully.
exports.Stop = function(callback) {
    var self = this;

    // Stop any other scheduled shutdowns
    self.CancelNiceStop(function() {});

    // Check if server is running
    self.IsRunning(function(res) {
        if(!res.running) {
            // Not running
            callback(true);

        } else if(res.running && !res.initialized) {
            // Server is running but not initialized yet.
            self.Kill(function() {
                callback(true);
            });
        } else if(res.running && res.initialized) {
            // Server is running and initialized, save world, then kill.
            RCON.Command("saveworld", function(res) {
                Logger.log('info', '[Server] ' + res.message);
                setTimeout(function() {
                    self.Kill(function()  {
                        setTimeout(function() {
                            callback(true);
                        }, 1500);
                    }) ;
                }, 1500);
            });
        }
    });
};

// Kills ARK: Survival Evolved Server process.
exports.Kill = function (callback) {
    Config.Load(function(config) {
        // Find processes that matches our running server.
        ps.lookup({command: "ShooterGameServer.exe"}, function (err, list) {
            list.forEach(function (p) {
                if (p.command == config.Server.Win64 + "\\ShooterGameServer.exe") {
                    // Kill it with fire
                    try {
                        process.kill(p.pid, "SIGTERM");
                    } catch(e) {
                        // Prevent kill ESRCH
                    }

                }
            });
            callback();
        });
    });
};

// Checks if ARK: Survival Evolved Server is running.
exports.IsRunning = function(callback) {

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
                    // Process matches configured server instance.
                    response.running = true;
                    response.process = p;
                }
            });
            if(!response.running) {
                // Not running
                callback(response);
            } else {
                // Process is running
                response.running = true;

                Query.Run(function(data) {
                    if(data) {
                        // Server is running and initialized
                        response.initialized = true;
                        global.state.WaitForUpdate = false;
                        callback(response);
                    } else {
                        // Server is running but not initialized
                        global.state.WaitForUpdate = true;
                        callback(response);
                    }
                });
            }

        });
    });
};

// Schedules a graceful Stop of the ARK: Survival Evolved Server.
exports.StopNice = function(message, callback) {
    var self = this;
    self.CancelNiceStop(function() {
        Logger.log('info', "[Server] Shutdown Scheduled: " + message);
        self.IsRunning(function(res) {
            if(res.running && res.initialized) {
                RCON.Command("broadcast Server shutdown in 15 minutes, " + message, function () {
                    self.timers.niceStop = setTimeout(function () {
                        RCON.Command("broadcast Server shutdown in 10 minutes, " + message, function () {
                            self.timers.niceStop = setTimeout(function () {
                                RCON.Command("broadcast Server shutdown in 5 minutes, " + message, function () {
                                    self.timers.niceStop = setTimeout(function () {
                                        RCON.Command("broadcast Server shutdown in 3 minutes, " + message, function () {
                                            self.timers.niceStop = setTimeout(function () {
                                                RCON.Command("broadcast Server shutdown in 1 minute, " + message, function () {
                                                    self.timers.niceStop = setTimeout(function () {
                                                        clearTimeout(self.timers.niceStop);
                                                        self.timers.niceStop = null;
                                                        RCON.Command("broadcast Server is shutting down now, " + message, function () {
                                                            self.Stop(function() {
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
    if(this.timers.niceStop) {
        Logger.log('info', "[Sheduler] Scheduled shutdown cancelled.");
        clearTimeout(this.timers.niceStop);
        this.timers.niceStop = null;
        callback({status: true, message: "Scheduled shutdown cancelled"});
    } else {
        callback({status: false, message: "No scheduled Shutdowns"});
    }
};