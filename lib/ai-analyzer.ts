// Утилиты для анализа текста с использованием AI

import OpenAI from 'openai';

const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gpt-4-turbo-preview';

let openai: OpenAI | null = null;

if (AI_API_KEY) {
  openai = new OpenAI({
    apiKey: AI_API_KEY,
  });
}

/**
 * Извлекает ключевые утверждения из текста с помощью AI
 */
export async function extractKeyClaimsWithAI(text: string): Promise<string[]> {
  if (!openai) {
    console.warn('AI API key not configured, skipping AI analysis');
    return [];
  }

  if (!text || text.trim().length === 0) {
    return [];
  }

  try {
    const prompt = `Проанализируй следующий текст и выдели 3-5 ключевых утверждений или фактов. 
Каждое утверждение должно быть важным и проверяемым. 
Верни только утверждения, по одному на строку, без нумерации и дополнительных комментариев.

Текст:
${text.substring(0, 3000)}`;

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Ты помощник для извлечения ключевых утверждений из текста. Отвечай только утверждениями, по одному на строку.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    if (!content) {
      return [];
    }

    // Разбиваем на строки и фильтруем пустые
    const claims = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10 && !line.match(/^\d+[\.\)]/)) // Убираем нумерацию
      .slice(0, 5);

    return claims;
  } catch (error) {
    console.error('Error extracting claims with AI:', error);
    return [];
  }
}

/**
 * Извлекает имена собственные (люди, организации, места) с помощью AI
 */
export async function extractNamesWithAI(text: string): Promise<string[]> {
  if (!openai) {
    return [];
  }

  if (!text || text.trim().length === 0) {
    return [];
  }

  try {
    const prompt = `Извлеки из следующего текста имена собственные: людей, организаций, мест. 
Верни только имена, по одному на строку, без дополнительных комментариев.

Текст:
${text.substring(0, 2000)}`;

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Ты помощник для извлечения имен собственных из текста. Отвечай только именами, по одному на строку.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '';
    if (!content) {
      return [];
    }

    const names = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2)
      .slice(0, 10);

    return names;
  } catch (error) {
    console.error('Error extracting names with AI:', error);
    return [];
  }
}
