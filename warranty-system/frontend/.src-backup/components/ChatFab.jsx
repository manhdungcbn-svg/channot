import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ChatPanel from './ChatPanel'

// ============================================
// CHAT FAB — nút nổi + panel chat overlay
// Hiển thị trên MỌI trang của app bảo hành (role customer).
// Click FAB → panel chat mở ngay tại chỗ (không rời trang).
// ============================================

export default function ChatFab() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Đóng panel khi điều hướng sang trang /chat (trang chat đầy đủ)
  useEffect(() => {
    if (location.pathname.startsWith('/chat')) setOpen(false)
  }, [location.pathname])

  // Đóng bằng phím Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Ngăn scroll body khi panel mở trên mobile
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      {/* Nút nổi */}
      <button
        onClick={() => setOpen(v => !v)}
        title={open ? 'Đóng trợ lý ảo' : 'Trợ lý ảo — hỏi về bảo hành'}
        aria-label={open ? 'Đóng trợ lý ảo' : 'Mở trợ lý ảo'}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          background: open
            ? 'linear-gradient(135deg, #DC2626, #B91C1C)'
            : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          boxShadow: open
            ? '0 10px 28px rgba(220,38,38,0.45)'
            : '0 10px 28px rgba(79,70,229,0.42)',
        }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            <path d="M9 10h.01M12 10h.01M15 10h.01" />
          </svg>
        )}
        {/* Badge chỉ báo có thể hỏi ngay */}
        {!open && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
            style={{ background: '#34D399', boxShadow: '0 0 0 2px #fff' }}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Panel chat overlay */}
      {open && (
        <>
          {/* Lớp nền mờ (mobile) */}
          <div
            className="fixed inset-0 z-[55] md:hidden"
            style={{ background: 'rgba(15,25,41,0.5)' }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Trợ lý ảo BảoHành Pro"
            className="fixed z-[58] bottom-0 right-0 md:bottom-24 md:right-6 w-full md:w-[420px] h-[85vh] md:h-[640px] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ background: '#0F1929', border: '1px solid #334155' }}
          >
            <ChatPanel compact onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}
