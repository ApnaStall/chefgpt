"""
routers/recommendations.py — Personalised AI recipe recommendations
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import User, Ingredient, UserIngredient, SavedRecipe, Recipe
from schemas import RecommendationRequest, RecommendationResponse, RecommendationOut, RecipeOut, RecipeIngredientOut, RecipeStepOut
from auth_utils import get_current_user
from ai_service import get_recommendations

router = APIRouter()

@router.post("", response_model=RecommendationResponse)
async def personalised_recommendations(
    body: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI Feature 5: Personalised recommendations based on pantry, diet, and mood."""
    # Get pantry
    result = await db.execute(
        select(Ingredient.name)
        .join(UserIngredient, UserIngredient.ingredient_id == Ingredient.id)
        .where(UserIngredient.user_id == current_user.id)
    )
    pantry = [r[0] for r in result.all()]

    # Get cooking history (titles of saved recipes)
    hist = await db.execute(
        select(Recipe.title)
        .join(SavedRecipe, SavedRecipe.recipe_id == Recipe.id)
        .where(SavedRecipe.user_id == current_user.id)
        .order_by(SavedRecipe.saved_at.desc())
        .limit(10)
    )
    history = [r[0] for r in hist.all()]

    diet_pref = body.diet_pref or (current_user.diet_prefs[0] if current_user.diet_prefs else None)

    raw = await get_recommendations(
        pantry=pantry,
        diet_pref=diet_pref,
        mood=body.mood,
        cooking_history=history,
    )

    recs = []
    pantry_set = set(pantry)
    for item in raw:
        r = item["recipe"]
        ings = [
            RecipeIngredientOut(
                name=i["name"], qty=i.get("qty", ""),
                is_optional=i.get("is_optional", False),
                have=i["name"].lower() in pantry_set,
            ) for i in r.get("ingredients", [])
        ]
        steps = [RecipeStepOut(step_order=i+1, instruction=s) for i, s in enumerate(r.get("steps", []))]
        required = [i for i in ings if not i.is_optional]
        match = int(len([i for i in required if i.have]) / max(len(required), 1) * 100)

        recipe_out = RecipeOut(
            id=f"rec-{len(recs)}",
            title=r["title"], emoji=r.get("emoji", "✨"),
            description=r.get("description"), cuisine=r.get("cuisine"),
            meal_type=r.get("meal_type", "dinner"),
            prep_time=r.get("prep_time"), servings=r.get("servings", 2),
            tags=r.get("tags", []), match_score=match,
            ingredients=ings, steps=steps,
        )
        recs.append(RecommendationOut(
            recipe=recipe_out,
            why=item.get("why", "Recommended for you"),
            confidence=item.get("confidence", 80),
        ))

    return RecommendationResponse(recommendations=recs)
