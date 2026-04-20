"""
models.py — SQLAlchemy ORM models mapping to MySQL schema
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, SmallInteger, Boolean,
    DateTime, Enum, ForeignKey, UniqueConstraint, JSON, Numeric
)
from sqlalchemy.orm import relationship
from database import Base

def gen_uuid():
    return str(uuid.uuid4())

# ─── USER ────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id         = Column(String(36), primary_key=True, default=gen_uuid)
    email      = Column(String(255), unique=True, nullable=False)
    name       = Column(String(100), nullable=False)
    password   = Column(String(255), nullable=False)
    diet_prefs = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pantry        = relationship("UserIngredient", back_populates="user",    cascade="all, delete")
    saved_recipes = relationship("SavedRecipe",    back_populates="user",    cascade="all, delete")
    chat_messages = relationship("ChatMessage",    back_populates="user",    cascade="all, delete")
    recipes       = relationship("Recipe",         back_populates="creator")

# ─── INGREDIENT ──────────────────────────────────────────────────────────────
class Ingredient(Base):
    __tablename__ = "ingredients"

    id        = Column(String(36), primary_key=True, default=gen_uuid)
    name      = Column(String(100), unique=True, nullable=False)
    category  = Column(String(50))
    aliases   = Column(JSON, default=list)
    unit_type = Column(Enum("weight", "volume", "count", "bunch"), default="count")
    image_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    user_pantry       = relationship("UserIngredient",         back_populates="ingredient")
    recipe_usages     = relationship("RecipeIngredient",       back_populates="ingredient")
    substitutions_from = relationship(
        "IngredientSubstitution",
        foreign_keys="IngredientSubstitution.ingredient_id",
        back_populates="ingredient",
    )

# ─── USER PANTRY ─────────────────────────────────────────────────────────────
class UserIngredient(Base):
    __tablename__ = "user_ingredients"
    __table_args__ = (UniqueConstraint("user_id", "ingredient_id"),)

    id            = Column(String(36), primary_key=True, default=gen_uuid)
    user_id       = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(String(36), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    quantity      = Column(Numeric(8, 2))
    unit          = Column(String(30))
    added_at      = Column(DateTime, default=datetime.utcnow)

    user       = relationship("User",       back_populates="pantry")
    ingredient = relationship("Ingredient", back_populates="user_pantry")

# ─── RECIPE ──────────────────────────────────────────────────────────────────
class Recipe(Base):
    __tablename__ = "recipes"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    title       = Column(String(200), nullable=False)
    description = Column(Text)
    emoji       = Column(String(10), default="🍳")
    cuisine     = Column(String(80))
    meal_type   = Column(Enum("breakfast", "lunch", "dinner", "snack"), default="dinner")
    prep_time   = Column(SmallInteger)
    servings    = Column(Integer, default=2)
    tags        = Column(JSON, default=list)
    source      = Column(Enum("ai_generated", "manual", "imported"), default="ai_generated")
    created_by  = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"))
    created_at  = Column(DateTime, default=datetime.utcnow)

    creator     = relationship("User",             back_populates="recipes")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete")
    steps       = relationship("RecipeStep",       back_populates="recipe", cascade="all, delete",
                               order_by="RecipeStep.step_order")
    saved_by    = relationship("SavedRecipe",      back_populates="recipe", cascade="all, delete")

# ─── RECIPE INGREDIENT ───────────────────────────────────────────────────────
class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    __table_args__ = (UniqueConstraint("recipe_id", "ingredient_id"),)

    id            = Column(String(36), primary_key=True, default=gen_uuid)
    recipe_id     = Column(String(36), ForeignKey("recipes.id",     ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(String(36), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    quantity      = Column(String(30))
    is_optional   = Column(Boolean, default=False)
    notes         = Column(String(200))

    recipe     = relationship("Recipe",     back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_usages")

# ─── RECIPE STEP ─────────────────────────────────────────────────────────────
class RecipeStep(Base):
    __tablename__ = "recipe_steps"

    id            = Column(String(36), primary_key=True, default=gen_uuid)
    recipe_id     = Column(String(36), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    step_order    = Column(Integer, nullable=False)
    instruction   = Column(Text, nullable=False)
    duration_mins = Column(Integer)

    recipe = relationship("Recipe", back_populates="steps")

# ─── SUBSTITUTIONS ───────────────────────────────────────────────────────────
class IngredientSubstitution(Base):
    __tablename__ = "ingredient_substitutions"
    __table_args__ = (UniqueConstraint("ingredient_id", "substitute_id"),)

    id            = Column(String(36), primary_key=True, default=gen_uuid)
    ingredient_id = Column(String(36), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    substitute_id = Column(String(36), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    ratio         = Column(String(50), default="1:1")
    notes         = Column(String(200))

    ingredient = relationship("Ingredient", foreign_keys=[ingredient_id],
                              back_populates="substitutions_from")

# ─── SAVED RECIPE ────────────────────────────────────────────────────────────
class SavedRecipe(Base):
    __tablename__ = "saved_recipes"
    __table_args__ = (UniqueConstraint("user_id", "recipe_id"),)

    id        = Column(String(36), primary_key=True, default=gen_uuid)
    user_id   = Column(String(36), ForeignKey("users.id",   ondelete="CASCADE"), nullable=False)
    recipe_id = Column(String(36), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    rating    = Column(Integer)
    cooked_at = Column(DateTime)
    saved_at  = Column(DateTime, default=datetime.utcnow)

    user   = relationship("User",   back_populates="saved_recipes")
    recipe = relationship("Recipe", back_populates="saved_by")

# ─── CHAT MESSAGE ────────────────────────────────────────────────────────────
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(String(36), primary_key=True, default=gen_uuid)
    user_id    = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role       = Column(Enum("user", "assistant"), nullable=False)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")
