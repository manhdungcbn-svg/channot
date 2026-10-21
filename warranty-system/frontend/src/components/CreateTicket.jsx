import { useEffect, useState } from 'react'
import { productService, ticketService } from '../services/services'

/**
 * Modal tạo phiếu bảo hành — chỉ staff/admin (US-03).
 * Section 1: Tìm sản phẩm theo serial → fill product + customer.
 * Section 2: Mô tả lỗi (bắt buộc).
 */
export function CreateTicketModal({ isOpen, onClose, onCreated, prefillProduct = null }) {
  const [serial, setSerial] = useState('')
  const [product, setProduct] = useState(prefillProduct)
  const [productError, setProductError] = useState('')
  const [looking, setLooking] = useState(false)

  const [issue, setIssue] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Reset khi mở/đóng
  useEffect(() => {
    if (isOpen) {
      setSerial('')
      setProduct(prefillProduct)
      setProductError('')
      setIssue('')
      setSubmitError('')
    }
  }, [isOpen, prefillProduct])

  if (!isOpen) return null

  async function lookupSerial(e) {
    e?.preventDefault()
    const s = serial.trim()
    if (!s) { setProductError('Vui lòng nhập serial sản phẩm.'); return }
    setLooking(true); setProductError('')
    try {
      const p = await productService.bySerial(s)
      setProduct(p)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Không tìm thấy sản phẩm với serial này.'
      setProductError(detail)
      setProduct(null)
    } finally {
      setLooking(false)
    }
  }

  function validate() {
    if (!product) return 'Vui lòng tìm sản phẩm theo serial trước.'
    const trimmed = issue.trim()
    if (!trimmed) return 'Vui lòng nhập mô tả lỗi.'
    if (trimmed.length > 2000) return 'Mô tả lỗi tối đa 2000 ký tự.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const v = validate()
    if (v) { setSubmitError(v); return }
    setSaving(true); setSubmitError('')
    try {
      await ticketService.create({
        product_id: product.id,
        issue_description: issue.trim(),
      })
      onCreated()
      onClose()
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Tạo phiếu thất bại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: '#0F1929', animation: 'contentFadeUp 0.3s ease-out both' }}>
        <div className="px-6 pt-5 pb-4 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1A3A6B, #2563EB)' }}>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Tạo phiếu bảo hành</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Tiếp nhận yêu cầu mới và kiểm tra điều kiện bảo hành tự động.</p>
          </div>
          <button onClick={onClose} type="button" className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* SECTION 1: Sản phẩm */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#2563EB', color: '#FFFFFF' }}>1</div>
              <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Sản phẩm</h3>
            </div>
            <div className="space-y-3 pl-8">
              {!product && (
                <form onSubmit={lookupSerial} className="flex gap-2">
                  <input type="text" value={serial} onChange={e => setSerial(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono"
                    style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9' }}
                    placeholder="Nhập serial, ví dụ: RWF-2026-00123" />
                  <button type="submit" disabled={looking}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: looking ? '#334155' : '#2563EB', cursor: looking ? 'not-allowed' : 'pointer' }}>
                    {looking ? 'Đang tìm...' : 'Tìm'}
                  </button>
                </form>
              )}
              {productError && (
                <div className="p-3 rounded-lg text-sm"
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171' }}>
                  {productError}
                </div>
              )}
              {product && (
                <div className="rounded-xl p-3 flex items-start justify-between gap-3"
                  style={{ background: '#1E293B', border: '1px solid #334155' }}>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: '#F1F5F9' }}>{product.name}</div>
                    <div className="mono text-xs mt-0.5" style={{ color: '#94A3B8' }}>{product.serial_number}</div>
                    <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                      {product.category}{product.manufacture_date ? ` · SX ${new Date(product.manufacture_date).toLocaleDateString('vi-VN')}` : ''}
                    </div>
                  </div>
                  {!prefillProduct && (
                    <button type="button" onClick={() => { setProduct(null); setSerial(''); setProductError('') }}
                      className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: '#334155', color: '#CBD5E1' }}>
                      Đổi
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Mô tả lỗi */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#059669', color: '#FFFFFF' }}>2</div>
              <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Mô tả lỗi</h3>
            </div>
            <div className="space-y-2 pl-8">
              <textarea rows={5} value={issue} onChange={e => setIssue(e.target.value)}
                maxLength={2000}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9', resize: 'vertical' }}
                placeholder="Mô tả chi tiết triệu chứng, thời điểm xảy ra, điều kiện tái hiện..." />
              <div className="flex items-center justify-between text-xs" style={{ color: '#64748B' }}>
                <span>Mô tả càng chi tiết, AI phân loại càng chính xác.</span>
                <span>{issue.length}/2000</span>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171' }}>
              {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-2 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}>
              Hủy
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: saving ? '#334155' : '#2563EB', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
                </svg>
              )}
              {saving ? 'Đang tạo...' : 'Tạo phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTicketModal