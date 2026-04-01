"""
routers/chat.py — Multi-turn AI cooking chat, persisted to MySQL
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, ChatMessage, Ingredient, UserIngredient
from schemas import ChatMessageIn, ChatMessageOut, ChatResponse
from auth_utils import get_current_user
from ai_service import cooking_chat

router = APIRouter()

@router.post("", response_model=ChatResponse)
async def send_message(
    body: ChatMessageIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI Feature 4: Natural language cooking chat with pantry context."""
    # Get pantry
    result = await db.execute(
        select(Ingredient.name)
        .join(UserIngredient, UserIngredient.ingredient_id == Ingredient.id)
        .where(UserIngredient.user_id == current_user.id)
    )
    pantry = [r[0] for r in result.all()]

    # Load recent history
    hist_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
    )
    history_rows = list(reversed(hist_result.scalars().all()))
    history = [{"role": h.role, "content": h.content} for h in history_rows]

    # Save user message
    user_msg = ChatMessage(user_id=current_user.id, role="user", content=body.content)
    db.add(user_msg)
    await db.flush()

    # Call AI
    ai_text = await cooking_chat(history, body.content, pantry)

    # Save AI response
    ai_msg = ChatMessage(user_id=current_user.id, role="assistant", content=ai_text)
    db.add(ai_msg)
    await db.flush()
    await db.refresh(ai_msg)
    await db.refresh(user_msg)

    all_history = history_rows + [user_msg, ai_msg]
    return ChatResponse(
        message=ChatMessageOut.model_validate(ai_msg),
        history=[ChatMessageOut.model_validate(m) for m in all_history],
    )

@router.get("/history", response_model=list[ChatMessageOut])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(50)
    )
    return [ChatMessageOut.model_validate(m) for m in result.scalars().all()]

@router.delete("/history")
async def clear_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatMessage).where(ChatMessage.user_id == current_user.id)
    )
    for msg in result.scalars().all():
        await db.delete(msg)
    return {"cleared": True}
