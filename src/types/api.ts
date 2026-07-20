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
