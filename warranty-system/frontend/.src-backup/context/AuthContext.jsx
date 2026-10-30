import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

// Parse JSON an toàn. Nếu localStorage hỏng / không phải JSON → trả fallback.
function safeJSON(raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => safeJSON(localStorage.getItem('user'), null))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(r => { setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)) })
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const r = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', r.data.access_token)
    localStorage.setItem('user', JSON.stringify(r.data.user))
    setUser(r.data.user)
    return r.data.user
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
