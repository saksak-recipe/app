import { apiClient } from '@/api/client';
import type {
  AiRecipeDetail,
  AiRecipeRecommendationResponse,
  RecipeDetail,
  RecipeRecommendationResponse,
  SaveRecipeRequest,
  SavedRecipeDetail,
  SavedRecipeListItem,
  SavedRecipeSource,
  SavedRecipeStatus,
} from '@/types/api';

export async function getRecipeRecommendations(): Promise<RecipeRecommendationResponse> {
  const { data } = await apiClient.get<RecipeRecommendationResponse>(
    '/recipes/recommendations',
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

const AI_REQUEST_TIMEOUT_MS = 20_000;

export const SAVED_RECIPES_KEY = ['recipes', 'saved'] as const;

export async function getAiRecipeRecommendations(): Promise<AiRecipeRecommendationResponse> {
  const { data } = await apiClient.get<AiRecipeRecommendationResponse>(
    '/recipes/ai/recommendations',
    { timeout: AI_REQUEST_TIMEOUT_MS },
  );
  return data;
}

export async function getAiRecipeDetail(recipeId: string): Promise<AiRecipeDetail> {
  const { data } = await apiClient.get<AiRecipeDetail>('/recipes/ai/detail', {
    params: { recipe_id: recipeId },
    timeout: AI_REQUEST_TIMEOUT_MS,
  });
  return data;
}

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
