var express     = require('express');
var app         = express();
var server      = require('http').Server(app);
var io          = require('socket.io')(server);
var bodyParser  = require('body-parser');
var Logger      = require('./lib/Log');
var Config      = require('./lib/Config');
var Server      = require('./lib/Server');
var RCON        = require('./lib/RCON');
var Query       = require('./lib/Query');
var Steam       = require('./lib/Steam');
var Scheduler   = require('./lib/Scheduler');
var router      = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', router);

// Allow Cross Origin
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

global.state = {
    WaitForUpdate: false
};

global.timers = {
    niceStop: []
};

global.QueryData = null;

global.GameData = {
    Players: [],
    Tribes: []
};

function checkSecret(req, res, callback) {
    Config.Load(function(config) {
        if(config.API.Secret == req.params['key']) {
            callback()
        } else {
            res.json({status: false, message: "Access denied, incorrect key"});
        }
    });
}

// API: Status
app.get('/', function(req, res) {
    Config.Load(function(config) {
        Server.IsRunning(function(s) {
            if(s && s.process && s.process.arguments && s.process.arguments[0]) s.process.arguments[0] = s.process.arguments[0]
                .replace(/\?ServerAdminPassword=[a-zA-Z0-9.,\-!$]+/i, "")
                .replace(/\?ServerPassword=[a-zA-Z0-9.,\-!$]+/i, "");
            if(config && config.Server && config.Server.Params) config.Server.Params =  config.Server.Params
                .replace(/\?ServerAdminPassword=[a-zA-Z0-9.,\-!$]+/i, "")
                .replace(/\?ServerPassword=[a-zA-Z0-9.,\-!$]+/i, "");
            try {
                res.json({
                    Server: config.Server,
                    Running: s
                });
            } catch(e) {
                // Sent data after headers were sent.
            }
        });
    })
});

// API: Query
app.get('/query', function(req, res) {
    res.json(global.QueryData);
});

// API: Update
app.get('/update/:key', function (req, res) {
    checkSecret(req, res, function() {
        Server.Stop(function () {
            Logger.log('info', "[Server] Stopping for update");
            Steam.Update(function (data) {
                Logger.log('info', "[Update] " + (data.success ? "Success" : "Failed"));
                Server.Start(function () {
                    Logger.log('info', "[Server] Started");
                });
            })
        });
    });
});

// API: Server Start
app.get('/start/:key', function(req, res) {
    checkSecret(req, res, function() {
        Server.Start(function (game) {
            res.json(game);
        });
    });
});

// API: Server Nice Stop
app.get('/stop/:message/:key', function(req, res) {
    checkSecret(req, res, function() {
        Server.StopNice(req.params.message, function () {
        });
        res.json({status: true, message: req.params.message});
    });
});

// API: Server Force Stop
app.get('/force/stop/:key', function(req, res) {
    checkSecret(req, res, function() {
        Server.Stop(function (status) {
            res.json({status: status});
        });
    });
});

// API: Cancel Stop
app.get('/cancel/stop/:key', function(req, res) {
    checkSecret(req, res, function() {
        Server.CancelNiceStop(function (response) {
            res.json(response);
        });
    });
});

// API: RCON Command
app.get('/rcon/:command/:key', function(req, res) {
    checkSecret(req, res, function() {
        RCON.Command(req.params['command'], function (response) {
            res.json(response);
        });
    });
});

// API: Get Players
app.get('/players', function(req, res) {
   res.json(global.GameData.Players);
});

// API: Get Tribes
app.get('/tribes', function(req, res) {
    res.json(global.GameData.Tribes);
});

// API: Get Schedule
app.get('/scheduler/jobs', function(req, res) {
   Scheduler.GetJobs(function(schedule) {
       res.json(schedule);
   })
});

// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function (err) {
    // handle the error safely
    Logger.log('error', 'Uncaught exception: ' + err);
})

Config.Init(function() {
    Config.Load(function(config) {

        server.listen(config.API.Port);

        Steam.UpdateSteamCMD(function (success) {
            if(success)
            {
                Logger.log('info', 'Accessible by http://localhost:' + config.API.Port);

                Server.Init();

                setTimeout(function () {
                    Scheduler.Init(Server, io);
                }, 50);
            }
        });
    });
});

