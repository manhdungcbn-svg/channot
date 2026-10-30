// ============================================
// FILTER CHIPS COMPONENT
// Reusable filter chips
// ============================================

function FilterChips({ 
  options,
  value,
  onChange,
  label = null,
  showAll = true,
  allLabel = 'Tất cả',
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {label && (
        <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
          {label}
        </span>
      )}
      
      <div 
        className="flex gap-1 p-1 rounded-xl"
        style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
      >
        {showAll && (
          <button
            onClick={() => onChange(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: value === null ? '#1A3A6B' : 'transparent',
              color: value === null ? '#FFFFFF' : '#6B7280',
            }}
          >
            {allLabel}
          </button>
        )}
        
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: value === option.value ? '#1A3A6B' : 'transparent',
              color: value === option.value ? '#FFFFFF' : '#6B7280',
            }}
          >
            {option.icon && (
              <span className="inline-flex items-center gap-1">
                {option.icon}
                {option.label}
              </span>
            )}
            {!option.icon && option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default FilterChips
