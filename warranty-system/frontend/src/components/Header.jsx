import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'

// Icons
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const AIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z"/>
    <rect x="4" y="8" width="16" height="12" rx="2"/>
    <path d="M9 12h.01M12 12h.01M15 12h.01"/>
  </svg>
)

// Role labels in Vietnamese
const ROLE_LABELS = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  technician: 'Kỹ thuật viên',
  customer: 'Khách hàng',
}

export default function Header({ onMenuClick, pageId = '' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notifications-wrapper') && !e.target.closest('.user-menu-wrapper')) {
        setShowNotifications(false)
        setShowUserMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <header
      className="h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Page title (mobile) */}
        <h1 className="lg:hidden text-base font-semibold" style={{ color: '#0F1929' }}>
          {getPageTitle(pageId)}
        </h1>
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span style={{ color: '#9A9CAD' }}>Không gian làm việc</span>
          <span style={{ color: '#C5C7D0' }}>/</span>
          <span className="font-semibold" style={{ color: '#292B3D' }}>{getPageTitle(pageId || getPageId(location.pathname))}</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative notifications-wrapper">
          <button
            onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowUserMenu(false) }}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            style={{ color: '#6B7280' }}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: '#EF4444', fontSize: '10px' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg overflow-hidden z-50"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              >
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <div className="text-sm font-semibold" style={{ color: '#1F2937' }}>Thông báo</div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium" style={{ color: '#2563EB' }}>
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="text-2xl mb-2">🔔</div>
                      <p className="text-sm" style={{ color: '#9CA3AF' }}>Không có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        style={{ borderBottom: '1px solid #F0F1F5', background: notif.is_read ? 'transparent' : 'rgba(79,70,229,0.035)' }}
                        onClick={() => {
                          markRead(notif.id)
                          setShowNotifications(false)
                          navigate(notif.link || '/tickets')
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: notif.is_read ? '#F1F2F7' : '#E8EAFE', color: '#4F46E5' }}>
                            <span style={{ fontSize: '14px' }}>●</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium" style={{ color: '#1F1B2D' }}>{notif.title}</div>
                            <div className="text-xs mt-0.5" style={{ color: '#73768A' }}>{notif.message}</div>
                            <div className="text-xs mt-1" style={{ color: '#9A9CAD' }}>{formatNotificationTime(notif.created_at)}</div>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: '#4F46E5' }} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid #F3F4F6' }}>
                  <button
                    onClick={() => { setShowNotifications(false); navigate('/tickets') }}
                    className="text-xs font-medium"
                    style={{ color: '#2563EB' }}
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative user-menu-wrapper">
          <button
            onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {/* Avatar */}
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ backgroundColor: '#1A3A6B' }}
              >
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                {user?.full_name?.split(' ').slice(-1)[0] || 'Khách'}
              </div>
              <div className="text-xs capitalize" style={{ color: '#9CA3AF' }}>
                {ROLE_LABELS[user?.role] || user?.role || 'guest'}
              </div>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="2"
              className="hidden sm:block"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              >
                {/* User info */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <div className="text-sm font-semibold" style={{ color: '#1F2937' }}>
                    {user?.full_name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {user?.email}
                  </div>
                  <div className="text-xs mt-0.5 px-2 py-0.5 rounded-full inline-block" style={{ background: '#EEF4FF', color: '#2563EB' }}>
                    {ROLE_LABELS[user?.role] || user?.role}
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-2">
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: '#374151' }}
                  >
                    <SettingsIcon />
                    Cài đặt tài khoản
                  </button>

                  <button
                    onClick={() => { navigate('/ai'); setShowUserMenu(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: '#374151' }}
                  >
                    <AIcon />
                    Trợ lý AI
                  </button>
                </div>

                {/* Logout */}
                <div className="py-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors"
                    style={{ color: '#DC2626' }}
                  >
                    <LogoutIcon />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// Helper function to get page title
function getPageTitle(pageId) {
  const titles = {
    dashboard: 'Tổng quan',
    tickets: 'Phiếu bảo hành',
    products: 'Sản phẩm',
    customers: 'Khách hàng',
    ai: 'Trợ lý AI',
    payment: 'Thanh toán',
    wallet: 'Ví điện tử',
    chat: 'Trợ lý ảo',
    lookup: 'Tra cứu bảo hành',
    settings: 'Cài đặt',
    'my-products': 'Sản phẩm của tôi',
    'my-tickets': 'Phiếu bảo hành của tôi',
  }
  return titles[pageId] || 'BảoHành Pro'
}

function getPageId(path) {
  if (path.startsWith('/my-products')) return 'my-products'
  if (path.startsWith('/my-tickets')) return 'my-tickets'
  if (path.startsWith('/tickets')) return 'tickets'
  if (path.startsWith('/products')) return 'products'
  if (path.startsWith('/customers')) return 'customers'
  if (path.startsWith('/wallet')) return 'wallet'
  if (path.startsWith('/payment')) return 'payment'
  if (path.startsWith('/settings')) return 'settings'
  if (path.startsWith('/lookup')) return 'lookup'
  if (path.startsWith('/ai')) return 'ai'
  if (path.startsWith('/chat')) return 'chat'
  return 'dashboard'
}

function formatNotificationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'Vừa xong'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`
  return date.toLocaleDateString('vi-VN')
}
