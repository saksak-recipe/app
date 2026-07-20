import axios, { AxiosError, isAxiosError } from 'axios';

import type { ApiErrorBody } from '@/types/api';

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

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (
      status === 401 &&
      (code === 'TOKEN_EXPIRED' ||
        code === 'INVALID_TOKEN' ||
        code === 'UNAUTHORIZED')
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
