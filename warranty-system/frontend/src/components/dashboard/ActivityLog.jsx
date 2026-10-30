import { getStatusConfig } from '../../config/statusConfig'

// Danh sách hoạt động gần đây từ ticket, sort theo thời gian, lấy 8 mục mới nhất.

function formatRelativeTime(input) {
  try {
    const d = new Date(input)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'Vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  } catch {
    return ''
  }
}

function buildItems(tickets) {
  return tickets
    .map(t => {
      const agent = t.technician?.full_name || t.staff_name || 'Hệ thống'
      const cfg = getStatusConfig(t.status)
      return {
        id: t.id,
        ticket: t.ticket_code,
        product: t.product?.name || t.product_name,
        agent,
        action: cfg ? `chuyển sang ${cfg.label.toLowerCase()}` : 'cập nhật phiếu',
        color: cfg?.color || 'var(--text-muted)',
        time: t.updated_at || t.created_at,
      }
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8)
}

export default function ActivityLog({ tickets }) {
  const items = buildItems(tickets)

  if (items.length === 0) {
    return (
      <div className="app-panel p-5">
      <h3 className="app-panel-heading mb-4 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Hoạt động gần đây
        </h3>
        <div className="text-center py-6">
          <div className="text-2xl mb-1">📋</div>
          <p className="text-xs" style={{ color: 'var(--text-light)' }}>Chưa có hoạt động nào</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-panel overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h3 className="app-panel-heading flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Hoạt động gần đây
        </h3>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
          {items.length} sự kiện
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
        {items.map(item => (
          <div key={item.id} className="px-5 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{item.agent}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.action}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--info)' }}>{item.ticket}</span>
              </div>
              {item.product && (
                <p className="text-xs truncate" style={{ color: 'var(--text-light)' }}>{item.product}</p>
              )}
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-light)' }}>{formatRelativeTime(item.time)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}