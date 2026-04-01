"""
routers/pantry.py — Get/Add/Remove user pantry items + AI ingredient suggestions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, Ingredient, UserIngredient
from schemas import PantryAdd, PantryOut, PantryItemOut, IngredientOut, IngredientSuggestionRequest, IngredientSuggestionResponse
from auth_utils import get_current_user
from ai_service import suggest_ingredient_pairings

router = APIRouter()

async def _get_or_create_ingredient(db: AsyncSession, name: str) -> Ingredient:
    name = name.lower().strip()
    result = await db.execute(select(Ingredient).where(Ingredient.name == name))
    ing = result.scalar_one_or_none()
    if not ing:
        ing = Ingredient(name=name, category="other")
        db.add(ing)
        await db.flush()
        await db.refresh(ing)
    return ing

@router.get("", response_model=PantryOut)
async def get_pantry(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserIngredient)
        .where(UserIngredient.user_id == current_user.id)
        .options(selectinload(UserIngredient.ingredient))
        .order_by(UserIngredient.added_at.desc())
    )
    items = result.scalars().all()
    return PantryOut(
        items=[PantryItemOut.model_validate(i) for i in items],
        total_count=len(items),
    )

@router.post("", response_model=PantryOut)
async def add_to_pantry(
    body: PantryAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for name in body.ingredient_names:
        ing = await _get_or_create_ingredient(db, name)
        existing = await db.execute(
            select(UserIngredient).where(
                UserIngredient.user_id == current_user.id,
                UserIngredient.ingredient_id == ing.id,
            )
        )
        if not existing.scalar_one_or_none():
            db.add(UserIngredient(user_id=current_user.id, ingredient_id=ing.id))

    await db.flush()
    return await get_pantry(db=db, current_user=current_user)

@router.delete("/{ingredient_name}", response_model=PantryOut)
async def remove_from_pantry(
    ingredient_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Ingredient).where(Ingredient.name == ingredient_name.lower())
    )
    ing = result.scalar_one_or_none()
    if not ing:
        raise HTTPException(404, "Ingredient not found")

    await db.execute(
        delete(UserIngredient).where(
            UserIngredient.user_id == current_user.id,
            UserIngredient.ingredient_id == ing.id,
        )
    )
    return await get_pantry(db=db, current_user=current_user)

@router.post("/suggest", response_model=IngredientSuggestionResponse)
async def ai_suggest_ingredients(
    body: IngredientSuggestionRequest,
    current_user: User = Depends(get_current_user),
):
    """AI Feature 1: Suggest ingredients that pair well with the user's pantry."""
    if not body.pantry_ingredients:
        raise HTTPException(400, "Provide at least one ingredient")
    result = await suggest_ingredient_pairings(body.pantry_ingredients)
    return IngredientSuggestionResponse(
        suggestions=result.get("suggestions", []),
        reasoning=result.get("reasoning", ""),
    )
