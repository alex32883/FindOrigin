// API route для обработки webhook от Telegram

import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate } from '@/types/telegram';
import { sendTelegramMessage } from '@/lib/telegram';
import { extractTextFromMessage } from '@/lib/telegram-post-extractor';
import { googleSearch } from '@/lib/google-search';
import { createSearchQuery, compareAndRankSources } from '@/lib/ai-analyzer';

/**
 * Обрабатывает входящий webhook от Telegram
 */
export async function POST(request: NextRequest) {
  try {
    let update: TelegramUpdate;
    try {
      update = await request.json();
    } catch {
      console.error('Webhook: invalid or empty JSON body');
      return NextResponse.json({ ok: true });
    }

    const message = update.message || update.edited_message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text || message.caption || '';

    if (!text) {
      return NextResponse.json({ ok: true });
    }

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
 * Асинхронная обработка: поиск источников через Google Search API + AI сравнение
 */
async function processMessage(chatId: number, text: string) {
  try {
    await sendTelegramMessage(chatId, '🔍 Обрабатываю запрос...');

    const { text: extractedText, telegramLinks } = extractTextFromMessage(text);

    if (!extractedText || extractedText.trim().length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ Не удалось извлечь текст. Отправьте текст или ссылку на пост.'
      );
      return;
    }

    if (telegramLinks.length > 0) {
      await sendTelegramMessage(chatId, `📎 Обнаружено ${telegramLinks.length} ссылок на Telegram-посты. Обрабатываю текст...`);
    }

    // Поисковый запрос напрямую из текста (без предварительного анализа)
    const searchQuery = createSearchQuery(extractedText);

    if (!searchQuery) {
      await sendTelegramMessage(chatId, '❌ Не удалось сформировать поисковый запрос.');
      return;
    }

    await sendTelegramMessage(chatId, '🌐 Ищу источники...');

    const searchResults = await googleSearch(searchQuery, 10);

    if (searchResults.length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ Поиск не вернул результатов. Проверьте настройки Google Search API (GOOGLE_SEARCH_API_KEY, GOOGLE_CSE_ID).'
      );
      return;
    }

    await sendTelegramMessage(chatId, '🤖 Анализирую релевантность...');

    const ranked = await compareAndRankSources(extractedText, searchResults);
    const topSources = ranked.filter(s => s.relevanceScore >= 20).slice(0, 3);

    if (topSources.length === 0) {
      await sendTelegramMessage(
        chatId,
        `Поиск выполнен, но релевантные источники не найдены.\n\n📌 *Топ-3 результата поиска:*\n${searchResults.slice(0, 3).map((s, i) => `${i + 1}. [${s.title}](${s.link})`).join('\n')}`
      );
      return;
    }

    const avgConfidence = Math.round(
      topSources.reduce((sum, s) => sum + s.relevanceScore, 0) / topSources.length
    );

    let report = `📋 *Найденные источники (уверенность: ${avgConfidence}%):*\n\n`;
    topSources.forEach((s, i) => {
      report += `${i + 1}. *${s.title}* (${s.relevanceScore}%)\n${s.link}\n${s.snippet}\n\n`;
    });

    await sendTelegramMessage(chatId, report);
  } catch (error) {
    console.error('Error processing message:', error);
    try {
      await sendTelegramMessage(
        chatId,
        '❌ Произошла ошибка при обработке. Попробуйте позже.'
      );
    } catch (sendError) {
      console.error('Failed to send error notification to user:', sendError);
    }
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  });
}
