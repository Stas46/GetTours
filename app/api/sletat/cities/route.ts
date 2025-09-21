import { NextRequest, NextResponse } from 'next/server';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit } from '@/lib/sletat/client';
import { z } from 'zod';
import type { City } from '@/lib/sletat/types';

// Схема валидации для параметров запроса
const querySchema = z.object({
  countryId: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('countryId должен быть положительным числом');
    }
    return num;
  }),
});

// Кеш для городов по странам (время жизни 6 часов)
const citiesCache = new Map<number, { data: City[], timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 часов

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Проверка rate limit
    if (!checkRateLimit(clientIP, 'cities')) {
      return NextResponse.json(
        { error: 'Слишком частые запросы. Попробуйте через 1.5 секунды.' },
        { status: 429 }
      );
    }

    // Валидация параметров запроса
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      countryId: searchParams.get('countryId'),
    });

    // Проверяем кеш
    const cached = citiesCache.get(params.countryId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(
        cached.data,
        {
          headers: {
            'Cache-Control': 'public, max-age=21600', // 6 часов
            'ETag': `"cities-${params.countryId}-${cached.timestamp}"`,
          },
        }
      );
    }

    // Запрос к Sletat API
    const response = await sletatApi.get('/GetCities', {
      params: withAuth({
        countryId: params.countryId,
      }),
    });

    const data = extractSletatData<City[]>(response.data, 'GetCitiesResult');
    
    if (!data) {
      throw new Error('Не удалось получить список городов');
    }

    // Обновляем кеш
    citiesCache.set(params.countryId, {
      data,
      timestamp: Date.now(),
    });

    return NextResponse.json(
      data,
      {
        headers: {
          'Cache-Control': 'public, max-age=21600',
          'ETag': `"cities-${params.countryId}-${Date.now()}"`,
        },
      }
    );

  } catch (error) {
    console.error('Error in /api/sletat/cities:', error);
    
    // Обработка ошибок валидации
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры запроса',
          details: error.errors.map(e => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Ошибка получения списка городов',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}