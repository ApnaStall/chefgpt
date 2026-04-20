// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'

function FullPageSpinner() {
  return (
    <div style={styles.loadingPage}>
      <div style={styles.loadingCard} className="card">
        <span className="spinner dark" />
        <p style={styles.loadingText}>Loading your workspace...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, authReady } = useAuth()
  if (!authReady) return <FullPageSpinner />
  return user ? children : <Navigate to="/login" replace />
}

function AuthRoute({ mode }) {
  const { user, authReady } = useAuth()
  if (!authReady) return <FullPageSpinner />
  return user ? <Navigate to="/" replace /> : <AuthPage mode={mode} />
}

function AdminRoute({ children }) {
  const { user, authReady } = useAuth()
  if (!authReady) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'admin' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthRoute mode="login" />} />
          <Route path="/register" element={<AuthRoute mode="register" />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

const styles = {
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top, #f5e8c8 0%, var(--cream) 45%, #efe6d8 100%)',
    padding: '24px',
  },
  loadingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px',
    borderRadius: 'var(--radius-lg)',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--muted)',
  },
}
