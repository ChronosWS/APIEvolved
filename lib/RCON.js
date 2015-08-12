var fs      = require('fs');
var RCON    = require('simple-rcon');
var Server  = require('./Server');
var Logger  = require('./Log');
var Config  = require('./Config');

exports.Command = function (command, callback, retry) {
    var self = this;
    Server.GetConfig(function(gc) {

        var reply = {status: false, message: null};

        var client = new RCON({
            host:       '127.0.0.1',
            port:       gc.ServerSettings.RCONPort,
            password:   gc.ServerSettings.ServerAdminPassword
        }).on('error', function(err) {
            if(!reply.status && !retry) {
                if(callback) self.Command(command, callback, true);
                client.close();
            }
        }).exec(command, function(res) {
            reply.status = true;
            reply.message = res.body.toString().trim();
            callback(reply);
            callback = null;
            client.close();

        }).connect();
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