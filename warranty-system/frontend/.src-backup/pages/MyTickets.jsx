import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { ticketService } from '../services/services'
import { PageHeader } from '../components'
import { getStatusConfig } from '../config/statusConfig'

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
        (t.product?.name || '').toLowerCase().includes(q) ||
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
        />

        {error && (
          <div className="rounded-xl p-4 text-sm"
            style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        <div className="flex gap-3 flex-wrap items-center">
          <input type="text" placeholder="Tìm theo mã phiếu, sản phẩm, mô tả..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm flex-1 min-w-[240px]"
            style={{ background: '#FFFFFF', border: '1px solid #E7E9F1', color: '#191B2A' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ background: '#FFFFFF', border: '1px solid #E7E9F1', color: '#191B2A' }}>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s ? getStatusConfig(s)?.label || s : 'Tất cả trạng thái'}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-4 animate-pulse"
                style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
                <div className="h-4 rounded mb-2" style={{ background: '#F1F5F9', width: '40%' }} />
                <div className="h-3 rounded" style={{ background: '#F1F5F9', width: '70%' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="app-panel p-12 text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>
              {tickets.length === 0 ? 'Bạn chưa tạo phiếu bảo hành nào' : 'Không tìm thấy phiếu phù hợp'}
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              {tickets.length === 0
                ? 'Khi sản phẩm gặp sự cố, hãy liên hệ nhân viên để tạo phiếu.'
                : 'Thử thay đổi bộ lọc hoặc từ khóa.'}
            </p>
          </div>
        ) : (
          <div className="app-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Mã phiếu', 'Sản phẩm', 'Sự cố', 'Ngày tạo', 'Trạng thái'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase"
                      style={{ color: '#94A3B8' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} onClick={() => navigate(`/my-tickets/${t.id}`)}
                    className="border-t cursor-pointer hover:bg-gray-50"
                    style={{ borderColor: '#F0F1F5' }}>
                    <td className="px-4 py-3.5 font-semibold mono text-xs" style={{ color: '#1A3A6B' }}>
                      {t.ticket_code}
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: '#374151' }}>
                      {t.product?.name || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-sm truncate max-w-xs" style={{ color: '#64748B' }}>
                      {t.issue_description}
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: '#94A3B8' }}>
                      {new Date(t.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3.5"><StatusPill status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}