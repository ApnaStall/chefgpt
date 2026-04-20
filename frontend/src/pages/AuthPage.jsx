// src/pages/AuthPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage({ mode }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  const [form, setForm] = useState({ email: '', name: '', password: '', diet_prefs: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const diets = ['vegetarian', 'vegan', 'gluten-free', 'low-carb']

  const toggleDiet = (d) =>
    setForm(f => ({
      ...f,
      diet_prefs: f.diet_prefs.includes(d)
        ? f.diet_prefs.filter(x => x !== d)
        : [...f.diet_prefs, d],
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) await login(form.email, form.password)
      else         await register(form.email, form.name, form.password, form.diet_prefs)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Left panel — branding */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.logo}>Pantry<span style={styles.logoAccent}>AI</span></div>
          <h1 style={styles.tagline}>Cook smarter with what you already have.</h1>
          <p style={styles.sub}>
            AI-powered recipe matching, smart substitutions, and a personal cooking assistant — all in one place.
          </p>
          <div style={styles.features}>
            {['🥘 Match recipes to your pantry','🔄 AI ingredient substitutions','💬 Personal cooking assistant','✨ Personalised recommendations'].map(f => (
              <div key={f} style={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={styles.right}>
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <p style={styles.formSub}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} style={styles.link}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {!isLogin && (
              <div style={styles.field}>
                <label style={styles.label}>Full name</label>
                <input
                  className="input"
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                className="input" type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                className="input" type="password"
                placeholder={isLogin ? '••••••••' : 'Min. 6 characters'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {!isLogin && (
              <div style={styles.field}>
                <label style={styles.label}>Dietary preferences <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <div style={styles.dietGrid}>
                  {diets.map(d => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleDiet(d)}
                      style={{
                        ...styles.dietBtn,
                        ...(form.diet_prefs.includes(d) ? styles.dietBtnActive : {}),
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '4px' }}
            >
              {loading ? <span className="spinner" /> : (isLogin ? 'Sign in' : 'Create account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { display: 'flex', minHeight: '100vh' },
  left: {
    flex: '0 0 48%', background: 'var(--brown)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px',
  },
  leftInner: { maxWidth: '420px' },
  logo: {
    fontFamily: 'Lora, serif', fontSize: '32px', color: 'var(--cream)',
    fontWeight: 600, marginBottom: '32px',
  },
  logoAccent: { color: 'var(--gold)', fontStyle: 'italic' },
  tagline: {
    fontFamily: 'Lora, serif', fontSize: '34px', color: 'var(--white)',
    lineHeight: 1.25, marginBottom: '16px', fontWeight: 600,
  },
  sub: { color: 'rgba(255,255,255,0.55)', fontSize: '15px', lineHeight: 1.7, marginBottom: '36px' },
  features: { display: 'flex', flexDirection: 'column', gap: '12px' },
  featureItem: {
    color: 'rgba(255,255,255,0.75)', fontSize: '14px',
    padding: '10px 16px', background: 'rgba(255,255,255,0.07)',
    borderRadius: '10px', fontWeight: 500,
  },
  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 40px', background: 'var(--cream)',
  },
  formCard: { width: '100%', maxWidth: '400px' },
  formTitle: { fontFamily: 'Lora, serif', fontSize: '28px', marginBottom: '8px' },
  formSub: { color: 'var(--muted)', fontSize: '14px', marginBottom: '32px' },
  link: { color: 'var(--rust)', fontWeight: 500 },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--brown-mid)' },
  dietGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  dietBtn: {
    padding: '7px 14px', borderRadius: '20px', fontSize: '13px',
    fontWeight: 500, cursor: 'pointer', border: '1.5px solid var(--border)',
    background: 'var(--white)', color: 'var(--muted)', transition: 'all .18s',
    fontFamily: 'DM Sans, sans-serif',
  },
  dietBtnActive: {
    background: 'var(--rust-xlight)', borderColor: 'var(--rust)', color: 'var(--rust)',
  },
  error: {
    background: '#fdf0f0', border: '1px solid #e8b4b4',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    fontSize: '13px', color: '#a83232',
  },
}
