"""
routers/recipes.py — Generate AI recipes, list, save, get substitutions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, Recipe, RecipeIngredient, RecipeStep, Ingredient, SavedRecipe, UserIngredient
from schemas import (
    GenerateRecipesRequest, RecipeOut, RecipeIngredientOut, RecipeStepOut,
    SubstitutionRequest, SubstitutionResponse, SaveRecipeIn, SavedRecipeOut,
)
from auth_utils import get_current_user
from ai_service import generate_recipes, get_substitutions

router = APIRouter()

async def _get_pantry_names(db: AsyncSession, user_id: str) -> list[str]:
    result = await db.execute(
        select(Ingredient.name)
        .join(UserIngredient, UserIngredient.ingredient_id == Ingredient.id)
        .where(UserIngredient.user_id == user_id)
    )
    return [r[0] for r in result.all()]

async def _persist_recipe(db: AsyncSession, r: dict, user_id: str) -> Recipe:
    recipe = Recipe(
        title=r["title"], emoji=r.get("emoji", "🍳"),
        description=r.get("description"), cuisine=r.get("cuisine"),
        meal_type=r.get("meal_type", "dinner"),
        prep_time=r.get("prep_time"), servings=r.get("servings", 2),
        tags=r.get("tags", []), created_by=user_id,
    )
    db.add(recipe)
    await db.flush()

    for i, step in enumerate(r.get("steps", []), 1):
        db.add(RecipeStep(recipe_id=recipe.id, step_order=i, instruction=step))

    for ing_data in r.get("ingredients", []):
        name = ing_data["name"].lower().strip()
        res = await db.execute(select(Ingredient).where(Ingredient.name == name))
        ing = res.scalar_one_or_none()
        if not ing:
            ing = Ingredient(name=name, category="other")
            db.add(ing)
            await db.flush()
        db.add(RecipeIngredient(
            recipe_id=recipe.id, ingredient_id=ing.id,
            quantity=ing_data.get("qty", ""), is_optional=ing_data.get("is_optional", False),
        ))

    await db.flush()
    await db.refresh(recipe)
    return recipe

def _build_recipe_out(recipe: Recipe, pantry: list[str], extra: dict = None) -> RecipeOut:
    pantry_set = set(pantry)
    ings = [
        RecipeIngredientOut(
            name=ri.ingredient.name,
            qty=ri.quantity or "",
            is_optional=ri.is_optional,
            have=ri.ingredient.name in pantry_set,
        )
        for ri in recipe.ingredients
    ]
    steps = [RecipeStepOut(step_order=s.step_order, instruction=s.instruction,
                           duration_mins=s.duration_mins) for s in recipe.steps]
    required = [i for i in ings if not i.is_optional]
    match = int(len([i for i in required if i.have]) / max(len(required), 1) * 100)

    data = dict(
        id=recipe.id, title=recipe.title, description=recipe.description,
        emoji=recipe.emoji, cuisine=recipe.cuisine, meal_type=recipe.meal_type,
        prep_time=recipe.prep_time, servings=recipe.servings, tags=recipe.tags or [],
        match_score=match, ingredients=ings, steps=steps,
    )
    if extra:
        data.update(extra)
    return RecipeOut(**data)

@router.post("/generate", response_model=list[RecipeOut])
async def generate_ai_recipes(
    body: GenerateRecipesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI Feature 2: Generate recipes from pantry."""
    pantry = await _get_pantry_names(db, current_user.id)
    if not pantry:
        raise HTTPException(400, "Add ingredients to your pantry first")

    raw = await generate_recipes(
        pantry=pantry,
        meal_type=body.meal_type,
        max_time=body.max_time,
        diet_pref=body.diet_pref,
    )
    recipes = []
    for r in raw:
        recipe = await _persist_recipe(db, r, current_user.id)
        # reload with relationships
        res = await db.execute(
            select(Recipe)
            .where(Recipe.id == recipe.id)
            .options(selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient),
                     selectinload(Recipe.steps))
        )
        recipe = res.scalar_one()
        recipes.append(_build_recipe_out(recipe, pantry))

    return sorted(recipes, key=lambda r: r.match_score, reverse=True)

@router.get("", response_model=list[RecipeOut])
async def list_recipes(
    meal_type: str = None, max_time: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pantry = await _get_pantry_names(db, current_user.id)
    q = select(Recipe).where(Recipe.created_by == current_user.id) \
        .options(selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient),
                 selectinload(Recipe.steps)) \
        .order_by(Recipe.created_at.desc()).limit(30)
    if meal_type:
        q = q.where(Recipe.meal_type == meal_type)
    if max_time:
        q = q.where(Recipe.prep_time <= max_time)
    result = await db.execute(q)
    return [_build_recipe_out(r, pantry) for r in result.scalars().all()]

@router.get("/{recipe_id}", response_model=RecipeOut)
async def get_recipe(
    recipe_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pantry = await _get_pantry_names(db, current_user.id)
    result = await db.execute(
        select(Recipe).where(Recipe.id == recipe_id)
        .options(selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient),
                 selectinload(Recipe.steps))
    )
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(404, "Recipe not found")
    return _build_recipe_out(recipe, pantry)

@router.post("/substitutions", response_model=SubstitutionResponse)
async def ai_substitutions(
    body: SubstitutionRequest,
    current_user: User = Depends(get_current_user),
):
    """AI Feature 3: Suggest substitutions for missing ingredients."""
    result = await get_substitutions(
        recipe_title=body.recipe_title,
        missing=body.missing_ingredients,
        pantry=body.pantry_ingredients,
    )
    return SubstitutionResponse(
        substitutions=result.get("substitutions", []),
        tips=result.get("tips", ""),
    )

@router.post("/save", response_model=dict)
async def save_recipe(
    body: SaveRecipeIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(
        select(SavedRecipe).where(
            SavedRecipe.user_id == current_user.id,
            SavedRecipe.recipe_id == body.recipe_id,
        )
    )
    saved = existing.scalar_one_or_none()
    if saved:
        if body.rating:
            saved.rating = body.rating
    else:
        db.add(SavedRecipe(user_id=current_user.id, recipe_id=body.recipe_id, rating=body.rating))
    return {"saved": True}

@router.get("/saved/list", response_model=list[RecipeOut])
async def saved_recipes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pantry = await _get_pantry_names(db, current_user.id)
    result = await db.execute(
        select(Recipe)
        .join(SavedRecipe, SavedRecipe.recipe_id == Recipe.id)
        .where(SavedRecipe.user_id == current_user.id)
        .options(selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient),
                 selectinload(Recipe.steps))
        .order_by(SavedRecipe.saved_at.desc())
    )
    return [_build_recipe_out(r, pantry) for r in result.scalars().all()]
