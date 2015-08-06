var fs      = require('fs');
var Rcon    = require('simple-rcon');
var Server  = require('./Server');
var Logger  = require('./Log');
var Config  = require('./Config');

exports.Command = function (command, callback) {
    Server.GetConfig(function(gc) {
        var reply = false;
        var rcon = (new Rcon('127.0.0.1', gc.ServerSettings.RCONPort, gc.ServerSettings.ServerAdminPassword))
            .on("authenticated", function() {
                rcon.exec(command, function(res) {
                    var body = res.body.toString().trim();
                    if(body == "Server received, But no response!!") body = null;
                    reply = true;
                    callback({status: true, message: body});
                });
            })
            .on("error", function(error) {
                // Will happen on all closes, just handle and ignore it.
            });
            setTimeout(function() {
                // Send a false reply after 15 seconds in case we got no reply
                if(!reply)
                    if(typeof(callback) == "function") callback({status: false, message: null});
            }, 15000);
    });

};

exports.Players = function(callback) {
    var players = [];
    this.Command('listplayers', function(res) {
        if(res.message) {
            var lines = res.message.split("\n");
            for(var i in lines) {
                line = lines[i].split(" ");
                line.shift();
                line.concat(line);
                players.push({name: line[0].substr(0, line[0].length -1), id: line[1]});
            }
        }
        callback(players);
    });
};