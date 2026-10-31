import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatFab from './ChatFab'
import MustChangePasswordModal from './MustChangePasswordModal'
import { useAuth } from '../context/AuthContext'

// ============================================
// LAYOUT COMPONENT
// Main layout wrapper with sidebar and header
// ============================================

export default function Layout({ children, pageId = '' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.must_change_password) {
      const dismissed = sessionStorage.getItem('dismiss_pwd_prompt')
      if (!dismissed) {
        setShowPasswordModal(true)
      }
    }
  }, [user])

  function handleClosePasswordModal() {
    setShowPasswordModal(false)
    sessionStorage.setItem('dismiss_pwd_prompt', '1')
  }

  // FAB "Trợ lý ảo" — hiển thị cho MỌI vai trò (admin / staff / technician / customer).
  // Ẩn ở trang /chat vì trang đó đã có chat đầy đủ.
  const showChatFab = !location.pathname.startsWith('/chat')

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          pageId={pageId}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Nút nổi + panel chat overlay (mọi trang, mọi vai trò) */}
      {showChatFab && <ChatFab />}

      <MustChangePasswordModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
      />
    </div>
  )
}
