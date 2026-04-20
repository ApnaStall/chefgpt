// src/components/PantrySidebar.jsx
import { useState, useEffect } from 'react'
import { pantryApi } from '../api/client'

export default function PantrySidebar({ onFindRecipes, toast }) {
  const [items, setItems]           = useState([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [finding, setFinding]       = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => { fetchPantry() }, [])

  const fetchPantry = async () => {
    try {
      const data = await pantryApi.get()
      setItems(data.items)
    } catch { toast.error('Failed to load pantry') }
  }

  const addIngredients = async () => {
    const names = input.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    if (!names.length) return
    setLoading(true)
    try {
      const data = await pantryApi.add(names)
      setItems(data.items)
      setInput('')
      setSuggestions([])
    } catch { toast.error('Failed to add ingredients') }
    finally { setLoading(false) }
  }

  const removeIngredient = async (name) => {
    try {
      const data = await pantryApi.remove(name)
      setItems(data.items)
    } catch { toast.error('Failed to remove') }
  }

  const handleSuggest = async () => {
    if (!items.length) { toast.show('Add some ingredients first'); return }
    setSuggesting(true)
    setSuggestions([])
    try {
      const pantryNames = items.map(i => i.ingredient.name)
      const data = await pantryApi.suggest(pantryNames)
      setSuggestions(data.suggestions || [])
    } catch { toast.error('AI suggestion failed') }
    finally { setSuggesting(false) }
  }

  const addSuggestion = async (name) => {
    try {
      const data = await pantryApi.add([name])
      setItems(data.items)
      setSuggestions(s => s.filter(x => x !== name))
      toast.success(`Added ${name} ✓`)
    } catch { toast.error('Failed to add') }
  }

  const handleFind = async () => {
    if (!items.length) { toast.show('Add some ingredients first'); return }
    setFinding(true)
    try { await onFindRecipes() }
    finally { setFinding(false) }
  }

  const ingredientNames = new Set(items.map(i => i.ingredient.name))

  return (
    <aside style={sideStyles.sidebar}>
      {/* Header */}
      <div style={sideStyles.header}>
        <h3 style={sideStyles.title}>My Pantry</h3>
        <span style={sideStyles.count}>{items.length} items</span>
      </div>

      {/* Add input */}
      <div style={sideStyles.inputSection}>
        <div style={sideStyles.inputRow}>
          <input
            className="input"
            style={{ fontSize: '13px', padding: '9px 12px' }}
            placeholder="eggs, tomatoes, garlic…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIngredients()}
          />
          <button
            className="btn btn-rust"
            onClick={addIngredients}
            disabled={loading || !input.trim()}
            style={{ padding: '9px 14px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
          >
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '+'}
          </button>
        </div>

        {/* AI suggest button */}
        <button onClick={handleSuggest} disabled={suggesting} style={sideStyles.aiBtn}>
          {suggesting
            ? <><span className="spinner rust" style={{ width: 13, height: 13 }} /> Thinking…</>
            : '✦ AI: suggest what pairs well'}
        </button>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div style={sideStyles.suggestBox} className="animate-fadeUp">
          <div style={sideStyles.suggestLabel}>AI Suggestions</div>
          <div style={sideStyles.suggestGrid}>
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => addSuggestion(s)}
                disabled={ingredientNames.has(s)}
                style={{
                  ...sideStyles.suggestTag,
                  ...(ingredientNames.has(s) ? sideStyles.suggestTagDone : {}),
                }}
              >
                {ingredientNames.has(s) ? `✓ ${s}` : `+ ${s}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ingredient tags */}
      <div style={sideStyles.tags}>
        {items.length === 0
          ? <div style={sideStyles.empty}>Add ingredients to get started</div>
          : items.map(item => (
            <div key={item.id} className="animate-slideIn" style={sideStyles.tag}>
              <span style={sideStyles.tagName}>{item.ingredient.name}</span>
              {item.ingredient.category && (
                <span style={sideStyles.tagCat}>{item.ingredient.category}</span>
              )}
              <button onClick={() => removeIngredient(item.ingredient.name)} style={sideStyles.tagRemove}>×</button>
            </div>
          ))
        }
      </div>

      {/* Find recipes button */}
      <div style={sideStyles.footer}>
        <button
          className="btn btn-primary"
          onClick={handleFind}
          disabled={finding || !items.length}
          style={{ width: '100%', padding: '13px', fontSize: '14px' }}
        >
          {finding
            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Finding recipes…</>
            : `🍳 Find Recipes (${items.length} ingredients)`}
        </button>
      </div>
    </aside>
  )
}

const sideStyles = {
  sidebar: {
    width: '300px', flexShrink: 0,
    background: 'var(--white)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    height: '100%', overflow: 'hidden',
  },
  header: {
    padding: '20px 20px 12px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
  },
  title: { fontFamily: 'Lora, serif', fontSize: '18px', fontWeight: 600 },
  count: {
    background: 'var(--rust-xlight)', color: 'var(--rust)',
    fontSize: '12px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px',
  },
  inputSection: { padding: '14px 16px', borderBottom: '1px solid var(--border)' },
  inputRow: { display: 'flex', gap: '8px', marginBottom: '8px' },
  aiBtn: {
    width: '100%', background: 'none',
    border: '1.5px dashed var(--sage)',
    borderRadius: 'var(--radius-sm)', padding: '8px',
    fontSize: '12px', color: 'var(--sage)', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    transition: 'all .2s',
  },
  suggestBox: {
    margin: '0 16px 12px',
    background: 'var(--sage-light)',
    borderRadius: 'var(--radius-sm)', padding: '12px',
  },
  suggestLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--sage)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  suggestGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  suggestTag: {
    background: 'white', border: '1.5px solid var(--sage)',
    borderRadius: '20px', padding: '4px 11px',
    fontSize: '12px', color: 'var(--sage)', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    transition: 'all .15s',
  },
  suggestTagDone: {
    background: 'var(--sage)', color: 'white', borderColor: 'var(--sage)', cursor: 'default',
  },
  tags: {
    flex: 1, overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
  empty: { color: 'var(--muted)', fontSize: '13px', textAlign: 'center', marginTop: '24px' },
  tag: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px',
    background: 'var(--cream)', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--cream-dark)',
  },
  tagName: { flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--brown)', textTransform: 'capitalize' },
  tagCat:  { fontSize: '11px', color: 'var(--muted)', background: 'var(--cream-dark)', padding: '2px 7px', borderRadius: '10px' },
  tagRemove: {
    background: 'none', border: 'none', color: 'var(--muted)',
    fontSize: '16px', cursor: 'pointer', lineHeight: 1, padding: '0 2px',
    transition: 'color .15s',
  },
  footer: { padding: '16px', borderTop: '1px solid var(--border)' },
}
