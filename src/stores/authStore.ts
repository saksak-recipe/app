import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { setAuthToken } from '@/api/client';
import type { UserInfo } from '@/types/api';

const TOKEN_KEY = 'saksak_access_token';
const REFRESH_KEY = 'saksak_refresh_token';
const USER_KEY = 'saksak_user_info';

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (
    accessToken: string,
    refreshToken: string,
    user: UserInfo,
  ) => Promise<void>;
  updateUser: (user: UserInfo) => Promise<void>;
  clearSession: () => Promise<void>;
};

function parseStoredUser(userJson: string | null): UserInfo | null {
  if (!userJson) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(userJson);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as UserInfo).id !== 'string' ||
      typeof (parsed as UserInfo).email !== 'string' ||
      typeof (parsed as UserInfo).nickname !== 'string'
    ) {
      return null;
    }
    return parsed as UserInfo;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [token, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      const user = parseStoredUser(userJson);

      if (token && refreshToken && user) {
        setAuthToken(token);
        set({ token, refreshToken, user, isHydrated: true });
        return;
      }

      setAuthToken(null);
      set({ token: null, refreshToken: null, user: null, isHydrated: true });
    } catch {
      setAuthToken(null);
      set({ token: null, refreshToken: null, user: null, isHydrated: true });
    }
  },

  setSession: async (accessToken, refreshToken, user) => {
    setAuthToken(accessToken);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
    set({ token: accessToken, refreshToken, user });
  },

  updateUser: async (user) => {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  clearSession: async () => {
    setAuthToken(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ token: null, refreshToken: null, user: null });
  },
}));
