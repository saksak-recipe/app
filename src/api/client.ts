import axios, { AxiosError, isAxiosError } from 'axios';

import { refreshTokens } from '@/api/auth';
import type { ApiErrorBody, UserInfo } from '@/types/api';

const baseURL = `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let onTokensRefreshed:
  | ((access: string, refresh: string, user: UserInfo) => Promise<void>)
  | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function setTokensRefreshedHandler(
  handler: typeof onTokensRefreshed,
): void {
  onTokensRefreshed = handler;
}

function isAuthUrl(url?: string): boolean {
  if (!url) {
    return false;
  }

  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/email/') ||
    url.includes('/auth/password/') ||
    url.includes('/users/signup')
  );
}

async function rotateAccessToken(): Promise<string | null> {
  const { useAuthStore } = await import('@/stores/authStore');
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    return null;
  }

  const data = await refreshTokens(refreshToken);

  if (onTokensRefreshed) {
    await onTokensRefreshed(
      data.access_token,
      data.refresh_token,
      data.info,
    );
  } else {
    setAuthToken(data.access_token);
  }

  return data.access_token;
}

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const original = error.config as
      | (NonNullable<typeof error.config> & { _retry?: boolean })
      | undefined;

    if (
      status === 401 &&
      code === 'TOKEN_EXPIRED' &&
      original &&
      !isAuthUrl(original.url) &&
      !original._retry
    ) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = rotateAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const newToken = await refreshPromise;

        if (!newToken) {
          onUnauthorized?.();
          return Promise.reject(error);
        }

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;

        return apiClient.request(original);
      } catch {
        onUnauthorized?.();
        return Promise.reject(error);
      }
    }

    if (
      status === 401 &&
      (code === 'INVALID_TOKEN' || code === 'UNAUTHORIZED')
    ) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = '요청에 실패했습니다.'): string {
  if (!isAxiosError<ApiErrorBody>(error)) {
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  }

  if (!error.response) {
    return '서버에 연결할 수 없습니다. API 주소와 백엔드 실행 여부를 확인하세요.';
  }

  const detail = error.response.data?.detail;

  if (typeof detail === 'string' && detail.length > 0) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first?.msg === 'string') {
      return first.msg;
    }
  }

  return fallback;
}
