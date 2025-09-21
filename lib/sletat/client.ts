import axios from 'axios';
import type { RateLimitInfo } from './types';

// Получаем конфигурацию из переменных окружения
const BASE_URL = process.env.SLETAT_BASE_URL || 'https://module.sletat.ru/Main.svc';
const LOGIN = process.env.SLETAT_LOGIN!;
const PASSWORD = process.env.SLETAT_PASSWORD!;

if (!LOGIN || !PASSWORD) {
  throw new Error('SLETAT_LOGIN и SLETAT_PASSWORD должны быть указаны в переменных окружения');
}

// Создаем базовый Axios клиент для Sletat API
export const sletatApi = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Добавляем интерцепторы для логирования
sletatApi.interceptors.request.use(
  (config) => {
    console.log(`Sletat API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('Sletat API Request Error:', error);
    return Promise.reject(error);
  }
);

sletatApi.interceptors.response.use(
  (response) => {
    console.log(`Sletat API Response: ${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('Sletat API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper для автоматической подстановки логина и пароля
export function withAuth(params: Record<string, any> = {}): Record<string, any> {
  return {
    login: LOGIN,
    password: PASSWORD,
    ...params,
  };
}

// Simple rate limiting (in-memory)
const rateLimitMap = new Map<string, RateLimitInfo>();
const RATE_LIMIT_WINDOW = 1500; // 1.5 секунды
const MAX_REQUESTS_PER_WINDOW = 1;

export function checkRateLimit(ip: string, operation: string = 'default'): boolean {
  const key = `${ip}:${operation}`;
  const now = Date.now();
  const current = rateLimitMap.get(key);

  if (!current) {
    rateLimitMap.set(key, {
      requests: 1,
      lastRequest: now,
      ip,
    });
    return true;
  }

  // Если прошло больше времени окна, сбрасываем счетчик
  if (now - current.lastRequest >= RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, {
      requests: 1,
      lastRequest: now,
      ip,
    });
    return true;
  }

  // Проверяем лимит
  if (current.requests >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  // Увеличиваем счетчик
  current.requests++;
  current.lastRequest = now;
  rateLimitMap.set(key, current);
  return true;
}

// Очистка старых записей rate limit (запускается периодически)
export function cleanupRateLimit(): void {
  const now = Date.now();
  const CLEANUP_THRESHOLD = RATE_LIMIT_WINDOW * 10; // 15 секунд

  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.lastRequest > CLEANUP_THRESHOLD) {
      rateLimitMap.delete(key);
    }
  }
}

// Запускаем очистку каждые 30 секунд
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 30000);
}

// Утилиты для обработки ответов Sletat API
export function extractSletatData<T>(response: any, resultKey: string): T | null {
  try {
    const result = response[resultKey];
    if (!result) {
      console.error(`Sletat response missing ${resultKey}:`, response);
      return null;
    }

    if (result.ErrorMessage) {
      console.error(`Sletat API Error in ${resultKey}:`, result.ErrorMessage);
      throw new Error(result.ErrorMessage);
    }

    return result.Data || result;
  } catch (error) {
    console.error(`Error extracting Sletat data for ${resultKey}:`, error);
    throw error;
  }
}

// Получить IP адрес из request (для rate limiting)
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback для локальной разработки
  return '127.0.0.1';
}

// Валидация requestId
export function isValidRequestId(requestId: any): requestId is number {
  return typeof requestId === 'number' && requestId > 0 && Number.isInteger(requestId);
}