import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { ticketService, customerService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, StatCard } from '../components'
import StatusChangeModal from '../components/StatusChangeModal'
import { getStatusConfig, STATUSES } from '../config/statusConfig'

/** Trích thông báo lỗi từ response của axios (có thể là string hoặc object). */
function getErrorMessage(err, fallback) {
  const data = err?.response?.data
  if (typeof data === 'string') return data
  return data?.detail || data?.error?.message || fallback
}

const TABLES = { status: STATUSES }
const STATUS_FLOW = ['RECEIVED', 'INSPECTION', 'REPAIRING', 'COMPLETED']

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

function StatusFlowSteps({ statuses, currentIdx }) {
  return (
    <div className="flex items-center gap-0">
      {statuses.map((s, i) => {
        const cfg = TABLES.status[s]
        const done = i <= currentIdx
        const current = i === currentIdx
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: done ? 'var(--brand-700)' : 'var(--border)',
                  color: done ? 'var(--brand-fg)' : 'var(--text-light)',
                  border: current ? '2px solid var(--info)' : 'none'
                }}>
                {done && i < currentIdx ? '✓' : i + 1}
              </div>
              <div className="text-xs mt-1 whitespace-nowrap"
                style={{ color: done ? 'var(--brand-700)' : 'var(--text-light)', fontWeight: current ? 600 : 400 }}>
                {cfg?.label || s}
              </div>
            </div>
            {i < statuses.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mb-4" style={{ background: i < currentIdx ? 'var(--brand-700)' : 'var(--border)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function InfoBlock({ title, children }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-light)' }}>{title}</div>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>{children}</div>
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between px-4 py-2.5 border-b last:border-0 gap-3" style={{ borderColor: 'var(--border-light)' }}>
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-light)' }}>{label}</span>
      <span className={`text-xs text-right ${mono ? 'mono' : ''}`} style={{ color: 'var(--text-secondary)' }}>{value || '—'}</span>
    </div>
  )
}

export default function TicketDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
    const [technicians, setTechnicians] = useState([])
  const [busy, setBusy] = useState(false)
  // Trạng thái đang chờ xác nhận chuyển trạng thái (mở modal)
  const [pendingStatus, setPendingStatus] = useState(null)
  const navigate = useNavigate()
  const currentStatusCfg = getStatusConfig(ticket?.status)

  function load() {
    ticketService.get(id)
      .then(setTicket)
      .catch(err => {
        toast.error(getErrorMessage(err, 'Không tải được phiếu.'))
        navigate('/tickets')
      })
  }

  useEffect(() => {
    load()
    if (['admin', 'staff'].includes(user?.role)) {
      customerService.technicians()
        .then(setTechnicians)
        .catch(err => {
          toast.error(getErrorMessage(err, 'Không tải được danh sách kỹ thuật viên.'))
        })
    }
  }, [id])

  /** Mở modal xác nhận chuyển trạng thái. */
  function changeStatus(newStatus) {
    setPendingStatus(newStatus)
  }

  /** Thực thi chuyển trạng thái sau khi modal xác nhận. */
  async function confirmStatusChange({ note, cost }) {
    const target = pendingStatus
    if (!target) return
    setBusy(true)
    try {
      const updated = await ticketService.status(id, {
        new_status: target,
        action_note: note,
        repair_cost: cost || 0,
      })
      setTicket((t) => ({ ...t, ...updated }))
      setPendingStatus(null)
      toast.success(`Đã chuyển sang "${getStatusConfig(target)?.label || target}"`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lỗi cập nhật trạng thái'))
    } finally {
      setBusy(false)
    }
  }

  async function assign(techId) {
    setBusy(true)
    try {
      const updated = await ticketService.assign(id, techId)
      setTicket((t) => ({ ...t, ...updated }))
      toast.success('Đã phân công kỹ thuật viên')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Phân công thất bại'))
    } finally {
      setBusy(false)
    }
  }

  async function summarize() {
    setBusy(true)
    try {
      const { summary } = await ticketService.summarize(id)
      setTicket((t) => ({ ...t, ai_summary: summary }))
      toast.success('AI đã tóm tắt lịch sử')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Tóm tắt thất bại'))
    } finally {
      setBusy(false)
    }
  }

  async function pay() {
    setBusy(true)
    try {
      const r = await ticketService.pay(id)
      toast.success(`Thanh toán thành công. Số dư còn lại: ${Number(r.balance_after).toLocaleString('vi-VN')} đồng`)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thanh toán thất bại'))
    } finally {
      setBusy(false)
    }
  }

  if (!ticket) return (
    <Layout pageId="tickets">
      <div className="app-page text-center" style={{ color: 'var(--text-muted)' }}>Đang tải thông tin phiếu...</div>
    </Layout>
  )

  const transitions = {
    RECEIVED: ['INSPECTION', 'REJECTED'],
    INSPECTION: ['REPAIRING', 'REJECTED'],
    REPAIRING: ['COMPLETED', 'REJECTED'],
  }[ticket.status] || []
  const currentIdx = STATUS_FLOW.indexOf(ticket.status)
  const canChange = ['admin', 'staff', 'technician'].includes(user?.role)
  const canPay = ticket.within_warranty === 'NO' && ticket.payment_status === 'UNPAID'

  return (
    <Layout pageId="tickets">
      <div className="app-page space-y-6">
        <Link to="/tickets" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--info)' }}>
          ← Quay lại danh sách phiếu
        </Link>

        {/* Ticket header */}
        <div className="app-panel p-5">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold mono" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--brand-700)' }}>
                  {ticket.ticket_code}
                </h1>
                <StatusBadge variant={ticket.status?.toLowerCase()} label={currentStatusCfg?.label || ticket.status} />
                {ticket.ai_classification && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1" style={{ background: 'var(--info-bg)', color: 'var(--info-text)' }}>
                    🤖 {ticket.ai_classification}
                  </span>
                )}
                <StatusBadge
                  variant={ticket.within_warranty === 'YES' ? 'success' : 'error'}
                  label={ticket.within_warranty === 'YES' ? 'Còn hạn bảo hành' : 'Hết hạn bảo hành'}
                />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{ticket.issue_description}</p>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{ color: 'var(--text-light)' }}>Chi phí sửa chữa</div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}>
                {Number(ticket.repair_cost || 0).toLocaleString('vi-VN')} đ
              </div>
              <div className="mt-1">
                <StatusBadge
                  variant={ticket.payment_status === 'PAID' ? 'success' : 'warning'}
                  label={ticket.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                />
              </div>
            </div>
          </div>

          {/* Progress */}
          {ticket.status !== 'REJECTED' && (
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <StatusFlowSteps statuses={STATUS_FLOW} currentIdx={currentIdx} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Info columns */}
          <div className="space-y-5">
            <InfoBlock title="Thông tin sản phẩm">
              <InfoRow label="Sản phẩm" value={ticket.product?.name} />
              <InfoRow label="Serial" value={ticket.product?.serial_number} mono />
              <InfoRow label="Danh mục" value={ticket.product?.category} />
                <InfoRow label="Ngày sản xuất" value={ticket.product?.manufacture_date ? new Date(ticket.product.manufacture_date).toLocaleDateString('vi-VN') : '—'} />
              <InfoRow label="Bảo hành" value={`${ticket.product?.warranty_months || 12} tháng`} />
            </InfoBlock>

            <InfoBlock title="Thông tin khách hàng">
              <InfoRow label="Họ tên" value={ticket.customer?.full_name} />
              <InfoRow label="Email" value={ticket.customer?.email} />
              <InfoRow label="Điện thoại" value={ticket.customer?.phone} mono />
            </InfoBlock>

            <InfoBlock title="Thông tin xử lý">
              <InfoRow label="Kỹ thuật viên" value={ticket.technician?.full_name || 'Chưa phân công'} />
              <InfoRow label="Phân loại lỗi AI" value={ticket.ai_classification || 'Chưa phân loại'} />
              {ticket.warranty_check_reason && <InfoRow label="Lý do BH" value={ticket.warranty_check_reason} />}
            </InfoBlock>
          </div>

          {/* Actions + history */}
          <div className="space-y-5">
            {/* Action buttons */}
            {canChange && (
              <div className="app-panel p-5">
                <div className="app-panel-heading mb-3">Thao tác xử lý</div>
                <div className="space-y-3">
                  {['admin', 'staff'].includes(user?.role) && technicians.length > 0 && (
                    <div>
                      <div className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Phân công kỹ thuật viên:</div>
                      <div className="flex gap-2 flex-wrap">
                        {technicians.map(t => (
                          <button key={t.id} onClick={() => assign(t.id)} disabled={busy}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: ticket.technician_id === t.id ? 'var(--brand-50)' : 'var(--bg-card)' }}>
                            {t.full_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {transitions.length > 0 && (
                    <div>
                      <div className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Chuyển trạng thái:</div>
                      <div className="flex gap-2 flex-wrap">
                        {transitions.map(ns => (
                          <button key={ns} onClick={() => changeStatus(ns)} disabled={busy}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                            style={{ background: 'var(--brand-600)', opacity: busy ? 0.6 : 1 }}>
                            → {getStatusConfig(ns)?.label || ns}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={summarize} disabled={busy}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                    style={{ background: 'var(--brand-600)', opacity: busy ? 0.6 : 1 }}>
                    🤖 Tóm tắt lịch sử (AI)
                  </button>
                  {canPay && (
                    <button onClick={pay} disabled={busy}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{ background: 'var(--success)', opacity: busy ? 0.6 : 1 }}>
                      Thanh toán {Number(ticket.repair_cost || 0).toLocaleString('vi-VN')} đ
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* AI summary */}
            {ticket.ai_summary && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: 'var(--info-text)' }}>📋</span>
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--info-text)' }}>Tóm tắt AI</div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--info-text)' }}>{ticket.ai_summary}</p>
              </div>
            )}

            {/* Progress message */}
            {ticket.ai_progress_message && (
              <div className="app-panel p-4">
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>📱 Tin nhắn cho khách hàng</div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ticket.ai_progress_message}</p>
              </div>
            )}

            {/* History */}
            <div className="app-panel p-5">
              <div className="app-panel-heading mb-4">Lịch sử xử lý</div>
              <div className="space-y-3">
                {(ticket.history || []).map((h, i) => (
                  <div key={h.id || i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>{i + 1}</div>
                      {i < ticket.history.length - 1 && (
                        <div className="w-0.5 flex-1 mt-1" style={{ background: 'var(--border)', minHeight: 8 }} />
                      )}
                    </div>
                    <div className="pb-3 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge
                          variant={h.status_to?.toLowerCase()}
                          label={getStatusConfig(h.status_to)?.label || h.status_to}
                        />
                        <span className="text-xs mono" style={{ color: 'var(--text-light)' }}>
                          {new Date(h.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{h.action_note}</p>
                      {h.technician && <p className="text-xs mt-1 font-medium" style={{ color: 'var(--brand-700)' }}>KTV: {h.technician.full_name}</p>}
                    </div>
                  </div>
                ))}
                {(!ticket.history || ticket.history.length === 0) && (
                  <p className="text-sm text-center" style={{ color: 'var(--text-light)' }}>Chưa có lịch sử xử lý.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal xác nhận chuyển trạng thái */}
        <StatusChangeModal
          isOpen={Boolean(pendingStatus)}
          newStatus={pendingStatus}
          busy={busy}
          onClose={() => setPendingStatus(null)}
          onSubmit={confirmStatusChange}
        />
      </div>
    </Layout>
  )
}
