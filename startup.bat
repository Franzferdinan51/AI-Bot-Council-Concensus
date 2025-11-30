@echo off
echo Starting AI Bot Council Chamber...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo Error: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

echo Starting development server...
echo.
call npm run dev

REM Keep window open if there's an error
if %errorlevel% neq 0 (
    echo.
    echo Error: Development server failed to start
    echo.
    pause
)
