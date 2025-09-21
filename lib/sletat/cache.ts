import type { CacheEntry } from './types';

// In-memory cache для справочников и других данных
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  // Получить данные из кеша
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Проверяем, не истек ли срок действия
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Сохранить данные в кеш
  set<T>(key: string, data: T, ttlMs: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    this.cache.set(key, entry);
  }

  // Проверить, есть ли данные в кеше
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Проверяем, не истек ли срок действия
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Удалить из кеша
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Очистить весь кеш
  clear(): void {
    this.cache.clear();
  }

  // Очистить просроченные записи
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Получить информацию о кеше
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }
}

// Глобальный экземпляр кеша
export const cache = new MemoryCache();

// Периодическая очистка кеша (каждые 5 минут)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// Константы времени жизни кеша
export const CACHE_TTL = {
  COUNTRIES: 24 * 60 * 60 * 1000, // 24 часа
  DEPART_CITIES: 12 * 60 * 60 * 1000, // 12 часов
  CITIES: 6 * 60 * 60 * 1000, // 6 часов
  HOTEL_STARS: 24 * 60 * 60 * 1000, // 24 часа
  MEALS: 24 * 60 * 60 * 1000, // 24 часа
  OPERATORS: 24 * 60 * 60 * 1000, // 24 часа
  TOUR_RESULTS: 5 * 60 * 1000, // 5 минут
} as const;

// Утилиты для работы с кешированием
export class CacheManager {
  // Получить или установить значение в кеш
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    // Пытаемся получить из кеша
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Если нет в кеше, получаем новые данные
    const data = await fetcher();
    
    // Сохраняем в кеш
    cache.set(key, data, ttlMs);
    
    return data;
  }

  // Создать ключ кеша для справочников
  static createReferenceKey(type: string): string {
    return `reference:${type}`;
  }

  // Создать ключ кеша для городов по стране
  static createCitiesKey(countryId: number): string {
    return `cities:${countryId}`;
  }

  // Создать ключ кеша для результатов поиска
  static createTourResultsKey(requestId: number): string {
    return `tours:${requestId}`;
  }

  // Инвалидация кеша
  static invalidate(pattern: string): void {
    const keys = Array.from(cache['cache'].keys());
    
    for (const key of keys) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  }

  // Предварительная загрузка справочников
  static async preloadReferences(): Promise<void> {
    try {
      console.log('Preloading references...');
      
      // Можно добавить логику предварительной загрузки
      // популярных справочников при старте сервера
      
    } catch (error) {
      console.warn('Failed to preload references:', error);
    }
  }
}

// ETag генерация для HTTP кеширования
export function generateETag(data: any): string {
  // Простая реализация ETag на основе хеша данных
  const content = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `"${Math.abs(hash).toString(36)}"`;
}

// Утилиты для работы с заголовками кеширования
export function getCacheHeaders(ttlSeconds: number, etag?: string) {
  const headers: Record<string, string> = {
    'Cache-Control': `public, max-age=${ttlSeconds}`,
    'Vary': 'Accept-Encoding',
  };

  if (etag) {
    headers['ETag'] = etag;
  }

  return headers;
}

// Проверка if-none-match для ETag
export function checkIfNoneMatch(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  return ifNoneMatch === etag;
}