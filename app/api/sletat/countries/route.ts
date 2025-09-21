import { NextRequest, NextResponse } from 'next/server';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit } from '@/lib/sletat/client';
import type { Country } from '@/lib/sletat/types';

// Импорт mock-данных
const mockCountries: Country[] = [
  { Id: 119, Name: 'Турция', Alias: 'TR', HasTickets: true, HotelIsNotInStop: true, Rank: 1, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Turkey' },
  { Id: 40, Name: 'Египет', Alias: 'EG', HasTickets: true, HotelIsNotInStop: true, Rank: 1, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Egypt' },
  { Id: 46, Name: 'ОАЭ', Alias: 'AE', HasTickets: true, HotelIsNotInStop: true, Rank: 1, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'United Arab Emirates' },
  { Id: 45, Name: 'Греция', Alias: 'GR', HasTickets: true, HotelIsNotInStop: true, Rank: 2, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Greece' },
  { Id: 8, Name: 'Испания', Alias: 'ES', HasTickets: true, HotelIsNotInStop: true, Rank: 2, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Spain' },
  { Id: 25, Name: 'Италия', Alias: 'IT', HasTickets: true, HotelIsNotInStop: true, Rank: 2, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Italy' },
  { Id: 117, Name: 'Тунис', Alias: 'TN', HasTickets: true, HotelIsNotInStop: true, Rank: 2, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Tunisia' },
];

// Кеш для стран (обновляется раз в 24 часа)
let cache: { data: Country[], timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Проверка rate limit
    if (!checkRateLimit(clientIP, 'countries')) {
      return NextResponse.json(
        { error: 'Слишком частые запросы. Попробуйте через 1.5 секунды.' },
        { status: 429 }
      );
    }

    // В demo режиме используем заглушки
    if (process.env.SLETAT_DEMO_MODE === 'true') {
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, 300));

      return NextResponse.json(mockCountries, {
        headers: {
          'Cache-Control': 'public, max-age=86400', // 24 часа
        },
      });
    }

    // Получаем townFromId из параметров запроса или используем Москву по умолчанию
    const { searchParams } = new URL(request.url);
    const townFromId = searchParams.get('townFromId') || '832'; // 832 = Москва

    const cacheKey = `countries-${townFromId}`;

    // Проверяем кеш
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(
        cache.data,
        {
          headers: {
            'Cache-Control': 'public, max-age=86400', // 24 часа
            'ETag': `"${cacheKey}-${cache.timestamp}"`,
          },
        }
      );
    }

    // Запрос к Sletat API
    const response = await sletatApi.get('/GetCountries', {
      params: withAuth({
        townFromId: townFromId,
      }),
    });

    const data = extractSletatData<Country[]>(response.data, 'GetCountriesResult');
    
    if (!data) {
      throw new Error('Не удалось получить список стран');
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
          'ETag': `"countries-${cache.timestamp}"`,
        },
      }
    );

  } catch (error) {
    console.error('Error in /api/sletat/countries:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка получения списка стран',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}