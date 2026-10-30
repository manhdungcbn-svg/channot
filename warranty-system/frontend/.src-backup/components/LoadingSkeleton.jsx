// ============================================
// LOADING SKELETON COMPONENT
// Reusable loading states
// ============================================

function Skeleton({ 
  variant = 'text', // text | circle | card | table-row
  width,
  height,
  className = '',
  style = {}
}) {
  const baseClasses = 'animate-pulse rounded'
  
  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    card: 'rounded-xl',
    'table-row': 'h-12 rounded',
    avatar: 'rounded-full',
    button: 'h-10 rounded-xl',
  }
  
  const defaultStyle = {
    backgroundColor: '#E5E7EB',
    ...style,
  }
  
  if (width) defaultStyle.width = width
  if (height) defaultStyle.height = height
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={defaultStyle}
    />
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" className="flex-1" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="px-4 py-3 flex gap-4 border-b last:border-0"
          style={{ borderColor: '#F1F5F9' }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              variant="text" 
              className="flex-1"
              style={{ 
                opacity: 1 - (rowIndex * 0.1),
                width: colIndex === 0 ? '80%' : '60%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="flex gap-4 mb-4">
        <Skeleton variant="circle" width="48" height="48" />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" height="12" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </div>
      <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #F1F5F9' }}>
        <Skeleton variant="button" className="flex-1" />
        <Skeleton variant="button" className="flex-1" />
      </div>
    </div>
  )
}

// Stats skeleton
export function StatsSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(count, 4)}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <div className="flex justify-between items-start mb-3">
            <Skeleton variant="circle" width="40" height="40" />
          </div>
          <Skeleton variant="text" width="60%" height="28" className="mb-2" />
          <Skeleton variant="text" width="80%" height="14" />
        </div>
      ))}
    </div>
  )
}

// Page skeleton
export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton variant="text" width={200} height="28" className="mb-2" />
          <Skeleton variant="text" width={120} height="14" />
        </div>
        <Skeleton variant="button" width={140} />
      </div>
      
      {/* Stats */}
      <StatsSkeleton count={4} />
      
      {/* Table */}
      <TableSkeleton rows={5} columns={5} />
    </div>
  )
}

// Button loading state
export function ButtonSkeleton({ width = 100 }) {
  return (
    <div 
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl"
      style={{ backgroundColor: '#E5E7EB' }}
    >
      <Skeleton variant="circle" width="16" height="16" />
      <Skeleton variant="text" width={width} height="16" />
    </div>
  )
}

export default Skeleton
