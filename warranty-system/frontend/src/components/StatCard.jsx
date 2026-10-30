// ============================================
// STAT CARD COMPONENT
// Thẻ thống kê dùng chung cho Dashboard và các trang khác.
//
// Gộp từ 2 bản trùng lặp trước đây:
//   - components/StatCard.jsx         (bản đầy đủ: trend, onClick)
//   - components/dashboard/StatCard.jsx (bản rút gọn: color + bg)
//
// Prop:
//   label, value, unit, icon, color, bg|bgColor, trend, onClick, className
// ============================================

function StatCard({
  label,
  value,
  unit = '',
  icon,
  color = 'var(--brand-700)',
  bgColor,
  bg,          // alias của bgColor (tương thích ngược)
  trend = null, // { value: number, label: string } — positive = tăng, negative = giảm
  onClick = null,
  className = '',
}) {
  const CardWrapper = onClick ? 'button' : 'div'
  const iconBg = bgColor || bg || 'var(--brand-50)'

  return (
    <CardWrapper
      onClick={onClick}
      className={`
        rounded-2xl p-4 sm:p-5 text-left transition-all w-full
        ${onClick ? 'cursor-pointer hover:shadow-card' : 'hover:-translate-y-0.5'}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between mb-4 gap-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg, color }}
        >
          {icon}
        </div>

        {trend && (
          <div
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
            style={{
              backgroundColor: trend.value >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: trend.value >= 0 ? 'var(--success-text)' : 'var(--danger-text)',
            }}
          >
            {trend.value >= 0 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div
        className="text-3xl font-bold mb-1 tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
        {unit && (
          <span className="text-sm font-medium ml-2" style={{ color: 'var(--text-light)' }}>
            {unit}
          </span>
        )}
      </div>

      <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>

      {trend && trend.label && (
        <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
          {trend.label}
        </div>
      )}
    </CardWrapper>
  )
}

export default StatCard
