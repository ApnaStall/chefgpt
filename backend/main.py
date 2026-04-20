"""
PantryAI - FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import admin, auth, chat, pantry, recommendations, recipes
import models  # noqa: F401  # ensure models are registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup if they do not exist.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="PantryAI API",
    version="1.0.0",
    description="AI-powered recipe finder - FastAPI + MySQL + Groq",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(pantry.router, prefix="/api/pantry", tags=["Pantry"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["Recipes"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "PantryAI API"}
