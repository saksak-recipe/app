import { create } from 'zustand';

type KakaoSignupState = {
  signupToken: string | null;
  setSignupToken: (token: string | null) => void;
  takeSignupToken: () => string | null;
  clearSignupToken: () => void;
};

export const useKakaoSignupStore = create<KakaoSignupState>((set, get) => ({
  signupToken: null,
  setSignupToken: (token) => set({ signupToken: token }),
  takeSignupToken: () => {
    const token = get().signupToken;
    set({ signupToken: null });
    return token;
  },
  clearSignupToken: () => set({ signupToken: null }),
}));
