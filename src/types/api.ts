export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    pagination?: unknown;
  };
}

export interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  details?: { field: string; message: string }[] | Record<string, unknown> | null;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CursorMeta {
  hasMore: boolean;
  next: string | null;
}

export interface ListResult<T, M = PageMeta> {
  items: T[];
  meta: M;
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;
