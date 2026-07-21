import type { Ingredient } from '@/types/api';

function expirationSortKey(value: string | null): number {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }
  return Date.parse(value);
}

export function selectExpiringIngredients(
  items: Ingredient[],
  limit = 5,
): Ingredient[] {
  return items
    .filter((item) => item.status === 'expired' || item.status === 'soon')
    .slice()
    .sort((a, b) => {
      const byDate = expirationSortKey(a.expiration_date) - expirationSortKey(b.expiration_date);
      if (byDate !== 0) {
        return byDate;
      }
      return a.id - b.id;
    })
    .slice(0, limit);
}
