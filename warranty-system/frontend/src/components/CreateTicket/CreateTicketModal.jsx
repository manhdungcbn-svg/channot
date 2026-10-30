// ============================================
// CREATE TICKET MODAL - MAIN COMPONENT
// Orchestrates all steps
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ticketService } from '../../services/services'
import { useAuth } from '../../context/AuthContext'
import { isCustomer } from '../../utils/permissions'

// Step components
import Step1Customer from './Step1Customer'
import Step2Product from './Step2Product'
import Step3Issue from './Step3Issue'
import Step4Confirm from './Step4Confirm'
import SuccessScreen from './SuccessScreen'

// Icons
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
)

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// Step configuration — 'roles' dùng để ẩn bước không áp dụng.
const STEPS = [
  { id: 1, label: 'Khách hàng', shortLabel: 'KH', roles: ['admin', 'staff', 'technician'] },
  { id: 2, label: 'Sản phẩm', shortLabel: 'SP', roles: ['admin', 'staff', 'technician', 'customer'] },
  { id: 3, label: 'Vấn đề', shortLabel: 'VS', roles: ['admin', 'staff', 'technician', 'customer'] },
  { id: 4, label: 'Xác nhận', shortLabel: 'XN', roles: ['admin', 'staff', 'technician', 'customer'] },
]

export default function CreateTicketModal({ isOpen, onClose, onCreated, prefillProduct, prefillCustomer }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState({
    customer: null,
    product: null,
    issue_type: '',
    description: '',
    accessories: [],
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState(null)

  // Khách hàng không chọn khách hàng — chính họ là khách của phiếu.
  const customerMode = isCustomer(user)

  // Danh sách bước khả dụng với vai trò hiện tại.
  const visibleSteps = STEPS.filter(s => s.roles.includes(user?.role || 'customer'))
  // Bước "hiển thị" (1..N) → bước thực tế trong STEPS.
  const stepOffset = STEPS.length - visibleSteps.length

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      // Determine starting step based on prefill
      let startStep = customerMode ? 2 : 1
      let initialProduct = null
      let initialCustomer = null

      if (prefillCustomer) {
        initialCustomer = prefillCustomer
        startStep = prefillProduct ? 2 : 2
      }
      if (prefillProduct) {
        initialProduct = prefillProduct
        startStep = Math.min(startStep, 2)
      }

      setCurrentStep(startStep)
      setData({
        customer: initialCustomer,
        product: initialProduct,
        issue_type: '',
        description: '',
        accessories: [],
        notes: '',
      })
      setCreatedTicket(null)
      setSubmitting(false)
    }
  }, [isOpen, prefillProduct, prefillCustomer, customerMode])

  const handleDataUpdate = (updates) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !data.customer) {
      toast.error('Vui lòng chọn khách hàng')
      return
    }
    if (currentStep === 2 && !data.product) {
      toast.error('Vui lòng chọn sản phẩm')
      return
    }
    if (currentStep === 3 && (!data.issue_type || !data.description?.trim())) {
      toast.error('Vui lòng chọn loại sự cố và mô tả chi tiết')
      return
    }

    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, customerMode ? 2 : 1))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        product_id: data.product.id,
        issue_description: data.description?.trim(),
        customer_name: data.customer?.full_name || '',
        customer_email: data.customer?.email || '',
        customer_phone: data.customer?.phone || '',
      }

      const ticket = await ticketService.create(payload)
      setCreatedTicket(ticket)
      onCreated?.(ticket)
      toast.success(`Đã tạo phiếu bảo hành ${ticket.ticket_code}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error?.message || 'Không thể tạo phiếu bảo hành')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateAnother = () => {
    setCurrentStep(customerMode ? 2 : 1)
    setData({
      customer: null,
      product: null,
      issue_type: '',
      description: '',
      accessories: [],
      notes: '',
    })
    setCreatedTicket(null)
  }

  if (!isOpen) return null

  // Vị trí hiển thị của bước hiện tại trong danh sách bước đã lọc.
  const visibleIndex = Math.max(0, currentStep - 1 - stepOffset)
  const currentStepMeta = visibleSteps[visibleIndex] ?? visibleSteps[visibleSteps.length - 1]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(25, 27, 42, 0.42)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div 
        className="rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 70px rgba(24, 24, 45, 0.22)',
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-light)' }}
        >
          <div className="flex items-center gap-3">
            {currentStep > (customerMode ? 2 : 1) && !createdTicket && (
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <ArrowLeftIcon />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {createdTicket ? 'Hoàn tất' : 'Tạo phiếu bảo hành'}
              </h2>
              {!createdTicket && (
                <p className="text-xs" style={{ color: 'var(--text-light)' }}>
                  Bước {visibleIndex + 1} / {visibleSteps.length} — {currentStepMeta?.label}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
          >
            <XIcon />
          </button>
        </div>

        {/* Step indicator */}
        {!createdTicket && (
          <div style={{ borderBottom: '1px solid var(--border-light)' }}>
            <StepIndicator currentStep={currentStep} steps={visibleSteps} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {createdTicket ? (
            <SuccessScreen 
              ticket={createdTicket}
              product={data.product}
              customer={data.customer || user}
              onClose={onClose}
              onCreateAnother={handleCreateAnother}
              isCustomer={customerMode}
            />
          ) : (
            <div className="p-6">
              {currentStep === 1 && (
                <Step1Customer 
                  data={data}
                  onUpdate={handleDataUpdate}
                  prefillCustomer={prefillCustomer}
                />
              )}
              {currentStep === 2 && (
                <Step2Product
                  data={data}
                  onUpdate={handleDataUpdate}
                  customerId={data.customer?.id}
                  prefillProduct={prefillProduct}
                  isCustomer={customerMode}
                />
              )}
              {currentStep === 3 && (
                <Step3Issue
                  data={data}
                  onUpdate={handleDataUpdate}
                  isCustomer={customerMode}
                />
              )}
              {currentStep === 4 && (
                <Step4Confirm
                  data={data}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  isCustomer={customerMode}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer - Next button cho các bước trước bước cuối */}
        {!createdTicket && currentStep < 4 && (
          <div 
            className="px-6 py-4"
            style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)' }}
          >
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: 'var(--brand-700)' }}
            >
              Tiếp tục
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Chỉ báo tiến trình các bước — dùng danh sách bước đã lọc theo vai trò.
 */
function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep
        const isCurrent = step.id === currentStep
        const isLast = index === steps.length - 1
        
        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
              style={{
                backgroundColor: isCompleted ? 'var(--success)' : isCurrent ? 'var(--brand-600)' : 'var(--border)',
                color: isCompleted || isCurrent ? 'var(--brand-fg)' : 'var(--text-light)',
              }}
            >
              {isCompleted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                step.id
              )}
            </div>
            
            {/* Label */}
            <span 
              className="ml-2 text-xs font-medium hidden sm:block"
              style={{ color: isCurrent ? 'var(--text-primary)' : 'var(--text-light)' }}
            >
              {step.label}
            </span>
            
            {/* Connector */}
            {!isLast && (
              <div 
                className="w-8 h-0.5 mx-2"
                style={{ backgroundColor: isCompleted ? 'var(--success)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}