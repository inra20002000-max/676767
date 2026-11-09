@echo off
chcp 65001 >nul
title Vite Production Preview - Life Simulator (1in8b)

echo ====================================================================
echo   Vite Production Preview - Life Simulator (1in8b)
echo   http://localhost:4173
echo ====================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден в системе!
    echo Установите Node.js (версия 18+) с https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [1/3] Node.js обнаружен: %NODE_VER%

if not exist "dist\index.html" (
    echo [2/3] Каталог dist не найден. Запуск сборки проекта...
    call npm.cmd run build
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Ошибка при сборке проекта.
        pause
        exit /b 1
    )
    echo [2/3] Сборка успешно завершена.
) else (
    echo [2/3] Production-сборка dist найдена.
)

echo [3/3] Запуск браузера: http://localhost:4173
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:4173"

echo Запуск Vite preview на порту 4173...
echo Для остановки нажмите Ctrl + C
echo.
call npx.cmd vite preview --port 4173 --strictPort
