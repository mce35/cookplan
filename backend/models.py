from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Text, Table
from sqlalchemy.orm import relationship
from database import Base

# Junction table for recipe dependencies
recipe_dependencies = Table(
    "recipe_dependencies",
    Base.metadata,
    Column("parent_recipe_id", Integer, ForeignKey("recipes.id"), primary_key=True),
    Column("child_recipe_id", Integer, ForeignKey("recipes.id"), primary_key=True),
)

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    servings = Column(Integer)
    prep_time = Column(Integer)  # in minutes
    cook_time = Column(Integer)  # in minutes
    recipe_type = Column(String)  # entree, plat, accompagnement, dessert
    instructions = Column(Text)

    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")

    # Self-referential relationship for dependencies
    dependencies = relationship(
        "Recipe",
        secondary=recipe_dependencies,
        primaryjoin=id == recipe_dependencies.c.parent_recipe_id,
        secondaryjoin=id == recipe_dependencies.c.child_recipe_id,
        backref="used_in"
    )

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    unit = Column(String) # e.g., g, ml, unit

    recipe_ingredients = relationship("RecipeIngredient", back_populates="ingredient")

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    recipe_id = Column(Integer, ForeignKey("recipes.id"), primary_key=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), primary_key=True)
    quantity = Column(Float)

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_ingredients")

class Planning(Base):
    __tablename__ = "planning"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    meal_type = Column(String)  # midi, soir

    # We want a main dish and a side dish for each meal
    main_recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    side_recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    note = Column(String, nullable=True)  # Notes for the meal

    main_recipe = relationship("Recipe", foreign_keys=[main_recipe_id])
    side_recipe = relationship("Recipe", foreign_keys=[side_recipe_id])
