# Решение проблемы ETIMEDOUT при подключении к Telegram API с Vercel

Если при деплое на Vercel возникают ошибки `ETIMEDOUT` или `fetch failed` при обращении к api.telegram.org, скорее всего, запросы к Telegram блокируются или недоступны из IP Vercel.

## Варианты решения

### 1. Изменить регион Vercel (уже настроено)

В `vercel.json` указаны регионы `iad1` (США) и `fra1` (Франкфурт), где доступ к Telegram обычно не ограничен.

### 2. Использовать прокси через Cloudflare Worker

Создайте Cloudflare Worker, который проксирует запросы к api.telegram.org:

```javascript
// worker.js — deploy на Cloudflare Workers (ready as-is)
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = `https://api.telegram.org${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set('Host', 'api.telegram.org');

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.body ? request.body : undefined,
    });

    return fetch(modifiedRequest);
  },
};
```

В Vercel Environment Variables задайте:
```
TELEGRAM_API_URL=https://your-worker.your-subdomain.workers.dev/bot
```

> Внимание: URL должен заканчиваться на `/bot` (без слэша в конце).

#### Важно: именно Worker (прокси), не Redirect

- **Redirect** (правило перенаправления в Cloudflare) — не подходит. Оно возвращает 302, запрос уходит на api.telegram.org, и с Vercel снова будет ETIMEDOUT.
- Нужен именно **Worker** (скрипт выше): он принимает запрос на workers.dev и сам делает запрос к api.telegram.org с своего IP, затем возвращает ответ в Vercel.

#### Проверка

1. В Vercel: **Settings → Environment Variables** — `TELEGRAM_API_URL` = `https://<ваш-worker>.workers.dev/bot` (без слэша в конце).
2. После изменения переменных — заново задеплоить проект (Redeploy).
3. Проверить Worker в браузере: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo` — если с Vercel по-прежнему таймаут, откройте в браузере `https://<ваш-worker>.workers.dev/bot<TOKEN>/getWebhookInfo` — должен вернуться тот же JSON (значит прокси работает).

#### Если Vercel всё равно выдаёт ошибку

Посмотрите в **Vercel → Deployments → Logs** точный текст ошибки. После доработки кода там будет, например: `Telegram API error (404): ...` или `Telegram API error (401): ...` — по коду и тексту можно понять причину.

### 3. Локальный Bot API сервер Telegram

Можно развернуть [Telegram Local Bot API Server](https://github.com/tdlib/telegram-bot-api) на своём сервере и указать его в `TELEGRAM_API_URL`.
