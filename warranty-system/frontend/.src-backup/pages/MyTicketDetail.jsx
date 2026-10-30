import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ticketService } from '../services/services'
import { PageHeader } from '../components'
import { getStatusConfig, STATUSES } from '../config/statusConfig'

function StatusPill({ status }) {
  const cfg = getStatusConfig(status)
  if (!cfg) return <span className="text-xs">{status}</span>
  return (
    <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function TimelineStep({ status, currentStatus, historyItem }) {
  const cfg = STATUSES[status]
  if (!cfg) return null
  const order = ['RECEIVED', 'INSPECTION', 'REPAIRING', 'COMPLETED']
  const currentIdx = order.indexOf(currentStatus)
  const thisIdx = order.indexOf(status)
  const isDone = thisIdx <= currentIdx
  const isCurrent = thisIdx === currentIdx

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isDone ? cfg.color : '#E2E8F0',
            color: '#FFFFFF',
            border: isCurrent ? `3px solid ${cfg.color}` : 'none',
          }}>
          {isDone ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <div className="w-2 h-2 rounded-full" style={{ background: '#9A9CAD' }} />
          )}
        </div>
        {status !== 'COMPLETED' && <div className="w-0.5 h-12" style={{ background: isDone ? cfg.color : '#E2E8F0' }} />}
      </div>
      <div className="flex-1 pb-4">
        <div className="text-sm font-semibold" style={{ color: isDone ? '#0F1929' : '#94A3B8' }}>
          {cfg.label}
        </div>
        {historyItem && (
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>{historyItem.action_note}</p>
        )}
        {historyItem && (
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
            {new Date(historyItem.created_at).toLocaleString('vi-VN')}
          </p>
        )}
      </div>
    </div>
  )
}

export default function MyTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    ticketService.get(id)
      .then(setTicket)
      .catch(err => setError(err.response?.data?.detail || 'Không tải được phiếu.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Layout pageId="my-tickets">
        <div className="app-page">
          <div className="rounded-2xl p-6 animate-pulse" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
            <div className="h-6 rounded mb-3" style={{ background: '#F1F5F9', width: '30%' }} />
            <div className="h-4 rounded mb-2" style={{ background: '#F1F5F9', width: '60%' }} />
            <div className="h-4 rounded" style={{ background: '#F1F5F9', width: '50%' }} />
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !ticket) {
    return (
      <Layout pageId="my-tickets">
        <div className="app-page">
          <div className="rounded-xl p-4 text-sm"
            style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
            {error || 'Không tìm thấy phiếu'}
          </div>
          <button onClick={() => navigate('/my-tickets')}
            className="mt-4 px-4 py-2 rounded-xl text-sm"
            style={{ background: '#EEF4FF', color: '#2563EB' }}>
            ← Quay lại danh sách
          </button>
        </div>
      </Layout>
    )
  }

  const order = ['RECEIVED', 'INSPECTION', 'REPAIRING', 'COMPLETED']
  const isRejected = ticket.status === 'REJECTED'
  const history = ticket.history || []

  return (
    <Layout pageId="my-tickets">
      <div className="app-page space-y-6">
        <div>
          <Link to="/my-tickets"
            className="text-xs font-medium inline-flex items-center gap-1 mb-2"
            style={{ color: '#2563EB' }}>
            ← Quay lại danh sách
          </Link>
          <PageHeader title={`Phiếu ${ticket.ticket_code}`}
            subtitle={`Tạo ngày ${new Date(ticket.created_at).toLocaleString('vi-VN')}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#0F1929' }}>Thông tin sản phẩm</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748B' }}>Tên sản phẩm</span>
                  <span className="font-semibold" style={{ color: '#0F1929' }}>{ticket.product?.name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748B' }}>Serial</span>
                  <span className="font-mono text-xs" style={{ color: '#1A3A6B' }}>{ticket.product?.serial_number || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748B' }}>Danh mục</span>
                  <span style={{ color: '#0F1929' }}>{ticket.product?.category || '—'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#0F1929' }}>Mô tả sự cố</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{ticket.issue_description}</p>
            </div>

            {ticket.ai_progress_message && (
              <div className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #F0F9FF 100%)', border: '1px solid #BFDBFE' }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                    <path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z"/>
                    <rect x="4" y="8" width="16" height="12" rx="2"/>
                  </svg>
                  <h3 className="text-sm font-semibold" style={{ color: '#1A3A6B' }}>Cập nhật từ hệ thống</h3>
                </div>
                <p className="text-sm" style={{ color: '#374151' }}>{ticket.ai_progress_message}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#0F1929' }}>Trạng thái</h3>
              <div className="mb-4"><StatusPill status={ticket.status} /></div>

              {isRejected ? (
                <div className="text-sm" style={{ color: '#991B1B' }}>
                  Phiếu đã bị từ chối bảo hành.
                </div>
              ) : (
                <div className="space-y-1">
                  {order.map(s => (
                    <TimelineStep key={s} status={s}
                      currentStatus={ticket.status}
                      historyItem={history.find(h => h.status_to === s)} />
                  ))}
                </div>
              )}
            </div>

            {ticket.technician && (
              <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#0F1929' }}>Kỹ thuật viên</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
                    style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                    {ticket.technician.full_name?.charAt(0) || 'K'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#0F1929' }}>{ticket.technician.full_name}</div>
                    <div className="text-xs" style={{ color: '#94A3B8' }}>{ticket.technician.email}</div>
                  </div>
                </div>
              </div>
            )}

            {ticket.repair_cost && Number(ticket.repair_cost) > 0 && (
              <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#0F1929' }}>Chi phí sửa chữa</h3>
                <div className="text-2xl font-bold" style={{ color: '#0F1929' }}>
                  {Number(ticket.repair_cost).toLocaleString('vi-VN')}đ
                </div>
                <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                  Trạng thái thanh toán: {ticket.payment_status}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}