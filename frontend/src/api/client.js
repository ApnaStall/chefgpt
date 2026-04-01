// src/api/client.js — Axios instance with auth interceptor

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── AUTH ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login:    (data) => api.post('/auth/login', data).then(r => r.data),
}

// ─── PANTRY ───────────────────────────────────────────────────────────────
export const pantryApi = {
  get:     ()      => api.get('/pantry').then(r => r.data),
  add:     (names) => api.post('/pantry', { ingredient_names: names }).then(r => r.data),
  remove:  (name)  => api.delete(`/pantry/${encodeURIComponent(name)}`).then(r => r.data),
  suggest: (ings)  => api.post('/pantry/suggest', { pantry_ingredients: ings }).then(r => r.data),
}

// ─── RECIPES ──────────────────────────────────────────────────────────────
export const recipesApi = {
  generate:       (params)  => api.post('/recipes/generate', params).then(r => r.data),
  list:           (params)  => api.get('/recipes', { params }).then(r => r.data),
  get:            (id)      => api.get(`/recipes/${id}`).then(r => r.data),
  substitutions:  (body)    => api.post('/recipes/substitutions', body).then(r => r.data),
  save:           (body)    => api.post('/recipes/save', body).then(r => r.data),
  saved:          ()        => api.get('/recipes/saved/list').then(r => r.data),
}

// ─── CHAT ─────────────────────────────────────────────────────────────────
export const chatApi = {
  send:         (content) => api.post('/chat', { content }).then(r => r.data),
  history:      ()        => api.get('/chat/history').then(r => r.data),
  clearHistory: ()        => api.delete('/chat/history').then(r => r.data),
}

// ─── RECOMMENDATIONS ──────────────────────────────────────────────────────
export const recsApi = {
  get: (body) => api.post('/recommendations', body).then(r => r.data),
}
