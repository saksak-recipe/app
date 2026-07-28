import { apiClient } from '@/api/client';
import type {
  AddShoppingItemsRequest,
  DataScope,
  Ingredient,
  ShoppingItem,
  UpdateShoppingItemRequest,
} from '@/types/api';

function shoppingBase(scope: DataScope): string {
  return scope === 'group' ? '/groups/me/shopping-items' : '/shopping-items';
}

export async function getShoppingItems(
  scope: DataScope = 'personal',
): Promise<ShoppingItem[]> {
  const { data } = await apiClient.get<ShoppingItem[]>(shoppingBase(scope));
  return data;
}

export async function addShoppingItems(
  payload: AddShoppingItemsRequest,
  scope: DataScope = 'personal',
): Promise<ShoppingItem[]> {
  const { data } = await apiClient.post<ShoppingItem[]>(
    shoppingBase(scope),
    payload,
  );
  return data;
}

export async function updateShoppingItem(
  itemId: number,
  payload: UpdateShoppingItemRequest,
  scope: DataScope = 'personal',
): Promise<ShoppingItem> {
  const { data } = await apiClient.patch<ShoppingItem>(
    `${shoppingBase(scope)}/${itemId}`,
    payload,
  );
  return data;
}

export async function deleteShoppingItem(
  itemId: number,
  scope: DataScope = 'personal',
): Promise<void> {
  await apiClient.delete(`${shoppingBase(scope)}/${itemId}`);
}

export async function deleteAllShoppingItems(
  scope: DataScope = 'personal',
): Promise<void> {
  await apiClient.delete(shoppingBase(scope));
}

export async function shoppingItemToIngredient(
  itemId: number,
  scope: DataScope = 'personal',
): Promise<Ingredient> {
  const { data } = await apiClient.post<Ingredient>(
    `${shoppingBase(scope)}/${itemId}/to-ingredient`,
  );
  return data;
}
