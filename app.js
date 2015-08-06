var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var Logger      = require('./lib/Log');
var Config      = require('./lib/Config');
var Server      = require('./lib/Server');
var RCON        = require('./lib/RCON');
var ARKBar      = require('./lib/ARKBar');
var Query       = require('./lib/Query');
var Steam       = require('./lib/Steam');
var Scheduler   = require('./lib/Scheduler');
var spawn       = require('child_process').spawn;
var router      = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', router);

global.state = {
    WaitForUpdate: false
};

// API: Status
app.get('/', function(req, res) {
    Server.IsRunning(function(s) {
        res.json({
            Server: Config.Server,
            Running: s
        });
    });
});

// API: Query
app.get('/query', function(req, res) {
    Query.Run(function(data) {
        if(data) {
            res.json({
                online: true,
                server: data
            });
        } else {
            res.json({
                online: false,
                server: null
            });
        }
    })
});

// API: Update
app.get('/update', function (req, res) {
    Server.Stop(function() {
        Logger.log('info', "[Server] Stopping for update");
        Steam.Update(function(data) {
            Logger.log('info', "[Update] " + (data.success ? "Success" : "Failed"));
            Server.Start(function() {
                Logger.log('info', "[Server] Started");
            });
        })
    });
});

// API: Server Start
app.get('/start', function(req, res) {
   Server.Start(function(game) {
      res.json(game);
   });
});

// API: Server Nice Stop
app.get('/stop/:message', function(req, res) {
    Server.StopNice(req.params.message, function() {});
    res.json({status: true, message: req.params.message});
});

// API: Server Force Stop
app.get('/force/stop', function(req, res) {
    Server.Stop(function(status) {
        res.json({status: status});
    });
});

// API: Cancel Stop
app.get('/cancel/stop', function(req, res) {
    Server.CancelNiceStop(function(response) {
        res.json(response);
    });
});

// API: RCON Command
app.get('/rcon/:command', function(req, res) {
    RCON.Command(req.params['command'], function(response) {
       res.json(response);
    });
});

app.get('/timers', function(req, res) {
   Scheduler.GetTimers(function(timers) {
       res.json(timers);
   })
});

Config.Init(function() {
    Config.Load(function(config) {

        app.listen(config.API.Port);
        Logger.log('info', 'Accessible by http://localhost:' + config.API.Port);

        Server.Init();

        setTimeout(function() {
            Scheduler.Init(Server);
        }, 50);

    });
});

