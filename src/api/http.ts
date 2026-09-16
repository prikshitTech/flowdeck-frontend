import type { AxiosProgressEvent } from 'axios';

import client from './client';
import type { ApiEnvelope, ListResult, PageMeta, QueryParams } from '@/types/api';

export class OfflineError extends Error {
  constructor() {
    super('You are offline. Changes can be made once the connection is back.');
    this.name = 'OfflineError';
  }
}

function assertOnline(): void {
  if (!navigator.onLine) {
    throw new OfflineError();
  }
}

export async function getRequest<T>(url: string, params?: QueryParams): Promise<T> {
  const response = await client.get<ApiEnvelope<T>>(url, { params });
  return response.data.data;
}

export async function getListRequest<T, M = PageMeta>(url: string, params?: QueryParams): Promise<ListResult<T, M>> {
  const response = await client.get<ApiEnvelope<T[]>>(url, { params });

  return {
    items: response.data.data,
    meta: response.data.meta?.pagination as M
  };
}

export async function postRequest<T>(url: string, body?: unknown): Promise<T> {
  assertOnline();
  const response = await client.post<ApiEnvelope<T>>(url, body);
  return response.data.data;
}

export async function patchRequest<T>(url: string, body?: unknown): Promise<T> {
  assertOnline();
  const response = await client.patch<ApiEnvelope<T>>(url, body);
  return response.data.data;
}

export async function deleteRequest<T>(url: string): Promise<T> {
  assertOnline();
  const response = await client.delete<ApiEnvelope<T>>(url);
  return response.data.data;
}

export async function uploadRequest<T>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  assertOnline();

  const response = await client.post<ApiEnvelope<T>>(url, formData, {
    timeout: 0,
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    }
  });

  return response.data.data;
}

export async function downloadRequest(url: string): Promise<Blob> {
  const response = await client.get<Blob>(url, { responseType: 'blob', timeout: 0 });
  return response.data;
}
