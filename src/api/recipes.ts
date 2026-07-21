import { apiClient } from '@/api/client';
import type {
  DataScope,
  RecipeDetail,
  RecipeRecommendationResponse,
  SaveRecipeRequest,
  SavedRecipeDetail,
  SavedRecipeListItem,
  SavedRecipeSource,
  SavedRecipeStatus,
} from '@/types/api';

export async function getRecipeRecommendations(
  scope: DataScope = 'personal',
): Promise<RecipeRecommendationResponse> {
  const { data } = await apiClient.get<RecipeRecommendationResponse>(
    '/recipes/recommendations',
    { params: { scope } },
  );
  return data;
}

export async function getRecipeDetail(
  boardName: string,
  authorName: string,
): Promise<RecipeDetail> {
  const { data } = await apiClient.get<RecipeDetail>('/recipes/detail', {
    params: { board_name: boardName, author_name: authorName },
  });
  return data;
}

export const SAVED_RECIPES_KEY = ['recipes', 'saved'] as const;

export async function listSavedRecipes(): Promise<SavedRecipeListItem[]> {
  const { data } = await apiClient.get<SavedRecipeListItem[]>('/recipes/saved');
  return data;
}

export async function getSavedRecipe(id: string): Promise<SavedRecipeDetail> {
  const { data } = await apiClient.get<SavedRecipeDetail>(`/recipes/saved/${id}`);
  return data;
}

export async function getSavedRecipeStatus(
  source: SavedRecipeSource,
  sourceId: string,
): Promise<SavedRecipeStatus> {
  const { data } = await apiClient.get<SavedRecipeStatus>('/recipes/saved/status', {
    params: { source, source_id: sourceId },
  });
  return data;
}

export async function saveRecipe(request: SaveRecipeRequest): Promise<SavedRecipeDetail> {
  const { data } = await apiClient.post<SavedRecipeDetail>('/recipes/saved', request);
  return data;
}

export async function deleteSavedRecipe(id: string): Promise<void> {
  await apiClient.delete(`/recipes/saved/${id}`);
}
