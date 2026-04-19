@echo off
REM AI Council Chamber API Server Startup Script for Windows
REM Usage: start-server.bat [port] [lm-host] [lm-port]

setlocal EnableDelayedExpansion

REM Default values
set PORT=%~1
set LM_HOST=%~2
set LM_PORT=%~3

if "%~1"=="" set PORT=3001
if "%~2"=="" set LM_HOST=localhost
if "%~3"=="" set LM_PORT=1234

echo.
echo ===========================================
echo   AI Council Chamber - API Server
echo ===========================================
echo.
echo Configuration:
echo   Server Port: %PORT%
echo   LM Studio:   %LM_HOST%:%LM_PORT%
echo.
echo Starting server...
echo.

set PORT=%PORT%
set LM_STUDIO_HOST=%LM_HOST%
set LM_STUDIO_PORT=%LM_PORT%

node server.js

if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start
    pause
    exit /b 1
)
