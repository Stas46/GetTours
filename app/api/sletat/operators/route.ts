import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit } from '@/lib/sletat/client';
import type { TourOperator } from '@/lib/sletat/types';

// Валидация параметров запроса
const querySchema = z.object({
  townFromId: z.string().transform(val => parseInt(val, 10)),
  countryId: z.string().transform(val => parseInt(val, 10)),
});

// Кеш для туроператоров по маршруту
const operatorsCache = new Map<string, { data: TourOperator[], timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 часов

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

    // Валидация параметров запроса
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      townFromId: searchParams.get('townFromId'),
      countryId: searchParams.get('countryId'),
    });

    const cacheKey = `${params.townFromId}-${params.countryId}`;

    // Проверяем кеш
    const cached = operatorsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(
        cached.data,
        {
          headers: {
            'Cache-Control': 'public, max-age=21600', // 6 часов
            'ETag': `"operators-${cacheKey}-${cached.timestamp}"`,
          },
        }
      );
    }

    // Запрос к Sletat API
    const response = await sletatApi.get('/GetTourOperators', {
      params: withAuth({
        townFromId: params.townFromId,
        countryId: params.countryId,
      }),
    });

    const data = extractSletatData<TourOperator[]>(response.data, 'GetTourOperatorsResult');
    
    if (!data) {
      throw new Error('Не удалось получить список туроператоров');
    }

    // Обновляем кеш
    operatorsCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return NextResponse.json(
      data,
      {
        headers: {
          'Cache-Control': 'public, max-age=21600',
          'ETag': `"operators-${cacheKey}-${Date.now()}"`,
        },
      }
    );

  } catch (error) {
    console.error('Error in /api/sletat/operators:', error);
    
    // Обработка ошибок валидации
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры запроса. Требуются townFromId и countryId.',
          details: error.errors.map(e => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Ошибка получения списка туроператоров',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}