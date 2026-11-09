#!/usr/bin/env bash
# ====================================================================
# Life Simulator (1in8b Reimagined) - Cross-Platform Production Launcher
# ====================================================================

set -e

echo "===================================================================="
echo "  СИМУЛЯТОР ЖИЗНИ 1 ИЗ 8 МИЛЛИАРДОВ (1in8b REIMAGINED)"
echo "  Cross-Platform Production Launcher"
echo "===================================================================="
echo ""

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ОШИБКА] Node.js не найден в PATH!"
    echo "Пожалуйста, установите Node.js (v18+) с https://nodejs.org/"
    exit 1
fi

echo "[1/3] Node.js обнаружен: $(node -v)"

# 2. Check dist folder
if [ ! -f "dist/index.html" ]; then
    echo "[2/3] Каталог dist не найден. Запуск сборки npm run build..."
    npm run build
    echo "[2/3] Сборка успешно завершена."
else
    echo "[2/3] Production-сборка dist найдена."
fi

# 3. Open browser and start preview server
echo "[3/3] Открытие браузера и запуск сервера preview на порту 4173..."
echo "URL: http://localhost:4173"
echo "Для остановки нажмите Ctrl + C"
echo ""

# Background browser opener
(
    sleep 2
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:4173" >/dev/null 2>&1
    elif command -v open >/dev/null 2>&1; then
        open "http://localhost:4173" >/dev/null 2>&1
    elif command -v start >/dev/null 2>&1; then
        start "http://localhost:4173" >/dev/null 2>&1
    fi
) &

npx vite preview --port 4173 --strictPort
