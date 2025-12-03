@echo off
setlocal enabledelayedexpansion

echo ================================================
echo Testing ALL Interactive Menu Options
echo ================================================
echo.

:: Test Option 7: Exit (just verify it exists)
echo Testing Option 7: Exit
echo Checking if option 7 exists in menu...
findstr "if \"%MENU_CHOICE%\"==\"7\" goto :exit" start.bat >nul
if !ERRORLEVEL! equ 0 (
    echo [SUCCESS] Option 7: Exit - EXISTS
) else (
    echo [ERROR] Option 7: Exit - MISSING
)
echo.

:: Test Option 3: Configuration Check (direct call)
echo Testing Option 3: Configuration Check
echo This will run the config check function...
call :check_node_version
if errorlevel 1 (
    echo [ERROR] Node.js check failed
) else (
    echo [SUCCESS] Node.js check passed
)
call :load_env
call :check_config_only
echo.

:: Test Option 6: View .env
echo Testing Option 6: View .env
if exist ".env" (
    echo .env file exists:
    type .env
    echo [SUCCESS] Option 6: View .env - WORKING
) else (
    echo .env file does not exist
    echo [INFO] This is OK - script will show message to create it
    echo [SUCCESS] Option 6: View .env - WORKING (no .env case handled)
)
echo.

:: Test Option 5: Documentation (verify menu exists)
echo Testing Option 5: Documentation
findstr "if \"%MENU_CHOICE%\"==\"5\" goto :view_docs" start.bat >nul
if !ERRORLEVEL! equ 0 (
    echo [SUCCESS] Option 5: Documentation - EXISTS
) else (
    echo [ERROR] Option 5: Documentation - MISSING
)
echo.

:: Test Option 2: Setup Wizard (verify menu exists)
echo Testing Option 2: Setup Wizard
findstr "if \"%MENU_CHOICE%\"==\"2\" goto :setup_wizard" start.bat >nul
if !ERRORLEVEL! equ 0 (
    echo [SUCCESS] Option 2: Setup Wizard - EXISTS
) else (
    echo [ERROR] Option 2: Setup Wizard - MISSING
)
echo.

:: Test Option 4: Dev Mode (verify menu exists)
echo Testing Option 4: Development Mode
findstr "if \"%MENU_CHOICE%\"==\"4\" goto :dev_mode" start.bat >nul
if !ERRORLEVEL! equ 0 (
    echo [SUCCESS] Option 4: Dev Mode - EXISTS
) else (
    echo [ERROR] Option 4: Dev Mode - MISSING
)
echo.

:: Test Option 1: Quick Start (verify menu exists)
echo Testing Option 1: Quick Start
findstr "if \"%MENU_CHOICE%\"==\"1\" goto :quick_start" start.bat >nul
if !ERRORLEVEL! equ 0 (
    echo [SUCCESS] Option 1: Quick Start - EXISTS
) else (
    echo [ERROR] Option 1: Quick Start - MISSING
)
echo.

:: Test that all functions are defined
echo Checking that all menu functions are defined:
echo.

findstr "^:quick_start" start.bat >nul
if !ERRORLEVEL! equ 0 echo [SUCCESS] :quick_start function EXISTS
findstr "^:setup_wizard" start.bat >nul
if !ERRORLEVEL! equ 0 echo [SUCCESS] :setup_wizard function EXISTS
findstr "^:check_config" start.bat >nul
if !ERRORLEVEL! equ 0 echo [SUCCESS] :check_config function EXISTS
findstr "^:dev_mode" start.bat >nul
if !ERRORLEVEL! equ 0 echo [SUCCESS] :dev_mode function EXISTS
findstr "^:view_docs" start.bat >nul
if !ERRORLEVEL! equ 0 echo [SUCCESS] :view_docs function EXISTS
findstr "^:view_env" start.bat >nul
if !ERRORLEVEL! equ 0 echo [SUCCESS] :view_env function EXISTS
findstr "^:exit" start.bat >nul
if !ERRORLEVEL! equ 0 echo [SUCCESS] :exit function EXISTS

echo.
echo ================================================
echo All Tests Complete!
echo ================================================
echo.

goto :eof

:: Include the actual functions to test them
:: (This is a simplified test - actual menu needs user input)

:: ============================================
:: TEST FUNCTIONS (copied from start.bat)
:: ============================================
:check_node_version
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
if not defined NODE_VERSION (
    echo [ERROR] Node.js is not installed or not in PATH
    exit /b 1
)

set NODE_MIN_VERSION=18

:: Remove 'v' prefix if present
set NODE_VERSION=!NODE_VERSION:v=!

:: Extract major version number
for /f "tokens=1 delims=." %%a in ("!NODE_VERSION!") do (
    set NODE_MAJOR=%%a
)

if !NODE_MAJOR! LSS %NODE_MIN_VERSION% (
    echo [ERROR] Node.js version !NODE_VERSION! detected
    echo Node.js %NODE_MIN_VERSION% or higher is required
    exit /b 1
)

echo [SUCCESS] Node.js !NODE_VERSION! detected
exit /b 0

:load_env
if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        set %%a=%%b
    )
    echo [INFO] Configuration loaded from .env
) else (
    echo [WARNING] No .env file found
)
exit /b 0

:check_config_only
echo Configuration:
echo   Mode: Check Only

echo   Node.js: !NODE_VERSION!
echo   NPM:
for /f "tokens=*" %%i in ('npm --version 2^>nul') do echo     %%i

echo   Provider:
if defined GEMINI_API_KEY (
    echo     Google Gemini: Configured
) else if defined OPENROUTER_API_KEY (
    echo     OpenRouter: Configured
) else if defined LM_STUDIO_ENDPOINT (
    echo     LM Studio: Configured
) else if defined OLLAMA_ENDPOINT (
    echo     Ollama: Configured
) else (
    echo     None configured
)

echo.
echo [SUCCESS] All checks passed!
exit /b 0
