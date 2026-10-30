import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { consumeSessionFragment, readSession, writeSession } from '../utils/sessionBridge'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  // Nhận session bàn giao từ storefront (fragment URL) TRƯỚC khi đọc state,
  // để bấm nút "Bảo hành Pro" ở web bán hàng là vào thẳng app, không bị login lại.
  const [session] = useState(() => {
    consumeSessionFragment()
    return readSession()
  })
  const [user, setUser] = useState(() => session.user)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = session.token
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(r => { setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)) })
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const r = await api.post('/auth/login', { email, password })
    writeSession(r.data.access_token, r.data.user)
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
