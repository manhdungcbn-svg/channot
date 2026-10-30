// ============================================
// SEARCH INPUT COMPONENT
// Reusable search with icon
// ============================================

function SearchInput({ 
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  className = '',
  icon = null,
  onClear = null,
  loading = false,
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
        {icon || (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        )}
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all outline-none"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB',
          color: '#1F2937',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#2563EB'
          e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#E5E7EB'
          e.target.style.boxShadow = 'none'
        }}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="4"/>
            <path className="opacity-75" fill="#9CA3AF" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      )}
      
      {!loading && value && (
        <button
          onClick={() => {
            onChange('')
            onClear?.()
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100"
          style={{ color: '#9CA3AF' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default SearchInput
