// src/pages/Dashboard.jsx
import { useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../hooks/useToast'
import { recipesApi } from '../api/client'
import PantrySidebar from '../components/PantrySidebar'
import { RecipesGrid } from '../components/RecipeCard'
import RecipeModal from '../components/RecipeModal'
import ChatPanel from '../components/ChatPanel'
import RecommendationsPanel from '../components/RecommendationsPanel'

const TABS = [
  { id: 'recipes', label: '🍳 Recipes'         },
  { id: 'chat',    label: '💬 AI Chat'          },
  { id: 'recs',    label: '✨ For You'           },
  { id: 'saved',   label: '🔖 Saved'            },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { toasts, toast } = useToast()

  const [activeTab,    setActiveTab]    = useState('recipes')
  const [recipes,      setRecipes]      = useState([])
  const [savedRecipes, setSavedRecipes] = useState([])
  const [loading,      setLoading]      = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [modalRecipe,  setModalRecipe]  = useState(null)
  const [pantryItems,  setPantryItems]  = useState([])
  const [filters,      setFilters]      = useState({ meal_type: null, max_time: null })
  const [recipeParams, setRecipeParams] = useState({})

  const handleFilterChange = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  const findRecipes = useCallback(async () => {
    setLoading(true)
    setActiveTab('recipes')
    try {
      const data = await recipesApi.generate(recipeParams)
      setRecipes(data)
      toast.success(`Found ${data.length} recipes!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate recipes')
    } finally {
      setLoading(false)
    }
  }, [recipeParams])

  const loadSaved = useCallback(async () => {
    setSavedLoading(true)
    try {
      const data = await recipesApi.saved()
      setSavedRecipes(data)
    } catch { toast.error('Failed to load saved recipes') }
    finally { setSavedLoading(false) }
  }, [])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'saved') loadSaved()
  }

  return (
    <div style={dash.root}>
      {/* Top nav */}
      <header style={dash.nav}>
        <div style={dash.logo}>
          Pantry<span style={dash.logoAccent}>AI</span>
        </div>

        {/* Tab switcher */}
        <div style={dash.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                ...dash.tabBtn,
                ...(activeTab === t.id ? dash.tabBtnActive : {}),
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* User + logout */}
        <div style={dash.userArea}>
          <span style={dash.userName}>{user?.name}</span>
          <button className="btn btn-ghost" onClick={logout}
            style={{ padding: '7px 14px', fontSize: '13px' }}>
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={dash.body}>
        {/* Pantry sidebar — always visible */}
        <PantrySidebar
          onFindRecipes={findRecipes}
          toast={toast}
          onPantryChange={setPantryItems}
        />

        {/* Main content area */}
        <main style={dash.main}>
          {/* Recipe filters bar — only in recipes tab */}
          {activeTab === 'recipes' && (
            <div style={dash.recipeControls}>
              <div style={dash.recipeControlsLeft}>
                <select
                  className="input"
                  style={{ width: 'auto', fontSize: '13px', padding: '7px 10px' }}
                  onChange={e => setRecipeParams(p => ({ ...p, meal_type: e.target.value || null }))}
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
                  onChange={e => setRecipeParams(p => ({ ...p, max_time: e.target.value ? parseInt(e.target.value) : null }))}
                >
                  <option value="">Any time</option>
                  <option value="15">Under 15 min</option>
                  <option value="30">Under 30 min</option>
                  <option value="60">Under 60 min</option>
                </select>
                <select
                  className="input"
                  style={{ width: 'auto', fontSize: '13px', padding: '7px 10px' }}
                  onChange={e => setRecipeParams(p => ({ ...p, diet_pref: e.target.value || null }))}
                >
                  <option value="">Any diet</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten-free">Gluten-free</option>
                  <option value="low-carb">Low-carb</option>
                </select>
              </div>
              <div style={dash.recipeControlsRight}>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  {loading
                    ? 'Generating…'
                    : recipes.length > 0
                    ? `${recipes.length} recipes`
                    : 'Add ingredients & find recipes'}
                </span>
              </div>
            </div>
          )}

          {/* Panels */}
          {activeTab === 'recipes' && (
            <RecipesGrid
              recipes={recipes}
              loading={loading}
              onOpenRecipe={setModalRecipe}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}

          {activeTab === 'chat' && (
            <ChatPanel toast={toast} />
          )}

          {activeTab === 'recs' && (
            <RecommendationsPanel onOpenRecipe={setModalRecipe} toast={toast} />
          )}

          {activeTab === 'saved' && (
            <RecipesGrid
              recipes={savedRecipes}
              loading={savedLoading}
              onOpenRecipe={setModalRecipe}
              filters={{}}
              onFilterChange={() => {}}
            />
          )}
        </main>
      </div>

      {/* Recipe detail modal */}
      {modalRecipe && (
        <RecipeModal
          recipe={modalRecipe}
          onClose={() => setModalRecipe(null)}
          pantryItems={pantryItems}
          toast={toast}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}

const dash = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },
  nav: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '0 24px',
    background: 'var(--brown)', height: '56px', flexShrink: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: 'Lora, serif', fontSize: '20px',
    color: 'var(--cream)', fontWeight: 600, flexShrink: 0,
  },
  logoAccent: { color: 'var(--gold)', fontStyle: 'italic' },
  tabs: { display: 'flex', gap: '2px', flex: 1, justifyContent: 'center' },
  tabBtn: {
    padding: '6px 16px', borderRadius: 'var(--radius-sm)',
    fontSize: '13px', fontWeight: 500,
    color: 'rgba(255,255,255,0.55)', background: 'transparent',
    border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    transition: 'all .18s',
  },
  tabBtnActive: {
    background: 'rgba(255,255,255,0.12)', color: 'white',
  },
  userArea: { display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 },
  userName: { fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  recipeControls: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', background: 'var(--white)',
    borderBottom: '1px solid var(--border)', flexShrink: 0,
    gap: '12px',
  },
  recipeControlsLeft:  { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  recipeControlsRight: {},
}
