// ============================================
// STEPPER COMPONENT
// Reusable step progress indicator
// ============================================

function Stepper({ 
  steps,
  currentStep,
  className = '',
  direction = 'horizontal', // horizontal | vertical
}) {
  const isVertical = direction === 'vertical'
  
  return (
    <div className={`${className} ${isVertical ? 'flex flex-col gap-4' : 'flex items-center gap-2'}`}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        const isPending = stepNumber > currentStep
        
        return (
          <div 
            key={index}
            className={`flex ${isVertical ? 'flex-row gap-4' : 'flex-col items-center flex-1'}`}
          >
            {/* Step indicator */}
            <div 
              className="flex items-center justify-center rounded-full font-semibold transition-all"
              style={{
                width: isVertical ? 32 : 32,
                height: isVertical ? 32 : 32,
                backgroundColor: isCompleted ? 'var(--success)' : isCurrent ? 'var(--brand-700)' : 'var(--border)',
                color: isCompleted || isCurrent ? 'var(--brand-fg)' : 'var(--text-light)',
                boxShadow: isCurrent ? '0 0 0 4px rgba(26, 58, 107, 0.15)' : 'none',
                fontSize: '14px',
              }}
            >
              {isCompleted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                stepNumber
              )}
            </div>
            
            {/* Label */}
            <div 
              className={`${isVertical ? 'flex-1' : 'text-center mt-2'}`}
            >
              <p 
                className="text-xs font-medium"
                style={{ 
                  color: isCompleted ? 'var(--success)' : isCurrent ? 'var(--brand-700)' : 'var(--text-light)' 
                }}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs hidden sm:block" style={{ color: 'var(--text-light)' }}>
                  {step.description}
                </p>
              )}
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className={`${isVertical ? 'w-0.5 h-full absolute left-4' : 'flex-1 h-0.5 mx-2'}`}
                style={{
                  backgroundColor: isCompleted ? 'var(--success)' : 'var(--border)',
                  minWidth: isVertical ? 'auto' : 20,
                  minHeight: isVertical ? 40 : 'auto',
                  position: isVertical ? 'relative' : 'relative',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
