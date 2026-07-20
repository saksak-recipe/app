export type UserInfo = {
  id: string;
  email: string;
  nickname: string;
};

export type AuthResponse = {
  info: UserInfo;
  access_token: string;
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

export type Ingredient = {
  id: number;
  ingredient_name: string;
  purchase_date: string;
  expiration_date: string | null;
};

export type AddIngredientRequest = {
  purchase_date?: string | null;
  ingredients: string[];
};

export type ApiErrorBody = {
  status_code: number;
  code: string;
  detail: string | Array<{ msg?: string; loc?: unknown[] }>;
};

export type RecipeRecommendation = {
  recipe_name: string;
  parsed_ingredients: string;
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
