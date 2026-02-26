# FindOrigin - Telegram Bot

Telegram-бот для поиска источников информации из текста или постов.

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Скопируйте `env.example` в `.env.local` и заполните переменные окружения:
```bash
cp env.example .env.local
```

3. Запустите dev сервер:
```bash
npm run dev
```

## Переменные окружения

- `TELEGRAM_BOT_TOKEN` - токен бота от BotFather
- `TELEGRAM_API_URL` - базовый URL Telegram API (по умолчанию: https://api.telegram.org/bot)
- `AI_API_KEY` - ключ для AI сервиса (OpenAI)
- `AI_MODEL` - модель AI (по умолчанию: gpt-4-turbo-preview)

## Деплой

Проект готов для деплоя на Vercel.
