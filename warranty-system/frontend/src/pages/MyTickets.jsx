import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import { ticketService } from '../services/services'
import { PageHeader } from '../components'
import { getStatusConfig } from '../config/statusConfig'
import CreateTicketModal from '../components/CreateTicket/CreateTicketModal'

function StatusPill({ status }) {
  const cfg = getStatusConfig(status)
  if (!cfg) return <span className="text-xs">{status}</span>
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

export default function MyTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [ticketModal, setTicketModal] = useState({ open: false, product: null })

  useEffect(() => {
    setLoading(true)
    ticketService.list()
      .then(setTickets)
      .catch(err => setError(err.response?.data?.detail || 'Không tải được danh sách phiếu.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let r = tickets
    if (statusFilter) r = r.filter(t => t.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(t =>
        t.ticket_code.toLowerCase().includes(q) ||
        (t.product?.name || t.product_name || '').toLowerCase().includes(q) ||
        t.issue_description.toLowerCase().includes(q)
      )
    }
    return r
  }, [tickets, statusFilter, search])

  const statusOptions = ['', 'RECEIVED', 'INSPECTION', 'REPAIRING', 'COMPLETED', 'REJECTED']

  return (
    <Layout pageId="my-tickets">
      <div className="app-page space-y-6">
        <PageHeader
          title="Phiếu bảo hành của tôi"
          subtitle="Theo dõi trạng thái các phiếu bảo hành bạn đã tạo"
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

        <div className="flex gap-3 flex-wrap items-center">
          <input type="text" placeholder="Tìm theo mã phiếu, sản phẩm, mô tả..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm flex-1 min-w-[240px]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s ? getStatusConfig(s)?.label || s : 'Tất cả trạng thái'}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-4 animate-pulse"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="h-4 rounded mb-2" style={{ background: 'var(--bg-hover)', width: '40%' }} />
                <div className="h-3 rounded" style={{ background: 'var(--bg-hover)', width: '70%' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="app-panel p-12 text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              {tickets.length === 0 ? 'Bạn chưa tạo phiếu bảo hành nào' : 'Không tìm thấy phiếu phù hợp'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-light)' }}>
              {tickets.length === 0
                ? 'Khi sản phẩm gặp sự cố, hãy liên hệ nhân viên để tạo phiếu.'
                : 'Thử thay đổi bộ lọc hoặc từ khóa.'}
            </p>
          </div>
        ) : (
          <div className="app-panel overflow-hidden">
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
                  cellClassName: 'text-sm',
                  render: (t) => (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {t.product?.name || t.product_name || '—'}
                    </span>
                  ),
                },
                {
                  key: 'issue',
                  header: 'Sự cố',
                  cellClassName: 'text-sm truncate max-w-xs',
                  render: (t) => (
                    <span style={{ color: 'var(--text-muted)' }}>{t.issue_description}</span>
                  ),
                },
                {
                  key: 'created',
                  header: 'Ngày tạo',
                  cellClassName: 'text-xs',
                  render: (t) => (
                    <span style={{ color: 'var(--text-light)' }}>
                      {new Date(t.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Trạng thái',
                  render: (t) => <StatusPill status={t.status} />,
                },
              ]}
              rows={filtered}
              onRowClick={(t) => navigate(`/my-tickets/${t.id}`)}
              minWidth={720}
            />
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