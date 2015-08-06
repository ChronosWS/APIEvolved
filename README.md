# APIEvolved

Made for managing/querying your ARK: Survival Evolved server running on Windows.

  - Tribe Data
  - Player Data
  - Server Query Data
  - RCON Support
  - Scheduled restarts
  - Automated Updates
  - Automated Backups and compression


### Disclaimer
The API is currently in alpha, advertised features may be missing.

### Version
0.0.1

### Tech

APIEvolved uses a number of open source projects to work properly:

* Express - serving the API calls
* [ArkData](https://github.com/AuthiQ/ArkData) - Parsing Tribe / Player data.
* edge - interface C# with ArkData.
* GameDig - doing parts of the Queries.
* Later - scheduling
* ini - reading the Game Configuration files
* simple-rcon - rcon protocol
* humanize-duration - turns numbers into nice human readable strings
* winston - logging
* request - used to call ARK.Bar API

And of course APIEvolved itself is open source with a [public repository](https://github.com/teamarkbar/APIEvolved) on GitHub.

### Installation
**Prerequisites:**
- Node v0.12 or later

**Clone repository into where you want it installed:**

    git clone https://github.com/teamarkbar/APIEvolved.git
    cd APIEvolved && npm install

- Set the correct Win64 path
- Set the path where you would like backups to reside.
- Optionally change the API Port
- Optionally set the secret for restarting / updating / rcon requests. (One will be generated if not, and will be displayed in console on first run)
- Optionally set the Params you want the server to run with

**Run with:**
```node app.js``` or use PM2/forever/daemon to run and start with your server.

### Upgrading
**Remember** to stop the running script, then use:
 
 ```git pull``` to update.

License
----

MIT


**Free Software, Hell Yeah!**
