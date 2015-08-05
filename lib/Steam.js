var exec   = require('child_process').exec;
var spawn  = require('child_process').spawn;
var Config = require('./Config');
var Server = require('./Server');
var Query  = require('./Query');
var ARKBar = require('./ARKBar');
var Logger = require('./Log');

exports.Update = function(callback) {
    Config.Load(function(config) {

        var output = "";
        var steam = null;

        if(config.Server.AutoUpdate.Validate) {
            // Will validate Game server files
            steam =  spawn(config.SteamCMD, ['+login', 'anonymous', '+force_install_dir', config.Server.Win64 + "\\..\\..\\..\\", "+app_update", "376030", "validate", "+quit"]);
        } else {
            // Will not validate Game server files
            steam =  spawn(config.SteamCMD, ['+login', 'anonymous', '+force_install_dir', config.Server.Win64 + "\\..\\..\\..", "+app_update", "376030", "+quit"]);
        }

        steam.stdout.on('data', function (data) {
            output += data;
        });

        steam.on('close', function (code) {
            var good = [
                "App '376030' fully installed",
                "Success! App '376030' already up to date"
            ];

            var success = false;

            for(var i in good) {
                if(output.indexOf(good[i]) > 0) {
                    success = true;
                    Logger.log('info', "[Update] " + good[i]);
                }
            }

            callback({code: code, success: success, data: output});
        });
    });
};

exports.UpdateAvailable = function(callback) {

    var response = {
        status: false,
        running: 0,
        available: 0,
        type: "none"
    };

    Query.Get(function(current) {
        ARKBar.Version(function(version) {
            response.running = parseFloat(current.version).toFixed(1);
            response.available = parseFloat(version.current).toFixed(1);

            if(response.running == response.available) {
                // Already up-to date
                callback(response);
            } else if(response.available > response.running) {
                response.status = true;
                var major = Math.floor(current.version);
                var offset = version.current - major;
                if(offset >= 1) {
                    response.type = "major";
                } else {
                    response.type = "minor";
                }
                callback(response);
            } else {
                callback(response);
            }
        });
    });
};

exports.ForceUpdate = function(callback) {

};


exports.CheckUpdate = function(callback) {
    var self = this;
    Config.Load(function(config) {
        if(config.Server.AutoUpdate.Enabled) {
            // Auto update is enabled
            Query.Get(function(current) {
                ARKBar.Version(function(version) {
                    version.current = parseFloat(version.current);
                    current.version = parseFloat(current.version);
                    if(current.version == version.current) {
                        // Already up-to date
                        Logger.log('debug', "[Update] Already up-to-date");
                        callback();
                    } else {
                        var major = Math.floor(current.version);
                        var offset = version.current - major;
                        if(config.Server.AutoUpdate.OnlyMajor) {
                            // Only update on Major version change
                            if(offset >= 1) {
                                Logger.log('debug', "[Update] Major patch (v"+version.current+"), running upgrade.");
                                self.Update(function(update) {
                                    callback();
                                });
                            } else {
                                Logger.log('debug', "[Update] Only minor patch (v"+version.current+") available, we're set to only update major.");
                                callback();
                            }
                        } else {
                            // Will update on all version changes
                            Logger.log('debug', "[Update] Patch (v"+version.current+") available, running upgrade.");
                            self.Update(function(update) {
                                callback();
                            });
                        }
                    }
                });
            });

        } else {
            Logger.log('debug', '[Update] Auto Update disabled.');
            callback();
        }
    });
};