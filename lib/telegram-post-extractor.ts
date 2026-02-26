// Утилиты для извлечения текста из Telegram-постов

import { TelegramPostLink } from '@/types/telegram';

/**
 * Парсит ссылку на Telegram-пост
 * Форматы: https://t.me/channel/123 или https://t.me/channel/123?single
 */
export function parseTelegramPostLink(url: string): TelegramPostLink {
  try {
    // Удаляем параметры запроса
    const cleanUrl = url.split('?')[0];
    
    // Паттерн для ссылок типа t.me/channel/123
    const pattern = /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([^\/]+)\/(\d+)/i;
    const match = cleanUrl.match(pattern);
    
    if (match) {
      return {
        channel: match[1],
        postId: parseInt(match[2], 10),
        isValid: true,
      };
    }
    
    return {
      channel: '',
      postId: 0,
      isValid: false,
    };
  } catch (error) {
    console.error('Error parsing Telegram post link:', error);
    return {
      channel: '',
      postId: 0,
      isValid: false,
    };
  }
}

/**
 * Извлекает текст из сообщения, проверяя наличие ссылок на Telegram-посты
 */
export function extractTextFromMessage(text: string): {
  text: string;
  telegramLinks: TelegramPostLink[];
} {
  if (!text) {
    return { text: '', telegramLinks: [] };
  }

  // Паттерн для поиска ссылок на Telegram
  const telegramLinkPattern = /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/[^\s]+/gi;
  const links = text.match(telegramLinkPattern) || [];
  
  const telegramLinks: TelegramPostLink[] = links
    .map(link => parseTelegramPostLink(link))
    .filter(link => link.isValid);

  // Если есть ссылки на Telegram-посты, попытаемся их извлечь
  // Пока возвращаем исходный текст, так как для получения поста нужен доступ к Telegram API
  // или веб-скрапинг (что будет реализовано позже)
  
  return {
    text: text,
    telegramLinks: telegramLinks,
  };
}

/**
 * Пытается получить текст поста через Telegram API
 * Примечание: Для этого нужны специальные права бота или публичный канал
 */
export async function fetchTelegramPost(
  channel: string,
  postId: number
): Promise<string | null> {
  // Эта функция будет реализована позже, когда будет доступ к Telegram API
  // или через веб-скрапинг публичных каналов
  console.log(`Attempting to fetch post from ${channel}/${postId}`);
  
  // TODO: Реализовать получение поста через:
  // 1. Telegram Bot API (если бот добавлен в канал)
  // 2. Веб-скрапинг публичных каналов
  // 3. Telegram Client API (если есть)
  
  return null;
}
