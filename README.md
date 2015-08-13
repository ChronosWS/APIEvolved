# APIEvolved

Made for managing/querying your ARK: Survival Evolved server running on Windows.

  - Tribe Data (working)
  - Player Data (working)
  - Server Query Data (working)
  - RCON Support (working)
  - Scheduled restarts (working)
  - Automated Updates (working)
  - Automated Backups and compression (work in progress)


### Disclaimer
The API is currently in alpha, advertised features may be missing.
This repository is heavily revised every day, make sure to git pull
every once in a while.

### Issues
Please post any issues you encounter along with your api.log file

### Version
0.1.0

### Tech

APIEvolved uses a number of open source projects to work properly:

* Express - serving the API calls
* [ArkData](https://github.com/AuthiQ/ArkData) - Parsing Tribe / Player data.
* edge - interface C# with ArkData.
* GameDig - doing parts of the Queries.
* cron - Scheduled jobs
* ini - reading the Game Configuration files
* simple-rcon - rcon protocol (skibz/prestonp fork)
* portscanner - used to check rcon protocol port.
* moment - for dates
* winston - logging
* request - used to call ARK.Bar API

And of course APIEvolved itself is open source with a [public repository](https://github.com/teamarkbar/APIEvolved) on GitHub.

### Installation

Download [latest zip](https://github.com/teamarkbar/APIEvolved/archive/master.zip) from git

Extract wherever you want
    
Copy example.config.json to config.json

- Set the correct Win64 path
- Set the path where you would like backups to reside.
- Optionally change the API Port
- Optionally set the secret for restarting / updating / rcon requests. (One will be generated if not, and will be displayed in console on first run)
- Optionally set the Params you want the server to run with

**Run start.bat**

### Configuring
**Scheduled Jobs**
Available actions: Restart, Broadcast.

**Cron Expression**
The expression is in this format:

seconds, minutes, hours, days, months, weekday

So if you want to run a broadcast every 15 minutes:
    0 */15 * * *

License
----
MIT **Free Software, Hell Yeah!**
