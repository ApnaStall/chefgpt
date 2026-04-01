"""
schemas.py — Pydantic v2 request/response models
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ─── ENUMS ───────────────────────────────────────────────────────────────────
class MealType(str, Enum):
    breakfast = "breakfast"
    lunch     = "lunch"
    dinner    = "dinner"
    snack     = "snack"

class DietPref(str, Enum):
    vegetarian  = "vegetarian"
    vegan       = "vegan"
    gluten_free = "gluten-free"
    low_carb    = "low-carb"

# ─── AUTH ────────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email:      EmailStr
    name:       str      = Field(min_length=2, max_length=100)
    password:   str      = Field(min_length=6)
    diet_prefs: List[str] = []

class UserLogin(BaseModel):
    email:    EmailStr
    password: str

class UserOut(BaseModel):
    class Config:
     orm_mode = True
    id:         str
    email:      str
    name:       str
    diet_prefs: List[str] = []
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut

# ─── INGREDIENT ──────────────────────────────────────────────────────────────
class IngredientOut(BaseModel):
    class Config:
     orm_mode = True
    id:        str
    name:      str
    category:  Optional[str]
    unit_type: Optional[str]
    aliases:   List[str] = []

# ─── PANTRY ──────────────────────────────────────────────────────────────────
class PantryAdd(BaseModel):
    ingredient_names: List[str] = Field(min_length=1)

class PantryItemOut(BaseModel):
    class Config:
     orm_mode = True
    id:         str
    ingredient: IngredientOut
    quantity:   Optional[float]
    unit:       Optional[str]
    added_at:   datetime

class PantryOut(BaseModel):
    items:       List[PantryItemOut]
    total_count: int

# ─── AI FEATURE SCHEMAS ──────────────────────────────────────────────────────
class IngredientSuggestionRequest(BaseModel):
    pantry_ingredients: List[str]

class IngredientSuggestionResponse(BaseModel):
    suggestions: List[str]
    reasoning:   str

# ─── RECIPE ──────────────────────────────────────────────────────────────────
class RecipeIngredientOut(BaseModel):
    name:        str
    qty:         str
    is_optional: bool = False
    have:        bool = False   # computed: is it in user's pantry?

class RecipeStepOut(BaseModel):
    step_order:    int
    instruction:   str
    duration_mins: Optional[int]

class RecipeOut(BaseModel):
    class Config:
     orm_mode = True
    id:           str
    title:        str
    description:  Optional[str]
    emoji:        str
    cuisine:      Optional[str]
    meal_type:    str
    prep_time:    Optional[int]
    servings:     int
    tags:         List[str] = []
    match_score:  int = 0
    ingredients:  List[RecipeIngredientOut] = []
    steps:        List[RecipeStepOut]       = []

class RecipeSearchRequest(BaseModel):
    meal_type:  Optional[MealType] = None
    max_time:   Optional[int]      = None      # minutes
    diet_pref:  Optional[str]      = None

class GenerateRecipesRequest(BaseModel):
    meal_type:  Optional[MealType] = None
    max_time:   Optional[int]      = None
    diet_pref:  Optional[str]      = None

# ─── SUBSTITUTIONS ───────────────────────────────────────────────────────────
class SubstitutionRequest(BaseModel):
    recipe_title:        str
    missing_ingredients: List[str]
    pantry_ingredients:  List[str]

class SubstitutionResponse(BaseModel):
    substitutions: List[dict]   # [{missing, substitute, notes}]
    tips:          str

# ─── CHAT ────────────────────────────────────────────────────────────────────
class ChatMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

class ChatMessageOut(BaseModel):
    class Config:
     orm_mode = True
    id:         str
    role:       str
    content:    str
    created_at: datetime

class ChatResponse(BaseModel):
    message:  ChatMessageOut
    history:  List[ChatMessageOut]

# ─── RECOMMENDATIONS ─────────────────────────────────────────────────────────
class RecommendationRequest(BaseModel):
    diet_pref: Optional[str] = None
    mood:      Optional[str] = None

class RecommendationOut(BaseModel):
    recipe:     RecipeOut
    why:        str          # personalised reason
    confidence: int          # 0-100

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationOut]

# ─── SAVED RECIPES ───────────────────────────────────────────────────────────
class SaveRecipeIn(BaseModel):
    recipe_id: str
    rating:    Optional[int] = Field(None, ge=1, le=5)

class SavedRecipeOut(BaseModel):
    class Config:
     orm_mode = True
    id:       str
    recipe:   RecipeOut
    rating:   Optional[int]
    saved_at: datetime
class UserOut(BaseModel):
    id: str
    email: str
    name: str
    created_at: Optional[datetime] = None   # ✅ FIX


    model_config = {
        "from_attributes": True
    }