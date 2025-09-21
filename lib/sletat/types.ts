// Общие типы
export interface SletatBaseResponse<T> {
  GetCountriesResult?: { Data: T };
  GetDepartCitiesResult?: { Data: T };
  GetCitiesResult?: { Data: T };
  GetToursResult?: { Data: T };
  GetLoadStateResult?: { Data: T };
  GetHotelStarsResult?: { Data: T };
  GetMealsResult?: { Data: T };
  GetTourOperatorsResult?: { Data: T };
  ActualizePriceResult?: { Data: T };
  ErrorMessage?: string;
}

// Справочники
export interface Country {
  Id: number;
  Name: string;
  NameEn?: string;
  Alias?: string;
}

export interface DepartCity {
  Id: number;
  Name: string;
  NameEn?: string;
  CountryId: number;
  CountryName?: string;
}

export interface City {
  Id: number;
  Name: string;
  NameEn?: string;
  CountryId: number;
  CountryName?: string;
  IsPopular?: boolean;
}

export interface HotelStar {
  Id: number;
  Name: string;
  StarCount: number;
}

export interface Meal {
  Id: number;
  Name: string;
  ShortName: string;
}

export interface TourOperator {
  Id: number;
  Name: string;
  LogoUrl?: string;
}

// Поиск туров
export interface TourSearchParams {
  cityFromId: number;
  countryId: number;
  cityId?: number;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  nightsMin: number;
  nightsMax: number;
  adults: number;
  children: number;
  stars?: number[];
  meals?: number[];
  operators?: number[];
  priceMin?: number;
  priceMax?: number;
  currencyAlias?: string;
}

export interface TourSearchResponse {
  requestId: number;
  ErrorMessage?: string;
}

// Статус загрузки
export interface LoadStateSource {
  SourceId: number;
  SourceName: string;
  IsProcessed: boolean;
  IsFailed: boolean;
  RowsCount: number;
  Errors?: string;
}

export interface LoadState {
  Sources: LoadStateSource[];
  IsFinished: boolean;
  ProcessedCount: number;
  TotalCount: number;
}

// Результаты поиска туров
export interface Tour {
  SourceId: number;
  TourId: string;
  SearchId?: string;
  HotelName: string;
  HotelStars: number;
  ResortName: string;
  CountryName: string;
  Nights: number;
  Adults: number;
  Children: number;
  MealName: string;
  MealId: number;
  OperatorName: string;
  OperatorId: number;
  Price: number;
  Currency: string;
  DateFrom: string;
  DateTo: string;
  UpdateDate: string;
  // Для актуализации цены
  ActualizationData?: {
    tourId: string;
    sourceId: number;
    searchId?: string;
    [key: string]: any;
  };
}

export interface TourResults {
  Tours: Tour[];
  TotalCount: number;
  HasMore: boolean;
  requestId: number;
}

// Актуализация цены
export interface ActualizePriceParams {
  tourId: string;
  sourceId: number;
  searchId?: string;
  [key: string]: any;
}

export interface ActualizedPrice {
  TourId: string;
  Price: number;
  Currency: string;
  ActualUrl?: string;
  IsAvailable: boolean;
  UpdateDate: string;
  ErrorMessage?: string;
  // Дополнительные данные о турпакете
  HotelName?: string;
  Nights?: number;
  DateFrom?: string;
  DateTo?: string;
  Adults?: number;
  Children?: number;
}

// Типы для клиентского API
export interface SearchFormData {
  departCityId: number;
  countryId: number;
  cityId?: number;
  dateFrom: string;
  dateTo: string;
  nightsMin: number;
  nightsMax: number;
  adults: number;
  children: number;
  selectedStars: number[];
  selectedMeals: number[];
  selectedOperators: number[];
}

export interface SearchProgress {
  requestId: number;
  processed: number;
  total: number;
  isFinished: boolean;
  sources: LoadStateSource[];
}

// Типы ошибок
export interface SletatError {
  message: string;
  code?: string;
  details?: any;
}

// Rate limiting
export interface RateLimitInfo {
  requests: number;
  lastRequest: number;
  ip: string;
}

// Кеширование
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}