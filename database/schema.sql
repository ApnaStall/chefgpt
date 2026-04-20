-- ============================================================
-- PantryAI Database Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS pantryai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pantryai;

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE users (
    id          CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    password    VARCHAR(255) NOT NULL,           -- bcrypt hash
    diet_prefs  JSON         DEFAULT ('[]'),     -- ["vegetarian","gluten-free"]
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- ─── INGREDIENTS CATALOG ─────────────────────────────────────
CREATE TABLE ingredients (
    id          CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(50),                     -- dairy, produce, protein, spice, grain
    aliases     JSON         DEFAULT ('[]'),     -- ["spring onion","scallion"]
    unit_type   ENUM('weight','volume','count','bunch') DEFAULT 'count',
    image_url   VARCHAR(500),
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY  uq_name (name),
    INDEX       idx_category (category)
);

-- ─── USER PANTRY ─────────────────────────────────────────────
CREATE TABLE user_ingredients (
    id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    user_id       CHAR(36)     NOT NULL,
    ingredient_id CHAR(36)     NOT NULL,
    quantity      DECIMAL(8,2),
    unit          VARCHAR(30),
    added_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY    uq_user_ing (user_id, ingredient_id),
    FOREIGN KEY   (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY   (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- ─── RECIPES ─────────────────────────────────────────────────
CREATE TABLE recipes (
    id          CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    emoji       VARCHAR(10)  DEFAULT '🍳',
    cuisine     VARCHAR(80),
    meal_type   ENUM('breakfast','lunch','dinner','snack') DEFAULT 'dinner',
    prep_time   SMALLINT     UNSIGNED,           -- minutes
    servings    TINYINT      UNSIGNED DEFAULT 2,
    tags        JSON         DEFAULT ('[]'),     -- ["quick","vegetarian"]
    source      ENUM('ai_generated','manual','imported') DEFAULT 'ai_generated',
    created_by  CHAR(36),                        -- user_id who generated it
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_meal_type (meal_type),
    INDEX idx_cuisine   (cuisine),
    FULLTEXT    ft_title_desc (title, description)
);

-- ─── RECIPE INGREDIENTS ──────────────────────────────────────
CREATE TABLE recipe_ingredients (
    id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    recipe_id     CHAR(36)     NOT NULL,
    ingredient_id CHAR(36)     NOT NULL,
    quantity      VARCHAR(30),                   -- "2 cups", "1/2 tsp"
    is_optional   BOOLEAN      DEFAULT FALSE,
    notes         VARCHAR(200),                  -- "finely diced"
    FOREIGN KEY   (recipe_id)     REFERENCES recipes(id)     ON DELETE CASCADE,
    FOREIGN KEY   (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    UNIQUE KEY    uq_recipe_ing (recipe_id, ingredient_id)
);

-- ─── RECIPE STEPS ────────────────────────────────────────────
CREATE TABLE recipe_steps (
    id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    recipe_id     CHAR(36)     NOT NULL,
    step_order    TINYINT      UNSIGNED NOT NULL,
    instruction   TEXT         NOT NULL,
    duration_mins TINYINT      UNSIGNED,
    FOREIGN KEY   (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX         idx_recipe_order (recipe_id, step_order)
);

-- ─── INGREDIENT SUBSTITUTIONS ────────────────────────────────
CREATE TABLE ingredient_substitutions (
    id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    ingredient_id CHAR(36)     NOT NULL,
    substitute_id CHAR(36)     NOT NULL,
    ratio         VARCHAR(50)  DEFAULT '1:1',    -- "use 3/4 the amount"
    notes         VARCHAR(200),
    FOREIGN KEY   (ingredient_id)  REFERENCES ingredients(id) ON DELETE CASCADE,
    FOREIGN KEY   (substitute_id)  REFERENCES ingredients(id) ON DELETE CASCADE,
    UNIQUE KEY    uq_sub (ingredient_id, substitute_id)
);

-- ─── SAVED RECIPES / HISTORY ─────────────────────────────────
CREATE TABLE saved_recipes (
    id         CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    user_id    CHAR(36)  NOT NULL,
    recipe_id  CHAR(36)  NOT NULL,
    rating     TINYINT   CHECK (rating BETWEEN 1 AND 5),
    cooked_at  DATETIME,
    saved_at   DATETIME  DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_saved (user_id, recipe_id),
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- ─── CHAT HISTORY ────────────────────────────────────────────
CREATE TABLE chat_messages (
    id         CHAR(36)                     PRIMARY KEY DEFAULT (UUID()),
    user_id    CHAR(36)                     NOT NULL,
    role       ENUM('user','assistant')     NOT NULL,
    content    TEXT                         NOT NULL,
    created_at DATETIME                     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_chat (user_id, created_at)
);

-- ─── AI SUGGESTION LOG ───────────────────────────────────────
CREATE TABLE ai_suggestions (
    id           CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    user_id      CHAR(36)  NOT NULL,
    type         ENUM('ingredient_pair','substitution','recommendation') NOT NULL,
    prompt_hash  VARCHAR(64),
    response     JSON,
    created_at   DATETIME  DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY  (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX        idx_user_type (user_id, type)
);

-- ─── SEED: COMMON INGREDIENTS ────────────────────────────────
INSERT INTO ingredients (name, category, unit_type, aliases) VALUES
('egg',          'protein',  'count',  '["eggs"]'),
('chicken',      'protein',  'weight', '["chicken breast","chicken thigh"]'),
('onion',        'produce',  'count',  '["onions","yellow onion"]'),
('garlic',       'produce',  'count',  '["garlic clove","cloves of garlic"]'),
('tomato',       'produce',  'count',  '["tomatoes","roma tomato"]'),
('potato',       'produce',  'count',  '["potatoes","baby potatoes"]'),
('rice',         'grain',    'weight', '["basmati rice","jasmine rice","white rice"]'),
('pasta',        'grain',    'weight', '["spaghetti","penne","fettuccine"]'),
('butter',       'dairy',    'weight', '["unsalted butter","salted butter"]'),
('milk',         'dairy',    'volume', '["whole milk","skim milk"]'),
('cheese',       'dairy',    'weight', '["cheddar","mozzarella","parmesan"]'),
('olive oil',    'pantry',   'volume', '["extra virgin olive oil","EVOO"]'),
('salt',         'spice',    'volume', '["sea salt","kosher salt","table salt"]'),
('pepper',       'spice',    'volume', '["black pepper","ground pepper","white pepper"]'),
('lemon',        'produce',  'count',  '["lemons","lemon juice"]'),
('spinach',      'produce',  'bunch',  '["baby spinach","spinach leaves"]'),
('carrot',       'produce',  'count',  '["carrots","baby carrots"]'),
('flour',        'grain',    'weight', '["all-purpose flour","plain flour","AP flour"]'),
('sugar',        'pantry',   'weight', '["white sugar","granulated sugar","caster sugar"]'),
('cumin',        'spice',    'volume', '["cumin powder","ground cumin","cumin seeds"]');
