// src/hooks/useToast.js
import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'default', duration = 3000) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const toast = {
    show:    (msg) => addToast(msg, 'default'),
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
  }

  return { toasts, toast }
}

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type !== 'default' ? t.type : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
