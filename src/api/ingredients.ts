import { apiClient } from '@/api/client';
import type { AddIngredientRequest, Ingredient } from '@/types/api';

export async function getIngredients(): Promise<Ingredient[]> {
  const { data } = await apiClient.get<Ingredient[]>('/ingredients');
  return data;
}

export async function addIngredients(
  payload: AddIngredientRequest,
): Promise<Ingredient[]> {
  const { data } = await apiClient.post<Ingredient[]>('/ingredients', payload);
  return data;
}

export async function deleteIngredient(ingredientId: number): Promise<void> {
  await apiClient.delete(`/ingredients/${ingredientId}`);
}

export async function deleteAllIngredients(): Promise<void> {
  await apiClient.get('/ingredients/all-delete');
}
