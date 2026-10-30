import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ============================================
// COMMAND PALETTE — tìm kiếm toàn cục (Ctrl/Cmd + K)
// Điều hướng nhanh tới các trang + tìm phiếu/sản phẩm.
// ============================================

const COMMANDS = [
  { id: 'dashboard', label: 'Tổng quan', group: 'Điều hướng', path: '/', keywords: 'dashboard tong quan home' },
  { id: 'tickets', label: 'Phiếu bảo hành', group: 'Điều hướng', path: '/tickets', keywords: 'phieu bao hanh ticket' },
  { id: 'products', label: 'Sản phẩm', group: 'Điều hướng', path: '/products', keywords: 'san pham product' },
  { id: 'customers', label: 'Khách hàng', group: 'Điều hướng', path: '/customers', keywords: 'khach hang customer' },
  { id: 'lookup', label: 'Tra cứu bảo hành', group: 'Nghiệp vụ', path: '/lookup', keywords: 'tra cuu serial warranty' },
  { id: 'ai', label: 'Trợ lý AI', group: 'Nghiệp vụ', path: '/ai', keywords: 'ai tro ly phan loai' },
  { id: 'wallet', label: 'Ví điện tử', group: 'Tài chính', path: '/wallet', keywords: 'vi dien tu wallet nap' },
  { id: 'payment', label: 'Thanh toán', group: 'Tài chính', path: '/payment', keywords: 'thanh toan payment' },
  { id: 'my-products', label: 'Sản phẩm của tôi', group: 'Khách hàng', path: '/my-products', keywords: 'san pham cua toi' },
  { id: 'my-tickets', label: 'Phiếu của tôi', group: 'Khách hàng', path: '/my-tickets', keywords: 'phieu cua toi' },
  { id: 'chat', label: 'Trợ lý ảo', group: 'Khách hàng', path: '/chat', keywords: 'chat tro ly ao' },
  { id: 'settings', label: 'Cài đặt tài khoản', group: 'Tài khoản', path: '/settings', keywords: 'cai dat settings' },
  { id: 'coming-soon', label: 'Tính năng đang được cập nhật', group: 'Khác', path: '/coming-soon', keywords: 'tinh nang sap ra coming soon' },
]

/**
 * Command palette: ô tìm kiếm toàn cục + điều hướng nhanh.
 * Mở bằng Ctrl/Cmd+K hoặc click vào nút tìm kiếm trên Header.
 */
export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const { user } = useAuth()

  // Lọc lệnh theo role + từ khoá
  const results = useCallback(() => {
    const role = user?.role
    const allowed = COMMANDS.filter((cmd) => {
      if (['admin', 'staff'].includes(role)) return true
      if (role === 'technician') {
        return !['products', 'customers', 'payment', 'my-products', 'my-tickets'].includes(cmd.id)
      }
      if (role === 'customer') {
        // Khách chỉ thao tác trong khu vực của mình: không có dashboard quản trị,
        // không có danh sách phiếu toàn hệ thống, không có AI console / thanh toán.
        return ['lookup', 'wallet', 'my-products', 'my-tickets', 'chat', 'settings'].includes(cmd.id)
      }
      return true
    })

    const q = query.trim().toLowerCase()
    if (!q) return allowed
    return allowed.filter((cmd) =>
      `${cmd.label} ${cmd.keywords} ${cmd.group}`.toLowerCase().includes(q),
    )
  }, [query, user?.role])

  const items = results()

  // Focus input khi mở
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Reset active index khi danh sách đổi
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Điều hướng bằng bàn phím
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % Math.max(items.length, 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + items.length) % Math.max(items.length, 1))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = items[activeIndex]
        if (cmd) { navigate(cmd.path); onClose() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, items, activeIndex, navigate, onClose])

  // Cuộn item đang active vào view
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm nhanh"
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden animate-scale-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Ô tìm kiếm */}
        <div className="flex items-center gap-3 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm trang, phiếu, sản phẩm... (Ctrl+K)"
            className="flex-1 h-14 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
            aria-label="Tìm kiếm nhanh"
          />
          <kbd
            className="hidden sm:block text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            ESC
          </kbd>
        </div>

        {/* Danh sách kết quả */}
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Không tìm thấy “{query}”
              </p>
            </div>
          ) : (
            items.map((cmd, idx) => (
              <button
                key={cmd.id}
                data-active={idx === activeIndex}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => { navigate(cmd.path); onClose() }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{
                  background: idx === activeIndex ? 'var(--brand-50)' : 'transparent',
                }}
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    background: idx === activeIndex ? 'var(--brand-600)' : 'var(--bg-hover)',
                    color: idx === activeIndex ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 6 12 9 15 6" />
                  </svg>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {cmd.label}
                  </span>
                  <span className="block text-xs" style={{ color: 'var(--text-light)' }}>
                    {cmd.group}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer gợi ý phím tắt */}
        <div
          className="px-4 py-2 flex items-center gap-4 text-[11px]"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-light)' }}
        >
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>↑↓</kbd>
            di chuyển
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>↵</kbd>
            mở
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>esc</kbd>
            đóng
          </span>
        </div>
      </div>
    </div>
  )
}
