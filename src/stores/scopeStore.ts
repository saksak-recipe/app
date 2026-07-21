import { create } from 'zustand';

import type { DataScope } from '@/types/api';

type ScopeState = {
  scope: DataScope;
  hasGroup: boolean;
  setScope: (scope: DataScope) => void;
  setHasGroup: (hasGroup: boolean) => void;
};

export const useScopeStore = create<ScopeState>((set) => ({
  scope: 'personal',
  hasGroup: false,
  setScope: (scope) => set({ scope }),
  setHasGroup: (hasGroup) =>
    set((state) => ({
      hasGroup,
      scope: hasGroup ? state.scope : 'personal',
    })),
}));
