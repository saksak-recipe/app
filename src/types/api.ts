export type UserInfo = {
  id: string;
  email: string;
  nickname: string;
  has_password: boolean;
  has_kakao: boolean;
  deleted_at: string | null;
};

export type AuthResponse = {
  info: UserInfo;
  access_token: string;
  refresh_token: string;
};

export type SignUpResponse = {
  email: string;
  message: string;
};

export type OkResponse = {
  ok: boolean;
  message?: string;
};

export type KakaoAuthResponse = AuthResponse & {
  status: 'authenticated';
};

export type KakaoNeedsProfileResponse = {
  status: 'needs_profile';
  signup_token: string;
};

export type KakaoLoginResponse = KakaoAuthResponse | KakaoNeedsProfileResponse;

export type KakaoCompleteRequest = {
  signup_token: string;
  nickname: string;
  email: string;
};

export type SignUpRequest = {
  email: string;
  password: string;
  checked_password: string;
  nickname: string;
};

export type LogInRequest = {
  email: string;
  password: string;
};

export type EmailVerifyRequest = {
  email: string;
  code: string;
};

export type EmailResendRequest = {
  email: string;
};

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetConfirmRequest = {
  email: string;
  code: string;
  password: string;
  checked_password: string;
};

export type UpdateMeRequest = {
  nickname?: string;
};

export type UpdatePasswordRequest = {
  new_password: string;
  checked_password: string;
  current_password?: string;
};

export type DataScope = 'personal' | 'group';

export type IngredientStatus = 'expired' | 'soon' | 'ok' | 'unknown';

export type Ingredient = {
  id: number;
  ingredient_name: string;
  purchase_date: string;
  expiration_date: string | null;
  status: IngredientStatus;
};

export type AddIngredientRequest = {
  purchase_date?: string | null;
  expiration_date?: string | null;
  ingredients: string[];
};

export type UpdateIngredientRequest = {
  ingredient_name?: string;
  purchase_date?: string | null;
  expiration_date?: string | null;
};

export type ShoppingItem = {
  id: number;
  name: string;
  is_checked: boolean;
  created_at: string;
};

export type AddShoppingItemsRequest = {
  names: string[];
};

export type UpdateShoppingItemRequest = {
  is_checked: boolean;
};

export type GroupMember = {
  user_id: string;
  nickname: string;
  role: string;
};

export type Group = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  members: GroupMember[];
  created_at: string;
};

export type GroupInvite = {
  id: string;
  group_id: string;
  group_name: string;
  inviter_nickname: string;
  status: string;
  created_at: string;
};

export type CreateGroupRequest = {
  name: string;
};

export type UpdateGroupRequest = {
  name: string;
};

export type InviteByNicknameRequest = {
  nickname: string;
};

export type JoinByCodeRequest = {
  invite_code: string;
};

export type MergeRequest = {
  mode: 'copy' | 'move';
  ingredients: number[];
  shopping_items: number[];
};

export type MergeResponse = {
  created_ingredients: Ingredient[];
  created_shopping_items: ShoppingItem[];
  skipped_ingredient_ids: number[];
  skipped_shopping_item_ids: number[];
  deleted_ingredient_ids: number[];
  deleted_shopping_item_ids: number[];
};

export type ApiErrorBody = {
  status_code: number;
  code: string;
  detail: string | Array<{ msg?: string; loc?: unknown[] }>;
};

export type RecipeRecommendation = {
  recipe_name: string;
  owned_ingredients: string[];
  missing_ingredients: string[];
  board_name: string;
  author_name: string;
  recipe_difficulty: string;
  time: string;
  score: number;
};

export type RecipeRecommendationResponse = {
  ingredients_used: string[];
  recipes: RecipeRecommendation[];
};

export type RecipeIngredient = {
  name: string;
  amount: string;
};

export type RecipeStep = {
  order: number;
  description: string;
  tip: string | null;
  image_url: string | null;
};

export type RecipeDetail = {
  board_name: string;
  author_name: string;
  recipe_name: string;
  source_url: string;
  main_image_url: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tips: string[];
  cached: boolean;
};

export type AiRecipeRecommendation = {
  recipe_id: string;
  recipe_name: string;
  owned_ingredients: string[];
  missing_ingredients: string[];
  recipe_difficulty: string;
  time: string;
  source: 'ai';
};

export type AiRecipeRecommendationResponse = {
  ingredients_used: string[];
  recipes: AiRecipeRecommendation[];
};

export type AiRecipeDetail = {
  recipe_id: string;
  recipe_name: string;
  source: 'ai';
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tips: string[];
  owned_ingredients: string[];
  missing_ingredients: string[];
  cached: boolean;
};

export type SavedRecipeSource = 'ai' | 'mangae';

export type SaveRecipeRequest = {
  source: SavedRecipeSource;
  source_id: string;
};

export type SavedRecipeListItem = {
  id: string;
  source: SavedRecipeSource;
  source_id: string;
  recipe_name: string;
  recipe_difficulty: string | null;
  time: string | null;
  created_at: string;
};

export type SavedRecipeSnapshot = {
  ingredients: RecipeIngredient[];
  steps: Array<{ order: number; description: string }>;
  tips: string[];
  owned_ingredients?: string[];
  missing_ingredients?: string[];
  board_name?: string;
  author_name?: string;
  source_url?: string;
  main_image_url?: string | null;
};

export type SavedRecipeDetail = {
  id: string;
  source: SavedRecipeSource;
  source_id: string;
  recipe_name: string;
  recipe_difficulty: string | null;
  time: string | null;
  snapshot: SavedRecipeSnapshot;
  created_at: string;
};

export type SavedRecipeStatus = {
  saved: boolean;
  id: string | null;
};
