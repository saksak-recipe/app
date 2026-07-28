import type { DataScope } from '@/types/api';

export function parseDataScope(value: unknown): DataScope {
  return value === 'group' ? 'group' : 'personal';
}
