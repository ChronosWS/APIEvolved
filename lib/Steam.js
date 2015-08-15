var exec   = require('child_process').exec;
var spawn  = require('child_process').spawn;
var request = require('request');
var decompress = require('decompress');
var fs = require('fs');
var path = require('path');
var Config = require('./Config');
var Server = require('./Server');
var Query  = require('./Query');
var ARKBar = require('./ARKBar');
var Logger = require('./Log');

var updating = false;

exports.IsUpdating = function() {
  return updating;
};

exports.SetUpdating = function(bool) {
    updating = bool;
};

exports.UpdateSteamCMD = function (callback) {
    Config.Load(function (config) {

        var destPath = path.dirname(config.SteamCMD);
        var zipFilePath = path.join(destPath, "SteamCmd.zip");
        fs.stat(destPath, function (err, stats) {
            if (err) {
                fs.mkdirSync(destPath);
            }

            Logger.log('info', "[UpdateSteamCmd] Getting the latest SteamCMD to " + destPath);
            request
                .get('https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip')
                .on('error', function (err) {
                    Logger.log('error', "[UpdateSteamCmd] Error downloading: " + err);
                    callback(false);
                })
                .on('complete', function () {
                    Logger.log('info', "[UpdateSteamCmd] Download complete.  Unpacking...");
                    new decompress({ mode: '777' })
                        .src(zipFilePath)
                        .dest(destPath)
                        .use(decompress.zip({ strip: 1 }))
                        .run(function (err, files) {
                            if (err) {
                                Logger.log('error', "[UpdateSteamCmd] Error unzipping: " + err);
                                callback(false);
                            }
                            else {
                                Logger.log('info', "[UpdateSteamCmd] Unpack complete.  SteamCMD is up-to-date.");
                                callback(true);
                            }
                        });
                })
                .pipe(fs.createWriteStream(zipFilePath));               
        })
    });    
};

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

                // New version available

                response.status = true;
                var major = Math.floor(current.version);
                var offset = version.current - major;

                if(offset >= 1) {
                    // Major Patch
                    response.type = "major";
                } else {
                    // Minor patch
                    response.type = "minor";
                }

                callback(response);

            } else {

                // Should not occur
                callback(response);

            }

        });
    });
};

