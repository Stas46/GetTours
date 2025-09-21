'use client'

import type { Tour } from '@/lib/sletat/types'

interface TourCardProps {
  tour: Tour
  onActualizePrice: (tour: Tour) => void
}

export default function TourCard({ tour, onActualizePrice }: TourCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const renderStars = (count: number) => {
    return (
      <div className="flex">
        {Array.from({ length: Math.max(0, Math.min(5, count)) }, (_, i) => (
          <svg key={i} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {count === 0 && <span className="text-sm text-gray-400">Без звезд</span>}
      </div>
    )
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'RUB' ? 'RUB' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPeopleText = (adults: number, children: number) => {
    const parts = []
    
    if (adults > 0) {
      const adultText = adults === 1 ? 'взрослый' : adults < 5 ? 'взрослых' : 'взрослых'
      parts.push(`${adults} ${adultText}`)
    }
    
    if (children > 0) {
      const childText = children === 1 ? 'ребенок' : children < 5 ? 'детей' : 'детей'
      parts.push(`${children} ${childText}`)
    }
    
    return parts.join(', ')
  }

  return (
    <div className="tour-card">
      {/* Заголовок карточки */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate" title={tour.HotelName}>
            {tour.HotelName}
          </h3>
          <div className="flex items-center mt-1">
            {renderStars(tour.HotelStars)}
            {tour.HotelStars > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                ({tour.HotelStars} ★)
              </span>
            )}
          </div>
        </div>
        
        {/* Цена */}
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-primary">
            {formatPrice(tour.Price, tour.Currency)}
          </div>
          <div className="text-sm text-gray-500">
            за {getPeopleText(tour.Adults, tour.Children)}
          </div>
        </div>
      </div>

      {/* Основная информация */}
      <div className="space-y-3">
        {/* Локация */}
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>
            {tour.ResortName}, {tour.CountryName}
          </span>
        </div>

        {/* Даты */}
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {formatDate(tour.DateFrom)} — {formatDate(tour.DateTo)}
          </span>
        </div>

        {/* Продолжительность */}
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>
            {tour.Nights} {tour.Nights === 1 ? 'ночь' : tour.Nights < 5 ? 'ночи' : 'ночей'}
          </span>
        </div>

        {/* Питание */}
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>
            {tour.MealName}
          </span>
        </div>

        {/* Туроператор */}
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>
            {tour.OperatorName}
          </span>
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>
            Источник: #{tour.SourceId}
          </span>
          <span>
            Обновлено: {formatDate(tour.UpdateDate)}
          </span>
        </div>

        {/* Кнопка актуализации цены */}
        <button
          onClick={() => onActualizePrice(tour)}
          className="btn-secondary w-full text-sm"
          disabled={!tour.ActualizationData}
        >
          {tour.ActualizationData ? 'Актуализировать цену' : 'Актуализация недоступна'}
        </button>
      </div>

      {/* Индикатор свежести данных */}
      <div className="mt-2">
        {(() => {
          const updateTime = new Date(tour.UpdateDate).getTime()
          const now = Date.now()
          const hoursDiff = Math.floor((now - updateTime) / (1000 * 60 * 60))
          
          let colorClass = 'bg-green-100 text-green-800'
          let text = 'Свежие данные'
          
          if (hoursDiff > 24) {
            colorClass = 'bg-red-100 text-red-800'
            text = 'Данные устарели'
          } else if (hoursDiff > 6) {
            colorClass = 'bg-yellow-100 text-yellow-800'
            text = 'Рекомендуем обновить'
          }
          
          return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
              {text}
            </span>
          )
        })()}
      </div>
    </div>
  )
}