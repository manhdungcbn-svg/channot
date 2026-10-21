import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
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
      window.alert(detail)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => tickets.filter(t => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    const matchSearch = !debouncedSearch ||
      t.ticket_code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.product?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.customer?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
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
              style={{ background: '#4F46E5', boxShadow: '0 7px 18px rgba(79,70,229,0.2)' }}>
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
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Tìm theo mã phiếu, sản phẩm, khách hàng..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: '#E7E9F1', background: '#FFFFFF', color: '#191B2A' }} />
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filterStatus === s ? '#EEF2FF' : 'transparent',
                  color: filterStatus === s ? '#4338CA' : '#73768A',
                }}>
                {s === 'all' ? `Tất cả (${tickets.length})` : `${getStatusConfig(s).label} (${tickets.filter(ticket => ticket.status === s).length})`}
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Table */}
        <div className="app-panel overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F0F1F5' }}>
            <div>
              <h2 className="app-panel-heading">Danh sách phiếu bảo hành</h2>
              <p className="text-xs mt-1" style={{ color: '#9A9CAD' }}>Hiển thị {filtered.length} trên tổng số {tickets.length} phiếu</p>
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr style={{ background: '#FAFAFC' }}>
                {['Mã phiếu', 'Sản phẩm', 'Khách hàng', 'Vấn đề', 'Trạng thái', 'Bảo hành'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold tracking-wide" style={{ color: '#85889A' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: '#73768A' }}>Đang tải danh sách phiếu...</td></tr>
                : filtered.length === 0
                ? <tr><td colSpan={6} className="px-4 py-14 text-center text-sm" style={{ color: '#73768A' }}>{tickets.length === 0 ? 'Chưa có phiếu bảo hành nào.' : 'Không tìm thấy phiếu phù hợp.'}</td></tr>
                : filtered.map(ticket => (
                  <tr key={ticket.id} className="border-t cursor-pointer transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#F0F1F5' }}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}>
                    <td className="px-4 py-3.5 font-semibold mono text-xs" style={{ color: '#4338CA' }}>{ticket.ticket_code}</td>
                    <td className="px-4 py-3.5 text-sm max-w-40 truncate" style={{ color: '#41445A' }}><span className="font-medium">{ticket.product?.name || `Sản phẩm #${ticket.product_id}`}</span><span className="block text-xs mt-0.5" style={{ color: '#9A9CAD' }}>{ticket.product?.serial_number || ''}</span></td>
                    <td className="px-4 py-3.5 font-medium" style={{ color: '#41445A' }}>{ticket.customer?.full_name || `Khách hàng #${ticket.customer_id}`}</td>
                    <td className="px-4 py-3.5 max-w-48 truncate text-xs" style={{ color: '#73768A' }}>{translateIssueCategory(ticket.ai_classification) || ticket.issue_description?.slice(0, 48) || '—'}</td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={ticket.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: ticket.within_warranty === 'YES' ? '#D1FAE5' : '#FEE2E2', color: ticket.within_warranty === 'YES' ? '#065F46' : '#991B1B' }}>
                        {ticket.within_warranty === 'YES' ? 'Còn BH' : 'Hết BH'}
                      </span>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          </div>
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
    HARDWARE: 'Lỗi phần cứng',
    NETWORK: 'Lỗi kết nối mạng',
    PHYSICAL: 'Hư hỏng vật lý',
    POWER: 'Lỗi nguồn điện',
    SOFTWARE: 'Lỗi phần mềm',
  }
  return labels[category] || category
}
