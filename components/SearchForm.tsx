'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Filters from './Filters'
import type { 
  SearchFormData, 
  Country, 
  DepartCity, 
  City,
  HotelStar,
  Meal,
  TourOperator 
} from '@/lib/sletat/types'

interface SearchFormProps {
  onSearch: (data: SearchFormData) => void
  isLoading: boolean
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  // Состояние формы
  const [formData, setFormData] = useState<SearchFormData>({
    departCityId: 0,
    countryId: 0,
    cityId: undefined,
    dateFrom: dayjs().add(1, 'month').format('YYYY-MM-DD'),
    dateTo: dayjs().add(2, 'month').format('YYYY-MM-DD'),
    nightsMin: 7,
    nightsMax: 14,
    adults: 2,
    children: 0,
    selectedStars: [],
    selectedMeals: [],
    selectedOperators: [],
  })

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Загрузка справочников
  const { data: departCities = [] } = useQuery({
    queryKey: ['depart-cities'],
    queryFn: async (): Promise<DepartCity[]> => {
      const response = await fetch('/api/sletat/depart-cities')
      if (!response.ok) throw new Error('Ошибка загрузки городов вылета')
      return response.json()
    },
    staleTime: 12 * 60 * 60 * 1000, // 12 часов
  })

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async (): Promise<Country[]> => {
      const response = await fetch('/api/sletat/countries')
      if (!response.ok) throw new Error('Ошибка загрузки стран')
      return response.json()
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 часа
  })

  const { data: cities = [] } = useQuery({
    queryKey: ['cities', formData.countryId],
    queryFn: async (): Promise<City[]> => {
      if (!formData.countryId) return []
      const response = await fetch(`/api/sletat/cities?countryId=${formData.countryId}`)
      if (!response.ok) throw new Error('Ошибка загрузки городов')
      return response.json()
    },
    enabled: formData.countryId > 0,
    staleTime: 6 * 60 * 60 * 1000, // 6 часов
  })

  // Сброс выбранного города при смене страны
  useEffect(() => {
    if (formData.countryId) {
      setFormData(prev => ({ ...prev, cityId: undefined }))
    }
  }, [formData.countryId])

  // Восстановление данных из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sletat-search-form')
    if (saved) {
      try {
        const parsedData = JSON.parse(saved)
        setFormData(prev => ({ ...prev, ...parsedData }))
      } catch (error) {
        console.warn('Ошибка восстановления данных формы:', error)
      }
    }
  }, [])

  // Сохранение данных в localStorage
  useEffect(() => {
    localStorage.setItem('sletat-search-form', JSON.stringify(formData))
  }, [formData])

  const handleInputChange = (name: keyof SearchFormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Валидация
    if (!formData.departCityId) {
      alert('Выберите город вылета')
      return
    }
    
    if (!formData.countryId) {
      alert('Выберите страну')
      return
    }

    if (dayjs(formData.dateFrom).isBefore(dayjs(), 'day')) {
      alert('Дата начала должна быть в будущем')
      return
    }

    if (dayjs(formData.dateTo).isBefore(dayjs(formData.dateFrom), 'day')) {
      alert('Дата окончания должна быть позже даты начала')
      return
    }

    if (formData.nightsMax < formData.nightsMin) {
      alert('Максимальное количество ночей не может быть меньше минимального')
      return
    }

    onSearch(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="search-form space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Поиск туров
      </h2>

      {/* Основные параметры поиска */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Город вылета */}
        <div>
          <label htmlFor="departCity" className="block text-sm font-medium text-gray-700 mb-2">
            Город вылета *
          </label>
          <select
            id="departCity"
            value={formData.departCityId}
            onChange={(e) => handleInputChange('departCityId', Number(e.target.value))}
            className="select-field"
            required
          >
            <option value={0}>Выберите город</option>
            {departCities.map((city) => (
              <option key={city.Id} value={city.Id}>
                {city.Name}
              </option>
            ))}
          </select>
        </div>

        {/* Страна */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Страна *
          </label>
          <select
            id="country"
            value={formData.countryId}
            onChange={(e) => handleInputChange('countryId', Number(e.target.value))}
            className="select-field"
            required
          >
            <option value={0}>Выберите страну</option>
            {countries.map((country) => (
              <option key={country.Id} value={country.Id}>
                {country.Name}
              </option>
            ))}
          </select>
        </div>

        {/* Курорт/город */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            Курорт/город
          </label>
          <select
            id="city"
            value={formData.cityId || ''}
            onChange={(e) => handleInputChange('cityId', e.target.value ? Number(e.target.value) : undefined)}
            className="select-field"
            disabled={!formData.countryId}
          >
            <option value="">Любой</option>
            {cities.map((city) => (
              <option key={city.Id} value={city.Id}>
                {city.Name}
              </option>
            ))}
          </select>
        </div>

        {/* Количество взрослых */}
        <div>
          <label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-2">
            Взрослые
          </label>
          <select
            id="adults"
            value={formData.adults}
            onChange={(e) => handleInputChange('adults', Number(e.target.value))}
            className="select-field"
            required
          >
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Даты и ночи */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Дата начала */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
            Дата вылета *
          </label>
          <input
            type="date"
            id="dateFrom"
            value={formData.dateFrom}
            onChange={(e) => handleInputChange('dateFrom', e.target.value)}
            className="input-field"
            min={dayjs().format('YYYY-MM-DD')}
            required
          />
        </div>

        {/* Дата окончания */}
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
            Дата возвращения *
          </label>
          <input
            type="date"
            id="dateTo"
            value={formData.dateTo}
            onChange={(e) => handleInputChange('dateTo', e.target.value)}
            className="input-field"
            min={formData.dateFrom}
            required
          />
        </div>

        {/* Минимальное количество ночей */}
        <div>
          <label htmlFor="nightsMin" className="block text-sm font-medium text-gray-700 mb-2">
            Ночей от
          </label>
          <select
            id="nightsMin"
            value={formData.nightsMin}
            onChange={(e) => handleInputChange('nightsMin', Number(e.target.value))}
            className="select-field"
            required
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,25,30].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        {/* Максимальное количество ночей */}
        <div>
          <label htmlFor="nightsMax" className="block text-sm font-medium text-gray-700 mb-2">
            Ночей до
          </label>
          <select
            id="nightsMax"
            value={formData.nightsMax}
            onChange={(e) => handleInputChange('nightsMax', Number(e.target.value))}
            className="select-field"
            required
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,25,30].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Дети */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-2">
            Дети
          </label>
          <select
            id="children"
            value={formData.children}
            onChange={(e) => handleInputChange('children', Number(e.target.value))}
            className="select-field"
          >
            {[0,1,2,3,4,5].map(num => (
              <option key={num} value={num}>{num === 0 ? 'Без детей' : num}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Дополнительные фильтры */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-primary hover:text-primary/80 font-medium text-sm flex items-center"
        >
          {showAdvancedFilters ? 'Скрыть' : 'Показать'} дополнительные фильтры
          <svg 
            className={`ml-1 h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvancedFilters && (
          <div className="mt-4">
            <Filters
              selectedStars={formData.selectedStars}
              selectedMeals={formData.selectedMeals}
              selectedOperators={formData.selectedOperators}
              onStarsChange={(stars) => handleInputChange('selectedStars', stars)}
              onMealsChange={(meals) => handleInputChange('selectedMeals', meals)}
              onOperatorsChange={(operators) => handleInputChange('selectedOperators', operators)}
            />
          </div>
        )}
      </div>

      {/* Кнопка поиска */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ищем туры...
            </span>
          ) : (
            'Найти туры'
          )}
        </button>
      </div>
    </form>
  )
}