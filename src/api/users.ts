import { apiClient } from '@/api/client';
import type {
  UpdateMeRequest,
  UpdatePasswordRequest,
  UserInfo,
} from '@/types/api';

export async function getMe(): Promise<UserInfo> {
  const { data } = await apiClient.get<UserInfo>('/users/me');
  return data;
}

export async function updateMe(payload: UpdateMeRequest): Promise<UserInfo> {
  const { data } = await apiClient.patch<UserInfo>('/users/me', payload);
  return data;
}

export async function updatePassword(
  payload: UpdatePasswordRequest,
): Promise<UserInfo> {
  const { data } = await apiClient.patch<UserInfo>('/users/me/password', payload);
  return data;
}

export async function deleteMe(): Promise<void> {
  await apiClient.delete('/users/me');
}
