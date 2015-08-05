# APIEvolved

Made for managing/querying your ARK: Survival Evolved server running on Windows.

  - Tribe Data
  - Player Data
  - Server Query Data
  - RCON Support
  - Scheduled restarts
  - Automated Updates
  - Automated Backups and compression


### Version
0.0.1

### Tech

APIEvolved uses a number of open source projects to work properly:

* Express - serving the API calls
* GameDig - doing parts of the Queries.
* Later - scheduling
* ini - reading the Game Configuration files
* simple-rcon - rcon protocol
* humanize-duration - turns numbers into nice human readable strings
* winston - logging
* request - used to call ARK.Bar API

And of course APIEvolved itself is open source with a [public repository](https://github.com/Xstasy/APIEvolved) on GitHub.

### Installation
**Prerequisites:**
- Node v0.12 or later

Download the latest zip from master, extract wherever, edit config.json:
- Change port if you'd like
- Set the correct Win64 path
- Optionally set the secret for restarting / updating / rcon requests. (One will be generated if not, and will be displayed in console on first run)
- Optionally set the Params you want the server to run with

**Run with:**
```node app.js``` or use PM2/forever/daemon to run and start with your server.

License
----

MIT


**Free Software, Hell Yeah!**
