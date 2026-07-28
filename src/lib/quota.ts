import type { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { queryKeys } from '@/api/queryKeys';
import type { ApiErrorBody, QuotaInfo, QuotasResponse } from '@/types/api';

export type QuotaKind = 'ocr' | 'rag';

export function formatQuotaBannerText(
  kind: QuotaKind,
  remaining: number,
): string {
  if (remaining <= 0) {
    return '오늘 횟수를 모두 사용했어요';
  }
  if (kind === 'rag') {
    return `오늘 추천 ${remaining}회 남음`;
  }
  return `오늘 스캔 ${remaining}회 남음`;
}

export function getApiErrorCode(error: unknown): string | null {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return null;
  }
  const code = error.response?.data?.code;
  return typeof code === 'string' ? code : null;
}

export function patchQuotasKind(
  queryClient: QueryClient,
  kind: QuotaKind,
  quota: QuotaInfo,
): void {
  const prev = queryClient.getQueryData<QuotasResponse>(queryKeys.quotas);
  if (!prev) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.quotas });
    return;
  }
  queryClient.setQueryData<QuotasResponse>(queryKeys.quotas, {
    ...prev,
    [kind]: quota,
  });
}

export function markQuotaExhausted(
  queryClient: QueryClient,
  kind: QuotaKind,
): void {
  const prev = queryClient.getQueryData<QuotasResponse>(queryKeys.quotas);
  if (!prev) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.quotas });
    return;
  }
  const current = prev[kind];
  queryClient.setQueryData<QuotasResponse>(queryKeys.quotas, {
    ...prev,
    [kind]: { ...current, used: current.limit, remaining: 0 },
  });
}
