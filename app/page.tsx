'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SearchForm from '@/components/SearchForm'
import TourCard from '@/components/TourCard'
import ProgressBar from '@/components/ProgressBar'
import type { SearchFormData, Tour, SearchProgress } from '@/lib/sletat/types'

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<Tour[]>([])
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const handleSearch = async (formData: SearchFormData) => {
    setIsSearching(true)
    setSearchError(null)
    setSearchResults([])
    setSearchProgress(null)

    try {
      // 1. Запускаем поиск
      const startResponse = await fetch('/api/sletat/tours/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!startResponse.ok) {
        const errorData = await startResponse.json()
        throw new Error(errorData.error || 'Ошибка запуска поиска')
      }

      const { requestId } = await startResponse.json()

      // 2. Опрашиваем статус поиска
      const pollInterval = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS || '1500')
      const pollTimeout = parseInt(process.env.NEXT_PUBLIC_POLL_TIMEOUT_MS || '20000')
      
      let pollCount = 0
      const maxPolls = Math.floor(pollTimeout / pollInterval)

      const pollStatus = async (): Promise<void> => {
        if (pollCount >= maxPolls) {
          throw new Error('Превышено время ожидания поиска')
        }

        const statusResponse = await fetch(`/api/sletat/tours/status?requestId=${requestId}`)
        
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json()
          throw new Error(errorData.error || 'Ошибка получения статуса')
        }

        const progress = await statusResponse.json()
        setSearchProgress(progress)

        // Если есть хотя бы частичные результаты, получаем их
        if (progress.processed > 0) {
          try {
            const resultsResponse = await fetch(`/api/sletat/tours/results?requestId=${requestId}`)
            if (resultsResponse.ok) {
              const results = await resultsResponse.json()
              setSearchResults(results.Tours || [])
            }
          } catch (error) {
            console.warn('Ошибка получения промежуточных результатов:', error)
          }
        }

        // Если поиск не завершен, продолжаем опрос
        if (!progress.isFinished) {
          pollCount++
          setTimeout(pollStatus, pollInterval)
        } else {
          // Финальное получение результатов
          const resultsResponse = await fetch(`/api/sletat/tours/results?requestId=${requestId}`)
          if (resultsResponse.ok) {
            const results = await resultsResponse.json()
            setSearchResults(results.Tours || [])
          }
          setIsSearching(false)
        }
      }

      await pollStatus()

    } catch (error) {
      console.error('Search error:', error)
      setSearchError(error instanceof Error ? error.message : 'Произошла неизвестная ошибка')
      setIsSearching(false)
    }
  }

  const handleActualizePrice = async (tour: Tour) => {
    if (!tour.ActualizationData) {
      alert('Нет данных для актуализации цены')
      return
    }

    try {
      const response = await fetch('/api/sletat/tours/actualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tour.ActualizationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка актуализации цены')
      }

      const actualizedPrice = await response.json()
      
      // Показываем результат пользователю
      const message = actualizedPrice.IsAvailable
        ? `Актуальная цена: ${actualizedPrice.Price} ${actualizedPrice.Currency}`
        : 'Тур недоступен'
      
      alert(message)

    } catch (error) {
      console.error('Price actualization error:', error)
      alert(error instanceof Error ? error.message : 'Ошибка актуализации цены')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Sletat Tours - Поиск и бронирование туров
          </h1>
          <p className="text-gray-600 mt-1">
            Найдите идеальный тур по лучшей цене
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="mb-8">
          <SearchForm onSearch={handleSearch} isLoading={isSearching} />
        </div>

        {/* Search Progress */}
        {isSearching && searchProgress && (
          <div className="mb-8">
            <ProgressBar progress={searchProgress} />
          </div>
        )}

        {/* Search Error */}
        {searchError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Ошибка поиска
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {searchError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Найденные туры ({searchResults.length})
              </h2>
              <div className="text-sm text-gray-600">
                {isSearching ? 'Поиск продолжается...' : 'Поиск завершен'}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((tour, index) => (
                <TourCard
                  key={`${tour.SourceId}-${tour.TourId}-${index}`}
                  tour={tour}
                  onActualizePrice={handleActualizePrice}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isSearching && searchResults.length === 0 && !searchError && searchProgress && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l6-6m-6 6v6m0-6h6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Туры не найдены
            </h3>
            <p className="text-gray-600">
              Попробуйте изменить параметры поиска
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Sletat Tours. Поиск туров от Sletat API.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}