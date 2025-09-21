# GitHub Pages статическая версия

Для деплоя на GitHub Pages нужно адаптировать приложение:

## 🔄 Изменения для статической версии:

### 1. Обновить next.config.js
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Базовый путь для GitHub Pages
  basePath: process.env.NODE_ENV === 'production' ? '/GetTours' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/GetTours/' : '',
}

module.exports = nextConfig
```

### 2. Создать GitHub Actions workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      env:
        NEXT_PUBLIC_SLETAT_LOGIN: ${{ secrets.SLETAT_LOGIN }}
        NEXT_PUBLIC_SLETAT_PASSWORD: ${{ secrets.SLETAT_PASSWORD }}
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./out
```

### 3. Переписать API вызовы на клиентские
- Убрать /api роуты
- Вызывать Sletat API напрямую из браузера
- ⚠️ **ПРОБЛЕМА**: Креденшиалы будут видны в браузере!

## ❌ Проблемы статической версии:

1. **Безопасность**: Логин/пароль Sletat видны всем
2. **CORS**: Sletat API может блокировать браузерные запросы  
3. **Rate limiting**: Сложно контролировать со стороны клиента
4. **SEO**: Нет серверного рендеринга данных

## ✅ Лучшее решение - Vercel:

1. Форкните репозиторий на GitHub
2. Зайдите на vercel.com
3. Подключите GitHub аккаунт
4. Импортируйте проект GetTours
5. Добавьте environment variables:
   - SLETAT_LOGIN
   - SLETAT_PASSWORD  
   - SLETAT_BASE_URL
6. Deploy!

URL будет: https://get-tours-[hash].vercel.app