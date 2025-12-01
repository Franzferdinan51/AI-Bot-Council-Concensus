@echo off
:: Test script for all start.bat options
:: This will test each option in sequence

echo ================================================
echo Testing All start.bat Options
echo ================================================
echo.

echo OPTION 3: Configuration Check
echo -------------------------------
start.bat -c
echo.
pause

echo.
echo OPTION 5: Documentation (testing if menu shows)
echo ----------------------------------------------------
echo Testing if menu appears correctly...
echo Note: This would normally show interactive menu
echo But we're testing with -h flag first
echo.
start.bat -h
echo.
pause

echo.
echo OPTION 6: View .env
echo --------------------
if exist ".env" (
    echo .env exists
    type .env
) else (
    echo .env does not exist (this is OK for testing)
)
echo.
pause

echo.
echo OPTION 1: Quick Start (with -i -b to skip install/build)
echo ------------------------------------------------------------
echo This will test the Quick Start logic but skip install/build
echo Note: Should show error about dist\index.js not found
echo.
start.bat -i -b 2>&1 | head -30
echo.
pause

echo.
echo ================================================
echo Testing Complete
echo ================================================
echo All options tested!
echo.
