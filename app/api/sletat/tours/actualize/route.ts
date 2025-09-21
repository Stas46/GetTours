import { NextRequest, NextResponse } from 'next/server';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit } from '@/lib/sletat/client';
import { z } from 'zod';
import type { ActualizedPrice, ActualizePriceParams } from '@/lib/sletat/types';

// Схема валидации для параметров актуализации цены
const actualizePriceSchema = z.object({
  tourId: z.string().min(1),
  sourceId: z.number().int().positive(),
  searchId: z.string().optional(),
  // Дополнительные поля, которые могут потребоваться для актуализации
}).passthrough(); // позволяет дополнительные поля

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Проверка rate limit (менее строгий для актуализации)
    if (!checkRateLimit(clientIP, 'actualize-price')) {
      return NextResponse.json(
        { error: 'Слишком частые запросы актуализации. Попробуйте через 1.5 секунды.' },
        { status: 429 }
      );
    }

    // Валидация входных данных
    const body = await request.json();
    const params = actualizePriceSchema.parse(body) as ActualizePriceParams;

    console.log('Actualizing price for tour:', params);

    // Подготовка параметров для Sletat API
    const sletatParams = withAuth({
      ...params,
      // Добавляем все дополнительные поля из params
    });

    // Запрос к Sletat API
    const response = await sletatApi.get('/ActualizePrice', {
      params: sletatParams,
    });

    console.log('Actualize price response:', response.data);

    const data = extractSletatData(response.data, 'ActualizePriceResult');
    
    if (!data) {
      throw new Error('Не удалось актуализировать цену');
    }

    // Трансформация ответа в стандартный формат
    const actualizedPrice: ActualizedPrice = {
      TourId: params.tourId,
      Price: parseFloat(data.Price || data.Amount || '0'),
      Currency: data.Currency || data.CurrencyAlias || 'RUB',
      ActualUrl: data.ActualUrl || data.BookingUrl || data.Url,
      IsAvailable: data.IsAvailable !== false && data.Available !== false,
      UpdateDate: data.UpdateDate || new Date().toISOString(),
      ErrorMessage: data.ErrorMessage || data.Error,
      // Дополнительная информация
      HotelName: data.HotelName,
      Nights: data.Nights || data.NightsCount,
      DateFrom: data.DateFrom || data.StartDate,
      DateTo: data.DateTo || data.EndDate,
      Adults: data.Adults || data.AdultsCount,
      Children: data.Children || data.ChildrenCount,
    };

    console.log('Price actualized successfully:', actualizedPrice);

    return NextResponse.json(actualizedPrice);

  } catch (error) {
    console.error('Error in /api/sletat/tours/actualize:', error);
    
    // Обработка ошибок валидации
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры актуализации',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Ошибка актуализации цены',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}