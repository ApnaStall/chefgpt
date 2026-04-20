// src/components/RecommendationsPanel.jsx
import { useState } from 'react'
import { recsApi } from '../api/client'
import RecipeCard from './RecipeCard'

export default function RecommendationsPanel({ onOpenRecipe, toast }) {
  const [diet,  setDiet]  = useState('')
  const [mood,  setMood]  = useState('')
  const [recs,  setRecs]  = useState([])
  const [loading, setLoading] = useState(false)

  const MOODS = ['comfort food', 'light & fresh', 'something spicy', 'quick & easy', 'impress guests', 'using leftovers']

  const fetch = async () => {
    setLoading(true)
    setRecs([])
    try {
      const data = await recsApi.get({ diet_pref: diet || null, mood: mood || null })
      setRecs(data.recommendations)
    } catch { toast.error('Recommendation failed') }
    finally { setLoading(false) }
  }

  return (
    <div style={rec.container}>
      {/* Controls */}
      <div style={rec.controls}>
        <h3 style={rec.title}>Personalised for You</h3>
        <p style={rec.sub}>AI recommendations based on your pantry, diet, and mood</p>

        <div style={rec.formRow}>
          <div style={rec.field}>
            <label style={rec.label}>Diet preference</label>
            <select
              className="input"
              value={diet}
              onChange={e => setDiet(e.target.value)}
              style={{ fontSize: '13px' }}
            >
              <option value="">No restriction</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="gluten-free">Gluten-free</option>
              <option value="low-carb">Low-carb</option>
            </select>
          </div>
          <div style={{ ...rec.field, flex: 2 }}>
            <label style={rec.label}>Craving / mood</label>
            <input
              className="input"
              placeholder="e.g. something warm and hearty…"
              value={mood}
              onChange={e => setMood(e.target.value)}
              style={{ fontSize: '13px' }}
              onKeyDown={e => e.key === 'Enter' && fetch()}
            />
          </div>
        </div>

        {/* Mood chips */}
        <div style={rec.moodChips}>
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => setMood(m)}
              style={{
                ...rec.chip,
                ...(mood === m ? rec.chipActive : {}),
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={fetch}
          disabled={loading}
          style={{ width: '100%', padding: '13px', marginTop: '4px' }}
        >
          {loading
            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Personalising…</>
            : '✨ Get Recommendations'}
        </button>
      </div>

      {/* Results */}
      <div style={rec.results}>
        {loading && (
          <div style={rec.loadingState}>
            <span className="spinner rust" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p style={{ color: 'var(--muted)', marginTop: '16px', fontSize: '14px' }}>
              Crafting personalised recommendations just for you…
            </p>
          </div>
        )}

        {!loading && recs.length === 0 && (
          <div style={rec.emptyState}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✨</div>
            <h4 style={{ fontFamily: 'Lora, serif', fontSize: '18px', marginBottom: '6px' }}>
              Ready to personalise
            </h4>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Select your preferences above and hit Get Recommendations.
            </p>
          </div>
        )}

        {!loading && recs.length > 0 && (
          <div style={rec.grid} className="animate-fadeUp">
            {recs.map((r, i) => (
              <div key={i} className="animate-fadeUp"  style={{ 
    ...rec.recCard, 
    animationDelay: `${i * 0.08}s` 
  }}>
                {/* Why badge */}
                <div style={rec.whyBadge}>
                  <span style={{ color: 'var(--gold)' }}>✦</span> {r.why}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                  <div style={rec.confidence}>
                    <div style={{ ...rec.confidenceFill, width: `${r.confidence}%` }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.confidence}% match</span>
                </div>
                <RecipeCard recipe={r.recipe} onOpen={onOpenRecipe} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const rec = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  controls: {
    padding: '20px 24px',
    background: 'var(--white)', borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  title: { fontFamily: 'Lora, serif', fontSize: '20px', fontWeight: 600, marginBottom: '4px' },
  sub:   { fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' },
  formRow: { display: 'flex', gap: '12px', marginBottom: '12px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  moodChips: { display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '14px' },
  chip: {
    padding: '5px 13px', borderRadius: '20px', fontSize: '12px',
    border: '1.5px solid var(--border)', background: 'var(--cream)',
    color: 'var(--muted)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    fontWeight: 500, transition: 'all .15s',
  },
  chipActive: {
    background: 'var(--gold-light)', borderColor: 'var(--gold)', color: 'var(--gold)',
  },
  results: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  loadingState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 20px',
  },
  emptyState: {
    textAlign: 'center', padding: '60px 20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px',
  },
  recCard: {},
  whyBadge: {
    background: 'var(--gold-light)', border: '1px solid var(--gold)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px',
    fontSize: '12px', color: 'var(--brown)', lineHeight: 1.5,
    marginBottom: '8px', fontWeight: 500,
  },
  confidence: {
    height: '3px', background: 'var(--warm)', borderRadius: '3px',
    width: '80px', overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%', background: 'var(--gold)', borderRadius: '3px',
    transition: 'width .6s',
  },
}
