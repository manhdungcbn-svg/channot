import { STATUSES } from '../../config/statusConfig'

// Thanh phân bổ trạng thái phiếu (5 status). Đếm số lượng theo từng status.

export default function StatusProgressBar({ tickets }) {
  const groups = Object.keys(STATUSES).filter(k => k !== 'WAITING_PARTS' && k !== 'DELIVERED')
  const total = tickets.length

  return (
    <div className="space-y-3">
      {groups.map(key => {
        const count = tickets.filter(t => t.status === key).length
        const pct = total > 0 ? count / total * 100 : 0
        const c = STATUSES[key]
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span style={{ color: '#374151' }}>{c.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium" style={{ color: c.color }}>{count}</span>
                <span className="font-medium" style={{ color: '#94A3B8' }}>({pct.toFixed(0)}%)</span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: c.color }}>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}