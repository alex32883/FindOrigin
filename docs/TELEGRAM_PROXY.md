# Решение проблемы ETIMEDOUT при подключении к Telegram API с Vercel

Если при деплое на Vercel возникают ошибки `ETIMEDOUT` или `fetch failed` при обращении к api.telegram.org, скорее всего, запросы к Telegram блокируются или недоступны из IP Vercel.

## Варианты решения

### 1. Изменить регион Vercel (уже настроено)

В `vercel.json` указаны регионы `iad1` (США) и `fra1` (Франкфурт), где доступ к Telegram обычно не ограничен.

### 2. Использовать прокси через Cloudflare Worker

Создайте Cloudflare Worker, который проксирует запросы к api.telegram.org:

```javascript
// worker.js — deploy на Cloudflare Workers
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = `https://api.telegram.org${url.pathname}${url.search}`;
    
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    return fetch(modifiedRequest);
  },
};
```

В Vercel Environment Variables задайте:
```
TELEGRAM_API_URL=https://your-worker.your-subdomain.workers.dev/bot
```

> Внимание: URL должен заканчиваться на `/bot` (без слэша).

### 3. Локальный Bot API сервер Telegram

Можно развернуть [Telegram Local Bot API Server](https://github.com/tdlib/telegram-bot-api) на своём сервере и указать его в `TELEGRAM_API_URL`.
