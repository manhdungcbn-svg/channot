// ============================================
// STAT CARD COMPONENT
// Reusable statistics card
// ============================================

function StatCard({
  label,
  value,
  unit = '',
  icon,
  color = '#1A3A6B',
  bgColor = '#EEF4FF',
  trend = null, // { value: number, label: string } - positive = up, negative = down
  onClick = null,
  className = '',
}) {
  const CardWrapper = onClick ? 'button' : 'div'
  
  return (
    <CardWrapper
      onClick={onClick}
      className={`
        rounded-2xl p-5 text-left transition-all w-full
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
      style={{ 
        backgroundColor: '#FFFFFF', 
        border: '1px solid #E5E7EB',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: bgColor, color }}
        >
          {icon}
        </div>
        
        {trend && (
          <div 
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
            style={{ 
              backgroundColor: trend.value >= 0 ? '#D1FAE5' : '#FEE2E2',
              color: trend.value >= 0 ? '#059669' : '#DC2626',
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
        className="text-3xl font-bold mb-1"
        style={{ 
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: '#0F1929'
        }}
      >
        {value}
        {unit && (
          <span className="text-base font-normal ml-1" style={{ color: '#9CA3AF' }}>
            {unit}
          </span>
        )}
      </div>
      
      <div className="text-sm" style={{ color: '#6B7280' }}>
        {label}
      </div>
      
      {trend && trend.label && (
        <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          {trend.label}
        </div>
      )}
    </CardWrapper>
  )
}

export default StatCard
