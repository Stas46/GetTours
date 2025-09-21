@echo off
REM Скрипт быстрого запуска Sletat Tours для Windows

echo 🚀 Запуск Sletat Tours...

REM Проверяем наличие Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js не найден. Установите Node.js 18+ с https://nodejs.org/
    pause
    exit /b 1
)

REM Проверяем версию Node.js
for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION:~1%") do set MAJOR_VERSION=%%i

if %MAJOR_VERSION% lss 18 (
    echo ❌ Требуется Node.js 18+. Текущая версия: %NODE_VERSION%
    pause
    exit /b 1
)

echo ✅ Node.js версия: %NODE_VERSION%

REM Переходим в директорию скрипта
cd /d "%~dp0"

REM Проверяем наличие package.json
if not exist "package.json" (
    echo ❌ Файл package.json не найден. Убедитесь, что находитесь в корне проекта.
    pause
    exit /b 1
)

REM Проверяем наличие .env.local
if not exist ".env.local" (
    echo ❌ Файл .env.local не найден. Создайте его с настройками Sletat API.
    echo Пример содержимого:
    echo SLETAT_BASE_URL=https://module.sletat.ru/Main.svc
    echo SLETAT_LOGIN=your_login
    echo SLETAT_PASSWORD=your_password
    pause
    exit /b 1
)

REM Устанавливаем зависимости
echo 📦 Установка зависимостей...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Ошибка установки зависимостей
    pause
    exit /b 1
)

echo ✅ Зависимости установлены
echo ✅ Конфигурация проверена

REM Запускаем приложение
echo 🚀 Запуск приложения...
echo Приложение будет доступно по адресу: http://localhost:3000
echo Для остановки нажмите Ctrl+C
echo.

call npm run dev