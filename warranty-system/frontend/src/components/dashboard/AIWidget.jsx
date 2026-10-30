/**
 * Widget trạng thái AI — hiển thị các chỉ số THẬT được tính từ dữ liệu phiếu.
 *
 * Trước đây widget hiển thị "Chế độ mô phỏng" + "96% chỉ số minh họa" là số
 * bịa — gây mất niềm tin khi demo. Nay mọi con số đều suy ra từ `tickets`.
 */

// Ngưỡng SLA (giờ) để tính "đúng hạn" — khớp với quy ước nghiệp vụ.
const SLA_HOURS = 72

function hoursSince(iso) {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return (Date.now() - t) / 36e5
}

export default function AIWidget({ tickets = [] }) {
  const total = tickets.length
  const classified = tickets.filter((t) => t.ai_classification).length
  const aiRate = total > 0 ? Math.round((classified / total) * 100) : 0

  const completed = tickets.filter((t) => t.status === 'COMPLETED').length
  const completedRate = total > 0 ? Math.round((completed / total) * 100) : 0

  // Phiếu hoàn tất đúng hạn (trong SLA) — chỉ tính phiếu đã xong
  const finished = tickets.filter((t) => t.status === 'COMPLETED' && t.created_at)
  const onTime = finished.filter((t) => {
    const h = hoursSince(t.created_at)
    return h !== null && h <= SLA_HOURS
  }).length
  const onTimeRate = finished.length > 0 ? Math.round((onTime / finished.length) * 100) : 0

  const insights = [
    {
      label: 'Phân loại tự động',
      value: `${aiRate}%`,
      desc: `${classified}/${total} phiếu được AI phân loại`,
      bar: aiRate,
      color: 'var(--info)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2">
          <path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z"/>
          <rect x="4" y="8" width="16" height="12" rx="2"/>
          <path d="M9 12h.01M12 12h.01M15 12h.01"/>
        </svg>
      ),
    },
    {
      label: 'Đã hoàn tất',
      value: `${completed}`,
      desc: `${completedRate}% tổng số phiếu`,
      bar: completedRate,
      color: 'var(--success)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
    },
    {
      label: `Xử lý đúng hạn (≤${SLA_HOURS}h)`,
      value: `${onTimeRate}%`,
      desc: finished.length > 0 ? `${onTime}/${finished.length} phiếu hoàn tất` : 'Chưa có phiếu hoàn tất',
      bar: onTimeRate,
      color: 'var(--accent-violet)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
  ]

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--brand-dark)', boxShadow: 'var(--brand-shadow-lg)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(125,211,252,0.2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2">
              <path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z"/>
              <rect x="4" y="8" width="16" height="12" rx="2"/>
              <path d="M9 12h.01M12 12h.01M15 12h.01"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#fff' }}>Trợ lý bảo hành</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Số liệu theo thời gian thực
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
          <span className="text-xs" style={{ color: 'var(--success-text)' }}>Đang hoạt động</span>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${insight.color}22` }}
                >
                  {insight.icon}
                </div>
                <span className="text-xs truncate" style={{ color: '#fff' }}>{insight.label}</span>
              </div>
              <span className="text-sm font-bold flex-shrink-0 ml-2" style={{ color: insight.color }}>
                {insight.value}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${insight.bar}%`, background: insight.color }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{insight.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
