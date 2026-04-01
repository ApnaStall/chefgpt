// src/components/RecipeCard.jsx
export default function RecipeCard({ recipe, onOpen, index }) {
  const missing = recipe.ingredients.filter(i => !i.have && !i.is_optional)
  const hasAll  = missing.length === 0

  return (
    <div
      className="card animate-fadeUp"
      style={{ ...cardStyles.card, animationDelay: `${index * 0.05}s`, cursor: 'pointer' }}
      onClick={() => onOpen(recipe)}
    >
      {/* Emoji header */}
      <div style={{ ...cardStyles.emojiWrap, background: hasAll ? 'var(--sage-light)' : 'var(--rust-xlight)' }}>
        <span style={cardStyles.emoji}>{recipe.emoji}</span>
        {hasAll && <span style={cardStyles.haveBadge}>✓ Got everything</span>}
      </div>

      <div style={cardStyles.body}>
        <div style={cardStyles.title}>{recipe.title}</div>

        <div style={cardStyles.meta}>
          <span>⏱ {recipe.prep_time} min</span>
          <span>🍽 {recipe.servings} servings</span>
          <span style={{ textTransform: 'capitalize' }}>🌍 {recipe.cuisine}</span>
        </div>

        {recipe.description && (
          <p style={cardStyles.desc}>{recipe.description}</p>
        )}

        {/* Match bar */}
        <div style={{ marginTop: '12px' }}>
          <div style={cardStyles.matchRow}>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>Pantry match</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sage)' }}>{recipe.match_score}%</span>
          </div>
          <div className="match-bar">
            <div className="match-bar-fill" style={{ width: `${recipe.match_score}%` }} />
          </div>
        </div>

        {/* Missing */}
        {missing.length > 0 && (
          <div style={cardStyles.missing}>
            Missing: {missing.slice(0, 3).map(m => m.name).join(', ')}
            {missing.length > 3 && ` +${missing.length - 3} more`}
          </div>
        )}

        {/* Tags */}
        <div style={cardStyles.tags}>
          <span className="tag tag-warm" style={{ textTransform: 'capitalize' }}>{recipe.meal_type}</span>
          {recipe.tags.slice(0, 2).map(t => (
            <span key={t} className="tag tag-warm">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

const cardStyles = {
  card: {
    overflow: 'hidden', transition: 'transform .2s, box-shadow .2s',
    ':hover': { transform: 'translateY(-3px)' },
  },
  emojiWrap: {
    height: '90px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  emoji: { fontSize: '44px' },
  haveBadge: {
    position: 'absolute', bottom: '8px', right: '10px',
    background: 'var(--sage)', color: 'white',
    fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '10px',
  },
  body: { padding: '14px 16px 16px' },
  title: {
    fontFamily: 'Lora, serif', fontSize: '16px', fontWeight: 600,
    marginBottom: '6px', lineHeight: 1.3,
  },
  meta: {
    display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--muted)',
    marginBottom: '6px', flexWrap: 'wrap',
  },
  desc: { fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginTop: '4px' },
  matchRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' },
  missing: { fontSize: '11px', color: 'var(--rust)', marginTop: '8px', fontWeight: 500 },
  tags: { display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' },
}


// src/components/RecipesGrid.jsx
export function RecipesGrid({ recipes, loading, onOpenRecipe, filters, onFilterChange }) {
  const filtered = recipes.filter(r => {
    if (filters.meal_type && r.meal_type !== filters.meal_type) return false
    if (filters.max_time  && r.prep_time > filters.max_time)   return false
    return true
  })

  return (
    <div style={gridStyles.container}>
      {/* Filters bar */}
      <div style={gridStyles.filtersBar}>
        <div style={gridStyles.resultsLabel}>
          {loading
            ? <><span className="spinner dark" style={{ width: 14, height: 14 }} /> Generating recipes…</>
            : recipes.length > 0
              ? `${filtered.length} recipe${filtered.length !== 1 ? 's' : ''} found`
              : 'Add ingredients and find recipes'}
        </div>
        <div style={gridStyles.filterRow}>
          <select
            className="input"
            style={{ width: 'auto', fontSize: '13px', padding: '7px 10px' }}
            value={filters.meal_type || ''}
            onChange={e => onFilterChange('meal_type', e.target.value || null)}
          >
            <option value="">All meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
          <select
            className="input"
            style={{ width: 'auto', fontSize: '13px', padding: '7px 10px' }}
            value={filters.max_time || ''}
            onChange={e => onFilterChange('max_time', e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Any time</option>
            <option value="15">Under 15 min</option>
            <option value="30">Under 30 min</option>
            <option value="60">Under 60 min</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={gridStyles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ ...gridStyles.skeleton, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={gridStyles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>🍽</div>
          <h3 style={{ fontFamily: 'Lora, serif', marginBottom: '6px' }}>
            {recipes.length === 0 ? 'Your recipes appear here' : 'No matches for these filters'}
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            {recipes.length === 0
              ? 'Add ingredients in the Pantry, then hit Find Recipes.'
              : 'Try adjusting the meal type or time filter.'}
          </p>
        </div>
      ) : (
        <div style={gridStyles.grid}>
          {filtered.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} onOpen={onOpenRecipe} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

const gridStyles = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  filtersBar: {
    padding: '14px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  resultsLabel: {
    fontSize: '13px', color: 'var(--muted)', fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  filterRow: { display: 'flex', gap: '8px' },
  grid: {
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '18px',
    overflowY: 'auto',
    flex: 1,
  },
  loadingGrid: {
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '18px',
  },
  skeleton: {
    height: '280px', borderRadius: 'var(--radius-lg)',
    background: 'linear-gradient(90deg, var(--warm) 25%, var(--cream-dark) 50%, var(--warm) 75%)',
    backgroundSize: '200% 100%',
    animation: 'pulse 1.4s ease infinite',
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 20px', textAlign: 'center',
  },
}
