// Widget trạng thái AI: hiển thị 3 chỉ số thống kê AI trên nền gradient tối.

const INSIGHT_TEMPLATE = [
  { label: 'Phân loại tự động', color: '#2563EB', defaultBar: 0, icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
      <path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z"/>
      <rect x="4" y="8" width="16" height="12" rx="2"/>
      <path d="M9 12h.01M12 12h.01M15 12h.01"/>
    </svg>
  )},
  { label: 'Phiếu đã hoàn tất', color: '#059669', defaultBar: 0, icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )},
  { label: 'Độ chính xác mô phỏng', color: '#7C3AED', defaultBar: 96, icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
]

export default function AIWidget({ tickets }) {
  const classifiedByAI = tickets.filter(t => t.ai_classification).length
  const total = tickets.length
  const aiRate = total > 0 ? Math.round(classifiedByAI / total * 100) : 0
  const completed = tickets.filter(t => t.status === 'COMPLETED').length

  const insights = [
    { ...INSIGHT_TEMPLATE[0], value: `${aiRate}%`, desc: `${classifiedByAI}/${total} phiếu được AI xử lý`, bar: aiRate },
    { ...INSIGHT_TEMPLATE[1], value: `${completed}`, desc: 'Số phiếu đã hoàn tất', bar: total > 0 ? Math.round(completed / total * 100) : 0 },
    { ...INSIGHT_TEMPLATE[2], value: '96%', desc: 'Chỉ số minh họa', bar: 96 },
  ]

  return (
    <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg, #312E81 0%, #4F46E5 58%, #766BF2 100%)', boxShadow: '0 14px 30px rgba(79,70,229,0.17)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(96,165,250,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
              <path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z"/>
              <rect x="4" y="8" width="16" height="12" rx="2"/>
              <path d="M9 12h.01M12 12h.01M15 12h.01"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Trợ lý bảo hành</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.68)' }}>Chế độ mô phỏng</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34D399' }} />
          <span className="text-xs" style={{ color: '#A7F3D0' }}>Sẵn sàng</span>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${insight.color}22` }}>
                  {insight.icon}
                </div>
                <span className="text-xs text-white">{insight.label}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: insight.color }}>{insight.value}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${insight.bar}%`, background: insight.color }} />
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{insight.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}