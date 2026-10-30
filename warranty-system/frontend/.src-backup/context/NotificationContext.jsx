import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

const NotificationContext = createContext(null)

export function NotificationProvider({ children, user }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const pollRef = useRef(null)
  const lastFetchRef = useRef(null)
  const authReady = Boolean(user)

  const fetchNotifications = useCallback(async () => {
    if (!authReady) return
    try {
      const r = await api.get('/notifications')
      const data = Array.isArray(r.data) ? r.data : (r.data?.items || [])
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
      lastFetchRef.current = Date.now()
    } catch {
      // Silently fail — non-critical
    }
  }, [authReady])

  // Start polling only after auth is ready
  useEffect(() => {
    if (!authReady) return
    fetchNotifications()
    pollRef.current = setInterval(fetchNotifications, 15000)
    return () => clearInterval(pollRef.current)
  }, [authReady, fetchNotifications])

  // Re-fetch when window gets focus (but debounced)
  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - (lastFetchRef.current || 0) > 5000) fetchNotifications()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchNotifications])

  async function markRead(id) {
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user?.id])

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all')
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isOpen,
      setIsOpen,
      markRead,
      markAllRead,
      refresh: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
