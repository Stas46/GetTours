#!/bin/bash

# Скрипт автоматического деплоя на Vercel

echo "🚀 Деплой Sletat Tours на Vercel..."

# Проверяем наличие git
if ! command -v git &> /dev/null; then
    echo "❌ Git не найден. Установите Git с https://git-scm.com/"
    exit 1
fi

# Проверяем наличие npm  
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден. Установите Node.js с https://nodejs.org/"
    exit 1
fi

# Переходим в директорию проекта
cd "$(dirname "$0")"

echo "📦 Установка Vercel CLI..."
npm install -g vercel

echo "🔧 Подготовка проекта..."

# Инициализируем git репозиторий если нужно
if [ ! -d ".git" ]; then
    echo "🔄 Инициализация Git репозитория..."
    git init
    git branch -M main
fi

# Добавляем все файлы
git add .

# Создаем коммит
echo "💾 Создание коммита..."
git commit -m "Deploy: Sletat Tours $(date)"

# Проверяем наличие remote origin
if ! git remote get-url origin &> /dev/null; then
    echo "📡 Настройка GitHub репозитория..."
    read -p "Введите URL вашего GitHub репозитория (https://github.com/username/repo.git): " repo_url
    git remote add origin "$repo_url"
fi

# Пушим в GitHub
echo "📤 Отправка в GitHub..."
git push -u origin main

# Деплоим на Vercel
echo "🚀 Деплой на Vercel..."
echo "Следуйте инструкциям Vercel CLI:"
echo "1. Выберите scope (ваш аккаунт)"  
echo "2. Link to existing project? N"
echo "3. Project name: sletat-tours (или свой)"
echo "4. Directory: ./"
echo ""

vercel --prod

echo "✅ Деплой завершен!"
echo "🌐 Ваше приложение доступно по ссылке выше"
echo ""
echo "📝 Не забудьте добавить Environment Variables в Vercel Dashboard:"
echo "   - SLETAT_BASE_URL"
echo "   - SLETAT_LOGIN" 
echo "   - SLETAT_PASSWORD"
echo "   - SLETAT_POLL_INTERVAL_MS"
echo "   - SLETAT_POLL_TIMEOUT_MS"