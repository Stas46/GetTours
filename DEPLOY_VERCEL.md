# Деплой на Vercel - Пошаговая инструкция

## 🚀 Быстрый деплой (5 минут):

### Шаг 1: Подготовка репозитория
```bash
# Если еще не создан репозиторий
git init
git add .
git commit -m "Initial commit: Sletat Tours"
git remote add origin https://github.com/Stas46/GetTours.git
git push -u origin main
```

### Шаг 2: Деплой на Vercel

1. **Откройте https://vercel.com**
2. **Sign up with GitHub** (подключите ваш GitHub аккаунт)
3. **Import Project** → выберите репозиторий `GetTours`
4. **Configure Project:**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (или оставьте пустым)
   - Build Command: `npm run build` (автоматически)
   - Output Directory: `.next` (автоматически)

### Шаг 3: Environment Variables
В настройках проекта добавьте:

| Name | Value |
|------|-------|
| `SLETAT_BASE_URL` | `https://module.sletat.ru/Main.svc` |
| `SLETAT_LOGIN` | `9437373@gmail.com` |
| `SLETAT_PASSWORD` | `Nasa78!` |
| `SLETAT_POLL_INTERVAL_MS` | `1500` |
| `SLETAT_POLL_TIMEOUT_MS` | `20000` |

### Шаг 4: Deploy!
Нажмите **Deploy** - через 2-3 минуты получите готовый URL!

## 📱 Результат:
- **URL**: https://get-tours-[random].vercel.app
- **Автодеплой**: При каждом push в main
- **HTTPS**: Автоматически  
- **Серверные функции**: Работают как API Routes
- **Кеширование**: CDN + Edge функции

## ⚙️ Настройка домена (опционально):

1. В Vercel Settings → Domains
2. Добавьте свой домен: `tours.yourdomain.com`  
3. Настройте DNS записи согласно инструкции
4. Автоматически получите SSL сертификат

## 🔧 GitHub Actions (автоматический деплой):

Создайте файл `.github/workflows/vercel.yml`:
```yaml
name: Vercel Production Deployment
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
on:
  push:
    branches:
      - main
jobs:
  Deploy-Production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🔐 Безопасность:

✅ **Environment Variables** защищены  
✅ **HTTPS** из коробки  
✅ **Rate Limiting** работает  
✅ **CORS** настроен автоматически  

## 📊 Мониторинг:

- **Analytics**: Встроенный в Vercel  
- **Logs**: Real-time в dashboard
- **Performance**: Web Vitals tracking
- **Errors**: Automatic error reporting

## 💰 Лимиты бесплатного плана:

- **Bandwidth**: 100GB/месяц
- **Serverless Functions**: 100GB-Hrs/месяц  
- **Builds**: 6000 минут/месяц
- **Проекты**: Unlimited

## 🆚 Альтернативы:

### Netlify:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir .next
```

### Railway:
```bash
npm install -g @railway/cli
railway login
railway deploy
```

---

**Рекомендация**: Используйте Vercel - он создан специально для Next.js и даст лучший результат!