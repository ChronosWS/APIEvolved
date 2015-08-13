
var RCON    = require('simple-rcon');
var Server  = require('./Server');

exports.Command = function (command, callback, retry) {
    var self = this;
    Server.GetConfig(function(gc) {

        var reply = {status: false, message: null};

        var client = new RCON({
            host:       '127.0.0.1',
            port:       gc.ServerSettings.RCONPort,
            password:   gc.ServerSettings.ServerAdminPassword
        }).on('error', function() {
            /*if(!reply.status && !retry) {
                if(callback) self.Command(command, callback, true);
                client.close();
            }*/
        }).exec(command, function(res) {
            reply.status = true;
            reply.message = res.body.toString().trim();
            if(reply.message == "Server received, But no response!!") reply.message = null;
            callback(reply);
            callback = null;
            client.close();

        }).connect();
    });

};