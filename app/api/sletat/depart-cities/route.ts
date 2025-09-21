import { NextRequest, NextResponse } from 'next/server';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit } from '@/lib/sletat/client';
import type { DepartCity } from '@/lib/sletat/types';

// Кеш для городов вылета (обновляется раз в 12 часов)
let cache: { data: DepartCity[], timestamp: number } | null = null;
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 часов

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Проверка rate limit
    if (!checkRateLimit(clientIP, 'depart-cities')) {
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
            'Cache-Control': 'public, max-age=43200', // 12 часов
            'ETag': `"depart-cities-${cache.timestamp}"`,
          },
        }
      );
    }

    // Запрос к Sletat API
    const response = await sletatApi.get('/GetDepartCities', {
      params: withAuth(),
    });

    const data = extractSletatData<DepartCity[]>(response.data, 'GetDepartCitiesResult');
    
    if (!data) {
      throw new Error('Не удалось получить список городов вылета');
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
          'Cache-Control': 'public, max-age=43200',
          'ETag': `"depart-cities-${cache.timestamp}"`,
        },
      }
    );

  } catch (error) {
    console.error('Error in /api/sletat/depart-cities:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка получения городов вылета',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}