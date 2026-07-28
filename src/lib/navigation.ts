import type { Href } from 'expo-router';

import type { DataScope } from '@/types/api';

type EditIngredientParams = {
  id: number | string;
  name: string;
  purchaseDate: string;
  expirationDate?: string;
  scope: DataScope;
};

/** typedRoutes 동적 params용 Href 헬퍼 */
export function editIngredientHref(params: EditIngredientParams): Href {
  return {
    pathname: '/(main)/edit-ingredient',
    params: {
      id: String(params.id),
      name: params.name,
      purchase_date: params.purchaseDate,
      expiration_date: params.expirationDate ?? '',
      scope: params.scope,
    },
  } as Href;
}

export function verifyEmailHref(params: {
  email: string;
  expiresIn: number | string;
  source?: string;
}): Href {
  return {
    pathname: '/(auth)/verify-email',
    params: {
      email: params.email,
      expiresIn: String(params.expiresIn),
      ...(params.source ? { source: params.source } : {}),
    },
  } as Href;
}
