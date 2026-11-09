@echo off
cd /d "%~dp0"
title Life Simulator 1in8b Reimagined

echo ====================================================================
echo   LIFE SIMULATOR 1 IN 8 BILLION (1in8b REIMAGINED)
echo   Production Launcher
echo ====================================================================
echo.

if not exist "dist\index.html" (
    echo [1/2] Building project...
    call "%~dp0node_modules\.bin\vite.cmd" build
    if errorlevel 1 (
        echo [ERROR] Build failed.
        pause
        exit /b 1
    )
)

echo [2/2] Starting server at http://localhost:4173 ...
echo.
echo ====================================================================
echo   Opening in your browser: http://localhost:4173
echo   Press Ctrl + C in this window to stop the server
echo ====================================================================
echo.

start "" "http://localhost:4173"

call "%~dp0node_modules\.bin\vite.cmd" preview --port 4173 --strictPort

if errorlevel 1 (
    echo.
    echo Server stopped with code %errorlevel%.
    pause
)
