import { isAxiosError } from 'axios';

import type { ApiErrorBody } from '@/types/api';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong, please try again'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return 'Could not reach the server. Check your connection.';
    }

    return error.response.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError<ApiErrorBody>(error) || !Array.isArray(error.response?.data?.details)) {
    return {};
  }

  return Object.fromEntries(error.response.data.details.map((item) => [item.field, item.message]));
}
