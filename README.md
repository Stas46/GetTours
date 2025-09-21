# Sletat Tours - Витрина туров с интеграцией Sletat API

Современное веб-приложение для поиска и просмотра туров с интеграцией API Sletat. Приложение предоставляет удобный интерфейс для выбора параметров поиска и получения актуальных предложений туров.

## 🚀 Особенности

- **Полная интеграция с Sletat API** - поиск туров через официальное API
- **Современный UI/UX** - responsive дизайн на Tailwind CSS
- **Серверный прокси** - безопасное скрытие учетных данных API
- **Real-time поиск** - асинхронный поиск с отображением прогресса
- **Кеширование** - эффективное кеширование справочников и результатов
- **Rate limiting** - защита от злоупотреблений API
- **Актуализация цен** - получение актуальных цен и условий
- **TypeScript** - полная типизация для надежности кода

## 🛠 Технический стек

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Axios
- **Кеширование:** In-memory cache с TTL
- **Валидация:** Zod
- **Состояние:** React Query (TanStack Query)
- **Деплой:** Docker, Docker Compose, Nginx

## 📋 Требования

- Node.js 18+ 
- npm или yarn
- Docker (для деплоя)
- Действующие учетные данные Sletat API

## 🔧 Установка и запуск

### Локальная разработка

1. **Клонирование и установка зависимостей:**
```bash
git clone <repository-url>
cd sletat-tours
npm install
```

2. **Настройка переменных окружения:**
Создайте файл `.env.local`:
```env
# Обязательные переменные
SLETAT_BASE_URL=https://module.sletat.ru/Main.svc
SLETAT_LOGIN=your_sletat_login
SLETAT_PASSWORD=your_sletat_password

# Опциональные настройки
SLETAT_POLL_INTERVAL_MS=1500
SLETAT_POLL_TIMEOUT_MS=20000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Запуск в режиме разработки:**
```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

### Сборка для продакшена

```bash
npm run build
npm start
```

### Деплой с Docker

1. **Создание .env файла для Docker:**
```bash
cp .env.local .env
```

2. **Сборка и запуск:**
```bash
# Только приложение
docker-compose up -d sletat-tours

# С Nginx прокси
docker-compose --profile production up -d
```

3. **Остановка:**
```bash
docker-compose down
```

## 🗂 Структура проекта

```
sletat-tours/
├── app/                          # Next.js App Router
│   ├── api/sletat/              # API роуты для проксирования к Sletat
│   │   ├── countries/           # Справочник стран
│   │   ├── depart-cities/       # Города вылета
│   │   ├── cities/              # Города по странам
│   │   ├── hotel-stars/         # Звезды отелей
│   │   ├── meals/               # Типы питания
│   │   ├── operators/           # Туроператоры
│   │   └── tours/               # Поиск туров
│   │       ├── start/           # Запуск поиска
│   │       ├── status/          # Статус поиска
│   │       ├── results/         # Результаты поиска
│   │       └── actualize/       # Актуализация цены
│   ├── globals.css              # Глобальные стили
│   ├── layout.tsx               # Общий layout
│   ├── page.tsx                 # Главная страница
│   └── providers.tsx            # React Query Provider
├── components/                  # React компоненты
│   ├── SearchForm.tsx           # Форма поиска туров
│   ├── Filters.tsx              # Дополнительные фильтры
│   ├── TourCard.tsx             # Карточка тура
│   └── ProgressBar.tsx          # Индикатор прогресса
├── lib/sletat/                  # Утилиты для работы с Sletat API
│   ├── types.ts                 # TypeScript типы
│   ├── client.ts                # Axios клиент и утилиты
│   └── cache.ts                 # Система кеширования
├── Dockerfile                   # Docker конфигурация
├── docker-compose.yml          # Docker Compose
├── nginx.conf                   # Nginx конфигурация
└── README.md                   # Этот файл
```

## 🔌 API Endpoints

Все API роуты проксируют запросы к Sletat API и скрывают учетные данные:

### Справочники
- `GET /api/sletat/countries` - Список стран
- `GET /api/sletat/depart-cities` - Города вылета
- `GET /api/sletat/cities?countryId=N` - Города по стране
- `GET /api/sletat/hotel-stars` - Звезды отелей
- `GET /api/sletat/meals` - Типы питания  
- `GET /api/sletat/operators` - Туроператоры

### Поиск туров
- `POST /api/sletat/tours/start` - Запуск поиска туров
- `GET /api/sletat/tours/status?requestId=N` - Статус поиска
- `GET /api/sletat/tours/results?requestId=N` - Результаты поиска
- `POST /api/sletat/tours/actualize` - Актуализация цены

## 🎯 Использование

### Основной поиск

1. Выберите город вылета и страну назначения
2. Укажите даты и количество ночей
3. Выберите количество взрослых и детей
4. При необходимости настройте дополнительные фильтры
5. Нажмите "Найти туры"

### Дополнительные фильтры

- **Звезды отеля** - фильтр по категории отеля
- **Тип питания** - завтрак, полупансион, всё включено и др.
- **Туроператоры** - выбор предпочитаемых операторов

### Актуализация цены

Для получения актуальной цены нажмите "Актуализировать цену" на карточке тура. Система запросит у Sletat API самую свежую информацию о стоимости и условиях.

## ⚙️ Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию | Обязательная |
|------------|----------|--------------|--------------|
| `SLETAT_BASE_URL` | URL Sletat API | `https://module.sletat.ru/Main.svc` | ✅ |
| `SLETAT_LOGIN` | Логин для Sletat API | - | ✅ |
| `SLETAT_PASSWORD` | Пароль для Sletat API | - | ✅ |
| `SLETAT_POLL_INTERVAL_MS` | Интервал опроса статуса (мс) | `1500` | ❌ |
| `SLETAT_POLL_TIMEOUT_MS` | Таймаут поиска (мс) | `20000` | ❌ |
| `NEXT_PUBLIC_APP_URL` | URL приложения | `http://localhost:3000` | ❌ |

### Настройки кеширования

Справочники кешируются на разное время:
- **Страны, звезды, питание, операторы:** 24 часа
- **Города вылета:** 12 часов  
- **Города по странам:** 6 часов
- **Результаты поиска:** 5 минут

### Rate Limiting

- **Справочники:** не чаще 1 запроса в 1.5 секунды с IP
- **Поиск туров:** не чаще 1 запроса в 1.5 секунды с IP  
- **Актуализация:** не чаще 1 запроса в 1.5 секунды с IP

## 🐛 Отладка

### Логи

Все запросы к Sletat API логируются в консоль со следующей информацией:
- URL и параметры запроса
- Ответ от API или ошибки
- Время выполнения запроса

### Мониторинг кеша

Для просмотра статистики кеша можно использовать:
```javascript
import { cache } from '@/lib/sletat/cache'
console.log(cache.getStats())
```

### Health Check

Доступен эндпоинт `/health` для проверки состояния приложения.

## 🚀 Деплой в продакшен

### С Nginx

1. Настройте домен в `nginx.conf`
2. Добавьте SSL сертификаты в `./ssl/`
3. Раскомментируйте HTTPS секцию в nginx.conf
4. Запустите с профилем production:

```bash
docker-compose --profile production up -d
```

### Переменные для продакшена

```env
NODE_ENV=production
SLETAT_BASE_URL=https://module.sletat.ru/Main.svc
SLETAT_LOGIN=your_production_login
SLETAT_PASSWORD=your_production_password
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📞 Поддержка

Для получения учетных данных Sletat API и техническая поддержка:
- Сайт: https://sletat.ru/
- Email: integration@sletat.ru

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Создайте Pull Request

---

**Примечание:** Этот проект предназначен для демонстрации интеграции с Sletat API. Для коммерческого использования требуется соглашение с Sletat.