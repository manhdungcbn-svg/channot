import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { productService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import CreateTicketModal from '../components/CreateTicket/CreateTicketModal'
import { isCustomer } from '../utils/permissions'
import { getWarrantyStatus } from '../config/statusConfig'
import { buildCrossAppUrl } from '../utils/sessionBridge'

/** URL storefront (dev: cổng 5175). */
const SHOP_URL = import.meta.env.VITE_SHOP_URL || 'http://localhost:5175'

function StatusBadge({ within }) {
  const ok = within === 'YES'
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{
        background: ok ? 'var(--success-bg)' : 'var(--danger-bg)',
        color: ok ? 'var(--success-text)' : 'var(--danger-text)',
      }}>
      {ok ? 'Còn bảo hành' : 'Hết bảo hành'}
    </span>
  )
}

function ProductCard({ product, onClick, onCreateTicket }) {
  // Dùng chung logic với backend (getWarrantyStatus xử lý đúng overflow ngày).
  const status = getWarrantyStatus(product.manufacture_date, product.warranty_months)
  const within = status.id === 'active' || status.id === 'warning'
  const expiry = status.endDate ?? null

  return (
    <div className="rounded-2xl p-5 transition-all hover:scale-[1.01]"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 4px 14px rgba(25,27,42,0.035)' }}>
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={() => onClick(product)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
          style={{ background: 'var(--brand-50)', color: 'var(--brand-600)' }}
          aria-label={`Xem phiếu của ${product.name}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="13" y2="17"/>
          </svg>
        </button>
        <StatusBadge within={within ? 'YES' : 'NO'} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
      <p className="text-xs mb-2 font-mono" style={{ color: 'var(--text-muted)' }}>{product.serial_number}</p>
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-light)' }}>
        <span>{product.category}</span>
        {expiry && (
          <>
            <span>•</span>
            <span>Hết hạn: {expiry.toLocaleDateString('vi-VN')}</span>
          </>
        )}
      </div>

      {/* Nút tạo phiếu bảo hành */}
      <button
        onClick={() => onCreateTicket(product)}
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ backgroundColor: 'var(--brand-600)' }}
      >
        Tạo phiếu bảo hành
      </button>
    </div>
  )
}

export default function MyProducts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ticketModal, setTicketModal] = useState({ open: false, product: null })

  useEffect(() => {
    if (!user) return
    setLoading(true)
    productService.list()
      .then(setProducts)
      .catch(err => setError(err.response?.data?.detail || 'Không tải được sản phẩm.'))
      .finally(() => setLoading(false))
  }, [user])

  // Khách hàng tạo phiếu từ đây — không qua bước "chọn khách hàng".
  const handleCreateTicket = (product) => {
    if (!isCustomer(user)) return
    setTicketModal({ open: true, product })
  }

  return (
    <Layout pageId="my-products">
      <div className="app-page space-y-6">
        <PageHeader
          title="Sản phẩm của tôi"
          subtitle="Danh sách sản phẩm bạn đang sở hữu và bảo hành"
          actions={[
            {
              label: 'Tạo phiếu bảo hành',
              onClick: () => setTicketModal({ open: true, product: null }),
            },
          ]}
        />

        {error && (
          <div className="rounded-xl p-4 text-sm"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-text)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="app-panel rounded-2xl p-5 animate-pulse">
                <div className="w-10 h-10 rounded-xl mb-3" style={{ background: 'var(--bg-hover)' }} />
                <div className="h-4 rounded mb-2" style={{ background: 'var(--bg-hover)', width: '70%' }} />
                <div className="h-3 rounded" style={{ background: 'var(--bg-hover)', width: '50%' }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="app-panel p-12 text-center">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Bạn chưa có sản phẩm nào
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-light)' }}>
              Đăng ký bảo hành tại web bán hàng hoặc liên hệ nhân viên để thêm sản phẩm vào hệ thống.
            </p>
            <a
              href={buildCrossAppUrl(SHOP_URL, '/')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--brand-600)' }}
            >
              Đi tới web bán hàng →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => navigate('/my-tickets')}
                onCreateTicket={handleCreateTicket}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTicketModal
        isOpen={ticketModal.open}
        onClose={() => setTicketModal({ open: false, product: null })}
        prefillProduct={ticketModal.product}
      />
    </Layout>
  )
}