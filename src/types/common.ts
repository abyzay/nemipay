export type AppEnvironment = 'development' | 'production';

export type CurrencyCode = 'MXN';

export type IsoDateString = string;

export type IdempotencyKey = string;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}
