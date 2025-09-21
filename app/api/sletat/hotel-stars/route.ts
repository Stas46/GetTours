import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit } from '@/lib/sletat/client';
import type { HotelStar } from '@/lib/sletat/types';

// Валидация параметров запроса
const querySchema = z.object({
  countryId: z.string().transform(val => parseInt(val, 10)),
  towns: z.string().optional(), // Строка с ID городов, разделенных запятой
});

// Кеш для звезд отелей по стране и городам
const starsCache = new Map<string, { data: HotelStar[], timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 часов

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Проверка rate limit
    if (!checkRateLimit(clientIP, 'hotel-stars')) {
      return NextResponse.json(
        { error: 'Слишком частые запросы. Попробуйте через 1.5 секунды.' },
        { status: 429 }
      );
    }

    // Валидация параметров запроса
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      countryId: searchParams.get('countryId'),
      towns: searchParams.get('towns'),
    });

    const cacheKey = `${params.countryId}-${params.towns || 'all'}`;

    // Проверяем кеш
    const cached = starsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(
        cached.data,
        {
          headers: {
            'Cache-Control': 'public, max-age=21600', // 6 часов
            'ETag': `"hotel-stars-${cacheKey}-${cached.timestamp}"`,
          },
        }
      );
    }

    // Запрос к Sletat API
    const apiParams: any = {
      countryId: params.countryId,
    };

    // Добавляем towns если указан
    if (params.towns) {
      apiParams.towns = params.towns;
    }

    const response = await sletatApi.get('/GetHotelStars', {
      params: withAuth(apiParams),
    });

    const data = extractSletatData<HotelStar[]>(response.data, 'GetHotelStarsResult');
    
    if (!data) {
      throw new Error('Не удалось получить список звезд отелей');
    }

    // Обновляем кеш
    starsCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return NextResponse.json(
      data,
      {
        headers: {
          'Cache-Control': 'public, max-age=21600',
          'ETag': `"hotel-stars-${cacheKey}-${Date.now()}"`,
        },
      }
    );

  } catch (error) {
    console.error('Error in /api/sletat/hotel-stars:', error);
    
    // Обработка ошибок валидации
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры запроса. Требуется countryId.',
          details: error.errors.map(e => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Ошибка получения списка звезд отелей',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}