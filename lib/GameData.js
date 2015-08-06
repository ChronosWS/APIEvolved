var ArkData = require('../ArkData/ArkData');
var Config = require('./Config');
var fs = require('fs');

exports.Load = function(callback) {
    Config.Load(function(config) {
        ArkData.Get(config.Server.Win64 + "\\..\\..\\Saved\\SavedArks", function(data){
            global.GameData.Players = data.Players;
            global.GameData.Tribes = data.Tribes;
            callback(data);
        });
    });
};