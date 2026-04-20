import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../api/client'
import { useAuth } from '../hooks/useAuth'

const statCards = [
  { key: 'total_users', label: 'Users', tone: 'var(--brown)', accent: 'var(--gold-light)' },
  { key: 'total_recipes', label: 'Recipes', tone: 'var(--rust)', accent: 'var(--rust-xlight)' },
  { key: 'total_ingredients', label: 'Ingredients', tone: 'var(--sage)', accent: 'var(--sage-light)' },
  { key: 'total_pantry_items', label: 'Pantry Items', tone: '#7b4c9a', accent: '#efe3fb' },
  { key: 'total_saved_recipes', label: 'Saved Recipes', tone: '#8a4b2a', accent: '#fae8dc' },
  { key: 'total_chat_messages', label: 'Chat Messages', tone: '#285c8a', accent: '#e0effa' },
]

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    adminApi.dashboard()
      .then(result => {
        if (active) setData(result)
      })
      .catch(err => {
        if (!active) return
        setError(err.response?.data?.detail || 'Failed to load admin dashboard')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroGlowA} />
        <div style={styles.heroGlowB} />

        <header style={styles.topbar}>
          <div>
            <div style={styles.badge}>Admin Control Room</div>
            <h1 style={styles.title}>PantryAI operations at a glance</h1>
            <p style={styles.subtitle}>
              Review platform activity, recent signups, and freshly created recipes from one protected dashboard.
            </p>
          </div>

          <div style={styles.actions}>
            <div style={styles.identityCard}>
              <span style={styles.identityLabel}>Signed in as</span>
              <strong style={styles.identityName}>{user?.name}</strong>
              <span style={styles.identityRole}>{user?.role}</span>
            </div>
            <Link to="/" className="btn btn-ghost" style={styles.backButton}>Back to app</Link>
            <button className="btn btn-primary" onClick={logout}>Sign out</button>
          </div>
        </header>

        {loading && (
          <div style={styles.stateCard} className="card">
            <span className="spinner dark" />
            <span style={styles.stateText}>Loading admin metrics...</span>
          </div>
        )}

        {error && !loading && (
          <div style={{ ...styles.stateCard, ...styles.errorCard }} className="card">
            <strong style={styles.errorTitle}>Dashboard unavailable</strong>
            <span style={styles.stateText}>{error}</span>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <section style={styles.statsGrid}>
              {statCards.map(card => (
                <article
                  key={card.key}
                  className="card animate-fadeUp"
                  style={{ ...styles.statCard, background: `linear-gradient(135deg, ${card.accent} 0%, rgba(253,250,246,0.96) 100%)` }}
                >
                  <span style={{ ...styles.statLabel, color: card.tone }}>{card.label}</span>
                  <strong style={styles.statValue}>{data.stats[card.key]}</strong>
                </article>
              ))}
            </section>

            <section style={styles.panelGrid}>
              <article className="card" style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <span style={styles.panelEyebrow}>Recent users</span>
                    <h2 style={styles.panelTitle}>Latest signups</h2>
                  </div>
                </div>

                <div style={styles.list}>
                  {data.recent_users.map(member => (
                    <div key={member.id} style={styles.listRow}>
                      <div>
                        <div style={styles.primaryText}>{member.name}</div>
                        <div style={styles.secondaryText}>{member.email}</div>
                      </div>
                      <div style={styles.rowMeta}>
                        <span
                          className={`tag ${member.role === 'admin' ? 'tag-gold' : 'tag-warm'}`}
                          style={styles.roleTag}
                        >
                          {member.role}
                        </span>
                        <span style={styles.dateText}>{formatDate(member.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="card" style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <span style={styles.panelEyebrow}>Recent recipes</span>
                    <h2 style={styles.panelTitle}>Newest additions</h2>
                  </div>
                </div>

                <div style={styles.list}>
                  {data.recent_recipes.map(recipe => (
                    <div key={recipe.id} style={styles.listRow}>
                      <div>
                        <div style={styles.primaryText}>{recipe.title}</div>
                        <div style={styles.secondaryText}>
                          {recipe.creator_name ? `By ${recipe.creator_name}` : 'Creator unavailable'}
                        </div>
                      </div>
                      <div style={styles.rowMeta}>
                        <span className={`tag ${recipe.source === 'ai_generated' ? 'tag-sage' : 'tag-rust'}`}>
                          {recipe.source.replace('_', ' ')}
                        </span>
                        <span style={styles.dateText}>{formatDate(recipe.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f1e8da 0%, #f8f3ea 42%, #efe4d3 100%)',
    padding: '32px',
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 'calc(100vh - 64px)',
    borderRadius: '32px',
    padding: '32px',
    background: 'linear-gradient(145deg, rgba(46,31,20,0.96) 0%, rgba(92,61,46,0.94) 40%, rgba(184,92,56,0.90) 100%)',
    boxShadow: '0 28px 70px rgba(46,31,20,0.18)',
  },
  heroGlowA: {
    position: 'absolute',
    top: '-80px',
    right: '-20px',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,232,200,0.45) 0%, rgba(245,232,200,0) 70%)',
  },
  heroGlowB: {
    position: 'absolute',
    bottom: '-120px',
    left: '-60px',
    width: '360px',
    height: '360px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(220,232,220,0.22) 0%, rgba(220,232,220,0) 72%)',
  },
  topbar: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    flexWrap: 'wrap',
    marginBottom: '28px',
  },
  badge: {
    display: 'inline-flex',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(245,232,200,0.14)',
    border: '1px solid rgba(245,232,200,0.22)',
    color: '#f5e8c8',
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '16px',
  },
  title: {
    fontSize: 'clamp(2rem, 4vw, 3.6rem)',
    color: 'var(--white)',
    maxWidth: '720px',
    marginBottom: '12px',
  },
  subtitle: {
    maxWidth: '640px',
    color: 'rgba(253,250,246,0.72)',
    lineHeight: 1.7,
    fontSize: '15px',
  },
  actions: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  identityCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '14px 16px',
    borderRadius: '18px',
    background: 'rgba(253,250,246,0.1)',
    border: '1px solid rgba(253,250,246,0.16)',
    minWidth: '160px',
  },
  identityLabel: {
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(253,250,246,0.55)',
  },
  identityName: {
    fontSize: '15px',
    color: 'var(--white)',
  },
  identityRole: {
    fontSize: '13px',
    color: '#f5e8c8',
    textTransform: 'capitalize',
  },
  backButton: {
    color: 'var(--white)',
    borderColor: 'rgba(253,250,246,0.28)',
    background: 'rgba(253,250,246,0.06)',
  },
  stateCard: {
    position: 'relative',
    zIndex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '18px 20px',
    borderRadius: '18px',
    marginBottom: '24px',
    background: 'rgba(253,250,246,0.96)',
  },
  stateText: {
    fontSize: '14px',
    color: 'var(--muted)',
  },
  errorCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
  },
  errorTitle: {
    color: '#a83232',
    fontSize: '15px',
  },
  statsGrid: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '20px',
    borderRadius: '22px',
    minHeight: '122px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  statValue: {
    fontFamily: 'Lora, serif',
    fontSize: '36px',
    color: 'var(--brown)',
  },
  panelGrid: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '18px',
  },
  panel: {
    padding: '22px',
    borderRadius: '24px',
    background: 'rgba(253,250,246,0.98)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
  },
  panelEyebrow: {
    display: 'inline-block',
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: '6px',
  },
  panelTitle: {
    fontSize: '24px',
    color: 'var(--brown)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 0',
    borderBottom: '1px solid var(--border)',
  },
  primaryText: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--brown)',
    marginBottom: '4px',
  },
  secondaryText: {
    fontSize: '13px',
    color: 'var(--muted)',
  },
  rowMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
    flexShrink: 0,
  },
  roleTag: {
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: '12px',
    color: 'var(--muted)',
  },
}
