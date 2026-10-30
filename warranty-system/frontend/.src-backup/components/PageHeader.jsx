// ============================================
// PAGE HEADER COMPONENT
// Reusable page header with actions
// ============================================

function PageHeader({
  title,
  subtitle,
  actions = [],
  breadcrumb = [],
  className = '',
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div>
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: '#6B7280' }}>
            {breadcrumb.map((item, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && <span>›</span>}
                {item.href ? (
                  <a 
                    href={item.href}
                    className="hover:underline"
                    style={{ color: '#2563EB' }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        
        {/* Title */}
        <h1 
          className="text-2xl font-bold"
          style={{ 
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: '#0F1929'
          }}
        >
          {title}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.loading || action.disabled}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold 
                transition-all hover:opacity-90
                ${action.variant === 'secondary' ? '' : 'text-white'}
                ${action.loading || action.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={
                action.variant === 'secondary' 
                  ? { 
                      backgroundColor: '#F3F4F6', 
                      color: '#374151',
                      border: '1px solid #E5E7EB'
                    }
                  : { 
                      backgroundColor: '#1A3A6B',
                      boxShadow: '0 2px 8px rgba(26, 58, 107, 0.2)'
                    }
              }
            >
              {action.icon && (
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {action.icon}
                </span>
              )}
              {action.loading ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PageHeader
