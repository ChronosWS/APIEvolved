var fs      = require('fs');
var Config  = require('./Config');
var Parser  = require('binary-parser').Parser;
var iconv   = require('iconv-lite');

var StringParser = new Parser()
    .string('string', {zeroTerminated: true});

exports.Parse = function(callback) {
    var self = this;
    Config.Load(function(config) {
        self.ParseFile("test", function(buffer) {
            var string = buffer.toString('win1251');
            console.log(string);

            var Player = {};



            var PlayerNameBuffer = buffer.slice((string.indexOf('PlayerName') + 0x30), buffer.length);

            console.log(PlayerNameBuffer.toString('utf16le'));

            var PlayerCharacterBuffer = buffer.slice((string.indexOf('PlayerCharacterName') + 0x30), buffer.length);
            Player.CharacterName = StringParser.parse(PlayerCharacterBuffer).string;

            console.log(Player);
        });
    });
};

exports.ParseFile = function(file, callback) {
    Config.Load(function(config) {
        fs.readFile(config.Server.Win64 + "\\..\\..\\Saved\\SavedArks\\76561197987465026.arkprofile", function (err, data) {
            console.log(iconv.decode(data, 'ansi'));
            //callback(buffer);
        });
    });
};