// ============================================
// CREATE TICKET MODAL - MAIN COMPONENT
// Orchestrates all steps
// ============================================

import { useState, useEffect } from 'react'
import { ticketService } from '../../services/services'

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

// Step configuration
const STEPS = [
  { id: 1, label: 'Khách hàng', shortLabel: 'KH' },
  { id: 2, label: 'Sản phẩm', shortLabel: 'SP' },
  { id: 3, label: 'Vấn đề', shortLabel: 'VS' },
  { id: 4, label: 'Xác nhận', shortLabel: 'XN' },
]

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
                backgroundColor: isCompleted ? '#059669' : isCurrent ? '#4F46E5' : '#E7E9F1',
                color: isCompleted || isCurrent ? '#FFFFFF' : '#9CA3AF',
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
              style={{ color: isCurrent ? '#1F2937' : '#9CA3AF' }}
            >
              {step.label}
            </span>
            
            {/* Connector */}
            {!isLast && (
              <div 
                className="w-8 h-0.5 mx-2"
                style={{ backgroundColor: isCompleted ? '#059669' : '#E7E9F1' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CreateTicketModal({ isOpen, onClose, onCreated, prefillProduct, prefillCustomer }) {
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

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      // Determine starting step based on prefill
      let startStep = 1
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
  }, [isOpen, prefillProduct, prefillCustomer])

  const handleDataUpdate = (updates) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !data.customer) {
      alert('Vui lòng chọn khách hàng')
      return
    }
    if (currentStep === 2 && !data.product) {
      alert('Vui lòng chọn sản phẩm')
      return
    }
    if (currentStep === 3 && (!data.issue_type || !data.description?.trim())) {
      alert('Vui lòng chọn loại sự cố và mô tả chi tiết')
      return
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
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
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error?.message || 'Không thể tạo phiếu bảo hành')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateAnother = () => {
    setCurrentStep(1)
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(25, 27, 42, 0.42)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div 
        className="rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        style={{ 
          backgroundColor: '#FFFFFF',
          border: '1px solid #E7E9F1',
          boxShadow: '0 24px 70px rgba(24, 24, 45, 0.22)',
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F0F1F5' }}
        >
          <div className="flex items-center gap-3">
            {currentStep > 1 && !createdTicket && (
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                style={{ color: '#6B7280' }}
              >
                <ArrowLeftIcon />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#0F1929' }}>
                {createdTicket ? 'Hoàn tất' : 'Tạo phiếu bảo hành'}
              </h2>
              {!createdTicket && (
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  Bước {currentStep} / 4 — {STEPS[currentStep - 1].label}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
            style={{ color: '#6B7280' }}
          >
            <XIcon />
          </button>
        </div>

        {/* Step indicator */}
        {!createdTicket && (
          <div style={{ borderBottom: '1px solid #F0F1F5' }}>
            <StepIndicator currentStep={currentStep} steps={STEPS} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {createdTicket ? (
            <SuccessScreen 
              ticket={createdTicket}
              onClose={onClose}
              onCreateAnother={handleCreateAnother}
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
                />
              )}
              {currentStep === 3 && (
                <Step3Issue
                  data={data}
                  onUpdate={handleDataUpdate}
                />
              )}
              {currentStep === 4 && (
                <Step4Confirm
                  data={data}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer - Next button for steps 1-3 */}
        {!createdTicket && currentStep < 4 && (
          <div 
            className="px-6 py-4"
            style={{ borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
          >
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: '#1A3A6B' }}
            >
              Tiếp tục
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
