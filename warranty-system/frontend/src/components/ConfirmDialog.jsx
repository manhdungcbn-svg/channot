// ============================================
// CONFIRM DIALOG COMPONENT
// Reusable confirmation modal
// ============================================

function ConfirmDialog({ 
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger', // danger | warning | info | success
  loading = false,
  icon = null,
}) {
  if (!isOpen) return null
  
  const variantConfig = {
    danger: {
      bgColor: '#FEE2E2',
      borderColor: '#FECACA',
      iconBg: '#EF4444',
      iconColor: '#FFFFFF',
      buttonColor: '#DC2626',
      buttonHover: '#B91C1C',
    },
    warning: {
      bgColor: '#FEF3C7',
      borderColor: '#FCD34D',
      iconBg: '#F59E0B',
      iconColor: '#FFFFFF',
      buttonColor: '#D97706',
      buttonHover: '#B45309',
    },
    info: {
      bgColor: '#DBEAFE',
      borderColor: '#93C5FD',
      iconBg: '#3B82F6',
      iconColor: '#FFFFFF',
      buttonColor: '#2563EB',
      buttonHover: '#1D4ED8',
    },
    success: {
      bgColor: '#D1FAE5',
      borderColor: '#6EE7B7',
      iconBg: '#10B981',
      iconColor: '#FFFFFF',
      buttonColor: '#059669',
      buttonHover: '#047857',
    },
  }
  
  const config = variantConfig[variant]
  
  const DefaultIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div 
        className="rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
        style={{ 
          backgroundColor: '#FFFFFF',
          animation: 'contentFadeUp 0.2s ease-out both'
        }}
      >
        {/* Header */}
        <div 
          className="p-6 flex items-start gap-4"
          style={{ backgroundColor: config.bgColor, borderBottom: `1px solid ${config.borderColor}` }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: config.iconBg }}
          >
            {icon ? icon : DefaultIcon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: '#1F2937' }}>
              {title}
            </h3>
            {description && (
              <p className="text-sm mt-1" style={{ color: '#4B5563' }}>
                {description}
              </p>
            )}
          </div>
          {!loading && (
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ 
              backgroundColor: '#F3F4F6',
              color: '#4B5563',
              border: '1px solid #E5E7EB',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ 
              backgroundColor: loading ? '#9CA3AF' : config.buttonColor,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Đang xử lý...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
