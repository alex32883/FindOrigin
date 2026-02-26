// Интеграция с Google Custom Search API

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

/**
 * Поиск через Google Custom Search API
 */
export async function googleSearch(query: string, numResults: number = 10): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    console.warn('Google Search API not configured: GOOGLE_SEARCH_API_KEY/SEARCH_API_KEY and GOOGLE_CSE_ID required');
    return [];
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cseId);
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(Math.min(numResults, 10)));

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];

    return items.map((item: { title?: string; link?: string; snippet?: string }) => ({
      title: item.title || '',
      link: item.link || '',
      snippet: item.snippet || '',
    }));
  } catch (error) {
    console.error('Google Search error:', error);
    return [];
  }
}
