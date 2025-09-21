'use client'

import type { SearchProgress } from '@/lib/sletat/types'

interface ProgressBarProps {
  progress: SearchProgress
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const progressPercent = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0

  const getStatusText = () => {
    if (progress.isFinished) {
      return 'Поиск завершен'
    }
    
    if (progress.processed === 0) {
      return 'Запускаем поиск...'
    }

    return `Ищем предложения... (${progress.processed} из ${progress.total} источников)`
  }

  const getStatusColor = () => {
    if (progress.isFinished) {
      return 'text-green-600'
    }
    
    if (progress.processed === 0) {
      return 'text-blue-600'
    }

    return 'text-orange-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Прогресс поиска
        </h3>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {progressPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mb-4">
        <div 
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between">
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        
        {!progress.isFinished && (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-500">
              Загружаем...
            </span>
          </div>
        )}
      </div>

      {/* Source Details */}
      {progress.sources && progress.sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Источники данных:
          </h4>
          
          <div className="space-y-1">
            {progress.sources.map((source, index) => (
              <div key={source.SourceId || index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {source.SourceName || `Источник #${source.SourceId}`}
                </span>
                
                <div className="flex items-center space-x-2">
                  {source.IsFailed ? (
                    <>
                      <span className="text-red-600 text-xs">Ошибка</span>
                      <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </>
                  ) : source.IsProcessed ? (
                    <>
                      <span className="text-green-600 text-xs">
                        {source.RowsCount > 0 ? `${source.RowsCount} туров` : 'Готово'}
                      </span>
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400 text-xs">Обработка...</span>
                      <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error Details */}
          {progress.sources.some(s => s.IsFailed || s.Errors) && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <h5 className="text-sm font-medium text-red-800 mb-1">
                Ошибки при поиске:
              </h5>
              <div className="space-y-1">
                {progress.sources
                  .filter(s => s.IsFailed || s.Errors)
                  .map((source, index) => (
                    <div key={source.SourceId || index} className="text-xs text-red-700">
                      <strong>{source.SourceName}:</strong> {source.Errors || 'Неизвестная ошибка'}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}