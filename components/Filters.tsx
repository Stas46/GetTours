'use client'

import { useQuery } from '@tanstack/react-query'
import type { HotelStar, Meal, TourOperator } from '@/lib/sletat/types'

interface FiltersProps {
  selectedStars: number[]
  selectedMeals: number[]
  selectedOperators: number[]
  onStarsChange: (stars: number[]) => void
  onMealsChange: (meals: number[]) => void
  onOperatorsChange: (operators: number[]) => void
}

export default function Filters({
  selectedStars,
  selectedMeals,
  selectedOperators,
  onStarsChange,
  onMealsChange,
  onOperatorsChange,
}: FiltersProps) {
  // Загрузка справочников
  const { data: hotelStars = [] } = useQuery({
    queryKey: ['hotel-stars'],
    queryFn: async (): Promise<HotelStar[]> => {
      const response = await fetch('/api/sletat/hotel-stars')
      if (!response.ok) throw new Error('Ошибка загрузки звезд отелей')
      return response.json()
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 часа
  })

  const { data: meals = [] } = useQuery({
    queryKey: ['meals'],
    queryFn: async (): Promise<Meal[]> => {
      const response = await fetch('/api/sletat/meals')
      if (!response.ok) throw new Error('Ошибка загрузки типов питания')
      return response.json()
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 часа
  })

  const { data: operators = [] } = useQuery({
    queryKey: ['operators'],
    queryFn: async (): Promise<TourOperator[]> => {
      const response = await fetch('/api/sletat/operators')
      if (!response.ok) throw new Error('Ошибка загрузки туроператоров')
      return response.json()
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 часа
  })

  const handleStarToggle = (starId: number) => {
    if (selectedStars.includes(starId)) {
      onStarsChange(selectedStars.filter(id => id !== starId))
    } else {
      onStarsChange([...selectedStars, starId])
    }
  }

  const handleMealToggle = (mealId: number) => {
    if (selectedMeals.includes(mealId)) {
      onMealsChange(selectedMeals.filter(id => id !== mealId))
    } else {
      onMealsChange([...selectedMeals, mealId])
    }
  }

  const handleOperatorToggle = (operatorId: number) => {
    if (selectedOperators.includes(operatorId)) {
      onOperatorsChange(selectedOperators.filter(id => id !== operatorId))
    } else {
      onOperatorsChange([...selectedOperators, operatorId])
    }
  }

  const renderStars = (count: number) => {
    return (
      <div className="flex">
        {Array.from({ length: count }, (_, i) => (
          <svg key={i} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Дополнительные фильтры
      </h3>

      {/* Звезды отеля */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Звезды отеля
        </h4>
        <div className="space-y-2">
          {hotelStars.map((star) => (
            <label key={star.Id} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStars.includes(star.Id)}
                onChange={() => handleStarToggle(star.Id)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-3 flex items-center space-x-2">
                {renderStars(star.StarCount)}
                <span className="text-sm text-gray-600">({star.Name})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Питание */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Тип питания
        </h4>
        <div className="space-y-2">
          {meals.map((meal) => (
            <label key={meal.Id} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMeals.includes(meal.Id)}
                onChange={() => handleMealToggle(meal.Id)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-900">
                <span className="font-medium">{meal.ShortName}</span>
                <span className="text-gray-600 ml-1">({meal.Name})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Туроператоры */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Туроператоры
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {operators.map((operator) => (
            <label key={operator.Id} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedOperators.includes(operator.Id)}
                onChange={() => handleOperatorToggle(operator.Id)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-900">
                {operator.Name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Кнопки очистки */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        {selectedStars.length > 0 && (
          <button
            type="button"
            onClick={() => onStarsChange([])}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
          >
            Очистить звезды
          </button>
        )}
        {selectedMeals.length > 0 && (
          <button
            type="button"
            onClick={() => onMealsChange([])}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
          >
            Очистить питание
          </button>
        )}
        {selectedOperators.length > 0 && (
          <button
            type="button"
            onClick={() => onOperatorsChange([])}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
          >
            Очистить операторов
          </button>
        )}
        {(selectedStars.length > 0 || selectedMeals.length > 0 || selectedOperators.length > 0) && (
          <button
            type="button"
            onClick={() => {
              onStarsChange([])
              onMealsChange([])
              onOperatorsChange([])
            }}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
          >
            Очистить все фильтры
          </button>
        )}
      </div>
    </div>
  )
}