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

// Mock-данные для городов по странам
const mockCitiesByCountry: Record<number, City[]> = {
  119: [ // Турция
    { Id: 1334, Name: 'Стамбул', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null, OriginalName: 'Istanbul' },
    { Id: 72, Name: 'Анталья', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null, OriginalName: 'Antalya' },
    { Id: 149, Name: 'Белек', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null, OriginalName: 'Belek' },
    { Id: 1592, Name: 'Кемер', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null, OriginalName: 'Kemer' },
  ],
  40: [ // Египет
    { Id: 1642, Name: 'Шарм-эль-Шейх', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null, OriginalName: 'Sharm el-Sheikh' },
    { Id: 372, Name: 'Хургада', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null, OriginalName: 'Hurghada' },
    { Id: 37, Name: 'Александрия', Default: false, DescriptionUrl: null, IsPopular: false, ParentId: null, OriginalName: 'Alexandria' },
  ],
  46: [ // ОАЭ
    { Id: 1099, Name: 'Дубай', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null, OriginalName: 'Dubai' },
    { Id: 3576, Name: 'Абу-Даби', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null, OriginalName: 'Abu Dhabi' },
  ],
};

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

    // В demo режиме используем заглушки
    if (process.env.SLETAT_DEMO_MODE === 'true') {
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, 300));

      const cities = mockCitiesByCountry[params.countryId] || [];
      
      return NextResponse.json(cities, {
        headers: {
          'Cache-Control': 'public, max-age=21600', // 6 часов
        },
      });
    }

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