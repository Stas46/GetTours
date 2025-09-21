@echo off
REM Скрипт автоматического деплоя на Vercel для Windows

echo 🚀 Деплой Sletat Tours на Vercel...

REM Проверяем наличие git
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Git не найден. Установите Git с https://git-scm.com/
    pause
    exit /b 1
)

REM Проверяем наличие npm
where npm >nul 2>&1  
if %ERRORLEVEL% neq 0 (
    echo ❌ npm не найден. Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

REM Переходим в директорию скрипта
cd /d "%~dp0"

echo 📦 Установка Vercel CLI...
call npm install -g vercel

echo 🔧 Подготовка проекта...

REM Инициализируем git репозиторий если нужно
if not exist ".git" (
    echo 🔄 Инициализация Git репозитория...
    git init
    git branch -M main
)

REM Добавляем все файлы
git add .

REM Создаем коммит
echo 💾 Создание коммита...
git commit -m "Deploy: Sletat Tours %date% %time%"

REM Проверяем наличие remote origin
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 📡 Настройка GitHub репозитория...
    set /p repo_url="Введите URL вашего GitHub репозитория (https://github.com/username/repo.git): "
    git remote add origin "%repo_url%"
)

REM Пушим в GitHub  
echo 📤 Отправка в GitHub...
git push -u origin main

REM Деплоим на Vercel
echo 🚀 Деплой на Vercel...
echo Следуйте инструкциям Vercel CLI:
echo 1. Выберите scope (ваш аккаунт)
echo 2. Link to existing project? N  
echo 3. Project name: sletat-tours (или свой)
echo 4. Directory: ./
echo.

call vercel --prod

echo ✅ Деплой завершен!
echo 🌐 Ваше приложение доступно по ссылке выше
echo.
echo 📝 Не забудьте добавить Environment Variables в Vercel Dashboard:
echo    - SLETAT_BASE_URL
echo    - SLETAT_LOGIN
echo    - SLETAT_PASSWORD  
echo    - SLETAT_POLL_INTERVAL_MS
echo    - SLETAT_POLL_TIMEOUT_MS

pause