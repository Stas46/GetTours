import { NextRequest, NextResponse } from 'next/server';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit, isValidRequestId } from '@/lib/sletat/client';
import { z } from 'zod';
import type { Tour, TourResults } from '@/lib/sletat/types';

// Схема валидации для параметров запроса результатов
const resultsSchema = z.object({
  requestId: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (!isValidRequestId(num)) {
      throw new Error('requestId должен быть положительным целым числом');
    }
    return num;
  }),
  page: z.string().transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }).optional(),
  limit: z.string().transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 || num > 100 ? 20 : num;
  }).optional(),
});

// Функция для трансформации сырых данных Sletat в удобный формат
function transformTourData(rawTour: any): Tour {
  return {
    SourceId: rawTour.SourceId,
    TourId: rawTour.TourId || rawTour.Id,
    SearchId: rawTour.SearchId,
    HotelName: rawTour.HotelName || rawTour.Hotel?.Name || 'Не указано',
    HotelStars: rawTour.HotelStars || rawTour.Hotel?.Stars || 0,
    ResortName: rawTour.ResortName || rawTour.Resort?.Name || rawTour.CityName || 'Не указано',
    CountryName: rawTour.CountryName || rawTour.Country?.Name || 'Не указано',
    Nights: rawTour.Nights || rawTour.NightsCount || 0,
    Adults: rawTour.Adults || rawTour.AdultsCount || 1,
    Children: rawTour.Children || rawTour.ChildrenCount || 0,
    MealName: rawTour.MealName || rawTour.Meal?.Name || 'Не указано',
    MealId: rawTour.MealId || rawTour.Meal?.Id || 0,
    OperatorName: rawTour.OperatorName || rawTour.Operator?.Name || 'Не указано',
    OperatorId: rawTour.OperatorId || rawTour.Operator?.Id || 0,
    Price: parseFloat(rawTour.Price || rawTour.Amount || '0'),
    Currency: rawTour.Currency || rawTour.CurrencyAlias || 'RUB',
    DateFrom: rawTour.DateFrom || rawTour.StartDate || '',
    DateTo: rawTour.DateTo || rawTour.EndDate || '',
    UpdateDate: rawTour.UpdateDate || rawTour.LastUpdate || new Date().toISOString(),
    // Данные для актуализации цены
    ActualizationData: {
      tourId: rawTour.TourId || rawTour.Id,
      sourceId: rawTour.SourceId,
      searchId: rawTour.SearchId,
      // Дополнительные поля, которые могут потребоваться для актуализации
      ...Object.keys(rawTour).reduce((acc: any, key) => {
        if (key.startsWith('Actualize') || key.includes('PriceKey')) {
          acc[key] = rawTour[key];
        }
        return acc;
      }, {}),
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Проверка rate limit
    if (!checkRateLimit(clientIP, 'tours-results')) {
      return NextResponse.json(
        { error: 'Слишком частые запросы результатов. Попробуйте через 1.5 секунды.' },
        { status: 429 }
      );
    }

    // Валидация параметров запроса
    const { searchParams } = new URL(request.url);
    const params = resultsSchema.parse({
      requestId: searchParams.get('requestId'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    console.log(`Getting results for requestId: ${params.requestId}, page: ${params.page}, limit: ${params.limit}`);

    // Запрос к Sletat API для получения результатов
    const response = await sletatApi.get('/GetTours', {
      params: withAuth({
        requestId: params.requestId,
        updateResult: 1, // Запрос результатов
        // Пагинация (если поддерживается API)
        ...(params.page && { page: params.page }),
        ...(params.limit && { pageSize: params.limit }),
      }),
    });

    console.log('Raw results response:', response.data);

    const rawData = extractSletatData(response.data, 'GetToursResult');
    
    if (!rawData) {
      throw new Error('Не удалось получить результаты поиска');
    }

    // Обработка различных форматов ответа от Sletat
    let tours: any[] = [];
    
    if (Array.isArray(rawData)) {
      tours = rawData;
    } else if (rawData.Tours && Array.isArray(rawData.Tours)) {
      tours = rawData.Tours;
    } else if (rawData.Results && Array.isArray(rawData.Results)) {
      tours = rawData.Results;
    } else if (rawData.Data && Array.isArray(rawData.Data)) {
      tours = rawData.Data;
    }

    // Трансформация данных в единый формат
    const transformedTours = tours.map(transformTourData);

    const result: TourResults = {
      Tours: transformedTours,
      TotalCount: rawData.TotalCount || rawData.Total || tours.length,
      HasMore: rawData.HasMore || false,
      requestId: params.requestId,
    };

    console.log(`Results retrieved: ${result.Tours.length} tours out of ${result.TotalCount} total`);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 минут кеша
      },
    });

  } catch (error) {
    console.error('Error in /api/sletat/tours/results:', error);
    
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
        error: 'Ошибка получения результатов поиска',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}