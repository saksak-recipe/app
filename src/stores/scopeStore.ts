import { create } from 'zustand';

import type { DataScope } from '@/types/api';

type ScopeState = {
  scope: DataScope;
  hasGroup: boolean;
  setScope: (scope: DataScope) => void;
  setHasGroup: (hasGroup: boolean) => void;
  reset: () => void;
};

const initialState = {
  scope: 'personal' as DataScope,
  hasGroup: false,
};

export const useScopeStore = create<ScopeState>((set) => ({
  ...initialState,
  setScope: (scope) => set({ scope }),
  setHasGroup: (hasGroup) =>
    set((state) => ({
      hasGroup,
      scope: hasGroup ? state.scope : 'personal',
    })),
  reset: () => set(initialState),
}));
