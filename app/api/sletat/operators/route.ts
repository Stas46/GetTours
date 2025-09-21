import { NextRequest, NextResponse } from 'next/server';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit } from '@/lib/sletat/client';
import type { TourOperator } from '@/lib/sletat/types';

// Кеш для туроператоров (обновляется раз в 24 часа)
let cache: { data: TourOperator[], timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Проверка rate limit
    if (!checkRateLimit(clientIP, 'operators')) {
      return NextResponse.json(
        { error: 'Слишком частые запросы. Попробуйте через 1.5 секунды.' },
        { status: 429 }
      );
    }

    // Проверяем кеш
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(
        cache.data,
        {
          headers: {
            'Cache-Control': 'public, max-age=86400', // 24 часа
            'ETag': `"operators-${cache.timestamp}"`,
          },
        }
      );
    }

    // Запрос к Sletat API
    const response = await sletatApi.get('/GetTourOperators', {
      params: withAuth(),
    });

    const data = extractSletatData<TourOperator[]>(response.data, 'GetTourOperatorsResult');
    
    if (!data) {
      throw new Error('Не удалось получить список туроператоров');
    }

    // Обновляем кеш
    cache = {
      data,
      timestamp: Date.now(),
    };

    return NextResponse.json(
      data,
      {
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'ETag': `"operators-${cache.timestamp}"`,
        },
      }
    );

  } catch (error) {
    console.error('Error in /api/sletat/operators:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка получения списка туроператоров',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}