var edge = require('edge');
var fs   = require('fs');

var getData = edge.func(function() {/*
    #r "Newtonsoft.Json.dll"
    #r "ArkData.dll"
    using Newtonsoft.Json;
    using ArkData;
    using System.Threading.Tasks;
    using System.Collections.Generic;

    public class SerializePlayer {
        public long id { get; set; }
        public string steamId { get; set; }
        public short level { get; set; }
        public string steamName { get; set; }
        public string characterName { get; set; }
        public int? tribeid { get; set; }
    }

    public class SerializeTribe {
        public int id { get; set; }
        public string name { get; set; }
        public int? ownerId { get; set; }
    }

    public class SerializedResult {
        public List<SerializePlayer> players {get; set;}
        public List<SerializeTribe> tribes {get; set;}
    }


    public class Startup
    {
        public async Task<object> Invoke(dynamic input)
        {

            List<SerializePlayer> players = new List<SerializePlayer>();
            List<SerializeTribe> tribes = new List<SerializeTribe>();



            var container = await ArkData.ArkDataContainer.CreateAsync(input);

            foreach(Player p in container.Players) {
                SerializePlayer sp = new SerializePlayer();
                sp.id = p.Id;
                sp.steamId = p.SteamId;
                sp.level = p.Level;
                sp.steamName = p.SteamName;
                sp.characterName = p.CharacterName;
                sp.tribeid = p.TribeId;
                players.Add(sp);
            }

            foreach(Tribe t in container.Tribes) {
                SerializeTribe st = new SerializeTribe();
                st.id = t.Id;
                st.name = t.Name;
                st.ownerId = t.OwnerId;
                tribes.Add(st);
            }

            SerializedResult result = new SerializedResult();

            result.players = players;
            result.tribes = tribes;

            return JsonConvert.SerializeObject(result);
        }
    }

 */});

getData("C:\\ARK\\ShooterGame\\Saved\\SavedArks", function(error, result) {
    var json = JSON.parse(result);
    fs.writeFile("arkdata.json", JSON.stringify(json, null, 4), function(err) {
        console.log(err);
    });
});