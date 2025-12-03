@echo off
setlocal enabledelayedexpansion

echo =========================================
echo   AI Council MCP Server Diagnostics
echo =========================================
echo.

REM Check Node.js
echo 1. Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo    [ERROR] Node.js not found
    echo    Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
    echo    [OK] Node.js installed: !NODE_VERSION!
)

REM Check if .env exists
echo.
echo 2. Checking configuration...
if exist ".env" (
    echo    [OK] .env file exists

    findstr /C:"GEMINI_API_KEY=" .env >nul 2>&1
    if errorlevel 1 (
        echo    [WARNING] GEMINI_API_KEY not found in .env
    ) else (
        for /f "tokens=2 delims==" %%a in ('findstr "GEMINI_API_KEY" .env') do (
            if not "%%a"=="" (
                echo    [OK] Gemini API key configured
            ) else (
                echo    [WARNING] Gemini API key not set
            )
        )
    )
) else (
    echo    [WARNING] .env file not found
    echo    Copy from .env.example: copy .env.example .env
)

REM Check if server is built
echo.
echo 3. Checking server build...
if exist "dist\index.js" (
    echo    [OK] Server built (dist\index.js exists)
) else (
    echo    [ERROR] Server not built
    echo    Run: npm run build
    pause
    exit /b 1
)

REM Test health endpoint
echo.
echo 4. Testing server health...
node dist\index.js --health >nul 2>&1
if errorlevel 1 (
    echo    [WARNING] Health check returned non-zero exit code
) else (
    echo    [OK] Server health check passed
)

REM Check HTTP bridge
echo.
echo 5. Testing HTTP bridge...
set HTTP_PORT=4000

netstat -an | findstr ":!HTTP_PORT! " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo    [INFO] HTTP bridge not running on port !HTTP_PORT!
    echo    Start it with: npm run start:http
) else (
    echo    [OK] HTTP bridge is running on port !HTTP_PORT!

    REM Test health endpoint
    curl -s http://localhost:!HTTP_PORT!/health >nul 2>&1
    if errorlevel 1 (
        echo    [WARNING] HTTP bridge not responding
    ) else (
        echo    [OK] HTTP bridge responding
    )
)

REM Summary
echo.
echo =========================================
echo   Summary
echo =========================================
echo.

if exist "dist\index.js" (
    echo Server Status: Ready
) else (
    echo Server Status: Not Built
)

if exist ".env" (
    echo Configuration: Present
) else (
    echo Configuration: Missing
)

netstat -an | findstr ":4000 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo HTTP Bridge: Not Running
) else (
    echo HTTP Bridge: Running
)

echo.
echo =========================================
echo   Recommendations
echo =========================================
echo.

if not exist ".env" (
    echo * Configure API keys: copy .env.example .env
    echo * Edit .env and add your GEMINI_API_KEY
    echo.
)

if not exist "dist\index.js" (
    echo * Build the server: npm run build
    echo.
)

netstat -an | findstr ":4000 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo * Test with HTTP bridge: npm run start:http
    echo * Then test: curl http://localhost:4000/health
    echo.
)

echo * If MCP client tools are failing, restart your MCP client (Claude Desktop, etc.)
echo * See TROUBLESHOOTING_MCP_CLIENT.md for detailed help
echo.

pause
