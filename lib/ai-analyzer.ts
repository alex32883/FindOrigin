// AI-утилиты для сравнения текста с источниками (OpenAI GPT-4o-mini)

import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;
const model = process.env.AI_MODEL || 'openai/gpt-4o-mini';

let openai: OpenAI | null = null;

if (apiKey) {
  openai = new OpenAI({
    apiKey,
    ...(baseURL && { baseURL }),
  });
}

export interface SourceWithScore {
  title: string;
  link: string;
  snippet: string;
  relevanceScore: number;
}

/**
 * Создаёт поисковый запрос из текста (без предварительного анализа)
 */
export function createSearchQuery(text: string, maxLength: number = 100): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Берём первые предложения или первые maxLength символов
  const firstSentence = trimmed.split(/[.!?]+/)[0]?.trim();
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence;
  }

  return trimmed.substring(0, maxLength).trim();
}

/**
 * Сравнивает исходный текст с кандидатами-источниками и ранжирует по релевантности
 */
export async function compareAndRankSources(
  originalText: string,
  sources: { title: string; link: string; snippet: string }[]
): Promise<SourceWithScore[]> {
  if (!openai || sources.length === 0) {
    return sources.map(s => ({ ...s, relevanceScore: 0 }));
  }

  try {
    const prompt = `Ты помощник для оценки релевантности источников к исходному тексту.

Исходный текст:
"""
${originalText.substring(0, 2000)}
"""

Кандидаты источников (title, snippet):
${sources.map((s, i) => `${i + 1}. ${s.title}\n   ${s.snippet}`).join('\n\n')}

Для каждого источника оцени релевантность от 0 до 100 (насколько этот источник может быть первоисточником или подтверждением информации из текста).
Верни ТОЛЬКО числа через запятую в порядке источников (1, 2, 3...). Пример: 85, 42, 10`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'Ты оцениваешь релевантность источников. Отвечай только числами через запятую.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '';
    const scores = content
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n <= 100);

    return sources.map((source, i) => ({
      ...source,
      relevanceScore: scores[i] ?? 0,
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (error) {
    console.error('AI comparison error:', error);
    return sources.map(s => ({ ...s, relevanceScore: 0 }));
  }
}
