import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { productService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'

function StatusBadge({ within }) {
  const ok = within === 'YES'
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{
        background: ok ? '#D1FAE5' : '#FEE2E2',
        color: ok ? '#065F46' : '#991B1B',
      }}>
      {ok ? 'Còn bảo hành' : 'Hết bảo hành'}
    </span>
  )
}

function ProductCard({ product, onClick }) {
  const today = new Date()
  const mfg = product.manufacture_date ? new Date(product.manufacture_date) : null
  const expiry = mfg && product.warranty_months ? new Date(mfg) : null
  if (expiry) {
    const targetMonth = expiry.getMonth() + product.warranty_months
    expiry.setDate(1)
    expiry.setMonth(targetMonth)
    const lastDay = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0).getDate()
    expiry.setDate(Math.min(mfg.getDate(), lastDay))
  }
  const within = expiry ? expiry >= today : false

  return (
    <div onClick={() => onClick(product)}
      className="rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: '#FFFFFF', border: '1px solid #E7E9F1', boxShadow: '0 4px 14px rgba(25,27,42,0.035)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#EEF2FF', color: '#4F46E5' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="13" y2="17"/>
          </svg>
        </div>
        <StatusBadge within={within ? 'YES' : 'NO'} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: '#191B2A' }}>{product.name}</h3>
      <p className="text-xs mb-2 font-mono" style={{ color: '#64748B' }}>{product.serial_number}</p>
      <div className="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
        <span>{product.category}</span>
        {expiry && (
          <>
            <span>•</span>
            <span>Hết hạn: {expiry.toLocaleDateString('vi-VN')}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function MyProducts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    productService.list()
      .then(setProducts)
      .catch(err => setError(err.response?.data?.detail || 'Không tải được sản phẩm.'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <Layout pageId="my-products">
      <div className="app-page space-y-6">
        <PageHeader
          title="Sản phẩm của tôi"
          subtitle="Danh sách sản phẩm bạn đang sở hữu và bảo hành"
        />

        {error && (
          <div className="rounded-xl p-4 text-sm"
            style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="app-panel rounded-2xl p-5 animate-pulse">
                <div className="w-10 h-10 rounded-xl mb-3" style={{ background: '#F1F5F9' }} />
                <div className="h-4 rounded mb-2" style={{ background: '#F1F5F9', width: '70%' }} />
                <div className="h-3 rounded" style={{ background: '#F1F5F9', width: '50%' }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="app-panel p-12 text-center">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>
              Bạn chưa có sản phẩm nào
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              Liên hệ nhân viên để đăng ký sản phẩm vào hệ thống.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/my-tickets`)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}