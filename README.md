<<<<<<< HEAD
👨‍🍳 ChefGPT
Cloud-Based Data-Driven Recipe Generator & Nutrition Tracker


📌 Overview

ChefGPT is a full-stack cloud-native web application that generates personalized recipes based on available ingredients and tracks daily nutritional intake. The system leverages Python backend logic, a MySQL relational database, and AWS cloud infrastructure for scalable deployment.


🛠️ Tech Stack

• Backend: Python (Flask/Django)

• Database: MySQL

• Cloud: AWS EC2 / ECS, AWS RDS, AWS S3

• Frontend: HTML, CSS, JavaScript

• AI Logic: Custom Generative Logic (Ingredient-based Recipe Suggestion)


✨ Key Features

• 🔐 User Authentication (Signup/Login)

• 🥗 Ingredient-Based Recipe Suggestions

• 📊 Daily Nutrition Tracking

• 🗂️ Structured Relational Database

• ☁️ Cloud Deployment using AWS

• 🖼️ Recipe Image Storage via S3


🗄️ Database Schema Design

The system uses a normalized relational schema including:

• Users

• Recipes

• Ingredients

• Recipe_Ingredients

• User_Logs

Designed to support optimized relational queries and user personalization.


☁️ Cloud Architecture

• Application hosted on AWS EC2 / ECS

• Managed MySQL database via AWS RDS

• Static assets and images stored in AWS S3


🧠 AI-Based Recommendation Logic

• ChefGPT includes a basic generative concept that:

• Accepts user-provided ingredients

• Matches them with stored recipes

• Identifies missing ingredients

• Suggests alternatives for substitutions


🚀 Future Enhancements

• Integration with LLM APIs (OpenAI / HuggingFace)

• Docker Containerization

• CI/CD Pipeline Implementation

• Admin Dashboard

• Advanced Nutritional Analytics

📈 Resume Highlights

• Designed and optimized a normalized MySQL schema for relational data handling.

• Deployed a cloud-native Python application using AWS EC2 and RDS.

• Implemented AI-inspired ingredient-based recommendation logic.

• Built secure authentication and session management system.
=======
# 🥘 PantryAI — Full Stack

AI-powered recipe finder built with **React + FastAPI + MySQL + OpenAI**.

---

## Tech Stack

| Layer     | Technology                            |
|-----------|---------------------------------------|
| Frontend  | React 18, Vite, React Router, Axios   |
| Backend   | Python 3.11+, FastAPI, SQLAlchemy 2   |
| Database  | MySQL 8.0+, aiomysql (async driver)   |
| AI        | OpenAI GPT-4o-mini                    |
| Auth      | JWT (python-jose) + bcrypt (passlib)  |

---

## Project Structure

```
pantryai/
├── database/
│   └── schema.sql               ← MySQL schema + seed data
│
├── backend/
│   ├── main.py                  ← FastAPI app entry
│   ├── config.py                ← Env-based settings
│   ├── database.py              ← Async SQLAlchemy engine
│   ├── models.py                ← ORM models
│   ├── schemas.py               ← Pydantic schemas
│   ├── auth_utils.py            ← JWT + bcrypt
│   ├── ai_service.py            ← All OpenAI calls
│   ├── requirements.txt
│   ├── .env.example
│   └── routers/
│       ├── auth.py              ← POST /api/auth/register, /login
│       ├── pantry.py            ← GET/POST/DELETE /api/pantry + AI suggest
│       ├── recipes.py           ← POST /api/recipes/generate, substitutions
│       ├── chat.py              ← POST /api/chat (multi-turn, persisted)
│       └── recommendations.py  ← POST /api/recommendations
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css             ← Design system
        ├── api/client.js         ← Axios + all API functions
        ├── hooks/
        │   ├── useAuth.js        ← Auth context
        │   └── useToast.js       ← Toast notifications
        ├── pages/
        │   ├── AuthPage.jsx      ← Login / Register
        │   └── Dashboard.jsx     ← Main app shell
        └── components/
            ├── PantrySidebar.jsx         ← Pantry management
            ├── RecipeCard.jsx            ← Card + Grid
            ├── RecipeModal.jsx           ← Detail + substitutions
            ├── ChatPanel.jsx             ← AI chat
            └── RecommendationsPanel.jsx  ← Personalised recs
```

---

## AI Features

| Feature | Endpoint | Description |
|---------|----------|-------------|
| 🥦 Ingredient pairing  | `POST /api/pantry/suggest`           | Suggests ingredients that complement your pantry |
| 🍳 Recipe generation   | `POST /api/recipes/generate`         | Generates 6 recipes ranked by pantry match score |
| 🔄 Substitutions       | `POST /api/recipes/substitutions`    | Finds substitutes for missing ingredients |
| 💬 Cooking chat        | `POST /api/chat`                     | Multi-turn chat with pantry context, persisted to DB |
| ✨ Recommendations     | `POST /api/recommendations`          | Personalised picks based on diet, mood & history |

---

## Setup

### 1. Database

```bash
# Start MySQL and run the schema
mysql -u root -p < database/schema.sql
```

### 2. Backend

```bash
cd backend

# Copy and fill in environment variables
cp .env.example .env
# Edit .env: set DB_PASS, OPENAI_API_KEY, SECRET_KEY

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.  
Swagger docs: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

App will be at `http://localhost:3000`.

---

## API Reference (key endpoints)

```
POST   /api/auth/register           Register new user
POST   /api/auth/login              Login → returns JWT

GET    /api/pantry                  Get user's pantry
POST   /api/pantry                  Add ingredients { ingredient_names: [] }
DELETE /api/pantry/{name}           Remove ingredient
POST   /api/pantry/suggest          AI: suggest pairing ingredients

POST   /api/recipes/generate        AI: generate recipes from pantry
GET    /api/recipes                 List user's generated recipes
GET    /api/recipes/{id}            Get single recipe
POST   /api/recipes/substitutions   AI: find substitutions for missing
POST   /api/recipes/save            Save/bookmark a recipe
GET    /api/recipes/saved/list      Get saved recipes

POST   /api/chat                    Send message (multi-turn, pantry-aware)
GET    /api/chat/history            Get chat history
DELETE /api/chat/history            Clear chat history

POST   /api/recommendations         AI: personalised recommendations
```

---

## Environment Variables

### Backend `.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=pantryai

SECRET_KEY=your-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

DEBUG=false
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api
```
>>>>>>> 2783fce (working)
