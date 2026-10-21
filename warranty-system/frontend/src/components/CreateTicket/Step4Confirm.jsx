// ============================================
// CREATE TICKET MODAL - FULL WORKFLOW
// Step 4: Confirmation + Checklist
// ============================================

import { useState } from 'react'
import { getWarrantyStatus, formatWarrantyExpiry, getDaysRemaining } from '../../config/statusConfig'

// Icons
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const CircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
  </svg>
)

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const PackageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

// Issue type labels
const ISSUE_LABELS = {
  not_working: 'Không hoạt động',
  error_code: 'Báo lỗi',
  performance: 'Hoạt động kém',
  physical_damage: 'Hư hỏng vật lý',
  accessory: 'Lỗi phụ kiện',
  other: 'Khác',
}

export default function Step4Confirm({ data, onSubmit, submitting }) {
  const [agreed, setAgreed] = useState(false)
  
  const { customer, product, issue_type, description, accessories, notes } = data

  // Warranty info
  const warrantyInfo = product ? getWarrantyStatus(
    product.manufacture_date,
    product.warranty_months
  ) : null
  
  const expiryDate = product ? formatWarrantyExpiry(
    product.manufacture_date,
    product.warranty_months
  ) : null
  
  const daysLeft = product ? getDaysRemaining(
    product.manufacture_date,
    product.warranty_months
  ) : null

  const isValid = customer && product && issue_type && description?.trim() && agreed
  const isExpired = warrantyInfo === 'EXPIRED'

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit()
  }

  return (
    <div className="space-y-5">
      {/* Confirmation checklist */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold" style={{ color: '#1F2937' }}>
          Kiểm tra thông tin
        </h4>

        {/* Customer info */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-2 mb-2">
            <UserIcon />
            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Khách hàng</span>
          </div>
          <div className="font-semibold" style={{ color: '#1F2937' }}>
            {customer?.full_name}
          </div>
          <div className="text-sm" style={{ color: '#6B7280' }}>
            {customer?.phone}
            {customer?.email && ` • ${customer?.email}`}
          </div>
        </div>

        {/* Product info */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-2 mb-2">
            <PackageIcon />
            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Sản phẩm</span>
            {isExpired && (
              <span 
                className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
              >
                Hết BH
              </span>
            )}
          </div>
          <div className="font-semibold" style={{ color: '#1F2937' }}>
            {product?.name}
          </div>
          <div className="text-sm font-mono" style={{ color: '#6B7280' }}>
            {product?.serial_number}
          </div>
          {expiryDate && (
            <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              Hạn bảo hành: {expiryDate}
              {daysLeft !== null && daysLeft > 0 && (
                <span style={{ color: '#059669' }}> (còn {daysLeft} ngày)</span>
              )}
              {daysLeft !== null && daysLeft <= 0 && (
                <span style={{ color: '#DC2626' }}> (đã hết hạn)</span>
              )}
            </div>
          )}
        </div>

        {/* Issue info */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertIcon />
            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Vấn đề</span>
          </div>
          <div 
            className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
            style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}
          >
            {ISSUE_LABELS[issue_type] || issue_type}
          </div>
          <div className="text-sm" style={{ color: '#374151' }}>
            {description}
          </div>
          {accessories?.length > 0 && (
            <div className="mt-2 text-sm" style={{ color: '#6B7280' }}>
              <span className="font-medium">Phụ kiện: </span>
              {accessories.join(', ')}
            </div>
          )}
          {notes && (
            <div className="mt-2 text-sm italic" style={{ color: '#9CA3AF' }}>
              <span className="font-medium">Ghi chú: </span>
              {notes}
            </div>
          )}
        </div>
      </div>

      {/* Warranty warning */}
      {isExpired && (
        <div 
          className="p-4 rounded-xl flex items-start gap-3"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}
        >
          <span style={{ color: '#D97706' }}>
            <AlertIcon />
          </span>
          <div>
            <div className="text-sm font-semibold" style={{ color: '#92400E' }}>
              Sản phẩm đã hết hạn bảo hành
            </div>
            <div className="text-xs mt-1" style={{ color: '#B45309' }}>
              Phiếu bảo hành này sẽ được ghi nhận nhưng không được bảo hành miễn phí.
            </div>
          </div>
        </div>
      )}

      {/* Agreement checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div 
          onClick={() => setAgreed(!agreed)}
          className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
          style={{ 
            backgroundColor: agreed ? '#2563EB' : 'transparent',
            border: `2px solid ${agreed ? '#2563EB' : '#D1D5DB'}`,
          }}
        >
          {agreed && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <div className="text-sm" style={{ color: '#374151' }}>
          Tôi xác nhận thông tin trên là chính xác và đồng ý tạo phiếu bảo hành này.
        </div>
      </label>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ 
          backgroundColor: isValid && !submitting ? '#2563EB' : '#9CA3AF',
          boxShadow: isValid ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
        }}
      >
        {submitting ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Đang tạo phiếu...
          </>
        ) : (
          <>
            <CheckCircleIcon />
            Tạo phiếu bảo hành
          </>
        )}
      </button>
    </div>
  )
}
