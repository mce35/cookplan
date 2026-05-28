from fastapi import FastAPI, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date
import models, schemas, database
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Ingredients ---

@app.post("/ingredients/", response_model=schemas.Ingredient)
def create_ingredient(ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    db_ingredient = models.Ingredient(**ingredient.model_dump())
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient

@app.get("/ingredients/", response_model=List[schemas.Ingredient])
def read_ingredients(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    ingredients = db.query(models.Ingredient).order_by(models.Ingredient.name).offset(skip).limit(limit).all()
    return ingredients

# --- Recipes ---

@app.post("/recipes/", response_model=schemas.Recipe)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    # Extract nested data
    ingredients_data = recipe.ingredients
    dependency_ids = recipe.dependency_ids

    # Create basic recipe
    recipe_dict = recipe.model_dump()
    recipe_dict.pop('ingredients')
    recipe_dict.pop('dependency_ids')

    db_recipe = models.Recipe(**recipe_dict)
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)

    # Add ingredients
    for ing_data in ingredients_data:
        db_recipe_ing = models.RecipeIngredient(
            recipe_id=db_recipe.id,
            ingredient_id=ing_data.ingredient_id,
            quantity=ing_data.quantity
        )
        db.add(db_recipe_ing)

    # Add dependencies
    if dependency_ids:
        dependencies = db.query(models.Recipe).filter(models.Recipe.id.in_(dependency_ids)).all()
        db_recipe.dependencies = dependencies

    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@app.get("/recipes/", response_model=List[schemas.Recipe])
def read_recipes(response: Response, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    total = db.query(models.Recipe).count()
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    recipes = db.query(models.Recipe).order_by(models.Recipe.name).offset(skip).limit(limit).all()
    return recipes

@app.get("/recipes/{recipe_id}", response_model=schemas.Recipe)
def read_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe

@app.put("/recipes/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Update basic fields
    for key, value in recipe.model_dump(exclude={'ingredients', 'dependency_ids'}).items():
        setattr(db_recipe, key, value)

    # Update ingredients
    # Remove old ingredients
    db.query(models.RecipeIngredient).filter(models.RecipeIngredient.recipe_id == recipe_id).delete()
    # Add new ones
    for ing_data in recipe.ingredients:
        db_recipe_ing = models.RecipeIngredient(
            recipe_id=db_recipe.id,
            ingredient_id=ing_data.ingredient_id,
            quantity=ing_data.quantity
        )
        db.add(db_recipe_ing)

    # Update dependencies
    if recipe.dependency_ids is not None:
        dependencies = db.query(models.Recipe).filter(models.Recipe.id.in_(recipe.dependency_ids)).all()
        db_recipe.dependencies = dependencies

    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(db_recipe)
    db.commit()
    return {"ok": True}

# --- Planning ---

@app.get("/planning/", response_model=List[schemas.Planning])
def read_planning(start_date: date, end_date: date, db: Session = Depends(get_db)):
    planning = db.query(models.Planning).filter(
        models.Planning.date >= start_date,
        models.Planning.date <= end_date
    ).all()
    return planning

@app.post("/planning/", response_model=schemas.Planning)
def create_or_update_planning(plan: schemas.PlanningCreate, db: Session = Depends(get_db)):
    db_plan = db.query(models.Planning).filter(
        models.Planning.date == plan.date,
        models.Planning.meal_type == plan.meal_type
    ).first()

    if db_plan:
        db_plan.main_recipe_id = plan.main_recipe_id
        db_plan.side_recipe_id = plan.side_recipe_id
    else:
        db_plan = models.Planning(**plan.model_dump())
        db.add(db_plan)

    db.commit()
    db.refresh(db_plan)
    return db_plan

# --- Shopping List ---

@app.get("/shopping-list/")
def get_shopping_list(
    start_date: date,
    end_date: date,
    persons: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    plans = db.query(models.Planning).filter(
        models.Planning.date >= start_date,
        models.Planning.date <= end_date
    ).all()

    shopping_list = {} # ingredient_id -> {name, unit, quantity}

    def add_recipe_to_list(recipe_id, scale=1, visited=None):
        if not recipe_id: return
        if visited is None: visited = set()
        if recipe_id in visited: return
        visited.add(recipe_id)

        recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
        if not recipe: return

        for ri in recipe.ingredients:
            ing = ri.ingredient
            if ing.id not in shopping_list:
                shopping_list[ing.id] = {"name": ing.name, "unit": ing.unit, "quantity": 0, "recipe_ids": "", "recipe_names": ""}
            shopping_list[ing.id]["quantity"] += round(ri.quantity * scale,2)
            shopping_list[ing.id]["recipe_ids"] += ("|" + str(recipe.id)) if shopping_list[ing.id]["recipe_ids"] != "" else str(recipe.id)
            shopping_list[ing.id]["recipe_names"] += ("|" + str(recipe.name)) if shopping_list[ing.id]["recipe_names"] != "" else str(recipe.name)

        for dep in recipe.dependencies:
            add_recipe_to_list(dep.id, scale, visited)

    for plan in plans:
        if plan.main_recipe_id:
            main_recipe = db.query(models.Recipe).filter(models.Recipe.id == plan.main_recipe_id).first()
            main_servings = main_recipe.servings or 1 if main_recipe else 1
            add_recipe_to_list(plan.main_recipe_id, persons / main_servings)
        if plan.side_recipe_id:
            side_recipe = db.query(models.Recipe).filter(models.Recipe.id == plan.side_recipe_id).first()
            side_servings = side_recipe.servings or 1 if side_recipe else 1
            add_recipe_to_list(plan.side_recipe_id, persons / side_servings)

    return list(shopping_list.values())

# --- Search ---

@app.get("/recipes-by-ingredient/{ingredient_name}", response_model=List[schemas.RecipeShort])
def get_recipes_by_ingredient(
    ingredient_name: str,
    response: Response,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(models.Recipe).join(models.RecipeIngredient).join(models.Ingredient).filter(
        models.Ingredient.name.ilike(f"%{ingredient_name}%")
    ).order_by(models.Recipe.name)
    total = query.count()
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    recipes = query.offset(skip).limit(limit).all()
    return recipes
