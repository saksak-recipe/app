import { apiClient } from '@/api/client';
import type {
  AddIngredientRequest,
  AddShoppingItemsRequest,
  DataScope,
  Ingredient,
  ShoppingItem,
  UpdateIngredientRequest,
  UpdateShoppingItemRequest,
} from '@/types/api';

function ingredientsBase(scope: DataScope): string {
  return scope === 'group' ? '/groups/me/ingredients' : '/ingredients';
}

function shoppingBase(scope: DataScope): string {
  return scope === 'group' ? '/groups/me/shopping-items' : '/shopping-items';
}

export async function getIngredients(scope: DataScope = 'personal'): Promise<Ingredient[]> {
  const { data } = await apiClient.get<Ingredient[]>(ingredientsBase(scope));
  return data;
}

export async function addIngredients(
  payload: AddIngredientRequest,
  scope: DataScope = 'personal',
): Promise<Ingredient[]> {
  const { data } = await apiClient.post<Ingredient[]>(
    ingredientsBase(scope),
    payload,
  );
  return data;
}

export async function updateIngredient(
  ingredientId: number,
  payload: UpdateIngredientRequest,
  scope: DataScope = 'personal',
): Promise<Ingredient> {
  const { data } = await apiClient.patch<Ingredient>(
    `${ingredientsBase(scope)}/${ingredientId}`,
    payload,
  );
  return data;
}

export async function deleteIngredient(
  ingredientId: number,
  scope: DataScope = 'personal',
): Promise<void> {
  await apiClient.delete(`${ingredientsBase(scope)}/${ingredientId}`);
}

export async function deleteAllIngredients(
  scope: DataScope = 'personal',
): Promise<void> {
  await apiClient.delete(ingredientsBase(scope));
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
