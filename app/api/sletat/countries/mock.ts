import { NextRequest, NextResponse } from 'next/server';
import type { Country } from '@/lib/sletat/types';

// Демо данные для стран
const mockCountries: Country[] = [
  { Id: 119, Name: 'Турция', Alias: 'TR', HasTickets: true, HotelIsNotInStop: true, Rank: 1, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Turkey' },
  { Id: 40, Name: 'Египет', Alias: 'EG', HasTickets: true, HotelIsNotInStop: true, Rank: 1, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Egypt' },
  { Id: 46, Name: 'ОАЭ', Alias: 'AE', HasTickets: true, HotelIsNotInStop: true, Rank: 1, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'United Arab Emirates' },
  { Id: 45, Name: 'Греция', Alias: 'GR', HasTickets: true, HotelIsNotInStop: true, Rank: 2, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Greece' },
  { Id: 8, Name: 'Испания', Alias: 'ES', HasTickets: true, HotelIsNotInStop: true, Rank: 2, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Spain' },
  { Id: 25, Name: 'Италия', Alias: 'IT', HasTickets: true, HotelIsNotInStop: true, Rank: 2, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Italy' },
  { Id: 117, Name: 'Тунис', Alias: 'TN', HasTickets: true, HotelIsNotInStop: true, Rank: 2, TicketsIncluded: true, IsVisa: false, IsProVisa: false, OriginalName: 'Tunisia' },
];

export async function GET(request: NextRequest) {
  try {
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(mockCountries, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // 24 часа
      },
    });

  } catch (error) {
    console.error('Error in mock /api/sletat/countries:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка получения списка стран',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}