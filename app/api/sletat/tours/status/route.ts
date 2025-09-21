import { NextRequest, NextResponse } from 'next/server';
import { sletatApi, withAuth, extractSletatData, getClientIP, checkRateLimit, isValidRequestId } from '@/lib/sletat/client';
import { z } from 'zod';
import type { LoadState } from '@/lib/sletat/types';

// Схема валидации для параметров запроса статуса
const statusSchema = z.object({
  requestId: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (!isValidRequestId(num)) {
      throw new Error('requestId должен быть положительным целым числом');
    }
    return num;
  }),
});

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Строгая проверка rate limit для опроса статуса
    if (!checkRateLimit(clientIP, 'tours-status')) {
      return NextResponse.json(
        { error: 'Слишком частые запросы статуса. Соблюдайте интервал 1.5 секунды.' },
        { status: 429 }
      );
    }

    // Валидация параметров запроса
    const { searchParams } = new URL(request.url);
    const params = statusSchema.parse({
      requestId: searchParams.get('requestId'),
    });

    console.log(`Checking status for requestId: ${params.requestId}`);

    // Запрос к Sletat API
    const response = await sletatApi.get('/GetLoadState', {
      params: withAuth({
        requestId: params.requestId,
      }),
    });

    console.log('Load state response:', response.data);

    const data = extractSletatData<LoadState>(response.data, 'GetLoadStateResult');
    
    if (!data) {
      throw new Error('Не удалось получить статус поиска');
    }

    // Обработка ответа и подсчет прогресса
    const sources = data.Sources || [];
    const processedCount = sources.filter(s => s.IsProcessed).length;
    const totalCount = sources.length;
    const isFinished = data.IsFinished || processedCount === totalCount;

    const result = {
      requestId: params.requestId,
      sources,
      processed: processedCount,
      total: totalCount,
      isFinished,
      progressPercent: totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0,
      // Дополнительная информация для отладки
      hasErrors: sources.some(s => s.IsFailed || s.Errors),
      errorSources: sources.filter(s => s.IsFailed || s.Errors),
    };

    console.log(`Status check result:`, result);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Error in /api/sletat/tours/status:', error);
    
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
        error: 'Ошибка получения статуса поиска',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}