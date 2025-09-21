import { NextRequest, NextResponse } from 'next/server';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit } from '@/lib/sletat/client';
import { z } from 'zod';

// Схема валидации для параметров поиска туров
const searchSchema = z.object({
  cityFromId: z.number().int().positive(),
  countryId: z.number().int().positive(),
  cityId: z.number().int().positive().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  nightsMin: z.number().int().min(1).max(30),
  nightsMax: z.number().int().min(1).max(30),
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10).default(0),
  // Опциональные фильтры
  stars: z.array(z.number().int().min(1).max(5)).optional(),
  meals: z.array(z.number().int()).optional(),
  operators: z.array(z.number().int()).optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  currencyAlias: z.string().default('RUB'),
});

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Проверка rate limit (более строгий для стартов поиска)
    if (!checkRateLimit(clientIP, 'tours-start')) {
      return NextResponse.json(
        { error: 'Слишком частые запросы на поиск. Попробуйте через 1.5 секунды.' },
        { status: 429 }
      );
    }

    // Валидация входных данных
    const body = await request.json();
    const params = searchSchema.parse(body);

    // Проверка корректности дат
    const dateFromObj = new Date(params.dateFrom);
    const dateToObj = new Date(params.dateTo);
    const now = new Date();
    
    if (dateFromObj <= now) {
      return NextResponse.json(
        { error: 'Дата начала должна быть в будущем' },
        { status: 400 }
      );
    }

    if (dateToObj <= dateFromObj) {
      return NextResponse.json(
        { error: 'Дата окончания должна быть позже даты начала' },
        { status: 400 }
      );
    }

    if (params.nightsMax < params.nightsMin) {
      return NextResponse.json(
        { error: 'Максимальное количество ночей не может быть меньше минимального' },
        { status: 400 }
      );
    }

    // Подготовка параметров для Sletat API
    const sletatParams = withAuth({
      cityFromId: params.cityFromId,
      countryId: params.countryId,
      ...(params.cityId && { cityId: params.cityId }),
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      nightsMin: params.nightsMin,
      nightsMax: params.nightsMax,
      adults: params.adults,
      children: params.children,
      currencyAlias: params.currencyAlias,
      requestId: 0, // Первый запуск поиска
      // Фильтры (если указаны)
      ...(params.stars && params.stars.length > 0 && { 
        stars: params.stars.join(',') 
      }),
      ...(params.meals && params.meals.length > 0 && { 
        meals: params.meals.join(',') 
      }),
      ...(params.operators && params.operators.length > 0 && { 
        operators: params.operators.join(',') 
      }),
      ...(params.priceMin && { priceMin: params.priceMin }),
      ...(params.priceMax && { priceMax: params.priceMax }),
    });

    console.log('Starting tour search with params:', sletatParams);

    // Запрос к Sletat API
    const response = await sletatApi.get('/GetTours', {
      params: sletatParams,
    });

    console.log('Sletat API response:', response.data);

    const data = extractSletatData(response.data, 'GetToursResult');
    
    if (!data) {
      throw new Error('Не удалось запустить поиск туров');
    }

    // Извлекаем requestId из ответа
    const requestId = data.requestId || data.RequestId;
    
    if (!requestId || typeof requestId !== 'number') {
      console.error('Invalid requestId in response:', data);
      throw new Error('Получен некорректный идентификатор поиска');
    }

    console.log(`Tour search started successfully with requestId: ${requestId}`);

    return NextResponse.json({
      requestId,
      message: 'Поиск туров запущен успешно',
    });

  } catch (error) {
    console.error('Error in /api/sletat/tours/start:', error);
    
    // Обработка ошибок валидации
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры поиска',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Ошибка запуска поиска туров',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}