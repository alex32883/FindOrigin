// API route для обработки webhook от Telegram

import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate, TelegramMessage } from '@/types/telegram';
import { sendTelegramMessage } from '@/lib/telegram';
import { extractTextFromMessage } from '@/lib/telegram-post-extractor';
import { analyzeText } from '@/lib/text-analyzer';

/**
 * Обрабатывает входящий webhook от Telegram
 */
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    
    // Проверяем наличие сообщения
    const message = update.message || update.edited_message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }
    
    // Извлекаем chat.id и text
    const chatId = message.chat.id;
    const text = message.text || message.caption || '';
    
    if (!text) {
      return NextResponse.json({ ok: true });
    }
    
    // Быстро возвращаем 200 OK
    // Основная обработка будет асинхронной
    processMessage(chatId, text).catch(error => {
      console.error('Error processing message:', error);
    });
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Асинхронная обработка сообщения
 */
async function processMessage(chatId: number, text: string) {
  try {
    // Отправляем уведомление о начале обработки
    await sendTelegramMessage(chatId, '🔍 Обрабатываю запрос...');
    
    // Извлекаем текст (включая обработку ссылок на Telegram-посты)
    const { text: extractedText, telegramLinks } = extractTextFromMessage(text);
    
    if (!extractedText || extractedText.trim().length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ Не удалось извлечь текст из сообщения. Пожалуйста, отправьте текст или ссылку на пост.'
      );
      return;
    }
    
    // Если есть ссылки на Telegram-посты, уведомляем пользователя
    if (telegramLinks.length > 0) {
      await sendTelegramMessage(
        chatId,
        `📎 Обнаружено ${telegramLinks.length} ссылок на Telegram-посты. Обрабатываю текст из сообщения...`
      );
      // TODO: В будущем здесь будет извлечение текста из постов
    }
    
    // Анализируем текст и извлекаем ключевую информацию
    await sendTelegramMessage(chatId, '📊 Анализирую текст...');
    const extractedInfo = await analyzeText(extractedText);
    
    // Формируем отчет об анализе
    const analysisReport = formatAnalysisReport(extractedInfo);
    
    await sendTelegramMessage(chatId, analysisReport);
    
    // Уведомляем, что поиск источников будет следующим этапом
    await sendTelegramMessage(
      chatId,
      '⏳ Поиск источников будет реализован на следующем этапе.'
    );
    
  } catch (error) {
    console.error('Error processing message:', error);
    await sendTelegramMessage(
      chatId,
      '❌ Произошла ошибка при обработке сообщения. Попробуйте позже.'
    );
  }
}

/**
 * Форматирует отчет об анализе текста
 */
function formatAnalysisReport(info: Awaited<ReturnType<typeof analyzeText>>): string {
  let report = '📋 *Результаты анализа:*\n\n';
  
  if (info.keyClaims.length > 0) {
    report += '*Ключевые утверждения:*\n';
    info.keyClaims.slice(0, 3).forEach((claim, i) => {
      report += `${i + 1}. ${claim.substring(0, 100)}${claim.length > 100 ? '...' : ''}\n`;
    });
    report += '\n';
  }
  
  if (info.dates.length > 0) {
    report += `*Даты:* ${info.dates.slice(0, 5).join(', ')}\n\n`;
  }
  
  if (info.numbers.length > 0) {
    report += `*Числа/статистика:* ${info.numbers.slice(0, 5).join(', ')}\n\n`;
  }
  
  if (info.names.length > 0) {
    report += `*Имена/организации:* ${info.names.slice(0, 5).join(', ')}\n\n`;
  }
  
  if (info.links.length > 0) {
    report += `*Ссылки:* ${info.links.slice(0, 3).join(', ')}\n\n`;
  }
  
  if (info.searchQueries.length > 0) {
    report += '*Поисковые запросы:*\n';
    info.searchQueries.forEach((query, i) => {
      report += `${i + 1}. "${query}"\n`;
    });
  }
  
  return report;
}

// GET метод для проверки webhook (опционально)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook endpoint is ready',
    timestamp: new Date().toISOString()
  });
}
