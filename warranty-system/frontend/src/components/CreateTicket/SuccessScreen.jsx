// ============================================
// CREATE TICKET MODAL - SUCCESS SCREEN
// After ticket created successfully
// ============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Confetti animation
function Confetti() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
          }}
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: ['#10B981', '#2563EB', '#F59E0B', '#EF4444'][i % 4],
              opacity: 0.6,
            }}
          />
        </div>
      ))}
    </div>
  )
}

function SuccessIcon() {
  return (
    <div 
      className="w-20 h-20 rounded-full flex items-center justify-center relative"
      style={{ backgroundColor: '#D1FAE5' }}
    >
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center animate-bounce"
        style={{ backgroundColor: '#10B981' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <Confetti />
    </div>
  )
}

export default function SuccessScreen({ ticket, onClose, onCreateAnother }) {
  const [showDetails, setShowDetails] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center py-6 px-4">
      {/* Success animation */}
      <div className="mb-6">
        <SuccessIcon />
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>
        Tạo phiếu thành công!
      </h2>
      <p className="text-sm text-center mb-6" style={{ color: '#6B7280' }}>
        Phiếu bảo hành đã được tạo và sẵn sàng xử lý
      </p>

      {/* Ticket ID */}
      <div 
        className="w-full p-4 rounded-xl mb-4"
        style={{ backgroundColor: '#F0F7FF', border: '1px solid #BFDBFE' }}
      >
        <div className="text-center">
          <div className="text-xs font-medium mb-1" style={{ color: '#6B7280' }}>
            Mã phiếu bảo hành
          </div>
          <div
            className="text-2xl font-bold font-mono"
            style={{ color: '#4338CA' }}
          >
            {ticket?.ticket_code || `#${ticket?.id}`}
          </div>
        </div>
      </div>

      {/* Quick info */}
      <div className="w-full space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span style={{ color: '#6B7280' }}>Khách hàng</span>
          <span className="font-medium" style={{ color: '#1F1B2D' }}>
            {ticket?.customer_name || ticket?.customer?.full_name || '—'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#6B7280' }}>Sản phẩm</span>
          <span className="font-medium" style={{ color: '#1F1B2D' }}>
            {ticket?.product_name || ticket?.product?.name || '—'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#6B7280' }}>Trạng thái</span>
          <span 
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}
          >
            Tiếp nhận
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#6B7280' }}>Ngày tạo</span>
          <span className="font-medium" style={{ color: '#1F2937' }}>
            {ticket?.created_at 
              ? new Date(ticket.created_at).toLocaleString('vi-VN')
              : new Date().toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full space-y-3">
        <button
          onClick={() => { onClose(); navigate(`/tickets/${ticket?.id}`) }}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: '#4F46E5' }}
        >
          Xem chi tiết phiếu
        </button>
        
        <button
          onClick={onCreateAnother}
          className="w-full py-3 rounded-xl text-sm font-medium border transition-all"
          style={{ 
            borderColor: '#E5E7EB', 
            color: '#374151',
            backgroundColor: '#FFFFFF'
          }}
        >
          Tạo phiếu khác
        </button>
      </div>
    </div>
  )
}
