import { useState } from 'react'
import { productService } from '../services/services'
import { StatusBadge } from '../components'

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const PackageIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const AlertIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

function WarrantyCard({ product }) {
  if (!product) return null

  // Calculate warranty status
  const manufactureDate = product.manufacture_date ? new Date(product.manufacture_date) : null
  const warrantyMonths = product.warranty_months || 12
  const expiryDate = manufactureDate ? new Date(manufactureDate) : null
  if (expiryDate) {
    const targetMonth = expiryDate.getMonth() + warrantyMonths
    expiryDate.setDate(1)
    expiryDate.setMonth(targetMonth)
    const lastDay = new Date(expiryDate.getFullYear(), expiryDate.getMonth() + 1, 0).getDate()
    expiryDate.setDate(Math.min(manufactureDate.getDate(), lastDay))
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const expiryDay = expiryDate ? new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate()) : null
  const isExpired = expiryDay ? today > expiryDay : true
  const daysLeft = expiryDay ? Math.max(0, Math.round((expiryDay - today) / (1000 * 60 * 60 * 24))) : 0

  const CATEGORY_COLORS = {
    Laptop: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
    'Điện thoại': { bg: 'var(--brand-50)', text: 'var(--accent-violet)' },
    'Màn hình': { bg: 'var(--success-bg)', text: 'var(--success-text)' },
    Network: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
    Camera: { bg: 'var(--danger-bg)', text: 'var(--danger)' },
  }
  const cs = CATEGORY_COLORS[product.category] || { bg: 'var(--bg-subtle)', text: 'var(--text-secondary)' }

  return (
    <div className="app-panel overflow-hidden" style={{ boxShadow: '0 18px 44px rgba(25,27,42,0.12)' }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, var(--brand-900) 0%, var(--brand-600) 62%, #766BF2 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>Mã sê-ri</p>
            <p className="text-lg font-bold font-mono text-white">{product.serial_number}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Product info */}
        <div>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif' }}>{product.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: cs.bg, color: cs.text }}>{product.category}</span>
            <StatusBadge variant={isExpired ? 'error' : 'success'} label={isExpired ? 'Hết hạn BH' : 'Còn hạn BH'} />
          </div>
        </div>

        {/* Warranty details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-light)' }}>Ngày mua</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {manufactureDate ? manufactureDate.toLocaleDateString('vi-VN') : '—'}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-light)' }}>Thời hạn BH</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{warrantyMonths} tháng</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-light)' }}>Ngày hết hạn</p>
            <p className="text-sm font-semibold" style={{ color: expiryDate ? (isExpired ? 'var(--danger)' : 'var(--success-text)') : 'var(--text-light)' }}>
              {expiryDate ? expiryDate.toLocaleDateString('vi-VN') : '—'}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: isExpired ? 'var(--danger-bg)' : 'var(--success-bg)', border: `1px solid ${isExpired ? 'var(--danger-bg)' : 'var(--success-bg)'}` }}>
            <p className="text-xs" style={{ color: isExpired ? 'var(--danger-text)' : 'var(--success-text)' }}>Thời gian còn lại</p>
            <p className="text-sm font-bold" style={{ color: isExpired ? 'var(--danger)' : 'var(--success-text)' }}>
              {isExpired ? 'Đã hết' : `${daysLeft} ngày`}
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="p-3 rounded-xl" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-bg)' }}>
          <p className="text-xs" style={{ color: 'var(--warning-text)' }}>
            <strong>Lưu ý:</strong> Thông tin bảo hành chỉ mang tính chất tham khảo. Vui lòng liên hệ hotline <strong>0827461460</strong> để được hỗ trợ chi tiết.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Lookup() {
  const [serial, setSerial] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!serial.trim()) { setError('Vui lòng nhập serial sản phẩm'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const product = await productService.bySerial(serial.trim())
      setResult(product)
    } catch (err) {
      setError('Không tìm thấy sản phẩm với serial này. Vui lòng kiểm tra lại.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6" style={{ background: 'radial-gradient(ellipse at top left, var(--brand-50) 0%, transparent 38%), var(--bg-page)' }}>
      <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="px-4 py-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--brand-100)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          Tra cứu bảo hành
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Nhập serial sản phẩm để kiểm tra tình trạng bảo hành
        </p>
      </div>

      {/* Search form */}
      <div className="px-2 pb-7">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={serial}
              onChange={e => { setSerial(e.target.value); setError(''); setResult(null) }}
              className="w-full px-5 py-4 pl-14 pr-32 rounded-2xl text-base font-mono shadow-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              placeholder="Nhập mã sê-ri sản phẩm..."
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }}>
              <SearchIcon />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: loading ? 'var(--text-light)' : 'var(--brand-600)', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Đang tìm...' : 'Tra cứu'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="px-2 pb-10 max-w-2xl mx-auto">
        {error && (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        {result && <WarrantyCard product={result} />}

        {!result && !error && !loading && (
          <div className="app-panel p-8 text-center">
            <div className="text-4xl mb-3">🔎</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nhập serial sản phẩm để tra cứu thông tin bảo hành
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 px-6">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Liên hệ hỗ trợ: manhdungdbn@gmail.com | 0827461460
        </p>
        <a href="/login" className="inline-block mt-4 text-sm font-semibold" style={{ color: 'var(--brand-600)' }}>
          Đăng nhập để quản lý phiếu bảo hành →
        </a>
      </div>
      </div>
    </div>
  )
}
