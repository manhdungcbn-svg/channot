// Thẻ thống kê đơn lẻ dùng ở Dashboard.
// Prop: { label, value, unit, color, bg, icon }

export default function StatCard({ label, value, unit, color, bg, icon }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5" style={{ background: '#FFFFFF', border: '1px solid #E7E9F1', boxShadow: '0 4px 14px rgba(25,27,42,0.035)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
          {icon}
        </div>
        <span className="w-2 h-2 rounded-full" style={{ background: color, opacity: 0.65 }} />
      </div>
      <div className="text-3xl font-bold mb-1 tracking-tight" style={{ fontFamily: 'DM Sans, sans-serif', color: '#191B2A' }}>
        {value}<span className="text-sm font-medium ml-2" style={{ color: '#9A9CAD' }}>{unit}</span>
      </div>
      <div className="text-sm font-medium" style={{ color: '#73768A' }}>{label}</div>
    </div>
  )
}