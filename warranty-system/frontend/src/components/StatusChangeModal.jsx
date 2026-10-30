import { useEffect, useState } from 'react'
import { getStatusConfig } from '../config/statusConfig'

/**
 * Modal chuyển trạng thái phiếu — thay cho `window.prompt`.
 *
 * Cho phép nhập ghi chú xử lý và chi phí sửa chữa (chỉ hiện khi chuyển sang
 * COMPLETED). Xác nhận bằng nút, không dùng hộp thoại native của trình duyệt.
 */
export default function StatusChangeModal({
  isOpen,
  onClose,
  onSubmit,
  newStatus,
  busy = false,
}) {
  const [note, setNote] = useState('')
  const [cost, setCost] = useState('0')
  const [error, setError] = useState('')

  const cfg = getStatusConfig(newStatus)
  const needsCost = newStatus === 'COMPLETED'

  // Reset form mỗi lần mở
  useEffect(() => {
    if (isOpen) {
      setNote('')
      setCost('0')
      setError('')
    }
  }, [isOpen, newStatus])

  // Chặn đóng khi đang submit
  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, busy, onClose])

  if (!isOpen) return null

  function handleSubmit(e) {
    e.preventDefault()
    const numericCost = Number(cost.replace(/\./g, '').replace(/,/g, ''))
    if (needsCost && (Number.isNaN(numericCost) || numericCost < 0)) {
      setError('Chi phí sửa chữa không hợp lệ. Vui lòng nhập số.')
      return
    }
    onSubmit({ note: note.trim(), cost: needsCost ? numericCost : 0 })
  }

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-change-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl overflow-hidden animate-scale-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-start gap-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-600)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="status-change-title" className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Chuyển sang “{cfg?.label || newStatus}”
            </h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Ghi chú xử lý sẽ được lưu vào lịch sử phiếu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Đóng"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="label" htmlFor="status-note">
              Ghi chú xử lý
            </label>
            <textarea
              id="status-note"
              value={note}
              onChange={(e) => { setNote(e.target.value); setError('') }}
              rows={3}
              placeholder="Ví dụ: Đã kiểm tra mainboard, phát hiện lỗi nguồn..."
              className="input resize-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {needsCost && (
            <div>
              <label className="label" htmlFor="status-cost">
                Chi phí sửa chữa <span style={{ color: 'var(--text-light)' }}>(VND)</span>
              </label>
              <div className="relative">
                <input
                  id="status-cost"
                  type="text"
                  inputMode="numeric"
                  value={cost}
                  onChange={(e) => { setCost(e.target.value); setError('') }}
                  className="input pr-16"
                  style={{ color: 'var(--text-primary)' }}
                  placeholder="0"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--text-light)' }}
                >
                  đồng
                </span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-light)' }}>
                Nhập 0 nếu sản phẩm còn trong thời hạn bảo hành.
              </p>
            </div>
          )}

          {error && (
            <div
              className="px-3 py-2.5 rounded-lg text-sm flex items-start gap-2"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex gap-3 justify-end"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn btn-secondary"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75" />
                </svg>
                Đang xử lý...
              </span>
            ) : (
              `Xác nhận chuyển sang ${cfg?.label || newStatus}`
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
