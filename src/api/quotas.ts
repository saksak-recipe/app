import { apiClient } from '@/api/client';
import type { QuotasResponse } from '@/types/api';

export async function getQuotas(): Promise<QuotasResponse> {
  const { data } = await apiClient.get<QuotasResponse>('/quotas');
  return data;
}
