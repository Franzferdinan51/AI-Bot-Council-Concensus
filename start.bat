@echo off
setlocal enabledelayedexpansion

:: AI Council Chamber MCP Server Startup Script (Windows)
set VERSION=2.2.0
set NODE_MIN_VERSION=18

:: Check if any arguments provided
if not "%~1"=="" (
    :: If arguments provided, use legacy mode
    call :legacy_startup %*
    exit /b %ERRORLEVEL%
)

:: ============================================
:: INTERACTIVE MAIN MENU
:: ============================================
:interactive_menu
cls
echo.
echo ===============================================
echo   AI Council Chamber MCP Server v%VERSION%
echo ===============================================
echo.
echo Welcome! Choose an option:
echo.
echo   1. Quick Start (Start Server Now)
echo   2. Interactive Setup Wizard (Configure AI providers, personas, settings)
echo      NEW: Includes Dynamic Persona Selection for topic-specific expertise!
echo   3. Configure Bot Models (Set custom models for each persona)
echo      NEW: Dynamic Persona Selection available via API calls
echo   4. Configuration Check (Verify setup)
echo   5. Development Mode (with auto-reload)
echo   6. Open Documentation (View README, setup guides)
echo   7. View .env file
echo   8. Start HTTP Bridge (/health, /list-tools, /call-tool)
echo   9. Generate mcp.json from environment
echo  10. Exit
echo.
set /p MENU_CHOICE="Enter your choice (1-10): "

if "%MENU_CHOICE%"=="1" goto :quick_start
if "%MENU_CHOICE%"=="2" goto :setup_wizard
if "%MENU_CHOICE%"=="3" goto :configure_models
if "%MENU_CHOICE%"=="4" goto :check_config
if "%MENU_CHOICE%"=="5" goto :dev_mode
if "%MENU_CHOICE%"=="6" goto :view_docs
if "%MENU_CHOICE%"=="7" goto :view_env
if "%MENU_CHOICE%"=="8" goto :http_bridge
if "%MENU_CHOICE%"=="9" goto :generate_mcp
if "%MENU_CHOICE%"=="10" goto :exit

echo.
echo [ERROR] Invalid choice. Please enter a number between 1-10.
echo.
pause
goto :interactive_menu

:: ============================================
:: QUICK START
:: ============================================
:quick_start
cls
echo.
echo ===============================================
echo   Quick Start - Starting Server
echo ===============================================
echo.

:: Check Node.js version
echo [INFO] Checking Node.js version...
call :check_node_version
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js check failed
    echo.
    pause
    goto :interactive_menu
)

:: Load configuration
echo [INFO] Loading configuration...
if "%LOAD_ENV%"=="false" (
    echo [INFO] Skipping .env file load
) else if exist ".env" (
    call :load_env
) else (
    echo [WARNING] No .env file found
)

:: Install dependencies
echo [INFO] Installing dependencies...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found in PATH
    echo.
    pause
    goto :interactive_menu
)
call npm install

:: Build server
echo [INFO] Building server...
echo Note: TypeScript compilation errors may appear but build will complete
call npm run build

:: Start server
echo.
echo [SUCCESS] Starting MCP Server...
echo.
echo ========================================
echo Server is running...
echo ========================================
echo.
echo Server output will be displayed below.
echo Press Ctrl+C to stop the server.
echo ========================================
echo.

call :start_server

echo.
echo ========================================
echo Server has stopped
echo ========================================
echo.
pause
goto :interactive_menu

:: ============================================
:: SETUP WIZARD
:: ============================================
:setup_wizard
call :run_setup_wizard
goto :interactive_menu

:: ============================================
:: CONFIGURATION CHECK
:: ============================================
:check_config
cls
echo.
echo ===============================================
echo   Configuration Check
echo ===============================================
echo.

call :check_node_version
if errorlevel 1 (
    echo.
    pause
    goto :interactive_menu
)

call :load_env
call :check_config_only

echo.
pause
goto :interactive_menu

:: ============================================
:: DEVELOPMENT MODE
:: ============================================
:dev_mode
cls
echo.
echo ===============================================
echo   Development Mode
echo ===============================================
echo.
echo Starting in development mode with auto-reload...
echo.

call :check_node_version
if errorlevel 1 (
    echo.
    pause
    goto :interactive_menu
)

echo [INFO] Installing dependencies...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found in PATH
    echo.
    pause
    goto :interactive_menu
)
call npm install

echo.
echo [SUCCESS] Starting development server...
echo.
echo ========================================
echo Development server is running...
echo ========================================
echo.
echo Using npx to run tsx with auto-reload.
echo Press Ctrl+C to stop the server.
echo ========================================
echo.

if not exist "src\index.ts" (
    echo [ERROR] src\index.ts not found
    echo.
    pause
    goto :interactive_menu
)

npx tsx watch src\index.ts

echo.
echo ========================================
echo Development server has stopped
echo ========================================
echo.
pause
goto :interactive_menu

:: ============================================
:: HTTP BRIDGE MODE
:: ============================================
:http_bridge
cls
echo.
echo ===============================================
echo   HTTP Bridge Mode (/health, /list-tools, /call-tool)
echo ===============================================
echo.
echo Starts a lightweight HTTP wrapper for MCP tools.
echo.

call :check_node_version
if errorlevel 1 (
    echo.
    pause
    goto :interactive_menu
)

echo [INFO] Installing dependencies...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found in PATH
    echo.
    pause
    goto :interactive_menu
)
call npm install

echo [INFO] Building server...
call npm run build

echo.
echo [SUCCESS] Starting HTTP bridge on port %HTTP_PORT% (default 4000)...
echo Press Ctrl+C to stop the bridge.
echo.
setlocal
if "%HTTP_PORT%"=="" set HTTP_PORT=4000
npm run start:http
endlocal

echo.
echo ========================================
echo HTTP bridge has stopped
echo ========================================
echo.
pause
goto :interactive_menu

:: ============================================
:: GENERATE MCP CONFIG
:: ============================================
:generate_mcp
cls
echo.
echo ===============================================
echo   Generate mcp.json from environment
echo ===============================================
echo.

call :check_node_version
if errorlevel 1 (
    echo.
    pause
    goto :interactive_menu
)

echo [INFO] Installing dependencies...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found in PATH
    echo.
    pause
    goto :interactive_menu
)
call npm install

echo [INFO] Generating mcp.json using env vars...
call npm run gen:mcp

echo.
echo [SUCCESS] mcp.json updated.
echo.
pause
goto :interactive_menu

:: ============================================
:: VIEW DOCUMENTATION
:: ============================================
:view_docs
cls
echo.
echo ===============================================
echo   Documentation
echo ===============================================
echo.
echo Available documentation files:
echo.
echo   1. README.md - Main documentation
echo   2. SETUP.md - Detailed setup guide
echo   3. INSTALL.md - Installation instructions
echo   4. SETUP_WIZARD_GUIDE.md - Interactive setup guide
echo   5. TROUBLESHOOTING.md - Common issues and solutions
echo   6. STARTUP_GUIDE.md - Startup script options
echo   7. DYNAMIC_PERSONA_SELECTION.md - NEW: AI-powered persona selection guide
echo.
set /p DOC_CHOICE="View which file? (1-7) or 'q' to quit: "

if "%DOC_CHOICE%"=="q" goto :interactive_menu

if "%DOC_CHOICE%"=="1" (
    type README.md | more
    goto :view_docs
)
if "%DOC_CHOICE%"=="2" (
    type SETUP.md | more
    goto :view_docs
)
if "%DOC_CHOICE%"=="3" (
    type INSTALL.md | more
    goto :view_docs
)
if "%DOC_CHOICE%"=="4" (
    type SETUP_WIZARD_GUIDE.md | more
    goto :view_docs
)
if "%DOC_CHOICE%"=="5" (
    type TROUBLESHOOTING.md | more
    goto :view_docs
)
if "%DOC_CHOICE%"=="6" (
    type STARTUP_GUIDE.md | more
    goto :view_docs
)
if "%DOC_CHOICE%"=="7" (
    type DYNAMIC_PERSONA_SELECTION.md | more
    goto :view_docs
)

echo [ERROR] Invalid choice
echo.
pause
goto :view_docs

:: ============================================
:: VIEW .ENV FILE
:: ============================================
:view_env
cls
echo.
echo ===============================================
echo   .env File Viewer
echo ===============================================
echo.
if exist ".env" (
    echo Current .env file contents:
    echo.
    type .env
) else (
    echo [INFO] No .env file found.
    echo.
    echo Create one by:
    echo   - Running the Setup Wizard (option 2)
    echo   - Copying from .env.example
)

echo.
pause
goto :interactive_menu

:: ============================================
:: EXIT
:: ============================================
:exit
echo.
echo Goodbye!
echo.
exit /b 0

:: ============================================
:: LEGACY COMMAND-LINE MODE
:: ============================================
:legacy_startup
set SKIP_INSTALL=false
set SKIP_BUILD=false
set DEV_MODE=false
set CHECK_ONLY=false
set LOAD_ENV=true

:parse_args
if "%~1"=="" goto :start_legacy
if "%~1"=="-h" goto :usage_legacy
if "%~1"=="--help" goto :usage_legacy
if "%~1"=="-d" set DEV_MODE=true&shift&goto :parse_args
if "%~1"=="--dev" set DEV_MODE=true&shift&goto :parse_args
if "%~1"=="-i" set SKIP_INSTALL=true&shift&goto :parse_args
if "%~1"=="--skip-install" set SKIP_INSTALL=true&shift&goto :parse_args
if "%~1"=="-b" set SKIP_BUILD=true&shift&goto :parse_args
if "%~1"=="--skip-build" set SKIP_BUILD=true&shift&goto :parse_args
if "%~1"=="-c" set CHECK_ONLY=true&shift&goto :parse_args
if "%~1"=="--check-only" set CHECK_ONLY=true&shift&goto :parse_args
if "%~1"=="--no-env" set LOAD_ENV=false&shift&goto :parse_args
if "%~1"=="--node-version" echo Node.js %NODE_MIN_VERSION% or higher required&exit /b 0
if "%~1"=="-v" echo AI Council MCP Server v%VERSION%&exit /b 0
if "%~1"=="--version" echo AI Council MCP Server v%VERSION%&exit /b 0
if "%~1"=="-s" goto :setup_wizard
if "%~1"=="--setup" goto :setup_wizard
echo [ERROR] Unknown option: %~1
echo.
goto :usage_legacy

:usage_legacy
echo AI Council Chamber MCP Server v%VERSION%
echo.
echo Usage: %~nx0 [OPTIONS]
echo.
echo Options:
echo     -s, --setup              Interactive setup wizard
echo     -h, --help               Show this help message
echo     -d, --dev                Run in development mode (tsx watch)
echo     -i, --skip-install       Skip npm install
echo     -b, --skip-build         Skip TypeScript build
echo     -c, --check-only         Only run checks, don't start server
echo     --no-env                 Don't load .env file
echo     --node-version           Show required Node.js version
echo     -v, --version            Show version
echo.
echo Quick Start:
echo     %~nx0 --setup            Run interactive setup wizard
echo     %~nx0                     Start server with current config
echo.
echo Examples:
echo     %~nx0 -d                 Start in development mode
echo     %~nx0 -i -b              Skip install and build
echo     %~nx0 -c                 Run configuration checks
echo.
exit /b 0

:start_legacy
cls
echo ===========================================
echo AI Council Chamber MCP Server v%VERSION%
echo ===========================================
echo.

call :check_node_version
if errorlevel 1 exit /b 1

echo [INFO] Starting AI Council Chamber MCP Server...
call :load_env

if "%CHECK_ONLY%"=="true" (
    call :check_config_only
    exit /b 0
)

if "%SKIP_INSTALL%"=="false" (
    echo [INFO] Installing dependencies...
    call :npm_install
    if errorlevel 1 exit /b 1
)

if "%SKIP_BUILD%"=="false" (
    echo [INFO] Building server...
    call :npm_build
    if errorlevel 1 exit /b 1
)

echo.
if "%DEV_MODE%"=="true" (
    echo [SUCCESS] Starting in development mode...
    call :start_dev_server
) else (
    echo [SUCCESS] Starting MCP Server...
    call :start_server
)

exit /b 0

:: ============================================
:: SETUP WIZARD IMPLEMENTATION
:: ============================================
:run_setup_wizard
cls
echo.
echo ===============================================
echo   AI Council Chamber - Setup Wizard
echo ===============================================
echo.
echo This wizard will help you configure:
echo   1. AI Providers (Gemini, OpenRouter, etc.)
echo   2. Council Personas (enable/disable bots)
echo      NEW: Dynamic Persona Selection for topic-specific expertise!
echo   3. Server Settings
echo.
echo NEW IN v2.2: Bot-Specific Memory System
echo   - Bots remember context across sessions
echo   - Persistent facts, observations, and directives
echo.
echo Press any key to continue...
pause >nul

:: Load existing .env if present
if exist ".env" (
    call :load_env
    echo [INFO] Loaded existing .env file
    echo.
)

:: Step 1: AI Provider Configuration
call :setup_providers

:: Step 2: Council Personas
call :setup_personas

:: Step 3: Server Configuration
call :setup_server

:: Step 4: Save Configuration
call :save_env

echo.
echo [SUCCESS] Setup complete!
echo.
pause
exit /b 0

:: ============================================
:: STEP 1: AI PROVIDER CONFIGURATION
:: ============================================
:setup_providers
cls
echo.
echo ===============================================
echo STEP 1: Configure AI Providers
echo ===============================================
echo.
echo Choose your AI provider (can configure multiple):
echo.
echo   1. Google Gemini (Recommended - Free tier available)
echo   2. OpenRouter (Access to Claude, GPT-4, Llama, etc.)
echo   3. LM Studio (Local models)
echo   4. Ollama (Local models)
echo.
echo Provider: Google Gemini is recommended for beginners.
echo.

set GEMINI_API_KEY=
set OPENROUTER_API_KEY=
set LM_STUDIO_ENDPOINT=
set OLLAMA_ENDPOINT=

set /p GEMINI_CHOICE="Do you want to configure Google Gemini? (y/n) [y]: "
if "!GEMINI_CHOICE!"=="" set GEMINI_CHOICE=y
if /i "!GEMINI_CHOICE!"=="y" (
    set /p GEMINI_API_KEY="Enter your Gemini API Key: "
    if not defined GEMINI_API_KEY set GEMINI_API_KEY=
)

echo.
set /p OPENROUTER_CHOICE="Do you want to configure OpenRouter? (y/n) [n]: "
if /i "!OPENROUTER_CHOICE!"=="y" (
    set /p OPENROUTER_API_KEY="Enter your OpenRouter API Key: "
    if not defined OPENROUTER_API_KEY set OPENROUTER_API_KEY=
)

echo.
set /p LM_STUDIO_CHOICE="Do you want to configure LM Studio? (y/n) [n]: "
if /i "!LM_STUDIO_CHOICE!"=="y" (
    set /p LM_STUDIO_ENDPOINT="Enter LM Studio endpoint [http://localhost:1234/v1/chat/completions]: "
    if "!LM_STUDIO_ENDPOINT!"=="" set LM_STUDIO_ENDPOINT=http://localhost:1234/v1/chat/completions
) else (
    set LM_STUDIO_ENDPOINT=
)

echo.
set /p OLLAMA_CHOICE="Do you want to configure Ollama? (y/n) [n]: "
if /i "!OLLAMA_CHOICE!"=="y" (
    set /p OLLAMA_ENDPOINT="Enter Ollama endpoint [http://localhost:11434/v1/chat/completions]: "
    if "!OLLAMA_ENDPOINT!"=="" set OLLAMA_ENDPOINT=http://localhost:11434/v1/chat/completions
) else (
    set OLLAMA_ENDPOINT=
)

echo.
echo [SUCCESS] AI providers configured
pause
exit /b 0

:: ============================================
:: STEP 2: COUNCIL PERSONAS
:: ============================================
:setup_personas
cls
echo.
echo ===============================================
echo STEP 2: Configure Council Personas
echo ===============================================
echo.
echo Choose council preset:
echo.
echo   1. Beginner (Core 4 councilors - Speaker, Technocrat, Ethicist, Pragmatist)
echo   2. Advanced (12 councilors with specialists)
echo   3. Custom (Choose each persona individually)
echo.
set /p PERSONAS_CHOICE="Enter your choice (1-3) [1]: "
if "!PERSONAS_CHOICE!"=="" set PERSONAS_CHOICE=1

if "!PERSONAS_CHOICE!"=="1" (
    echo.
    echo Beginner preset selected.
    echo The Speaker, Technocrat, Ethicist, and Pragmatist will be enabled.
    pause
) else if "!PERSONAS_CHOICE!"=="2" (
    echo.
    echo Advanced preset selected.
    echo All councilors and specialists will be enabled.
    pause
) else if "!PERSONAS_CHOICE!"=="3" (
    call :setup_custom_personas
) else (
    echo Invalid choice.
    pause
    goto :setup_personas
)
exit /b 0

:setup_custom_personas
cls
echo.
echo ===============================================
echo Custom Council Configuration
echo ===============================================
echo.
echo Enable/Disable each persona (y/n):
echo.

rem Initialize all persona flags
set VISIONARY_ENABLED=false
set SENTINEL_ENABLED=false
set HISTORIAN_ENABLED=false
set CODER_ENABLED=false

set /p ENABLE_SPEAKER="Enable The Speaker (y/n) [y]: "
if "!ENABLE_SPEAKER!"=="" set ENABLE_SPEAKER=y

set /p ENABLE_TECHNOCRAT="Enable The Technocrat (y/n) [y]: "
if "!ENABLE_TECHNOCRAT!"=="" set ENABLE_TECHNOCRAT=y

set /p ENABLE_ETHICIST="Enable The Ethicist (y/n) [y]: "
if "!ENABLE_ETHICIST!"=="" set ENABLE_ETHICIST=y

set /p ENABLE_PRAGMATIST="Enable The Pragmatist (y/n) [y]: "
if "!ENABLE_PRAGMATIST!"=="" set ENABLE_PRAGMATIST=y

set /p ENABLE_VISIONARY="Enable The Visionary (y/n) [n]: "
if /i "!ENABLE_VISIONARY!"=="y" set VISIONARY_ENABLED=true

set /p ENABLE_SENTINEL="Enable The Sentinel (y/n) [n]: "
if /i "!ENABLE_SENTINEL!"=="y" set SENTINEL_ENABLED=true

set /p ENABLE_HISTORIAN="Enable The Historian (y/n) [n]: "
if /i "!ENABLE_HISTORIAN!"=="y" set HISTORIAN_ENABLED=true

set /p ENABLE_CODER="Enable Specialist Coder (y/n) [n]: "
if /i "!ENABLE_CODER!"=="y" set CODER_ENABLED=true

echo.
echo [SUCCESS] Custom council configured
pause
exit /b 0

:: ============================================
:: STEP 3: SERVER CONFIGURATION
:: ============================================
:setup_server
cls
echo.
echo ===============================================
echo STEP 3: Server Configuration
echo ===============================================
echo.
echo These settings control behavior and costs:
echo.

set /p ECONOMY_MODE="Enable Economy Mode? (reduces API costs) (y/n) [y]: "
if "!ECONOMY_MODE!"=="" set ECONOMY_MODE=y

set /p MAX_REQUESTS="Max concurrent API requests (1-5) [2]: "
if "!MAX_REQUESTS!"=="" set MAX_REQUESTS=2

set /p MAX_TURNS="Max context turns to keep (5-20) [8]: "
if "!MAX_TURNS!"=="" set MAX_TURNS=8

set CUSTOM_DIRECTIVE=
set /p CUSTOM_DIRECTIVE="Custom system directive (optional, press Enter to skip): "

echo.
echo [SUCCESS] Server configuration complete
pause
exit /b 0

:: ============================================
:: SAVE .ENV FILE
:: ============================================
:save_env
cls
echo.
echo ===============================================
echo STEP 4: Save Configuration
echo ===============================================
echo.
echo Review your settings:
echo.

if defined GEMINI_API_KEY (
    if not "!GEMINI_API_KEY!"=="" echo   Google Gemini: Configured
)
if defined OPENROUTER_API_KEY (
    if not "!OPENROUTER_API_KEY!"=="" echo   OpenRouter: Configured
)
if defined LM_STUDIO_ENDPOINT (
    if not "!LM_STUDIO_ENDPOINT!"=="" echo   LM Studio: Configured
)
if defined OLLAMA_ENDPOINT (
    if not "!OLLAMA_ENDPOINT!"=="" echo   Ollama: Configured
)

echo.
echo Environment variables to save:
echo.
echo MAX_CONCURRENT_REQUESTS=!MAX_REQUESTS!
echo MAX_CONTEXT_TURNS=!MAX_TURNS!
if /i "!ECONOMY_MODE!"=="y" echo ECONOMY_MODE=true
if defined CUSTOM_DIRECTIVE (
    if not "!CUSTOM_DIRECTIVE!"=="" echo CUSTOM_DIRECTIVE=!CUSTOM_DIRECTIVE!
)
echo.

set /p SAVE_CHOICE="Save these settings to .env file? (y/n) [y]: "
if "!SAVE_CHOICE!"=="" set SAVE_CHOICE=y
if /i not "!SAVE_CHOICE!"=="y" (
    echo [INFO] Settings not saved
    echo.
    pause
    exit /b 0
)

:: Save .env file
echo # AI Council Chamber Configuration > .env
echo # Generated on %DATE% %TIME% >> .env
echo. >> .env

if defined GEMINI_API_KEY (
    if not "!GEMINI_API_KEY!"=="" echo GEMINI_API_KEY=!GEMINI_API_KEY! >> .env
)
if defined OPENROUTER_API_KEY (
    if not "!OPENROUTER_API_KEY!"=="" echo OPENROUTER_API_KEY=!OPENROUTER_API_KEY! >> .env
)
if defined LM_STUDIO_ENDPOINT (
    if not "!LM_STUDIO_ENDPOINT!"=="" echo LM_STUDIO_ENDPOINT=!LM_STUDIO_ENDPOINT! >> .env
)
if defined OLLAMA_ENDPOINT (
    if not "!OLLAMA_ENDPOINT!"=="" echo OLLAMA_ENDPOINT=!OLLAMA_ENDPOINT! >> .env
)

echo MAX_CONCURRENT_REQUESTS=!MAX_REQUESTS! >> .env
echo MAX_CONTEXT_TURNS=!MAX_TURNS! >> .env

if /i "!ECONOMY_MODE!"=="y" echo ECONOMY_MODE=true >> .env

if defined CUSTOM_DIRECTIVE (
    if not "!CUSTOM_DIRECTIVE!"=="" echo CUSTOM_DIRECTIVE=!CUSTOM_DIRECTIVE! >> .env
)

echo.
echo [SUCCESS] Configuration saved to .env
echo.
pause
exit /b 0

:: ============================================
:: CONFIGURE BOT MODELS
:: ============================================
:configure_models
cls
echo.
echo ===============================================
echo   Configure Bot Models for Personas
echo ===============================================
echo.
echo This allows you to set custom AI models for each persona.
echo Each bot can use a different model (Claude, GPT-4, Llama, etc.)
echo.
echo Current default model: gemini-2.5-flash (for all bots)
echo.
echo NEW FEATURE: Dynamic Persona Selection
echo   Use settings.bots parameter in API calls to select topic-specific experts!
echo   Example: Science topics ^> Enable specialist-science automatically
echo   See DYNAMIC_PERSONA_SELECTION.md for full guide (Option 7 in Docs)
echo.
echo Press any key to continue...
pause >nul

:: Load existing .env
if exist ".env" (
    call :load_env
    echo [INFO] Loaded existing .env file
    echo.
)

cls
echo ===============================================
echo   Configure Bot Models
echo ===============================================
echo.
echo Available bots and their current models:
echo.
echo   Speaker (High Council)        - Current: gemini-2.5-flash
echo   The Facilitator (Moderator)   - Current: gemini-2.5-flash
echo   The Technocrat                - Current: gemini-2.5-flash
echo   The Ethicist                  - Current: gemini-2.5-flash
echo   The Pragmatist                - Current: gemini-2.5-flash
echo   The Visionary                 - Current: gemini-2.5-flash
echo   The Sentinel                  - Current: gemini-2.5-flash
echo   The Historian                 - Current: gemini-2.5-flash
echo   The Diplomat                  - Current: gemini-2.5-flash
echo   The Skeptic                   - Current: gemini-2.5-flash
echo   The Conspiracist              - Current: gemini-2.5-flash
echo   The Journalist                - Current: gemini-2.5-flash
echo   The Propagandist              - Current: gemini-2.5-flash
echo   The Psychologist               - Current: gemini-2.5-flash
echo   The Libertarian                - Current: gemini-2.5-flash
echo   The Progressive                - Current: gemini-2.5-flash
echo   The Conservative               - Current: gemini-2.5-flash
echo   The Independent                - Current: gemini-2.5-flash
echo   Specialist Coder              - Current: gemini-2.5-flash
echo.
echo Choose configuration mode:
echo   1. Quick Configure (Set model for all bots at once)
echo   2. Advanced Configure (Set individual models)
echo   3. Reset to defaults (Remove all custom models)
echo   4. Exit without changes
echo.
set /p MODEL_CHOICE="Enter your choice (1-4): "

if "%MODEL_CHOICE%"=="1" goto :quick_configure_models
if "%MODEL_CHOICE%"=="2" goto :advanced_configure_models
if "%MODEL_CHOICE%"=="3" goto :reset_model_configs
if "%MODEL_CHOICE%"=="4" goto :interactive_menu

echo Invalid choice.
pause
goto :configure_models

:quick_configure_models
cls
echo.
echo ===============================================
echo   Quick Configure - Set Model for All Bots
echo ===============================================
echo.
echo Choose AI Provider:
echo   1. Google Gemini (gemini-2.5-flash, gemini-1.5-pro)
echo   2. OpenRouter (Claude, GPT-4, Llama models)
echo   3. OpenAI (gpt-4o, gpt-4-turbo)
echo   4. Custom (Enter model name manually)
echo.
set /p PROVIDER_CHOICE="Enter provider (1-4): "

set DEFAULT_MODEL=
if "%PROVIDER_CHOICE%"=="1" (
    set DEFAULT_MODEL=gemini-2.5-flash
    echo Using Google Gemini models
) else if "%PROVIDER_CHOICE%"=="2" (
    echo.
    echo Available OpenRouter models:
    echo   - anthropic/claude-3.5-sonnet (Recommended)
    echo   - openai/gpt-4o-mini
    echo   - meta-llama/llama-3.1-70b-instruct
    echo   - mistralai/mistral-large
    echo.
    set /p DEFAULT_MODEL="Enter OpenRouter model name: "
) else if "%PROVIDER_CHOICE%"=="3" (
    echo.
    echo Available OpenAI models:
    echo   - gpt-4o (Recommended)
    echo   - gpt-4o-mini
    echo   - gpt-4-turbo
    echo.
    set /p DEFAULT_MODEL="Enter OpenAI model name: "
) else if "%PROVIDER_CHOICE%"=="4" (
    set /p DEFAULT_MODEL="Enter custom model name: "
) else (
    echo Invalid choice
    pause
    goto :quick_configure_models
)

if "!DEFAULT_MODEL!"=="" (
    echo [ERROR] Model name cannot be empty
    pause
    goto :quick_configure_models
)

echo.
echo Setting all bots to use: !DEFAULT_MODEL!
echo.
set /p CONFIRM_SETTING="Proceed with this setting? (y/n) [y]: "
if "!CONFIRM_SETTING!"=="" set CONFIRM_SETTING=y
if /i not "!CONFIRM_SETTING!"=="y" goto :configure_models

:: Generate model configuration
call :generate_model_config "!DEFAULT_MODEL!"
goto :save_models_and_exit

:advanced_configure_models
cls
echo.
echo ===============================================
echo   Advanced Configure - Individual Bot Models
echo ===============================================
echo.
echo This will configure each bot individually.
echo You can skip bots you don't want to change.
echo.
set /p CONTINUE_ADVANCED="Continue? (y/n) [y]: "
if "!CONTINUE_ADVANCED!"=="" set CONTINUE_ADVANCED=y
if /i not "!CONTINUE_ADVANCED!"=="y" goto :configure_models

:: Configure each bot
echo.
echo Configure Speaker (High Council):
set /p MODEL_speaker_high_council="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Facilitator (Moderator):
set /p MODEL_moderator_facilitator="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Technocrat:
set /p MODEL_councilor_technocrat="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Ethicist:
set /p MODEL_councilor_ethicist="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Pragmatist:
set /p MODEL_councilor_pragmatist="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Visionary:
set /p MODEL_councilor_visionary="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Sentinel:
set /p MODEL_councilor_sentinel="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Historian:
set /p MODEL_councilor_historian="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Diplomat:
set /p MODEL_councilor_diplomat="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Skeptic:
set /p MODEL_councilor_skeptic="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Conspiracist:
set /p MODEL_councilor_conspiracist="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Journalist:
set /p MODEL_councilor_journalist="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Propagandist:
set /p MODEL_councilor_propagandist="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Psychologist:
set /p MODEL_councilor_psychologist="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Libertarian:
set /p MODEL_councilor_libertarian="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Progressive:
set /p MODEL_councilor_progressive="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Conservative:
set /p MODEL_councilor_conservative="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure The Independent:
set /p MODEL_councilor_independent="Model (current: gemini-2.5-flash, press Enter to keep): "

echo.
echo Configure Specialist Coder:
set /p MODEL_specialist_code="Model (current: gemini-2.5-flash, press Enter to keep): "

:: Generate model configuration from entered values
call :generate_model_config "" "advanced"
goto :save_models_and_exit

:generate_model_config
set DEFAULT_MODEL=%~1
set CONFIG_MODE=%~2

if "%CONFIG_MODE%"=="advanced" (
    :: For advanced mode, build the config from individual variables
    echo.
    echo Generated configurations:
    echo.

    if defined MODEL_speaker_high_council (
        if not "!MODEL_speaker_high_council!"=="" echo MODEL_SPEAKER_HIGH_COUNCIL=!MODEL_speaker_high_council!
    )
    if defined MODEL_moderator_facilitator (
        if not "!MODEL_moderator_facilitator!"=="" echo MODEL_MODERATOR_FACILITATOR=!MODEL_moderator_facilitator!
    )
    if defined MODEL_councilor_technocrat (
        if not "!MODEL_councilor_technocrat!"=="" echo MODEL_COUNCILOR_TECHNOCRAT=!MODEL_councilor_technocrat!
    )
    if defined MODEL_councilor_ethicist (
        if not "!MODEL_councilor_ethicist!"=="" echo MODEL_COUNCILOR_ETHICIST=!MODEL_councilor_ethicist!
    )
    if defined MODEL_councilor_pragmatist (
        if not "!MODEL_councilor_pragmatist!"=="" echo MODEL_COUNCILOR_PRAGMATIST=!MODEL_councilor_pragmatist!
    )
    if defined MODEL_councilor_visionary (
        if not "!MODEL_councilor_visionary!"=="" echo MODEL_COUNCILOR_VISIONARY=!MODEL_councilor_visionary!
    )
    if defined MODEL_councilor_sentinel (
        if not "!MODEL_councilor_sentinel!"=="" echo MODEL_COUNCILOR_SENTINEL=!MODEL_councilor_sentinel!
    )
    if defined MODEL_councilor_historian (
        if not "!MODEL_councilor_historian!"=="" echo MODEL_COUNCILOR_HISTORIAN=!MODEL_councilor_historian!
    )
    if defined MODEL_councilor_diplomat (
        if not "!MODEL_councilor_diplomat!"=="" echo MODEL_COUNCILOR_DIPLOMAT=!MODEL_councilor_diplomat!
    )
    if defined MODEL_councilor_skeptic (
        if not "!MODEL_councilor_skeptic!"=="" echo MODEL_COUNCILOR_SKEPTIC=!MODEL_councilor_skeptic!
    )
    if defined MODEL_councilor_conspiracist (
        if not "!MODEL_councilor_conspiracist!"=="" echo MODEL_COUNCILOR_CONSPIRACIST=!MODEL_councilor_conspiracist!
    )
    if defined MODEL_councilor_journalist (
        if not "!MODEL_councilor_journalist!"=="" echo MODEL_COUNCILOR_JOURNALIST=!MODEL_councilor_journalist!
    )
    if defined MODEL_councilor_propagandist (
        if not "!MODEL_councilor_propagandist!"=="" echo MODEL_COUNCILOR_PROPAGANDIST=!MODEL_councilor_propagandist!
    )
    if defined MODEL_councilor_psychologist (
        if not "!MODEL_councilor_psychologist!"=="" echo MODEL_COUNCILOR_PSYCHOLOGIST=!MODEL_councilor_psychologist!
    )
    if defined MODEL_councilor_libertarian (
        if not "!MODEL_councilor_libertarian!"=="" echo MODEL_COUNCILOR_LIBERTARIAN=!MODEL_councilor_libertarian!
    )
    if defined MODEL_councilor_progressive (
        if not "!MODEL_councilor_progressive!"=="" echo MODEL_COUNCILOR_PROGRESSIVE=!MODEL_councilor_progressive!
    )
    if defined MODEL_councilor_conservative (
        if not "!MODEL_councilor_conservative!"=="" echo MODEL_COUNCILOR_CONSERVATIVE=!MODEL_councilor_conservative!
    )
    if defined MODEL_councilor_independent (
        if not "!MODEL_councilor_independent!"=="" echo MODEL_COUNCILOR_INDEPENDENT=!MODEL_councilor_independent!
    )
    if defined MODEL_specialist_code (
        if not "!MODEL_specialist_code!"=="" echo MODEL_SPECIALIST_CODE=!MODEL_specialist_code!
    )
) else (
    :: For quick mode, set all bots to the same model
    echo.
    echo All bots will use: !DEFAULT_MODEL!
    echo.
)
exit /b 0

:reset_model_configs
cls
echo.
echo ===============================================
echo   Reset Model Configurations
echo ===============================================
echo.
echo This will remove all custom model configurations.
echo All bots will revert to default model: gemini-2.5-flash
echo.
set /p CONFIRM_RESET="Are you sure? (y/n) [n]: "
if /i not "!CONFIRM_RESET!"=="y" (
    echo [INFO] Reset cancelled
    pause
    goto :configure_models
)

:: Remove MODEL_ variables from .env
if exist ".env" (
    echo [INFO] Removing model configurations from .env...
    powershell -Command "(Get-Content .env) | Where-Object { $_ -notmatch '^MODEL_' } | Set-Content .env.tmp" 2>nul
    if exist ".env.tmp" (
        move /y ".env.tmp" ".env" >nul 2>&1
    )
)

echo [SUCCESS] Model configurations reset
echo.
pause
goto :interactive_menu

:save_models_and_exit
echo.
set /p SAVE_MODELS="Save these model configurations to .env? (y/n) [y]: "
if "!SAVE_MODELS!"=="" set SAVE_MODELS=y
if /i not "!SAVE_MODELS!"=="y" (
    echo [INFO] Model configurations not saved
    pause
    goto :interactive_menu
)

:: Append model configurations to .env
echo. >> .env
echo # ======================================== >> .env
echo # CUSTOM BOT MODEL CONFIGURATIONS >> .env
echo # ======================================== >> .env
echo # Updated: %DATE% %TIME% >> .env
echo # >> .env

if "%CONFIG_MODE%"=="advanced" (
    :: Save individual configurations
    if defined MODEL_speaker_high_council (
        if not "!MODEL_speaker_high_council!"=="" echo MODEL_SPEAKER_HIGH_COUNCIL=!MODEL_speaker_high_council! >> .env
    )
    if defined MODEL_moderator_facilitator (
        if not "!MODEL_moderator_facilitator!"=="" echo MODEL_MODERATOR_FACILITATOR=!MODEL_moderator_facilitator! >> .env
    )
    if defined MODEL_councilor_technocrat (
        if not "!MODEL_councilor_technocrat!"=="" echo MODEL_COUNCILOR_TECHNOCRAT=!MODEL_councilor_technocrat! >> .env
    )
    if defined MODEL_councilor_ethicist (
        if not "!MODEL_councilor_ethicist!"=="" echo MODEL_COUNCILOR_ETHICIST=!MODEL_councilor_ethicist! >> .env
    )
    if defined MODEL_councilor_pragmatist (
        if not "!MODEL_councilor_pragmatist!"=="" echo MODEL_COUNCILOR_PRAGMATIST=!MODEL_councilor_pragmatist! >> .env
    )
    if defined MODEL_councilor_visionary (
        if not "!MODEL_councilor_visionary!"=="" echo MODEL_COUNCILOR_VISIONARY=!MODEL_councilor_visionary! >> .env
    )
    if defined MODEL_councilor_sentinel (
        if not "!MODEL_councilor_sentinel!"=="" echo MODEL_COUNCILOR_SENTINEL=!MODEL_councilor_sentinel! >> .env
    )
    if defined MODEL_councilor_historian (
        if not "!MODEL_councilor_historian!"=="" echo MODEL_COUNCILOR_HISTORIAN=!MODEL_councilor_historian! >> .env
    )
    if defined MODEL_councilor_diplomat (
        if not "!MODEL_councilor_diplomat!"=="" echo MODEL_COUNCILOR_DIPLOMAT=!MODEL_councilor_diplomat! >> .env
    )
    if defined MODEL_councilor_skeptic (
        if not "!MODEL_councilor_skeptic!"=="" echo MODEL_COUNCILOR_SKEPTIC=!MODEL_councilor_skeptic! >> .env
    )
    if defined MODEL_councilor_conspiracist (
        if not "!MODEL_councilor_conspiracist!"=="" echo MODEL_COUNCILOR_CONSPIRACIST=!MODEL_councilor_conspiracist! >> .env
    )
    if defined MODEL_councilor_journalist (
        if not "!MODEL_councilor_journalist!"=="" echo MODEL_COUNCILOR_JOURNALIST=!MODEL_councilor_journalist! >> .env
    )
    if defined MODEL_councilor_propagandist (
        if not "!MODEL_councilor_propagandist!"=="" echo MODEL_COUNCILOR_PROPAGANDIST=!MODEL_councilor_propagandist! >> .env
    )
    if defined MODEL_councilor_psychologist (
        if not "!MODEL_councilor_psychologist!"=="" echo MODEL_COUNCILOR_PSYCHOLOGIST=!MODEL_councilor_psychologist! >> .env
    )
    if defined MODEL_councilor_libertarian (
        if not "!MODEL_councilor_libertarian!"=="" echo MODEL_COUNCILOR_LIBERTARIAN=!MODEL_councilor_libertarian! >> .env
    )
    if defined MODEL_councilor_progressive (
        if not "!MODEL_councilor_progressive!"=="" echo MODEL_COUNCILOR_PROGRESSIVE=!MODEL_councilor_progressive! >> .env
    )
    if defined MODEL_councilor_conservative (
        if not "!MODEL_councilor_conservative!"=="" echo MODEL_COUNCILOR_CONSERVATIVE=!MODEL_councilor_conservative! >> .env
    )
    if defined MODEL_councilor_independent (
        if not "!MODEL_councilor_independent!"=="" echo MODEL_COUNCILOR_INDEPENDENT=!MODEL_councilor_independent! >> .env
    )
    if defined MODEL_specialist_code (
        if not "!MODEL_specialist_code!"=="" echo MODEL_SPECIALIST_CODE=!MODEL_specialist_code! >> .env
    )
) else (
    :: Save universal configuration
    echo # All bots using same model: !DEFAULT_MODEL! >> .env
    echo MODEL_SPEAKER_HIGH_COUNCIL=!DEFAULT_MODEL! >> .env
    echo MODEL_MODERATOR_FACILITATOR=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_TECHNOCRAT=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_ETHICIST=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_PRAGMATIST=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_VISIONARY=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_SENTINEL=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_HISTORIAN=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_DIPLOMAT=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_SKEPTIC=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_CONSPIRACIST=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_JOURNALIST=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_PROPAGANDIST=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_PSYCHOLOGIST=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_LIBERTARIAN=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_PROGRESSIVE=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_CONSERVATIVE=!DEFAULT_MODEL! >> .env
    echo MODEL_COUNCILOR_INDEPENDENT=!DEFAULT_MODEL! >> .env
    echo MODEL_SPECIALIST_CODE=!DEFAULT_MODEL! >> .env
)

echo. >> .env
echo [SUCCESS] Model configurations saved to .env
echo.
echo Changes will take effect when you restart the server.
echo.
pause
goto :interactive_menu

:: ============================================
:: UTILITY FUNCTIONS
:: ============================================
:check_node_version
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
if not defined NODE_VERSION (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js %NODE_MIN_VERSION% or higher
    echo Download from: https://nodejs.org/
    exit /b 1
)

:: Remove 'v' prefix if present
set NODE_VERSION=!NODE_VERSION:v=!

:: Extract major version number (first number before first dot)
for /f "tokens=1 delims=." %%a in ("!NODE_VERSION!") do (
    set NODE_MAJOR=%%a
)

if !NODE_MAJOR! LSS %NODE_MIN_VERSION% (
    echo [ERROR] Node.js version !NODE_VERSION! detected
    echo Node.js %NODE_MIN_VERSION% or higher is required
    echo Please update from: https://nodejs.org/
    exit /b 1
)

echo [SUCCESS] Node.js !NODE_VERSION! detected
exit /b 0

:load_env
if "%LOAD_ENV%"=="false" (
    echo [INFO] Skipping .env file load
    exit /b 0
)

if exist ".env" (
    echo [INFO] Loading .env configuration...
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if not "%%a"=="" if not "%%b"=="" (
            echo "%%a" | findstr /v "#" >nul
            if not errorlevel 1 (
                set "ENV_KEY=%%a"
                set "ENV_KEY=!ENV_KEY: =!"
                if not "!ENV_KEY!"=="" (
                    set "%%a=%%b"
                )
            )
        )
    )
    echo [INFO] Configuration loaded from .env
) else (
    echo [WARNING] No .env file found
)
exit /b 0

:npm_install
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found in PATH
    exit /b 1
)
call npm install
exit /b errorlevel

:npm_build
where tsc >nul 2>&1
if errorlevel 1 (
    echo [ERROR] tsc (TypeScript compiler) not found
    echo Run: npm install
    exit /b 1
)
call npm run build
exit /b errorlevel

:check_config_only
echo Configuration:
echo   Mode: Check Only
call :check_node_version
if errorlevel 1 exit /b 1

echo   Node.js: !NODE_VERSION!
echo   NPM:
for /f "tokens=*" %%i in ('npm --version 2^>nul') do echo     %%i

echo   Provider:
if defined GEMINI_API_KEY (
    if not "!GEMINI_API_KEY!"=="" (
        echo     Google Gemini: Configured
        set PROVIDER_CONFIGURED=true
    )
)
if defined OPENROUTER_API_KEY (
    if not "!OPENROUTER_API_KEY!"=="" (
        echo     OpenRouter: Configured
        set PROVIDER_CONFIGURED=true
    )
)
if defined LM_STUDIO_ENDPOINT (
    if not "!LM_STUDIO_ENDPOINT!"=="" (
        echo     LM Studio: Configured
        set PROVIDER_CONFIGURED=true
    )
)
if defined OLLAMA_ENDPOINT (
    if not "!OLLAMA_ENDPOINT!"=="" (
        echo     Ollama: Configured
        set PROVIDER_CONFIGURED=true
    )
)
if not defined PROVIDER_CONFIGURED (
    echo     None configured
    set PROVIDER_CONFIGURED=false
)

if "!PROVIDER_CONFIGURED!"=="false" (
    echo.
    echo [WARNING] No AI provider API keys configured
    echo.
    echo Please set at least one provider:
    echo   set GEMINI_API_KEY=your_key              # Google Gemini
    echo   set OPENROUTER_API_KEY=your_key          # OpenRouter
    echo   set LM_STUDIO_ENDPOINT=http://localhost:1234
    echo   set OLLAMA_ENDPOINT=http://localhost:11434
    echo.
    echo Or create a .env file with these variables.
)

echo.
echo [SUCCESS] All checks passed!
exit /b 0

:start_server
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] node not found in PATH
    goto :eof
)

if not exist "dist\index.js" (
    echo [ERROR] dist\index.js not found
    echo Please run: npm run build
    goto :eof
)

echo.
echo Starting MCP Server...
echo Server will run until you press Ctrl+C
echo.
node dist\index.js
goto :eof

:start_dev_server
where tsx >nul 2>&1
if errorlevel 1 (
    echo [ERROR] tsx not found
    echo Install with: npm install tsx -g
    exit /b 1
)

if not exist "src\index.ts" (
    echo [ERROR] src\index.ts not found
    exit /b 1
)

echo.
echo Starting development server with auto-reload...
echo Server will run until you press Ctrl+C
echo.
tsx watch src\index.ts
exit /b errorlevel

:: End of script
