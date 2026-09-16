import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { sessionEvents } from './sessionEvents';
import { tokenStorage, type TokenPair } from '@/utils/storage';
import type { ApiEnvelope } from '@/types/api';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

interface RetriableConfig extends InternalAxiosRequestConfig {
  retried?: boolean;
}

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000
});

client.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let pendingRefresh: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token stored');
  }

  const response = await axios.post<ApiEnvelope<TokenPair>>(`${API_URL}/auth/refresh`, { refreshToken });
  const tokens = { accessToken: response.data.data.accessToken, refreshToken: response.data.data.refreshToken };

  tokenStorage.save(tokens);
  sessionEvents.refreshed(tokens);

  return tokens.accessToken;
}

function shouldRefresh(error: AxiosError, config?: RetriableConfig): config is RetriableConfig {
  if (!config || config.retried || error.response?.status !== 401) {
    return false;
  }

  return !NO_REFRESH_PATHS.some((path) => config.url?.startsWith(path));
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (!shouldRefresh(error, config)) {
      throw error;
    }

    config.retried = true;

    try {
      pendingRefresh ??= refreshAccessToken().finally(() => {
        pendingRefresh = null;
      });

      const accessToken = await pendingRefresh;
      config.headers.Authorization = `Bearer ${accessToken}`;

      return client(config);
    } catch {
      tokenStorage.clear();
      sessionEvents.expired();
      throw error;
    }
  }
);

export default client;
