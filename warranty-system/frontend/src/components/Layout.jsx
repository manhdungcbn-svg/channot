import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

// ============================================
// LAYOUT COMPONENT
// Main layout wrapper with sidebar and header
// ============================================

export default function Layout({ children, pageId = '' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5F6FA' }}>
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
    </div>
  )
}
