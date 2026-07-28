import { clearQueryCache } from '@/api/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { useKakaoSignupStore } from '@/stores/kakaoSignupStore';
import { useScopeStore } from '@/stores/scopeStore';

export async function clearAppSession(): Promise<void> {
  clearQueryCache();
  useScopeStore.getState().reset();
  useKakaoSignupStore.getState().clearSignupToken();
  await useAuthStore.getState().clearSession();
}
