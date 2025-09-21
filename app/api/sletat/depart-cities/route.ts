import { NextRequest, NextResponse } from 'next/server';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit } from '@/lib/sletat/client';
import type { DepartCity } from '@/lib/sletat/types';

// Импорт mock-данных
const mockDepartCities: DepartCity[] = [
  { Id: 832, Name: 'Москва', Default: true, DescriptionUrl: null, IsPopular: true, ParentId: null },
  { Id: 1264, Name: 'Санкт-Петербург', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null },
  { Id: 1471, Name: 'Екатеринбург', Default: false, DescriptionUrl: null, IsPopular: false, ParentId: null },
  { Id: 1387, Name: 'Новосибирск', Default: false, DescriptionUrl: null, IsPopular: false, ParentId: null },
  { Id: 1327, Name: 'Казань', Default: false, DescriptionUrl: null, IsPopular: false, ParentId: null },
];

// Кеш для городов вылета (обновляется раз в 24 часа)
let cache: { data: DepartCity[], timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

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

    // В demo режиме используем заглушки
    if (process.env.SLETAT_DEMO_MODE === 'true') {
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, 300));

      return NextResponse.json(mockDepartCities, {
        headers: {
          'Cache-Control': 'public, max-age=86400', // 24 часа
        },
      });
    }

    // Проверяем кеш
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(
        cache.data,
        {
          headers: {
            'Cache-Control': 'public, max-age=86400', // 24 часа
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
          'Cache-Control': 'public, max-age=86400',
          'ETag': `"depart-cities-${cache.timestamp}"`,
        },
      }
    );

  } catch (error) {
    console.error('Error in /api/sletat/depart-cities:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка получения списка городов вылета',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}