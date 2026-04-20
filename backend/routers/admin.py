"""
Admin-only routes for dashboard metrics and recent activity.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth_utils import get_current_admin, is_admin_email
from database import get_db
from models import ChatMessage, Ingredient, Recipe, SavedRecipe, User, UserIngredient
from schemas import AdminDashboardOut, AdminRecentRecipeOut, AdminRecentUserOut, AdminSummaryStats

router = APIRouter()


async def _count_rows(db: AsyncSession, model) -> int:
    return int(await db.scalar(select(func.count()).select_from(model)) or 0)


@router.get("/dashboard", response_model=AdminDashboardOut)
async def get_admin_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stats = AdminSummaryStats(
        total_users=await _count_rows(db, User),
        total_recipes=await _count_rows(db, Recipe),
        total_ingredients=await _count_rows(db, Ingredient),
        total_pantry_items=await _count_rows(db, UserIngredient),
        total_saved_recipes=await _count_rows(db, SavedRecipe),
        total_chat_messages=await _count_rows(db, ChatMessage),
    )

    recent_users_result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(5)
    )
    recent_recipe_rows = await db.execute(
        select(Recipe, User.name)
        .outerjoin(User, Recipe.created_by == User.id)
        .order_by(Recipe.created_at.desc())
        .limit(5)
    )

    recent_users = [
        AdminRecentUserOut(
            id=user.id,
            email=user.email,
            name=user.name,
            role="admin" if is_admin_email(user.email) else "user",
            created_at=user.created_at,
        )
        for user in recent_users_result.scalars().all()
    ]
    recent_recipes = [
        AdminRecentRecipeOut(
            id=recipe.id,
            title=recipe.title,
            source=recipe.source,
            creator_name=creator_name,
            created_at=recipe.created_at,
        )
        for recipe, creator_name in recent_recipe_rows.all()
    ]

    return AdminDashboardOut(
        stats=stats,
        recent_users=recent_users,
        recent_recipes=recent_recipes,
    )
