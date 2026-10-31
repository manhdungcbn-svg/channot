import { useState } from 'react'
import { getStatusConfig, STATUSES } from '../config/statusConfig'
import { ticketService } from '../services/services'
import api from '../services/api'

const STATUS_ICONS = {
  RECEIVED: '📋',
  INSPECTION: '🔍',
  REPAIRING: '🔧',
  COMPLETED: '✅',
  REJECTED: '❌',
}

const PROGRESS_STEPS = [
  { key: 'RECEIVED', label: 'Tiếp nhận' },
  { key: 'INSPECTION', label: 'Kiểm tra' },
  { key: 'REPAIRING', label: 'Sửa chữa' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
]

function ProgressTracker({ status }) {
  const statusOrder = Object.keys(STATUSES)
  const currentIndex = statusOrder.indexOf(status)
  const isRejected = status === 'REJECTED'

  if (isRejected) {
    return (
      <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--danger-bg)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--danger-text)' }}>
          ⚠️ Phiếu bảo hành đã bị từ chối. Vui lòng liên hệ hotline để biết thêm chi tiết.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        {PROGRESS_STEPS.map((step, i) => {
          const isActive = i <= currentIndex
          const isCurrent = i === currentIndex
          return (
            <div key={step.key} className="flex items-center" style={{ flex: i < PROGRESS_STEPS.length - 1 ? 1 : 'none' }}>
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: isActive ? 'var(--brand-600)' : 'var(--border)',
                    color: isActive ? 'var(--brand-fg)' : 'var(--text-light)',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.2)' : 'none',
                  }}
                >
                  {i + 1}
                </div>
                <p className="text-xs mt-1.5 font-medium" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-light)' }}>
                  {step.label}
                </p>
              </div>
              {i < PROGRESS_STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded"
                  style={{ background: i < currentIndex ? 'var(--brand-600)' : 'var(--border)' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const cfg = getStatusConfig(status)
  if (!cfg) return null
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

export default function LookupModal({ onClose }) {
  const [ticketCode, setTicketCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!ticketCode.trim()) { setError('Vui lòng nhập mã phiếu bảo hành'); return }
    setLoading(true)
    setError('')
    setTicket(null)
    try {
      // Try to find ticket by code - this endpoint needs to be public
      const response = await api.get(`/tickets/public/${ticketCode.trim()}`)
      setTicket(response.data)
    } catch (err) {
      setError('Không tìm thấy phiếu bảo hành. Vui lòng kiểm tra lại mã phiếu.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', animation: 'contentFadeUp 0.4s ease-out both' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--brand-700) 0%, var(--brand-600) 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--brand-fg)' }}>Tra cứu phiếu BH</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Xem tình trạng sửa chữa</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!ticket ? (
            <>
              {/* Search form */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nhập mã phiếu bảo hành
                  </label>
                  <input
                    type="text"
                    value={ticketCode}
                    onChange={e => { setTicketCode(e.target.value.toUpperCase()); setError('') }}
                    className="w-full px-4 py-3 rounded-xl border text-sm font-mono"
                    style={{ borderColor: 'var(--brand-200)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                    placeholder="VD: BH-001"
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-light)' }}>
                    Mã phiếu có dạng: BH-XXX (ví dụ: BH-001, BH-002...)
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: loading ? 'var(--border-strong)' : 'var(--brand-600)', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Đang tra cứu...' : 'Tra cứu'}
                </button>
              </form>

              {/* Quick hint */}
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'var(--info-bg)', border: '1px solid var(--info-bg)' }}>
                <p className="text-xs" style={{ color: 'var(--info-text)' }}>
                  💡 <strong>Mẹo:</strong> Bạn có thể tìm mã phiếu trên biên nhận hoặc tin nhắn xác nhận đã được gửi qua SMS/Email.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Ticket result */}
              <div className="space-y-4">
                {/* Ticket header */}
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold font-mono" style={{ color: 'var(--brand-700)' }}>{ticket.ticket_code}</span>
                    <span className="text-2xl">{STATUS_ICONS[ticket.status]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={ticket.status} />
                  </div>
                </div>

                {/* Product info */}
                <div>
                  <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Sản phẩm</h4>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{ticket.product?.name || '—'}</p>
                    <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-light)' }}>{ticket.product?.serial_number || ''}</p>
                  </div>
                </div>

                {/* Issue */}
                <div>
                  <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Vấn đề</h4>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ticket.issue_description}</p>
                  </div>
                </div>

                {/* Progress tracker */}
                <div>
                  <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Tiến độ</h4>
                  <ProgressTracker status={ticket.status} />
                </div>

                {/* AI message */}
                {ticket.ai_progress_message && (
                  <div className="p-3 rounded-xl" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)' }}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm">🤖</span>
                      <p className="text-xs" style={{ color: 'var(--accent-violet)' }}>{ticket.ai_progress_message}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setTicket(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    Tra cứu khác
                  </button>
                  <button onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'var(--brand-700)' }}>
                    Đóng
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 text-center" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-light)' }}>
            Cần hỗ trợ? Liên hệ hotline: <strong style={{ color: 'var(--brand-700)' }}>0827461460</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
