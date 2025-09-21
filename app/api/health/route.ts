import { NextRequest, NextResponse } from 'next/server';

// Простой health check endpoint для мониторинга
export async function GET(request: NextRequest) {
  try {
    // Проверяем основные переменные окружения
    const requiredEnvVars = ['SLETAT_LOGIN', 'SLETAT_PASSWORD', 'SLETAT_BASE_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Missing environment variables',
          missing: missingVars,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Возвращаем успешный статус
    return NextResponse.json(
      {
        status: 'healthy',
        service: 'sletat-tours',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}