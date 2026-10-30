// ============================================
// CREATE TICKET MODAL - FULL WORKFLOW
// Step 2: Product Selection + Warranty Check
// ============================================

import { useState, useEffect } from 'react'
import { productService } from '../../services/services'
import { getWarrantyStatus, formatWarrantyExpiry, getDaysRemaining } from '../../config/statusConfig'

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

function WarrantyBadge({ status }) {
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: status.bg, color: status.color }}
    >
      <AlertIcon />
      {status.label}
      {status.daysRemaining > 0 && (
        <span className="ml-1 opacity-75">
          ({status.daysRemaining} ngày)
        </span>
      )}
    </span>
  )
}

function ProductCard({ product, onSelect, selected }) {
  const warrantyInfo = getWarrantyStatus(
    product.manufacture_date,
    product.warranty_months
  )
  const expiryDate = formatWarrantyExpiry(
    product.manufacture_date,
    product.warranty_months
  )
  const daysLeft = getDaysRemaining(
    product.manufacture_date,
    product.warranty_months
  )

  return (
    <button
      onClick={() => onSelect(product)}
      className="w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md"
      style={{
        borderColor: selected ? 'var(--brand-600)' : 'var(--border)',
        backgroundColor: selected ? 'var(--brand-50)' : 'var(--bg-card)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {product.name}
            </span>
            {selected && (
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--success)', color: 'white' }}
              >
                <CheckIcon />
              </span>
            )}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="font-mono text-xs">{product.serial_number}</span>
          </div>
          {product.model && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
              Model: {product.model}
            </div>
          )}
        </div>
        
        <WarrantyBadge status={warrantyInfo} />
      </div>
      
      {/* Warranty details */}
      <div 
        className="mt-3 pt-3 grid grid-cols-2 gap-2"
        style={{ borderTop: '1px solid var(--border-light)' }}
      >
        <div>
          <div className="text-xs" style={{ color: 'var(--text-light)' }}>Ngày mua</div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {product.purchase_date 
              ? new Date(product.purchase_date).toLocaleDateString('vi-VN')
              : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: 'var(--text-light)' }}>Hạn BH</div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {expiryDate}
          </div>
        </div>
        {daysLeft !== null && daysLeft > 0 && (
          <div className="col-span-2">
            <div className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--success-text)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Còn {daysLeft} ngày bảo hành
            </div>
          </div>
        )}
      </div>
    </button>
  )
}

export default function Step2Product({ data, onUpdate, customerId, prefillProduct, isCustomer = false }) {
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(prefillProduct || data.product || null)

  useEffect(() => {
    if (prefillProduct) {
      setSelectedProduct(prefillProduct)
      onUpdate({ product: prefillProduct })
    } else if (isCustomer) {
      // Khách hàng: backend đã lọc /products theo tài khoản đang đăng nhập.
      loadOwnedProducts()
    } else if (customerId) {
      loadProductsByCustomer(customerId)
    }
  }, [prefillProduct, customerId, isCustomer])

  const loadOwnedProducts = async () => {
    setSearching(true)
    try {
      const list = await productService.list()
      setProducts(list || [])
    } catch {
      setProducts([])
    } finally {
      setSearching(false)
    }
  }

  const loadProductsByCustomer = async (cid) => {
    setSearching(true)
    try {
      const list = await productService.list()
      setProducts((list || []).filter(product => product.customer_id === cid))
    } catch {
      setProducts([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = async () => {
    if (!search.trim()) {
      if (customerId) loadProductsByCustomer(customerId)
      return
    }
    setSearching(true)
    try {
      // Search by serial or name
      const results = await productService.list(search)
      setProducts(results || [])
    } catch {
      setProducts([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelectProduct = (product) => {
    setSelectedProduct(product)
    onUpdate({ product })
  }

  return (
    <div className="space-y-4">
      {/* Khách hàng: chỉ chọn trong sản phẩm đã đăng ký bảo hành của mình */}
      {isCustomer ? (
        <div
          className="p-3 rounded-xl text-sm flex items-start gap-2"
          style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
        >
          <span className="mt-0.5">ℹ️</span>
          <span>
            Chọn sản phẩm của bạn đang được bảo hành. Nếu chưa thấy sản phẩm vừa mua, hãy đăng ký bảo hành tại
            web bán hàng hoặc liên hệ hotline <strong>1900 6868</strong>.
          </span>
        </div>
      ) : (
        <>
          {/* Search */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Tìm sản phẩm
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }}>
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
                  placeholder="Tìm theo serial, tên sản phẩm..."
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{ backgroundColor: 'var(--brand-600)' }}
              >
                Tìm
              </button>
            </div>
          </div>
        </>
      )}

      {/* Product list */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {searching ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--text-light)" strokeWidth="4"/>
              <path className="opacity-75" fill="var(--text-light)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              {isCustomer
                ? 'Bạn chưa có sản phẩm nào được đăng ký bảo hành'
                : customerId
                  ? 'Khách hàng chưa có sản phẩm nào đăng ký'
                  : 'Vui lòng chọn khách hàng trước'}
            </p>
          </div>
        ) : (
          products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              selected={selectedProduct?.id === product.id}
              onSelect={handleSelectProduct}
            />
          ))
        )}
      </div>

      {/* Selected product summary */}
      {selectedProduct && (
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-text)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--success-text)' }}><CheckIcon /></span>
            <span className="text-sm font-medium" style={{ color: 'var(--success-text)' }}>
              Đã chọn: {selectedProduct.name}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
