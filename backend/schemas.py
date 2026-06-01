from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date

class IngredientBase(BaseModel):
    name: str
    unit: str

class IngredientCreate(IngredientBase):
    pass

class Ingredient(IngredientBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class RecipeIngredientBase(BaseModel):
    ingredient_id: int
    quantity: float

class RecipeIngredientCreate(RecipeIngredientBase):
    pass

class RecipeIngredient(RecipeIngredientBase):
    ingredient: Ingredient
    model_config = ConfigDict(from_attributes=True)

class RecipeShort(BaseModel):
    id: int
    name: str
    recipe_type: str
    model_config = ConfigDict(from_attributes=True)

class RecipeBase(BaseModel):
    name: str
    servings: int
    prep_time: int
    cook_time: int
    recipe_type: str
    instructions: str

class RecipeCreate(RecipeBase):
    ingredients: List[RecipeIngredientCreate] = []
    dependency_ids: List[int] = []

class Recipe(RecipeBase):
    id: int
    ingredients: List[RecipeIngredient] = []
    dependencies: List[RecipeShort] = []
    model_config = ConfigDict(from_attributes=True)

class PlanningBase(BaseModel):
    date: date
    meal_type: str # midi, soir
    main_recipe_id: Optional[int] = None
    side_recipe_id: Optional[int] = None
    note: Optional[str] = None

class PlanningCreate(PlanningBase):
    pass

class Planning(PlanningBase):
    id: int
    main_recipe: Optional[RecipeShort] = None
    side_recipe: Optional[RecipeShort] = None
    model_config = ConfigDict(from_attributes=True)

# To handle circular reference in Recipe schema
Recipe.model_rebuild()
