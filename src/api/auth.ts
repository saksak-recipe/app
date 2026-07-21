import { apiClient } from '@/api/client';
import type {
  AuthResponse,
  EmailResendRequest,
  EmailVerifyRequest,
  KakaoCompleteRequest,
  KakaoAuthResponse,
  KakaoLoginResponse,
  LogInRequest,
  OkResponse,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  SignUpRequest,
  SignUpResponse,
} from '@/types/api';

export async function login(payload: LogInRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function signup(payload: SignUpRequest): Promise<SignUpResponse> {
  const { data } = await apiClient.post<SignUpResponse>('/users/signup', payload);
  return data;
}

export async function verifyEmail(payload: EmailVerifyRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/email/verify', payload);
  return data;
}

export async function resendVerificationEmail(
  payload: EmailResendRequest,
): Promise<OkResponse> {
  const { data } = await apiClient.post<OkResponse>('/auth/email/resend', payload);
  return data;
}

export async function requestPasswordReset(
  payload: PasswordResetRequest,
): Promise<OkResponse> {
  const { data } = await apiClient.post<OkResponse>(
    '/auth/password/reset/request',
    payload,
  );
  return data;
}

export async function confirmPasswordReset(
  payload: PasswordResetConfirmRequest,
): Promise<OkResponse> {
  const { data } = await apiClient.post<OkResponse>(
    '/auth/password/reset/confirm',
    payload,
  );
  return data;
}

export async function loginWithKakao(
  accessToken: string,
): Promise<KakaoLoginResponse> {
  const { data } = await apiClient.post<KakaoLoginResponse>('/auth/kakao', {
    access_token: accessToken,
  });
  return data;
}

export async function completeKakaoSignup(
  payload: KakaoCompleteRequest,
): Promise<KakaoAuthResponse> {
  const { data } = await apiClient.post<KakaoAuthResponse>(
    '/auth/kakao/complete',
    payload,
  );
  return data;
}

export async function refreshTokens(
  refreshToken: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refresh_token: refreshToken });
}
