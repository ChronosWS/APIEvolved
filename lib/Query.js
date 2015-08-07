var Gamedig          = require('gamedig');
var Server           = require('./Server');
var RCON             = require('./RCON');
var humanizeDuration = require("humanize-duration");
var fs               = require('fs');

exports.Run = function(callback, retry) {
    if(!retry) {
        retry = false;
    }
    var self = this;
    Server.GetConfig(function(config) {
        Gamedig.query(
            {
                type: 'protocol-valve',
                host: '127.0.0.1',
                port: parseInt(config.SessionSettings.QueryPort),
            },
            function (state) {
                if (state.error) {
                    if(!retry) {
                        self.Run(callback, true);
                    } else {
                        callback(false);
                    }
                }
                else {

                    var data = {};
                    data.name = state.name;
                    var x = data.name.match(/.*v([0-9.]+)/);
                    if (x && x[1]) {
                        data.version = parseFloat(x[1]).toFixed(1);
                        self.Set({version: data.version}, function() {});
                    } else {
                        data.version = null;
                    }

                    data.name = data.name.replace(/\ -\ \((v[0-9.]+)\)/, "");
                    data.map = state.map;
                    if (state.raw && state.raw.rules && state.raw.rules.DAYTIME_s) {
                        data.time = state.raw.rules.DAYTIME_s;
                    } else {
                        data.time = "Unknown";
                    }

                    data.port = state.raw.port;
                    data.game = state.raw.game;
                    data.environment = (state.raw.environment == "w" ? "Windows" : "Linux");
                    data.secure = Boolean(state.raw.secure);
                    data.playerCount = state.raw.numplayers;
                    data.playerMax = state.maxplayers;
                    data.players = [];
                    for (var i in state.players) {
                        var player = {};
                        for(var c in global.GameData.Players) {
                            if(global.GameData.Players[c].steamName == state.players[i].name) {
                                player = global.GameData.Players[c];
                            }
                        }

                        if(!player.steamName) {
                            player.name = state.players[i].name;
                        }

                        player.score = state.players[i].score;
                        player.time = state.players[i].time;
                        player.humanTime = humanizeDuration(player.time * 1000, {round: true, units: ["d", "h", "m"]});
                        data.players.push(player);
                    }
                    callback(data);
                }
            }
        );
    });
};

exports.Get = function(callback) {
    try {
        var self = this;
        fs.readFile(__dirname + "/../version.json", 'utf8', function (err, data) {
            if (!err) {
                data = JSON.parse(data);
                data.status = true;
                callback(data);
            } else {
                callback({status: false, version: 0});
            }
        });
    } catch(e) {
        console.log('error', '[Query:Get] ' + e);
        callback({status: false, version: 0 });
    }
};

exports.Set = function(data, callback) {
    try {
        fs.writeFile(__dirname + "/../version.json", JSON.stringify(data, null, 4), function(err) {
            if(err) {
                callback(false, data);
            } else {
                callback(true, data);
            }
        });
    } catch(e) {
        console.log('error', '[Query:Set] ' + e);
        callback(false, data);
    }
};
