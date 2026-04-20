"""
ai_service.py - All Groq interactions centralized here
"""

import json
import re

from groq import AsyncGroq

from config import settings


client = AsyncGroq(api_key=settings.GROQ_API_KEY)

ALLOWED_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}
MEAL_TYPE_ALIASES = {
    "dessert": "snack",
    "brunch": "lunch",
    "appetizer": "snack",
    "starter": "snack",
    "main": "dinner",
    "main_course": "dinner",
    "side": "snack",
}


async def _chat(messages: list[dict], max_tokens: int = 1000, json_mode: bool = False) -> str:
    kwargs = {
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.8,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    resp = await client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content


def _parse_json(text: str) -> dict | list:
    text = re.sub(r"```json|```", "", text).strip()
    return json.loads(text)


def _normalize_meal_type(value: str | None) -> str:
    if not value:
        return "dinner"
    normalized = str(value).strip().lower().replace(" ", "_")
    normalized = MEAL_TYPE_ALIASES.get(normalized, normalized)
    return normalized if normalized in ALLOWED_MEAL_TYPES else "dinner"


async def suggest_ingredient_pairings(pantry: list[str]) -> dict:
    prompt = f"""I have these ingredients: {', '.join(pantry)}.
Suggest 6 more ingredients that pair well and expand what I can cook.
Return JSON: {{"suggestions": ["ing1","ing2",...], "reasoning": "brief explanation"}}"""
    result = await _chat(
        [{"role": "user", "content": prompt}],
        max_tokens=400,
        json_mode=True,
    )
    return _parse_json(result)


async def generate_recipes(
    pantry: list[str],
    meal_type: str | None = None,
    max_time: int | None = None,
    diet_pref: str | None = None,
) -> list[dict]:
    filters = []
    if meal_type:
        filters.append(f"meal type: {meal_type}")
    if max_time:
        filters.append(f"max prep time: {max_time} minutes")
    if diet_pref:
        filters.append(f"diet: {diet_pref}")
    filter_str = (", ".join(filters) + ".") if filters else ""

    prompt = f"""You are a recipe generation engine.
Pantry ingredients: {', '.join(pantry)}.
Constraints: {filter_str or 'none'}.

Generate 6 diverse recipes primarily using these ingredients.
Return a JSON object with a "recipes" array. Each recipe must have:
{{
  "title": string,
  "emoji": string,
  "cuisine": string,
  "meal_type": "breakfast"|"lunch"|"dinner"|"snack",
  "prep_time": integer (minutes),
  "servings": integer,
  "description": string (1 sentence),
  "tags": [string],
  "match_score": integer (0-100),
  "ingredients": [{{"name": string, "qty": string, "is_optional": boolean, "have": boolean}}],
  "steps": [string]
}}"""
    result = await _chat(
        [{"role": "user", "content": prompt}],
        max_tokens=2500,
        json_mode=True,
    )
    data = _parse_json(result)
    recipes = data.get("recipes", data) if isinstance(data, dict) else data
    for recipe in recipes:
        if isinstance(recipe, dict):
            recipe["meal_type"] = _normalize_meal_type(recipe.get("meal_type"))
    return recipes


async def get_substitutions(
    recipe_title: str,
    missing: list[str],
    pantry: list[str],
) -> dict:
    prompt = f"""Recipe: "{recipe_title}".
Missing ingredients: {', '.join(missing)}.
User's pantry: {', '.join(pantry)}.

Suggest the best substitutions from the pantry or easy alternatives.
Return JSON: {{
  "substitutions": [{{"missing": string, "substitute": string, "notes": string}}],
  "tips": string
}}"""
    result = await _chat(
        [{"role": "user", "content": prompt}],
        max_tokens=600,
        json_mode=True,
    )
    return _parse_json(result)


async def cooking_chat(
    history: list[dict],
    new_message: str,
    pantry: list[str],
) -> str:
    system = f"""You are a friendly, expert cooking assistant.
The user's current pantry: {', '.join(pantry) or 'not set yet'}.
Help with recipe ideas, cooking tips, substitutions, meal planning.
Keep responses practical and concise. Use markdown bullet points sparingly."""

    messages = [{"role": "system", "content": system}]
    for msg in history[-10:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": new_message})

    return await _chat(messages, max_tokens=700)


async def get_recommendations(
    pantry: list[str],
    diet_pref: str | None,
    mood: str | None,
    cooking_history: list[str],
) -> list[dict]:
    history_ctx = f"Recently cooked: {', '.join(cooking_history[-5:])}." if cooking_history else ""
    prompt = f"""You are a personalised recipe recommender.
Pantry: {', '.join(pantry) or 'not set'}.
Diet: {diet_pref or 'none'}.
Craving/mood: {mood or 'not specified'}.
{history_ctx}

Recommend 4 recipes tailored specifically to this user. Return JSON object with "recommendations" array:
{{
  "recommendations": [{{
    "recipe": {{
      "title": string, "emoji": string, "cuisine": string,
      "meal_type": "breakfast"|"lunch"|"dinner"|"snack",
      "prep_time": integer, "servings": integer, "description": string,
      "tags": [string], "match_score": integer,
      "ingredients": [{{"name": string, "qty": string, "is_optional": boolean, "have": boolean}}],
      "steps": [string]
    }},
    "why": string (personalised 1-sentence reason),
    "confidence": integer (0-100)
  }}]
}}"""
    result = await _chat(
        [{"role": "user", "content": prompt}],
        max_tokens=2000,
        json_mode=True,
    )
    data = _parse_json(result)
    return data.get("recommendations", [])
