// ============================================
// CHAT SERIAL MODAL
// Modal tra cứu bảo hành theo serial, dùng từ chatbot.
// Gọi aiService.warrantyHistory(serial) → hiển thị tên SP, trạng thái BH,
// ngày hết hạn, số phiếu → cho phép mở CreateTicketModal để tạo phiếu BH.
// ============================================

import { useState, useEffect } from 'react'
import { aiService, productService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import CreateTicketModal from './CreateTicket/CreateTicketModal'

export default function ChatSerialModal({ isOpen, onClose, initialSerial = '' }) {
  const { user } = useAuth()
  const [serial, setSerial] = useState(initialSerial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [prefillProduct, setPrefillProduct] = useState(null)

  // Đồng bộ serial mở đầu mỗi lần modal được mở lại
  useEffect(() => {
    if (isOpen) {
      setSerial(initialSerial || '')
      setError('')
      setResult(null)
      setShowCreate(false)
      setPrefillProduct(null)
    }
  }, [isOpen, initialSerial])

  async function handleLookup(e) {
    e?.preventDefault()
    const s = serial.trim()
    if (!s) {
      setError('Vui lòng nhập mã sê-ri sản phẩm.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const r = await aiService.warrantyHistory(s)
      setResult(r)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Không tìm thấy sản phẩm với serial này.')
    } finally {
      setLoading(false)
    }
  }

  // Mở form tạo phiếu: cần product.id để POST /tickets
  async function handleCreateTicket() {
    const s = serial.trim()
    if (!s) return
    setLoading(true)
    setError('')
    try {
      const product = await productService.bySerial(s)
      setPrefillProduct(product)
      setShowCreate(true)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Không tải được thông tin sản phẩm.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const within = result?.warranty_status === 'YES'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--chat-bg)', border: '1px solid var(--chat-surface-hover)', boxShadow: '0 24px 70px rgba(0,0,0,0.45)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--brand-800), var(--info))' }}
        >
          <div>
            <h2 className="text-base font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Tra cứu bảo hành theo serial
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Nhập mã sê-ri trên nhãn dán sản phẩm
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            aria-label="Đóng"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              value={serial}
              onChange={e => { setSerial(e.target.value); setError('') }}
              placeholder="Ví dụ: RWF-2026-00123"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono"
              style={{ background: 'var(--chat-surface)', border: '1px solid var(--chat-surface-hover)', color: 'var(--chat-text)' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
              style={{ background: loading ? 'var(--chat-surface-hover)' : 'var(--info)', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Đang tra...' : 'Tra cứu'}
            </button>
          </form>

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--chat-bg)', border: '1px solid var(--chat-surface-hover)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--chat-text)' }}>
                    {result.product_name || '—'}
                  </p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--info)' }}>
                    {result.serial}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0"
                  style={within
                    ? { background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }
                    : { background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}
                >
                  {within ? '✓ Còn BH' : '✕ Hết BH'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2.5" style={{ background: 'var(--chat-surface)', border: '1px solid var(--chat-surface-hover)' }}>
                  <p className="text-[11px]" style={{ color: 'var(--chat-text-dim)' }}>Ngày hết hạn</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--chat-text)' }}>
                    {result.warranty_end_date || '—'}
                  </p>
                </div>
                <div className="rounded-lg p-2.5" style={{ background: 'var(--chat-surface)', border: '1px solid var(--chat-surface-hover)' }}>
                  <p className="text-[11px]" style={{ color: 'var(--chat-text-dim)' }}>Số phiếu bảo hành</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--chat-text)' }}>
                    {result.ticket_count ?? 0}
                  </p>
                </div>
              </div>

              {result.summary && (
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--chat-text-muted)' }}>
                  {result.summary}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-3 flex-shrink-0" style={{ borderTop: '1px solid var(--chat-surface)' }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--chat-surface)', color: 'var(--chat-text-muted)', border: '1px solid var(--chat-surface-hover)' }}
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleCreateTicket}
            disabled={loading || !serial.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: loading || !serial.trim() ? 'var(--chat-surface-hover)' : 'var(--info)', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Tạo phiếu bảo hành
          </button>
        </div>
      </div>

      {/* Form tạo phiếu bảo hành (4 bước) — truyền prefillProduct + prefillCustomer.
          prefillCustomer phải có `id` để Step2Product lọc đúng sản phẩm của khách. */}
      <CreateTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false)
          onClose()
        }}
        prefillProduct={prefillProduct}
        prefillCustomer={user ? { ...user, id: user.id } : null}
      />
    </div>
  )
}
