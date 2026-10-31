import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productService } from '../services/services'
import { StatusBadge } from '../components'
import { useAuth } from '../context/AuthContext'
import { buildCrossAppUrl } from '../utils/sessionBridge'

const SHOP_BASE_URL = import.meta.env.VITE_SHOP_URL || 'http://localhost:5175'

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const ShopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M4 9v11h16V9" />
    <path d="M9 20v-6h6v6" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

function WarrantyCard({ product }) {
  if (!product) return null

  const manufactureDate = product.manufacture_date
    ? new Date(product.manufacture_date)
    : product.purchase_date
      ? new Date(product.purchase_date)
      : null
  const warrantyMonths = product.warranty_months || 12

  let expiryDate = null
  if (product.warranty_end_date) {
    expiryDate = new Date(product.warranty_end_date)
  } else if (manufactureDate) {
    expiryDate = new Date(manufactureDate)
    const targetMonth = expiryDate.getMonth() + warrantyMonths
    expiryDate.setDate(1)
    expiryDate.setMonth(targetMonth)
    const lastDay = new Date(expiryDate.getFullYear(), expiryDate.getMonth() + 1, 0).getDate()
    expiryDate.setDate(Math.min(manufactureDate.getDate(), lastDay))
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const expiryDay = expiryDate ? new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate()) : null
  const isExpired = expiryDay ? today > expiryDay : product.within_warranty === 'NO'
  const daysLeft = expiryDay ? Math.max(0, Math.round((expiryDay - today) / (1000 * 60 * 60 * 24))) : 0

  const CATEGORY_COLORS = {
    Laptop: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
    'Điện thoại': { bg: 'var(--brand-50)', text: 'var(--accent-violet)' },
    'Màn hình': { bg: 'var(--success-bg)', text: 'var(--success-text)' },
    'Tivi & Âm thanh': { bg: 'var(--brand-50)', text: 'var(--brand-700)' },
    'Máy lọc nước': { bg: 'var(--info-bg)', text: 'var(--info-text)' },
    'Tủ lạnh & Điều hòa': { bg: 'var(--brand-50)', text: 'var(--brand-700)' },
    'Thiết bị gia dụng': { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
    'Phụ kiện & Đèn': { bg: 'var(--bg-subtle)', text: 'var(--text-secondary)' },
  }
  const cs = CATEGORY_COLORS[product.category] || { bg: 'var(--bg-subtle)', text: 'var(--text-secondary)' }

  return (
    <div className="app-panel overflow-hidden" style={{ boxShadow: '0 18px 44px rgba(25,27,42,0.12)' }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, var(--brand-900) 0%, var(--brand-600) 62%, #766BF2 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>Mã sê-ri</p>
            <p className="text-lg font-bold font-mono text-white">{product.serial_number || product.serial}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Product info */}
        <div className="flex items-start gap-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name || product.product_name}
              className="w-20 h-20 rounded-2xl object-contain p-1 border flex-shrink-0"
              style={{ background: '#ffffff', borderColor: 'var(--border)' }}
            />
          ) : null}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif' }}>
              {product.name || product.product_name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: cs.bg, color: cs.text }}>
                  {product.category}
                </span>
              )}
              <StatusBadge variant={isExpired ? 'error' : 'success'} label={isExpired ? 'Hết hạn BH' : 'Còn hạn BH'} />
            </div>
          </div>
        </div>

        {/* Warranty details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-light)' }}>Ngày kích hoạt/mua</p>
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [serial, setSerial] = useState(searchParams.get('serial') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [myProducts, setMyProducts] = useState([])
  const [loadingMyProducts, setLoadingMyProducts] = useState(false)

  // Tự động tải danh sách sản phẩm sở hữu nếu khách đã đăng nhập
  useEffect(() => {
    if (!user) {
      setMyProducts([])
      return
    }
    let cancelled = false
    setLoadingMyProducts(true)
    productService
      .list()
      .then((data) => {
        if (!cancelled) setMyProducts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setMyProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoadingMyProducts(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // Tự động tra cứu nếu URL có sẵn param ?serial=...
  useEffect(() => {
    const qSerial = searchParams.get('serial')
    if (qSerial && qSerial.trim()) {
      setSerial(qSerial.trim())
      runLookup(qSerial.trim())
    }
  }, [searchParams])

  async function runLookup(lookupSerial) {
    const clean = String(lookupSerial || '').trim().toUpperCase()
    if (!clean) {
      setError('Vui lòng nhập serial sản phẩm')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      // Ưu tiên endpoint xác thực nếu có session, fallback public lookup
      let product = null
      try {
        product = await productService.bySerial(clean)
      } catch (authErr) {
        // Khách chưa đăng nhập hoặc tra cứu serial của người khác -> dùng public lookup
        const pub = await productService.lookupPublic(clean)
        if (pub && pub.found) {
          product = {
            serial_number: pub.serial,
            name: pub.product_name,
            category: pub.category,
            warranty_months: pub.warranty_months,
            warranty_end_date: pub.warranty_end_date,
            within_warranty: pub.within_warranty,
            image_url: pub.image_url,
          }
        } else {
          throw new Error('not_found')
        }
      }
      setResult(product)
    } catch (err) {
      setError('Không tìm thấy sản phẩm với serial này. Vui lòng kiểm tra lại mã trên tem máy.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    if (serial.trim()) {
      setSearchParams({ serial: serial.trim().toUpperCase() })
    }
    runLookup(serial)
  }

  function handlePickMyProduct(prod) {
    setSerial(prod.serial_number)
    setSearchParams({ serial: prod.serial_number })
    runLookup(prod.serial_number)
  }

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-6"
      style={{
        background: 'radial-gradient(ellipse at top left, var(--brand-50) 0%, transparent 38%), var(--bg-page)',
      }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Thanh điều hướng: ở lại bảo hành hoặc quay về web bán hàng (cùng tab) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b mb-6" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              title="Quay lại trang trước trong web bảo hành"
            >
              ← Ở lại web bảo hành
            </button>
            <a
              href={buildCrossAppUrl(SHOP_BASE_URL, '/')}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--brand-700)' }}
            >
              <ShopIcon />
              <span>Quay về Web Bán Hàng (cùng tab)</span>
            </a>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {user ? (
              <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--brand-700)' }}>
                <CheckCircleIcon />
                <span>Đã đăng nhập: {user.full_name || user.email || user.phone}</span>
              </span>
            ) : (
              <a
                href={buildCrossAppUrl(SHOP_BASE_URL, '/orders')}
                className="font-medium hover:underline"
                style={{ color: 'var(--brand-600)' }}
              >
                Chưa có serial? Xem đơn hàng đã mua →
              </a>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="px-4 py-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--brand-100)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
            Tra cứu bảo hành
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {user
              ? 'Chọn nhanh serial từ sản phẩm của bạn bên dưới hoặc nhập serial bất kỳ để kiểm tra'
              : 'Nhập serial in trên thân vỏ hoặc hoá đơn mua hàng để kiểm tra thời hạn bảo hành'}
          </p>
        </div>

        {/* Danh sách serial của khách đã đăng nhập (không bắt đăng nhập lại) */}
        {user && myProducts.length > 0 && (
          <div className="mb-6 rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-700)' }}>
                📦 Sản phẩm của bạn ({myProducts.length})
              </span>
              <Link to="/my-products" className="text-xs font-medium hover:underline" style={{ color: 'var(--brand-600)' }}>
                Quản lý tất cả →
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {myProducts.map((p) => {
                const isSelected = serial.toUpperCase() === p.serial_number?.toUpperCase()
                return (
                  <button
                    key={p.id || p.serial_number}
                    type="button"
                    onClick={() => handlePickMyProduct(p)}
                    className="flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border"
                    style={{
                      background: isSelected ? 'var(--brand-50)' : 'var(--bg-subtle)',
                      borderColor: isSelected ? 'var(--brand-600)' : 'var(--border)',
                    }}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-contain p-0.5 bg-white border" style={{ borderColor: 'var(--border)' }} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                        SP
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </div>
                      <div className="text-xs font-mono font-medium" style={{ color: 'var(--brand-700)' }}>
                        {p.serial_number}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Search form */}
        <div className="px-2 pb-7">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={serial}
                onChange={(e) => {
                  setSerial(e.target.value)
                  setError('')
                  setResult(null)
                }}
                className="w-full px-5 py-4 pl-14 pr-32 rounded-2xl text-base font-mono shadow-sm uppercase"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="Nhập mã sê-ri sản phẩm (VD: TND-AC10-001)..."
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

          {/* Gợi ý quay về web bán hàng để lấy serial */}
          <div className="mt-3 text-center">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Không nhớ số serial?{' '}
              <a
                href={buildCrossAppUrl(SHOP_BASE_URL, '/orders')}
                className="font-semibold hover:underline"
                style={{ color: 'var(--brand-600)' }}
              >
                Tìm trong danh sách đơn hàng đã mua trên Web Bán Hàng →
              </a>
            </span>
          </div>
        </div>

        {/* Results */}
        <div className="px-2 pb-10 max-w-2xl mx-auto">
          {error && (
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>{error}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Bạn có thể vào{' '}
                <a href={buildCrossAppUrl(SHOP_BASE_URL, '/orders')} className="underline font-medium" style={{ color: 'var(--brand-600)' }}>
                  Lịch sử đơn hàng
                </a>{' '}
                để sao chép chính xác mã serial.
              </p>
            </div>
          )}

          {result && <WarrantyCard product={result} />}

          {!result && !error && !loading && (
            <div className="app-panel p-8 text-center">
              <div className="text-4xl mb-3">🔎</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {user && myProducts.length > 0
                  ? 'Bấm vào một trong các sản phẩm của bạn ở trên để xem nhanh hạn bảo hành'
                  : 'Nhập serial sản phẩm để tra cứu thông tin bảo hành'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pb-8 px-6 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Hỗ trợ khách hàng: <a href="mailto:manhdungcbn@gmail.com" className="font-medium hover:underline">manhdungcbn@gmail.com</a> | Hotline:{' '}
            <a href="tel:0827461460" className="font-semibold" style={{ color: 'var(--brand-600)' }}>0827461460</a>
          </p>
          <p className="text-2xs mt-1" style={{ color: 'var(--text-light)' }}>
            Địa chỉ: Nam Tuấn, Cao Bằng
          </p>
          {!user && (
            <a
              href="/login"
              className="inline-block mt-4 text-sm font-semibold"
              style={{ color: 'var(--brand-600)' }}
            >
              Đăng nhập để xem danh sách serial tự động →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
