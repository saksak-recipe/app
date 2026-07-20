import { apiClient } from '@/api/client';
import type {
  AiRecipeDetail,
  AiRecipeRecommendationResponse,
  RecipeDetail,
  RecipeRecommendationResponse,
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
