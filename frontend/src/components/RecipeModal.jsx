// src/components/RecipeModal.jsx
import { useState } from 'react'
import { recipesApi } from '../api/client'

export default function RecipeModal({ recipe, onClose, pantryItems, toast }) {
  const [subLoading, setSubLoading] = useState(false)
  const [subResult,  setSubResult]  = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [rating,     setRating]     = useState(0)

  if (!recipe) return null

  const missing = recipe.ingredients.filter(i => !i.have && !i.is_optional)

  const handleSubstitutions = async () => {
    setSubLoading(true)
    setSubResult(null)
    try {
      const pantryNames = pantryItems.map(i => i.ingredient?.name || i)
      const data = await recipesApi.substitutions({
        recipe_title:        recipe.title,
        missing_ingredients: missing.map(m => m.name),
        pantry_ingredients:  pantryNames,
      })
      setSubResult(data)
    } catch { toast.error('Substitution request failed') }
    finally { setSubLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await recipesApi.save({ recipe_id: recipe.id, rating: rating || null })
      setSaved(true)
      toast.success('Recipe saved ✓')
    } catch { toast.error('Failed to save recipe') }
    finally { setSaving(false) }
  }

  return (
    <div style={modal.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal.box} className="animate-fadeUp">
        {/* Close */}
        <button onClick={onClose} style={modal.close}>✕</button>

        {/* Header */}
        <div style={modal.header}>
          <div style={modal.emoji}>{recipe.emoji}</div>
          <div>
            <h2 style={modal.title}>{recipe.title}</h2>
            <div style={modal.meta}>
              <span>⏱ {recipe.prep_time} min</span>
              <span>🍽 {recipe.servings} servings</span>
              {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
              <span style={{ textTransform: 'capitalize' }}>{recipe.meal_type}</span>
            </div>
            {recipe.description && <p style={modal.desc}>{recipe.description}</p>}
          </div>
        </div>

        {/* Save + rating */}
        <div style={modal.saveRow}>
          <div style={modal.stars}>
            {[1,2,3,4,5].map(n => (
              <button
                key={n} onClick={() => setRating(n)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
                         color: n <= rating ? '#C4952A' : 'var(--warm)', transition: 'color .15s' }}
              >★</button>
            ))}
            {rating > 0 && <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>Rating: {rating}/5</span>}
          </div>
          <button
            className="btn btn-sage"
            onClick={handleSave}
            disabled={saving || saved}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            {saved ? '✓ Saved' : saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /></> : '🔖 Save Recipe'}
          </button>
        </div>

        <div style={modal.body}>
          {/* Ingredients */}
          <div style={modal.section}>
            <h4 style={modal.sectionTitle}>Ingredients</h4>
            <div style={modal.ingList}>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} style={modal.ingRow}>
                  <div style={{
                    ...modal.dot,
                    background: ing.have ? 'var(--sage)' : ing.is_optional ? 'var(--gold)' : 'var(--rust)',
                  }} />
                  <span style={{ flex: 1, fontSize: '14px', textTransform: 'capitalize' }}>{ing.name}</span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{ing.qty}</span>
                  {ing.is_optional && <span style={modal.optBadge}>optional</span>}
                </div>
              ))}
            </div>
            <div style={modal.legend}>
              <span><span style={{ ...modal.dot, background: 'var(--sage)', display: 'inline-block' }} /> Have it</span>
              <span><span style={{ ...modal.dot, background: 'var(--rust)', display: 'inline-block' }} /> Missing</span>
              <span><span style={{ ...modal.dot, background: 'var(--gold)', display: 'inline-block' }} /> Optional</span>
            </div>
          </div>

          {/* AI Substitutions */}
          {missing.length > 0 && (
            <div style={modal.section}>
              <button
                className="btn btn-ghost"
                onClick={handleSubstitutions}
                disabled={subLoading}
                style={{ width: '100%', borderStyle: 'dashed', borderColor: 'var(--gold)' }}
              >
                {subLoading
                  ? <><span className="spinner rust" style={{ width: 14, height: 14 }} /> Finding substitutions…</>
                  : '✦ AI: find substitutions for missing ingredients'}
              </button>
              {subResult && (
                <div style={modal.subResult} className="animate-fadeUp">
                  {subResult.substitutions?.map((s, i) => (
                    <div key={i} style={modal.subItem}>
                      <div style={modal.subMissing}>Missing: <strong>{s.missing}</strong></div>
                      <div style={modal.subSub}>→ Use: <strong>{s.substitute}</strong></div>
                      {s.notes && <div style={modal.subNote}>{s.notes}</div>}
                    </div>
                  ))}
                  {subResult.tips && (
                    <div style={modal.subTips}><strong>Tip:</strong> {subResult.tips}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Steps */}
          <div style={modal.section}>
            <h4 style={modal.sectionTitle}>Instructions</h4>
            <div style={modal.steps}>
              {recipe.steps.map((step, i) => (
                <div key={i} style={modal.step}>
                  <div style={modal.stepNum}>{step.step_order || i + 1}</div>
                  <div style={modal.stepText}>
                    {step.instruction}
                    {step.duration_mins && (
                      <span style={modal.stepTime}>⏱ {step.duration_mins} min</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {recipe.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {recipe.tags.map(t => <span key={t} className="tag tag-warm">{t}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const modal = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,12,6,.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  },
  box: {
    background: 'var(--white)', borderRadius: 'var(--radius-xl)',
    width: '600px', maxWidth: '100%', maxHeight: '90vh',
    overflowY: 'auto', position: 'relative',
    boxShadow: 'var(--shadow-lg)',
  },
  close: {
    position: 'sticky', top: '16px', float: 'right', marginRight: '16px',
    background: 'var(--cream)', border: 'none', borderRadius: '50%',
    width: '32px', height: '32px', fontSize: '14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  header: {
    display: 'flex', gap: '16px', alignItems: 'flex-start',
    padding: '24px 24px 16px',
  },
  emoji: { fontSize: '52px', lineHeight: 1, flexShrink: 0 },
  title: { fontFamily: 'Lora, serif', fontSize: '22px', fontWeight: 600, marginBottom: '6px' },
  meta:  { display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--muted)', flexWrap: 'wrap' },
  desc:  { fontSize: '13px', color: 'var(--muted)', marginTop: '6px', lineHeight: 1.6 },
  saveRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px 16px', borderBottom: '1px solid var(--border)',
  },
  stars: { display: 'flex', alignItems: 'center', gap: '2px' },
  body:    { padding: '20px 24px' },
  section: { marginBottom: '24px' },
  sectionTitle: {
    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--muted)', fontWeight: 600, marginBottom: '12px',
  },
  ingList: { display: 'flex', flexDirection: 'column' },
  ingRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 0', borderBottom: '1px solid var(--border)',
  },
  dot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  optBadge: {
    fontSize: '10px', background: 'var(--gold-light)', color: 'var(--gold)',
    padding: '2px 7px', borderRadius: '10px', fontWeight: 500,
  },
  legend: {
    display: 'flex', gap: '16px', marginTop: '10px',
    fontSize: '11px', color: 'var(--muted)', alignItems: 'center',
  },
  subResult: {
    background: 'var(--gold-light)', borderRadius: 'var(--radius-sm)',
    padding: '14px', marginTop: '10px',
    border: '1px solid var(--gold)',
  },
  subItem:    { marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(196,149,42,.2)' },
  subMissing: { fontSize: '12px', color: 'var(--muted)', marginBottom: '3px' },
  subSub:     { fontSize: '14px', color: 'var(--brown)' },
  subNote:    { fontSize: '12px', color: 'var(--muted)', marginTop: '4px', fontStyle: 'italic' },
  subTips:    { fontSize: '13px', color: 'var(--brown-mid)', marginTop: '8px', lineHeight: 1.6 },
  steps: { display: 'flex', flexDirection: 'column', gap: '12px' },
  step: { display: 'flex', gap: '14px', alignItems: 'flex-start' },
  stepNum: {
    background: 'var(--rust)', color: 'white',
    width: '26px', height: '26px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px',
  },
  stepText: { fontSize: '14px', lineHeight: 1.65, color: 'var(--brown)' },
  stepTime: {
    display: 'inline-block', marginLeft: '8px',
    fontSize: '11px', color: 'var(--muted)',
    background: 'var(--cream)', padding: '2px 7px', borderRadius: '10px',
  },
}
