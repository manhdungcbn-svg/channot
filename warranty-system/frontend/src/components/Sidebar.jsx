import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ============================================
// NAVIGATION ITEMS
// Organized by groups
// ============================================

const NAV_GROUPS = [
  {
    label: 'TỔNG QUAN',
    items: [
      {
        id: 'dashboard',
        label: 'Tổng quan',
        path: '/',
        roles: ['admin', 'staff', 'technician', 'customer'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        ),
      },
      {
        id: 'tickets',
        label: 'Phiếu bảo hành',
        path: '/tickets',
        roles: ['admin', 'staff', 'technician', 'customer'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        ),
      },
      {
        id: 'products',
        label: 'Sản phẩm',
        path: '/products',
        roles: ['admin', 'staff'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        ),
      },
      {
        id: 'customers',
        label: 'Khách hàng',
        path: '/customers',
        roles: ['admin', 'staff'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'NGHIỆP VỤ',
    items: [
      {
        id: 'lookup',
        label: 'Tra cứu BH',
        path: '/lookup',
        roles: ['admin', 'staff', 'technician', 'customer'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        ),
      },
      {
        id: 'ai',
        label: 'Trợ lý AI',
        path: '/ai',
        roles: ['admin', 'staff', 'technician'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z"/>
            <rect x="4" y="8" width="16" height="12" rx="2"/>
            <path d="M9 12h.01M12 12h.01M15 12h.01"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'TÀI CHÍNH',
    items: [
      {
        id: 'wallet',
        label: 'Ví điện tử',
        path: '/wallet',
        roles: ['admin', 'staff', 'customer'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
            <path d="M1 10h22"/>
          </svg>
        ),
      },
      {
        id: 'payment',
        label: 'Thanh toán',
        path: '/payment',
        roles: ['admin'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'DỊCH VỤ KHÁCH HÀNG',
    items: [
      {
        id: 'my-products',
        label: 'Sản phẩm của tôi',
        path: '/my-products',
        roles: ['customer'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        ),
      },
      {
        id: 'my-tickets',
        label: 'Phiếu của tôi',
        path: '/my-tickets',
        roles: ['customer'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="16" y2="17"/>
          </svg>
        ),
      },
      {
        id: 'chat',
        label: 'Trợ lý hỗ trợ',
        path: '/chat',
        roles: ['customer'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'TÀI KHOẢN',
    items: [
      {
        id: 'settings',
        label: 'Cài đặt tài khoản',
        path: '/settings',
        roles: ['admin', 'staff', 'technician', 'customer'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.33 3.22l-.08-.05a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        ),
      },
    ],
  },
]

// ============================================
// SIDEBAR COMPONENT
// ============================================

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { user } = useAuth()
  const [expandedGroups, setExpandedGroups] = useState(
    NAV_GROUPS.reduce((acc, group) => ({ ...acc, [group.label]: true }), {})
  )
  
  // Get current page ID from path
  const getCurrentPageId = () => {
    const path = location.pathname
    for (const group of NAV_GROUPS) {
      const item = group.items.find(item => item.path === path)
      if (item) return item.id
    }
    return 'dashboard'
  }
  
  const currentPageId = getCurrentPageId()
  
  const toggleGroup = (label) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }
  
  // Filter items by user role
  const filterByRole = (items) => {
    return items.filter(item => item.roles.includes(user?.role))
  }
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 264,
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E7E9F1',
          boxShadow: '4px 0 24px rgba(25,27,42,0.025)',
        }}
      >
        {/* Logo */}
        <div 
          className="h-16 flex items-center px-5"
          style={{ borderBottom: '1px solid #E5E7EB' }}
        >
          <Link to="/" className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg, #4F46E5, #7C3AED)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: '#0F1929' }}>
                BảoHành Pro
              </div>
              <div className="text-xs" style={{ color: '#9A9CAD' }}>
                Hệ thống bảo hành
              </div>
            </div>
          </Link>
          
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="py-4 px-3 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
          {NAV_GROUPS.map((group) => {
            const visibleItems = filterByRole(group.items)
            if (visibleItems.length === 0) return null
            
            return (
              <div key={group.label} className="mb-4">
                {/* Group label */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider mb-1 hover:bg-gray-50 rounded-lg transition-colors"
                  style={{ color: '#9CA3AF' }}
                >
                  <span>{group.label}</span>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className={`transition-transform ${expandedGroups[group.label] ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {/* Group items */}
                {expandedGroups[group.label] && (
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = currentPageId === item.id
                      
                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                            transition-all
                            ${isActive 
                              ? 'text-white' 
                              : 'text-gray-600 hover:bg-gray-50'
                            }
                          `}
                          style={
                            isActive 
                              ? { background: 'linear-gradient(100deg, #4F46E5, #5B50E8)', boxShadow: '0 5px 14px rgba(79,70,229,0.18)' }
                              : {}
                          }
                        >
                          <span style={{ color: isActive ? 'rgba(255,255,255,0.8)' : '#6B7280' }}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                          
                          {isActive && (
                            <span 
                              className="ml-auto w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
                            />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        
        {/* User info at bottom */}
        {user && (
          <div 
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{ borderTop: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ backgroundColor: '#4F46E5' }}
              >
                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: '#1F2937' }}>
                  {user.full_name}
                </div>
                <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
