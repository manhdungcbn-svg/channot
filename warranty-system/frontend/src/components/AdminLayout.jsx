import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Tổng quan', icon: 'grid' },
  { path: '/tickets', label: 'Phiếu bảo hành', icon: 'ticket' },
  { path: '/products', label: 'Sản phẩm', icon: 'box' },
  { path: '/customers', label: 'Khách hàng', icon: 'users' },
  { path: '/wallet', label: 'Ví tài khoản', icon: 'wallet' },
  { path: '/chatbot', label: 'AI Chatbot', icon: 'chat' },
  { path: '/finance', label: 'Tài chính', icon: 'finance' },
  { path: '/reports', label: 'Báo cáo', icon: 'chart' },
  { path: '/rma', label: 'RMA', icon: 'rma' },
  { path: '/notifications', label: 'Thông báo', icon: 'bell' },
  { path: '/settings', label: 'Cài đặt', icon: 'settings' },
]

function Icon({ name, size = 20 }) {
  const icons = {
    grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
    ticket: <><path d="M4 4h16v5a3 3 0 0 0 0 6v5H4v-5a3 3 0 0 0 0-6Z" /><path d="M13 8h3M13 12h3M13 16h2" /></>,
    box: <><path d="m21 8-9 5-9-5" /><path d="m3 8 9-5 9 5v8l-9 5-9-5Z" /><path d="M12 13v8" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
    wallet: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h4" /></>,
    chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
    finance: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /><path d="M2 19h22" /></>,
    rma: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    shield: <><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z" /><path d="m9 12 2 2 4-5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name] || icons.grid}
    </svg>
  )
}

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="layout-wrapper">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="brand" onClick={() => setSidebarOpen(false)}>
            <span className="brand-mark"><Icon name="shield" size={21} /></span>
            <span className="brand-copy">
              <strong>Warrio</strong>
              <small>Trung tâm bảo hành</small>
            </span>
          </Link>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)}>
            <Icon name="menu" size={24} />
          </button>
          <div className="topbar-search">
            <Icon name="shield" size={18} />
            <input type="text" placeholder="Tìm kiếm..." />
          </div>
          <div className="topbar-actions">
            <button className="icon-button"><Icon name="bell" /><i className="notification-dot" /></button>
            <Link to="/notifications" className="primary-button">
              <Icon name="plus" size={18} />
              Tạo phiếu mới
            </Link>
            <div className="user-avatar">MN</div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}
