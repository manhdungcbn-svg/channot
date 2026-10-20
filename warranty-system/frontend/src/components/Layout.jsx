import { useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const paths = {
  shield: <><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z" /><path d="m9 12 2 2 4-5" /></>,
  ticket: <><path d="M4 4h16v5a3 3 0 0 0 0 6v5H4v-5a3 3 0 0 0 0-6Z" /><path d="M13 8h3M13 12h3M13 16h2" /></>,
  box: <><path d="m21 8-9 5-9-5" /><path d="m3 8 9-5 9 5v8l-9 5-9-5Z" /><path d="M12 13v8" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  spark: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z" /><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8Z" /><path d="m5 13 .7 2.3L8 16l-2.3.7L5 19l-.7-2.3L2 16l2.3-.7Z" /></>,
  arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  bell: <><path d="M18 8A6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /><path d="M2 19h22" /></>,
  wallet: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h4" /></>,
  chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  rma: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></>,
  finance: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  notif: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  'eye-off': <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
}

export function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.shield}
    </svg>
  )
}

export const navItems = [
  { path: '/dashboard', label: 'Tổng quan', icon: 'shield' },
  { path: '/tickets', label: 'Phiếu bảo hành', icon: 'ticket' },
  { path: '/products', label: 'Sản phẩm', icon: 'box' },
  { path: '/customers', label: 'Khách hàng', icon: 'users' },
  { path: '/wallet', label: 'Ví tài khoản', icon: 'wallet' },
  { path: '/chatbot', label: 'AI Chatbot', icon: 'chat' },
  { path: '/finance', label: 'Tài chính', icon: 'finance' },
  { path: '/reports', label: 'Báo cáo', icon: 'chart' },
  { path: '/rma', label: 'RMA', icon: 'rma' },
  { path: '/notifications', label: 'Thông báo', icon: 'notif' },
  { path: '/settings', label: 'Cài đặt', icon: 'settings' },
]

const activity = [
  { icon: "check", title: "Hoàn tất phiếu #WR-2496", desc: "Kỹ thuật viên Hoàng Nam", time: "12 phút trước", tone: "green" },
  { icon: "ticket", title: "Phiếu mới #WR-2498", desc: "Nguyễn Minh Anh · MacBook Air M3", time: "34 phút trước", tone: "blue" },
  { icon: "box", title: "Đã nhận linh kiện", desc: "Màn hình Samsung Odyssey G7", time: "1 giờ trước", tone: "violet" },
]

function getRoleLabel(role) {
  const labels = {
    admin: 'Quản trị viên',
    staff: 'Nhân viên',
    technician: 'Kỹ thuật viên',
  }
  return labels[role] || 'Người dùng'
}

function getAvatarLetters(name) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export default function Layout({ children, title, eyebrow, description, showHeader = true, headerAction }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [toast, setToast] = useState("")
  
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const notify = (message) => {
    setToast(message)
    setTimeout(() => setToast(""), 2800)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-new">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-head">
          <div className="brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <span className="brand-icon"><Icon name="shield" size={20} /></span>
            <div>
              <strong>BảoHành Pro</strong>
              <small>Hệ thống quản lý</small>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}><Icon name="close" size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <a 
              key={item.path} 
              href={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-user" onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ cursor: 'pointer' }}>
          <div className="avatar">{getAvatarLetters(user?.name)}</div>
          <div>
            <strong>{user?.name || 'Người dùng'}</strong>
            <small>{getRoleLabel(user?.role)}</small>
          </div>
        </div>
        
        {/* User Dropdown */}
        {userMenuOpen && (
          <div className="user-dropdown" style={{
            position: 'absolute',
            bottom: '80px',
            left: '10px',
            right: '10px',
            background: '#1a1a2e',
            borderRadius: '8px',
            padding: '8px',
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <a href="/settings" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', color: '#fff', textDecoration: 'none', borderRadius: '6px' }}>
              <Icon name="settings" size={16} /> Cài đặt
            </a>
            <button onClick={handleLogout} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', color: '#ff6b6b', background: 'none', border: 'none', width: '100%', cursor: 'pointer', borderRadius: '6px' }}>
              <Icon name="logout" size={16} /> Đăng xuất
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="overlay" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobileOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
          <div className="topbar-search">
            <Icon name="search" size={18} />
            <input placeholder="Tìm phiếu, khách hàng, số sê-ri..." />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn notif" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <Icon name="bell" size={20} />
              <i className="dot" />
            </button>
            {headerAction || (
              <button className="btn-primary" onClick={() => notify("Đã mở form tạo phiếu")}>
                <Icon name="plus" size={17} /> <span>Tạo phiếu mới</span>
              </button>
            )}
            <div className="user-avatar" onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ cursor: 'pointer' }}>
              {getAvatarLetters(user?.name)}
            </div>
          </div>
        </header>

        {/* Notifications Panel */}
        {notificationsOpen && (
          <div className="notif-panel">
            <div className="notif-header">
              <strong>Thông báo</strong>
              <button onClick={() => setNotificationsOpen(false)}><Icon name="close" size={16} /></button>
            </div>
            {activity.slice(0, 3).map((item) => (
              <button key={item.title} className="notif-item" onClick={() => { notify("Đã đánh dấu là đã đọc"); setNotificationsOpen(false) }}>
                <span className={`notif-icon ${item.tone}`}><Icon name={item.icon} size={16} /></span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.desc} · {item.time}</small>
                </div>
              </button>
            ))}
            <a href="/notifications" className="notif-more" onClick={() => setNotificationsOpen(false)}>Xem tất cả thông báo →</a>
          </div>
        )}

        {/* Page Content */}
        <div className="content">
          {showHeader && title && (
            <div className="page-head">
              <div>
                <span className="eyebrow">{eyebrow}</span>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
              </div>
              {headerAction}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <span><Icon name="check" size={16} /></span>
          {toast}
        </div>
      )}
    </div>
  )
}
