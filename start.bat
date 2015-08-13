@echo off
:install

if not exist node.exe (
	echo Installing NodeJS
    powershell -command "(new-object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v0.12.7/x64/node.exe', '.\node.exe')"
)

if not exist npm.cmd (
	echo Installing and Updating NPM
	powershell -command "(new-object System.Net.WebClient).DownloadFile('http://nodejs.org/dist/npm/npm-1.4.9.zip', '.\npm.zip')"
	if not exist 7za.exe (
		powershell -command "(new-object System.Net.WebClient).DownloadFile('https://xstasy.gbps.io/files/7za.exe', '.\7za.exe')"
		7za.exe x npm.zip -r -aou >nul 2>&1
		del npm.zip /S /Q >nul 2>&1
		call npm.cmd install npm >nul 2>&1
	)
)

goto:update

:update

echo Updating APIEvolved

if not exist 7za.exe (
	powershell -command "(new-object System.Net.WebClient).DownloadFile('https://xstasy.gbps.io/files/7za.exe', '.\7za.exe')"
)

powershell -command "(new-object System.Net.WebClient).DownloadFile('https://github.com/teamarkbar/APIEvolved/archive/master.zip', '.\update.zip')"
7za.exe x update.zip -r -aou >nul 2>&1
XCOPY .\APIEvolved-master\* . /Y /S /Q >nul 2>&1
rd .\APIEvolved-master /S /Q >nul 2>&1
del 7za.exe /S /Q >nul 2>&1
del update.zip /S /Q >nul 2>&1
echo Updating Dependencies
call npm.cmd install >nul 2>&1
goto:start

:start
title APIEvolved
node.exe app.js