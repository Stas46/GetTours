#!/bin/bash

# Скрипт быстрого запуска Sletat Tours

echo "🚀 Запуск Sletat Tours..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js 18+ с https://nodejs.org/"
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js 18+. Текущая версия: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js версия: $NODE_VERSION"

# Переходим в директорию проекта
cd "$(dirname "$0")"

# Проверяем наличие package.json
if [ ! -f "package.json" ]; then
    echo "❌ Файл package.json не найден. Убедитесь, что находитесь в корне проекта."
    exit 1
fi

# Проверяем наличие .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ Файл .env.local не найден. Создайте его с настройками Sletat API."
    echo "Пример содержимого:"
    echo "SLETAT_BASE_URL=https://module.sletat.ru/Main.svc"
    echo "SLETAT_LOGIN=your_login"  
    echo "SLETAT_PASSWORD=your_password"
    exit 1
fi

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
if npm install; then
    echo "✅ Зависимости установлены"
else
    echo "❌ Ошибка установки зависимостей"
    exit 1
fi

# Проверяем переменные окружения
source .env.local
if [ -z "$SLETAT_LOGIN" ] || [ -z "$SLETAT_PASSWORD" ]; then
    echo "❌ Не указаны учетные данные Sletat в .env.local"
    exit 1
fi

echo "✅ Конфигурация проверена"

# Запускаем приложение
echo "🚀 Запуск приложения..."
echo "Приложение будет доступно по адресу: http://localhost:3000"
echo "Для остановки нажмите Ctrl+C"
echo ""

npm run dev