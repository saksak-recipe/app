import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { setAuthToken } from '@/api/client';
import type { UserInfo } from '@/types/api';

const TOKEN_KEY = 'saksak_access_token';
const USER_KEY = 'saksak_user_info';

type AuthState = {
  token: string | null;
  user: UserInfo | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: UserInfo) => Promise<void>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      const user = userJson ? (JSON.parse(userJson) as UserInfo) : null;

      if (token && user) {
        setAuthToken(token);
        set({ token, user, isHydrated: true });
        return;
      }

      setAuthToken(null);
      set({ token: null, user: null, isHydrated: true });
    } catch {
      setAuthToken(null);
      set({ token: null, user: null, isHydrated: true });
    }
  },

  setSession: async (token, user) => {
    setAuthToken(token);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
    set({ token, user });
  },

  clearSession: async () => {
    setAuthToken(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ token: null, user: null });
  },
}));
