import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { defaultRouteFor } from '../utils/permissions'

/**
 * Chặn trang theo vai trò.
 *
 * - Chưa đăng nhập → `/login` (nhớ lại trang đã cố vào).
 * - Đã đăng nhập nhưng không đủ quyền → về trang mặc định của vai trò đó
 *   (customer về `/my-tickets`, nhân viên về `/tickets` hoặc `/`).
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-700)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  // Không đủ quyền → về trang mặc định theo vai trò.
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={defaultRouteFor(user)} replace />
  }

  return children
}