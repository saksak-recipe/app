import { apiClient } from '@/api/client';
import type {
  AddIngredientRequest,
  DataScope,
  Ingredient,
  UpdateIngredientRequest,
} from '@/types/api';

function ingredientsBase(scope: DataScope): string {
  return scope === 'group' ? '/groups/me/ingredients' : '/ingredients';
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
