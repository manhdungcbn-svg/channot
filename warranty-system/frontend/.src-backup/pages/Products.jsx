import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { productService, ticketService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import CreateTicketModal from '../components/CreateTicket/CreateTicketModal'
import { StatusBadge } from '../components'
import { useDebounce } from '../hooks/useDebounce'

const CATEGORY_ICONS = {
  Laptop: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  'Điện thoại': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  'Màn hình': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  Network: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
    </svg>
  ),
  Camera: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8">
      <path d="M23 7l-7 5 7 5V7z"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  Default: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8">
      <rect x="2" y="2" width="20" height="20" rx="2" ry="2"/>
      <line x1="7" y1="12" x2="17" y2="12"/>
      <line x1="12" y1="7" x2="12" y2="17"/>
    </svg>
  ),
}

const CATEGORY_COLORS = {
  Laptop: { bg: '#EFF6FF', text: '#1D4ED8' },
  'Điện thoại': { bg: '#F5F3FF', text: '#6D28D9' },
  'Màn hình': { bg: '#ECFDF5', text: '#059669' },
  Network: { bg: '#FFFBEB', text: '#D97706' },
  Camera: { bg: '#FEF2F2', text: '#DC2626' },
}

function AddProductModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', serial_number: '', category: 'Network',
    manufacture_date: '', warranty_months: '12',
    price: '', description: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, val) { setForm(f => ({ ...f, [field]: val })); setError('') }

  function validate() {
    if (!form.name.trim()) return 'Vui lòng nhập tên sản phẩm.'
    if (!form.serial_number.trim()) return 'Vui lòng nhập mã serial.'
    if (form.warranty_months && (parseInt(form.warranty_months) < 1 || parseInt(form.warranty_months) > 120)) {
      return 'Thời hạn bảo hành phải từ 1 đến 120 tháng.'
    }
    if (form.price !== '' && form.price !== null) {
      const p = Number(form.price)
      if (Number.isNaN(p) || p < 0) return 'Giá sản phẩm phải lớn hơn hoặc bằng 0.'
    }
    return null
  }

  const computedExpiry = (() => {
    if (!form.manufacture_date || !form.warranty_months) return null
    const d = new Date(form.manufacture_date)
    d.setMonth(d.getMonth() + parseInt(form.warranty_months))
    return d.toLocaleDateString('vi-VN')
  })()

  async function handleSubmit(e) {
    e.preventDefault()
    const v = validate()
    if (v) { setError(v); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        serial_number: form.serial_number.trim(),
        category: form.category,
        warranty_months: parseInt(form.warranty_months),
        manufacture_date: form.manufacture_date || new Date().toISOString().split('T')[0],
      }
      // Phan 2.5 - section 3 thong tin thuong mai (optional, nho validate trong ham validate()).
      if (form.price !== '' && form.price !== null) {
        const p = Number(form.price)
        if (!Number.isNaN(p) && p >= 0) payload.price = p
      }
      if (form.description.trim()) {
        payload.description = form.description.trim()
      }
      await productService.create(payload)
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Tạo sản phẩm thất bại.')
    } finally { setSaving(false) }
  }

  const CATEGORIES = ['Network', 'Camera', 'Laptop', 'Điện thoại', 'Màn hình', 'Tai nghe', 'Máy tính bảng', 'Phụ kiện']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: '#0F1929', animation: 'contentFadeUp 0.3s ease-out both' }}>
        <div className="px-6 pt-5 pb-4 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1A3A6B, #2563EB)' }}>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Tạo sản phẩm mới</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Đăng ký thiết bị vào hệ thống bảo hành</p>
          </div>
          <button onClick={onClose} type="button" className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* SECTION 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#2563EB', color: '#FFFFFF' }}>1</div>
              <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Thông tin cơ bản</h3>
            </div>
            <div className="space-y-3 pl-8">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                  Tên sản phẩm <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9' }}
                  placeholder="VD: Router WiFi 6 Pro" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                    Mã sản phẩm / Serial <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input type="text" value={form.serial_number}
                    onChange={e => update('serial_number', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-mono"
                    style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9' }}
                    placeholder="RWF-2026-00123" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>Danh mục</label>
                  <select value={form.category} onChange={e => update('category', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#059669', color: '#FFFFFF' }}>2</div>
              <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Thông tin bảo hành</h3>
            </div>
            <div className="space-y-3 pl-8">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>Ngày sản xuất</label>
                  <input type="date" value={form.manufacture_date}
                    onChange={e => update('manufacture_date', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>Thời hạn (tháng)</label>
                  <select value={form.warranty_months} onChange={e => update('warranty_months', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9' }}>
                    {[6, 12, 18, 24, 36, 48, 60].map(m => <option key={m} value={m}>{m} tháng</option>)}
                  </select>
                </div>
              </div>
              {computedExpiry && (
                <div className="rounded-lg p-2.5 text-xs flex items-center gap-2"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Hết hạn bảo hành: <strong>{computedExpiry}</strong>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#F59E0B', color: '#FFFFFF' }}>3</div>
              <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Thông tin thương mại</h3>
            </div>
            <div className="space-y-3 pl-8">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                    Giá bán (VND)
                  </label>
                  <input type="number" min="0" step="1000" value={form.price}
                    onChange={e => update('price', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-mono"
                    style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9' }}
                    placeholder="VD: 1890000" />
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>Không bắt buộc. Để trống nếu chưa có.</div>
                </div>
                <div className="flex items-end">
                  {form.price !== '' && form.price !== null && !Number.isNaN(Number(form.price)) && Number(form.price) >= 0 && (
                    <div className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: '#1E293B', color: '#34D399' }}>
                      {Number(form.price).toLocaleString('vi-VN')} ₫
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                  Mô tả sản phẩm
                </label>
                <textarea rows={3} value={form.description}
                  onChange={e => update('description', e.target.value)}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9', resize: 'vertical' }}
                  placeholder="Mô tả ngắn về cấu hình, đặc điểm nổi bật..." />
                <div className="text-xs mt-1 text-right" style={{ color: '#64748B' }}>
                  {form.description.length}/2000
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 - Coming Soon */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#475569', color: '#FFFFFF' }}>4</div>
              <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Hình ảnh</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Sắp phát triển</span>
            </div>
            <div className="pl-8">
              <div className="rounded-xl p-4 text-xs flex items-start gap-3"
                style={{ background: 'rgba(71,85,105,0.1)', border: '1px dashed #475569', color: '#94A3B8' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <div>
                  <strong style={{ color: '#CBD5E1' }}>Tính năng upload hình ảnh đang được phát triển.</strong>
                  <div className="mt-1">Sẽ hỗ trợ upload nhiều ảnh, preview, lưu trữ qua Supabase Storage trong phiên bản tiếp theo.</div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171' }}>
              {error}
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
              {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [tickets, setTickets] = useState([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [catFilter, setCatFilter] = useState('all')
  const [warrantyFilter, setWarrantyFilter] = useState('all')
  const [expandedProduct, setExpandedProduct] = useState(null)

  const canCreate = ['admin', 'staff'].includes(user?.role)

  function load() {
    setLoading(true)
    Promise.all([
      productService.list().catch(() => []),
      ticketService.list().catch(() => []),
    ]).then(([ps, ts]) => {
      setProducts(ps)
      setTickets(ts)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const categories = ['all', ...new Set(products.map(p => p.category))]

  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = !debouncedSearch ||
      p.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.serial_number?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchCat = catFilter === 'all' || p.category === catFilter
    const matchWarranty = warrantyFilter === 'all' ||
      (warrantyFilter === 'active' && p.warranty_months >= 12) ||
      (warrantyFilter === 'expired' && p.warranty_months < 12)
    return matchSearch && matchCat && matchWarranty
  }), [products, debouncedSearch, catFilter, warrantyFilter])

  const catStats = {}
  categories.filter(c => c !== 'all').forEach(c => {
    catStats[c] = products.filter(p => p.category === c).length
  })

  const handleQuickTicket = (product) => {
    setSelectedProduct(product)
    setShowCreate(true)
  }

  return (
    <Layout pageId="products">
      <div className="app-page space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="app-page-title">Sản phẩm</h1>
            <p className="app-page-subtitle">Quản lý thiết bị, mã serial và thời hạn bảo hành</p>
          </div>
          {canCreate && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: '#4F46E5', boxShadow: '0 7px 18px rgba(79,70,229,0.2)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Thêm sản phẩm
            </button>
          )}
        </div>

        {/* Category summary */}
        {categories.length > 1 && (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length - 1, 6)}, minmax(0, 1fr))` }}>
            {categories.filter(c => c !== 'all').map(cat => {
              const icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS.Default
              const cs = CATEGORY_COLORS[cat] || { bg: '#F8FAFC', text: '#374151' }
              return (
                <div key={cat} className="rounded-xl p-3 text-center cursor-pointer transition-all"
                  style={{ background: catFilter === cat ? '#EEF2FF' : '#FFFFFF', border: `1px solid ${catFilter === cat ? '#C7D2FE' : '#E7E9F1'}`, boxShadow: catFilter === cat ? '0 4px 12px rgba(79,70,229,0.08)' : '0 2px 8px rgba(25,27,42,0.025)' }}
                  onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}>
                  <div className="mb-1">{icon}</div>
                  <div className="text-xs font-medium truncate" style={{ color: cs.text }}>{cat}</div>
                  <div className="text-lg font-bold" style={{ color: '#4338CA', fontFamily: 'DM Sans, sans-serif' }}>{catStats[cat]}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Toolbar */}
        <div className="space-y-3">
          <div className="app-panel p-4 space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Tìm theo tên, serial, danh mục..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: '#E7E9F1', background: '#FFFFFF', color: '#191B2A' }} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium" style={{ color: '#85889A' }}>Lọc bảo hành:</span>
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'active', label: 'Còn hạn (≥12 tháng)' },
              { value: 'expired', label: 'Hết hạn (<12 tháng)' },
            ].map(f => (
              <button key={f.value} onClick={() => setWarrantyFilter(f.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: warrantyFilter === f.value ? '#EEF2FF' : '#F5F6FA',
                  color: warrantyFilter === f.value ? '#4338CA' : '#73768A',
                }}>
                {f.label}
              </button>
            ))}
            {(catFilter !== 'all' || warrantyFilter !== 'all') && (
              <button onClick={() => { setCatFilter('all'); setWarrantyFilter('all') }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: '#FEE2E2', color: '#991B1B' }}>
                ✕ Xóa lọc
              </button>
            )}
          </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid gap-4 xl:grid-cols-2">
          {loading ? (
            <div className="col-span-2 app-panel text-center py-12" style={{ color: '#73768A' }}>Đang tải danh sách sản phẩm...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-2 text-center py-12" style={{ color: '#94A3B8' }}>
              <div className="text-3xl mb-2">📦</div>
              Không tìm thấy sản phẩm nào.
            </div>
          ) : filtered.map(product => {
            const ticketCount = tickets.filter(t => t.product_id === product.id).length
            const activeTickets = tickets.filter(t => t.product_id === product.id && ['RECEIVED', 'INSPECTION', 'REPAIRING'].includes(t.status)).length
            const icon = CATEGORY_ICONS[product.category] || CATEGORY_ICONS.Default
            const cs = CATEGORY_COLORS[product.category] || { bg: '#F8FAFC', text: '#374151' }

            return (
              <div key={product.id}
                className="app-panel p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cs.bg }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="font-semibold text-sm leading-snug" style={{ color: '#0F1929', fontFamily: 'DM Sans, sans-serif' }}>
                          {product.name}
                        </h3>
                        <div className="mono text-xs mt-0.5" style={{ color: '#94A3B8' }}>{product.serial_number}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ background: cs.bg, color: cs.text }}>{product.category}</span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div>
                        <div className="text-xs" style={{ color: '#94A3B8' }}>Ngày sản xuất</div>
                        <div className="text-sm font-semibold" style={{ color: '#374151' }}>
                          {product.manufacture_date ? new Date(product.manufacture_date).toLocaleDateString('vi-VN') : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#94A3B8' }}>Bảo hành</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold" style={{ color: product.warranty_months >= 24 ? '#059669' : product.warranty_months >= 12 ? '#F59E0B' : '#DC2626' }}>
                            {product.warranty_months} tháng
                          </span>
                          <StatusBadge
                            variant={product.warranty_months >= 12 ? 'success' : 'error'}
                            label={product.warranty_months >= 12 ? 'Còn hạn' : 'Hết hạn'}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#94A3B8' }}>Giá</div>
                        <div className="text-sm font-bold" style={{ color: '#0F1929' }}>
                          {product.price != null ? `${Number(product.price).toLocaleString('vi-VN')} ₫` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#94A3B8' }}>Phiếu BH</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold" style={{ color: '#374151' }}>{ticketCount}</span>
                          {activeTickets > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: '#EDE9FE', color: '#5B21B6' }}>
                              {activeTickets} đang xử lý
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: '#F1F5F9' }}>
                  <button onClick={() => handleQuickTicket(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#059669' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    Tạo phiếu BH
                  </button>
                  <button
                    onClick={() => window.location.href = `/tickets?product_id=${product.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E4EBF7' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Xem phiếu
                  </button>
                  <button
                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: expandedProduct === product.id ? '#1A3A6B' : '#F8FAFC',
                      color: expandedProduct === product.id ? '#FFFFFF' : '#1A3A6B',
                      border: '1px solid #E4EBF7',
                    }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    {expandedProduct === product.id ? 'Thu gọn' : 'Chi tiết'}
                  </button>
                </div>

                {/* Inline detail (mo rong khi click Chi tiet) */}
                {expandedProduct === product.id && (
                  <div className="mt-3 rounded-xl p-4 space-y-3"
                    style={{ background: '#F8FAFC', border: '1px solid #E4EBF7' }}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-medium" style={{ color: '#64748B' }}>Giá bán</div>
                        <div className="text-base font-bold mt-1" style={{ color: '#0F1929' }}>
                          {product.price != null ? `${Number(product.price).toLocaleString('vi-VN')} ₫` : 'Chưa cập nhật'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium" style={{ color: '#64748B' }}>Danh mục</div>
                        <div className="text-base font-semibold mt-1" style={{ color: '#0F1929' }}>{product.category}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-1" style={{ color: '#64748B' }}>Mô tả sản phẩm</div>
                      {product.description ? (
                        <div className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                          {product.description}
                        </div>
                      ) : (
                        <div className="text-sm italic" style={{ color: '#94A3B8' }}>Chưa có mô tả.</div>
                      )}
                    </div>
                    <div className="text-xs pt-2 border-t" style={{ color: '#94A3B8', borderColor: '#E4EBF7' }}>
                      Hình ảnh sản phẩm: <em>Sắp phát triển</em>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onCreated={load} />}
      {showCreate && selectedProduct && (
        <CreateTicketModal
          isOpen={showCreate}
          onClose={() => { setShowCreate(false); setSelectedProduct(null) }}
          onCreated={() => { setShowCreate(false); setSelectedProduct(null); load() }}
          prefillProduct={selectedProduct}
        />
      )}
    </Layout>
  )
}
