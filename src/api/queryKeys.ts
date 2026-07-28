import type { DataScope, SavedRecipeSource } from '@/types/api';

export const queryKeys = {
  quotas: ['quotas'] as const,
  users: {
    me: ['users', 'me'] as const,
  },
  group: {
    all: ['group'] as const,
    me: ['group', 'me'] as const,
    invites: ['group', 'invites'] as const,
  },
  ingredients: {
    all: ['ingredients'] as const,
    scope: (scope: DataScope) => ['ingredients', scope] as const,
  },
  shopping: {
    all: ['shopping'] as const,
    scope: (scope: DataScope) => ['shopping', scope] as const,
  },
  recipes: {
    all: ['recipes'] as const,
    recommendations: (scope: DataScope) =>
      ['recipes', 'recommendations', scope] as const,
    detail: (boardName: string, authorName: string) =>
      ['recipes', 'detail', boardName, authorName] as const,
    saved: ['recipes', 'saved'] as const,
    savedDetail: (id: string) => ['recipes', 'saved', id] as const,
    savedStatus: (source: SavedRecipeSource | 'idle', id: string) =>
      ['recipes', 'saved', 'status', source, id] as const,
    savedStatusAll: ['recipes', 'saved', 'status'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
} as const;
