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
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      )}
      
      <div 
        className="flex gap-1 p-1 rounded-xl"
        style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
      >
        {showAll && (
          <button
            onClick={() => onChange(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: value === null ? 'var(--brand-700)' : 'transparent',
              color: value === null ? 'var(--brand-fg)' : 'var(--text-muted)',
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
              backgroundColor: value === option.value ? 'var(--brand-700)' : 'transparent',
              color: value === option.value ? 'var(--brand-fg)' : 'var(--text-muted)',
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
