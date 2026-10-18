@echo off
setlocal EnableExtensions

title VERTEX ERP - Desktop Production
cd /d "%~dp0"

echo ===================================================
echo       VERTEX ERP - Desktop Standalone Production
echo ===================================================
echo.

set "APP_DIR=%~dp0"
set "DESKTOP_DIST_INDEX=%APP_DIR%desktop-dist\index.html"
set "LOCAL_EXE=%APP_DIR%node_modules\electron\dist\electron.exe"
set "LOCAL_BIN=%APP_DIR%node_modules\.bin\electron.cmd"
set "SUB_EXE=%APP_DIR%electron\node_modules\electron\dist\electron.exe"
set "SUB_BIN=%APP_DIR%electron\node_modules\.bin\electron.cmd"

rem Verify that pre-built desktop-dist\index.html exists
if not exist "%DESKTOP_DIST_INDEX%" (
    echo [!] ERROR: desktop-dist\index.html is missing.
    echo Please make sure the pre-built desktop-dist folder is included.
    pause
    exit /b 1
)

echo [*] Pre-built production bundle found: desktop-dist\index.html
echo [*] Starting VERTEX Desktop in Standalone Production Mode...

if exist "%LOCAL_EXE%" (
    start "" "%LOCAL_EXE%" .
    exit /b 0
)

if exist "%SUB_EXE%" (
    start "" "%SUB_EXE%" .
    exit /b 0
)

if exist "%LOCAL_BIN%" (
    call "%LOCAL_BIN%" .
    exit /b 0
)

if exist "%SUB_BIN%" (
    call "%SUB_BIN%" .
    exit /b 0
)

where electron >nul 2>nul
if %errorlevel% equ 0 (
    start "" electron .
    exit /b 0
)

if exist "%APPDATA%\npm\electron.cmd" (
    call "%APPDATA%\npm\electron.cmd" .
    exit /b 0
)

if exist "%LOCALAPPDATA%\npm\electron.cmd" (
    call "%LOCALAPPDATA%\npm\electron.cmd" .
    exit /b 0
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    if exist "%APP_DIR%electron\run-desktop.cjs" (
        call node "%APP_DIR%electron\run-desktop.cjs"
        if %errorlevel% equ 0 exit /b 0
    )
)

echo [*] Launching via npx electron...
call npx -y electron .

if %errorlevel% equ 0 exit /b 0

echo.
echo ===================================================
echo [!] Failed to start Electron desktop runner.
echo     Please verify that Node.js is installed.
echo ===================================================
pause
exit /b 1
