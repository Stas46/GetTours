import { NextRequest, NextResponse } from 'next/server';
import type { DepartCity } from '@/lib/sletat/types';

// Демо данные для городов вылета
const mockDepartCities: DepartCity[] = [
  { Id: 832, Name: 'Москва', Default: true, DescriptionUrl: null, IsPopular: true, ParentId: null },
  { Id: 1264, Name: 'Санкт-Петербург', Default: false, DescriptionUrl: null, IsPopular: true, ParentId: null },
  { Id: 1471, Name: 'Екатеринбург', Default: false, DescriptionUrl: null, IsPopular: false, ParentId: null },
  { Id: 1387, Name: 'Новосибирск', Default: false, DescriptionUrl: null, IsPopular: false, ParentId: null },
  { Id: 1327, Name: 'Казань', Default: false, DescriptionUrl: null, IsPopular: false, ParentId: null },
];

export async function GET(request: NextRequest) {
  try {
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(mockDepartCities, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // 24 часа
      },
    });

  } catch (error) {
    console.error('Error in mock /api/sletat/depart-cities:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка получения списка городов вылета',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}