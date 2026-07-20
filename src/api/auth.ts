import { apiClient } from '@/api/client';
import type { AuthResponse, LogInRequest, SignUpRequest } from '@/types/api';

export async function login(payload: LogInRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function signup(payload: SignUpRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/users/signup', payload);
  return data;
}
