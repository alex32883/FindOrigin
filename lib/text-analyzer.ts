// Утилиты для анализа текста и извлечения ключевой информации

import { extractKeyClaimsWithAI, extractNamesWithAI } from './ai-analyzer';

export interface ExtractedInfo {
  keyClaims: string[];
  dates: string[];
  numbers: string[];
  names: string[];
  links: string[];
  searchQueries: string[];
}

/**
 * Извлекает даты из текста
 */
function extractDates(text: string): string[] {
  const dates: string[] = [];
  
  // Паттерны для различных форматов дат
  const patterns = [
    // DD.MM.YYYY или DD/MM/YYYY
    /\b(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})\b/g,
    // YYYY-MM-DD
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    // Месяц день, год (английский)
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    // День месяц год (русский)
    /\b(\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})\b/gi,
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  });
  
  return [...new Set(dates)]; // Убираем дубликаты
}

/**
 * Извлекает числа и статистику из текста
 */
function extractNumbers(text: string): string[] {
  const numbers: string[] = [];
  
  // Паттерны для чисел с контекстом (проценты, суммы, количества)
  const patterns = [
    // Проценты
    /\b\d+\.?\d*\s*%/g,
    // Денежные суммы (рубли, доллары, евро)
    /\b\d+[\s,.]?\d*\s*(руб|₽|USD|\$|EUR|€|долл)/gi,
    // Большие числа с разделителями
    /\b\d{1,3}(?:[\s,.]?\d{3})+\b/g,
    // Обычные числа (только значимые, больше 10)
    /\b\d{2,}\b/g,
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      numbers.push(...matches);
    }
  });
  
  return [...new Set(numbers)];
}

/**
 * Извлекает имена собственные (базовая версия)
 */
function extractNames(text: string): string[] {
  const names: string[] = [];
  
  // Паттерны для имен (заглавные буквы, возможны ошибки)
  // Более точное извлечение потребует NLP библиотеки
  const patterns = [
    // Имена с заглавной буквы (2+ слова)
    /\b[A-ZА-ЯЁ][a-zа-яё]+\s+[A-ZА-ЯЁ][a-zа-яё]+/g,
    // Организации (слова с заглавной буквы)
    /\b(?:ООО|ЗАО|ПАО|АО|LLC|Inc|Corp)\s+[A-ZА-ЯЁ][\w\s]+/gi,
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      names.push(...matches.filter(m => m.length > 3));
    }
  });
  
  return [...new Set(names)];
}

/**
 * Извлекает ссылки из текста
 */
function extractLinks(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const matches = text.match(urlPattern);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Извлекает ключевые утверждения из текста (базовая версия)
 * Более точное извлечение будет через AI
 */
function extractKeyClaims(text: string): string[] {
  const claims: string[] = [];
  
  // Разбиваем текст на предложения
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Ищем предложения с ключевыми словами
  const keywords = [
    'утверждает', 'заявляет', 'сообщает', 'объявляет',
    'обнаружено', 'найдено', 'выявлено', 'установлено',
    'результат', 'исследование', 'анализ', 'данные',
    'статистика', 'процент', 'увеличение', 'уменьшение',
  ];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (keywords.some(keyword => lowerSentence.includes(keyword))) {
      claims.push(sentence.trim());
    }
  });
  
  // Если не нашли по ключевым словам, берем первые 3 предложения
  if (claims.length === 0 && sentences.length > 0) {
    claims.push(...sentences.slice(0, 3).map(s => s.trim()));
  }
  
  return claims.slice(0, 5); // Максимум 5 утверждений
}

/**
 * Создает поисковые запросы на основе извлеченной информации
 */
function createSearchQueries(info: Omit<ExtractedInfo, 'searchQueries'>): string[] {
  const queries: string[] = [];
  
  // Комбинируем ключевые утверждения с датами и именами
  if (info.keyClaims.length > 0) {
    // Берем первое утверждение
    const mainClaim = info.keyClaims[0];
    
    // Добавляем дату, если есть
    if (info.dates.length > 0) {
      queries.push(`${mainClaim} ${info.dates[0]}`);
    }
    
    // Добавляем имя, если есть
    if (info.names.length > 0) {
      queries.push(`${mainClaim} ${info.names[0]}`);
    }
    
    // Чистое утверждение
    queries.push(mainClaim);
  }
  
  // Если есть имена и даты, создаем запрос
  if (info.names.length > 0 && info.dates.length > 0) {
    queries.push(`${info.names[0]} ${info.dates[0]}`);
  }
  
  // Если есть только имена
  if (info.names.length > 0 && queries.length < 3) {
    queries.push(...info.names.slice(0, 2));
  }
  
  // Если ничего не найдено, берем первые слова текста
  if (queries.length === 0) {
    const words = info.keyClaims.join(' ').split(/\s+/).slice(0, 5);
    queries.push(words.join(' '));
  }
  
  return queries.slice(0, 3); // Максимум 3 запроса
}

/**
 * Основная функция анализа текста
 */
export async function analyzeText(text: string, useAI: boolean = true): Promise<ExtractedInfo> {
  if (!text || text.trim().length === 0) {
    return {
      keyClaims: [],
      dates: [],
      numbers: [],
      names: [],
      links: [],
      searchQueries: [],
    };
  }
  
  // Извлекаем структурированные данные (регулярные выражения)
  const dates = extractDates(text);
  const numbers = extractNumbers(text);
  const links = extractLinks(text);
  
  // Извлекаем ключевые утверждения и имена (с AI или без)
  let keyClaims: string[];
  let names: string[];
  
  if (useAI) {
    // Пытаемся использовать AI для более точного извлечения
    const [aiClaims, aiNames] = await Promise.all([
      extractKeyClaimsWithAI(text),
      extractNamesWithAI(text),
    ]);
    
    // Если AI вернул результаты, используем их, иначе fallback на регулярные выражения
    keyClaims = aiClaims.length > 0 ? aiClaims : extractKeyClaims(text);
    names = aiNames.length > 0 ? aiNames : extractNames(text);
  } else {
    keyClaims = extractKeyClaims(text);
    names = extractNames(text);
  }
  
  // Создаем промежуточный объект
  const partialInfo: Omit<ExtractedInfo, 'searchQueries'> = {
    keyClaims,
    dates,
    numbers,
    names,
    links,
  };
  
  // Создаем поисковые запросы
  const searchQueries = createSearchQueries(partialInfo);
  
  return {
    ...partialInfo,
    searchQueries,
  };
}
