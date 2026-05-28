export interface Ingredient {
  id?: number;
  name: string;
  unit: string;
}

export interface RecipeIngredient {
  ingredient_id: number;
  quantity: number;
  ingredient?: Ingredient;
}

export interface Recipe {
  id?: number;
  name: string;
  servings: number;
  prep_time: number;
  cook_time: number;
  recipe_type: string;
  instructions: string;
  ingredients: RecipeIngredient[];
  dependency_ids?: number[];
  dependencies?: RecipeShort[];
}

export interface RecipeShort {
  id: number;
  name: string;
  recipe_type: string;
}

export interface Planning {
  id?: number;
  date: string;
  meal_type: string;
  main_recipe_id?: number;
  side_recipe_id?: number;
  main_recipe?: RecipeShort;
  side_recipe?: RecipeShort;
}

export interface ShoppingItem {
  name: string;
  unit: string;
  quantity: number;
  recipe_names: string;
}
