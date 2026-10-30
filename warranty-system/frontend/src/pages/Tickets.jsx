import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import { customerService, productService, ticketService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import CreateTicketModal from '../components/CreateTicket/CreateTicketModal'
import { getStatusConfig } from '../config/statusConfig'
import { useDebounce } from '../hooks/useDebounce'

const STATUSES = ['all', 'RECEIVED', 'INSPECTION', 'REPAIRING', 'COMPLETED', 'REJECTED']

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

export default function Tickets() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const rows = await ticketService.list()
      if (['admin', 'staff'].includes(user?.role)) {
        const [products, customers] = await Promise.all([
          productService.list(),
          customerService.list(),
        ])
        const productById = new Map(products.map(product => [product.id, product]))
        const customerById = new Map(customers.map(customer => [customer.id, customer]))
        setTickets(rows.map(ticket => ({
          ...ticket,
          product: productById.get(ticket.product_id),
          customer: customerById.get(ticket.customer_id),
        })))
      } else {
        setTickets(rows)
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error?.message || 'Không tải được danh sách phiếu.'
      toast.error(detail)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => tickets.filter(t => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    const matchSearch = !debouncedSearch ||
      t.ticket_code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (t.product?.name || t.product_name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (t.customer?.full_name || t.customer_name || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    return matchStatus && matchSearch
  }), [tickets, filterStatus, debouncedSearch])

  // Scope theo US-03: chỉ staff/admin tiếp nhận phiếu (customer tạo qua MyTickets)
  const canCreate = ['admin', 'staff'].includes(user?.role)

  return (
    <Layout pageId="tickets">
      <div className="app-page space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="app-page-title">
              Phiếu bảo hành
            </h1>
            <p className="app-page-subtitle">Theo dõi, phân loại và xử lý các yêu cầu bảo hành</p>
          </div>
          {canCreate && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--brand-600)', boxShadow: '0 7px 18px rgba(79,70,229,0.2)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tạo phiếu mới
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="app-panel p-4 flex flex-col gap-4">
          <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Tìm theo mã phiếu, sản phẩm, khách hàng..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filterStatus === s ? 'var(--brand-50)' : 'transparent',
                  color: filterStatus === s ? 'var(--brand-700)' : 'var(--text-muted)',
                }}>
                {s === 'all' ? `Tất cả (${tickets.length})` : `${getStatusConfig(s).label} (${tickets.filter(ticket => ticket.status === s).length})`}
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Table */}
        <div className="app-panel overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <h2 className="app-panel-heading">Danh sách phiếu bảo hành</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>Hiển thị {filtered.length} trên tổng số {tickets.length} phiếu</p>
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: 'code',
                header: 'Mã phiếu',
                cellClassName: 'font-semibold mono text-xs',
                render: (t) => <span style={{ color: 'var(--brand-700)' }}>{t.ticket_code}</span>,
              },
              {
                key: 'product',
                header: 'Sản phẩm',
                cellClassName: 'text-sm max-w-40 truncate',
                render: (t) => (
                  <>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {t.product?.name || t.product_name || `Sản phẩm #${t.product_id}`}
                    </span>
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
                      {t.product?.serial_number || ''}
                    </span>
                  </>
                ),
              },
              {
                key: 'customer',
                header: 'Khách hàng',
                cellClassName: 'font-medium',
                render: (t) => (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {t.customer?.full_name || `Khách hàng #${t.customer_id}`}
                  </span>
                ),
              },
              {
                key: 'issue',
                header: 'Vấn đề',
                cellClassName: 'max-w-48 truncate text-xs',
                render: (t) => (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {translateIssueCategory(t.ai_classification)
                      || t.issue_description?.slice(0, 48)
                      || '—'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Trạng thái',
                render: (t) => <StatusPill status={t.status} />,
              },
              {
                key: 'warranty',
                header: 'Bảo hành',
                render: (t) => (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      background: t.within_warranty === 'YES' ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: t.within_warranty === 'YES' ? 'var(--success-text)' : 'var(--danger-text)',
                    }}
                  >
                    {t.within_warranty === 'YES' ? 'Còn BH' : 'Hết BH'}
                  </span>
                ),
              },
            ]}
            rows={filtered}
            loading={loading}
            onRowClick={(t) => navigate(`/tickets/${t.id}`)}
            minWidth={860}
            empty={{
              icon: '📋',
              title: tickets.length === 0 ? 'Chưa có phiếu bảo hành nào' : 'Không tìm thấy phiếu phù hợp',
              description: tickets.length === 0
                ? 'Tạo phiếu đầu tiên để bắt đầu theo dõi bảo hành.'
                : 'Thử từ khoá khác hoặc đổi bộ lọc trạng thái.',
            }}
          />
        </div>
      </div>

      <CreateTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); load() }}
      />
    </Layout>
  )
}

function translateIssueCategory(category) {
  const labels = {
    // Error code taxonomy mới (mục 5.1 AI-CHATBOT-USER-STORIES.md)
    screen_black: 'Màn hình đen / Không lên nguồn',
    screen_flicker: 'Màn hình nhấp nháy / Sọc',
    overheat: 'Quá nhiệt / Tắt đột ngột',
    keyboard: 'Bàn phím / Phím không hoạt động',
    audio: 'Loa / Micro / Âm thanh',
    water: 'Vào nước / Dính nước',
    storage: 'Ổ cứng / Lưu trữ',
    battery: 'Pin / Sạc',
    software: 'Lỗi phần mềm / Hệ điều hành',
    port: 'Cổng kết nối',
    other: 'Lỗi chưa xác định',
    // Legacy categories (dữ liệu seed cũ)
    HARDWARE: 'Lỗi phần cứng',
    NETWORK: 'Lỗi kết nối mạng',
    PHYSICAL: 'Hư hỏng vật lý',
    POWER: 'Lỗi nguồn điện',
    SOFTWARE: 'Lỗi phần mềm',
  }
  return labels[category] || category
}
