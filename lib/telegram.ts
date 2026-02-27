// Утилиты для работы с Telegram API

const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || 'https://api.telegram.org/bot';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const FETCH_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function telegramFetch(url: string, body: object): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * Отправляет сообщение через Telegram API
 */
export async function sendTelegramMessage(
  chatId: number,
  text: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown'
): Promise<void> {
  const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`;

  try {
    const response = await telegramFetch(url, {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    });

    if (!response.ok) {
      const text = await response.text();
      let errorDetail: string = text?.trim() || response.statusText || 'Unknown error';
      if (text?.trim()) {
        try {
          const error = JSON.parse(text) as { description?: string; error?: string };
          errorDetail = error.description || error.error || errorDetail;
        } catch {
          // keep errorDetail as text
        }
      }
      console.error('Telegram API error:', response.status, errorDetail);
      throw new Error(`Telegram API error (${response.status}): ${errorDetail}`);
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    throw error;
  }
}

/**
 * Устанавливает webhook для бота
 */
export async function setWebhook(webhookUrl: string): Promise<void> {
  const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/setWebhook`;

  try {
    const response = await telegramFetch(url, { url: webhookUrl });

    if (!response.ok) {
      const text = await response.text();
      let msg = text?.trim() || response.statusText;
      if (text?.trim()) {
        try {
          const err = JSON.parse(text) as { description?: string };
          msg = err.description || msg;
        } catch {
          // use raw text
        }
      }
      throw new Error(`Failed to set webhook: ${msg}`);
    }
  } catch (error) {
    console.error('Failed to set webhook:', error);
    throw error;
  }
}
