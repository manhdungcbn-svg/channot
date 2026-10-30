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
              backgroundColor: ['var(--success)', 'var(--brand-600)', 'var(--warning)', 'var(--danger)'][i % 4],
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
      style={{ backgroundColor: 'var(--success-bg)' }}
    >
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center animate-bounce"
        style={{ backgroundColor: 'var(--success)' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <Confetti />
    </div>
  )
}

export default function SuccessScreen({ ticket, product, customer, onClose, onCreateAnother, isCustomer = false }) {
  const [showDetails, setShowDetails] = useState(false)
  const navigate = useNavigate()

  // Khách hàng xem chi tiết ở khu vực riêng của họ.
  const detailPath = isCustomer ? `/my-tickets/${ticket?.id}` : `/tickets/${ticket?.id}`

  // Tên khách / sản phẩm: ưu tiên dữ liệu phiếu, sau đó tới dữ liệu đang chọn.
  // (API `TicketOut` không trả tên khách/sản phẩm nên cần fallback.)
  const customerName =
    ticket?.customer_name || customer?.full_name || customer?.name || '—'
  const productName =
    ticket?.product_name || product?.name || product?.product_name || '—'

  return (
    <div className="flex flex-col items-center py-6 px-4">
      {/* Success animation */}
      <div className="mb-6">
        <SuccessIcon />
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Tạo phiếu thành công!
      </h2>
      <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
        Phiếu bảo hành đã được tạo và sẵn sàng xử lý
      </p>

      {/* Ticket ID */}
      <div 
        className="w-full p-4 rounded-xl mb-4"
        style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--info-bg)' }}
      >
        <div className="text-center">
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Mã phiếu bảo hành
          </div>
          <div
            className="text-2xl font-bold font-mono"
            style={{ color: 'var(--brand-700)' }}
          >
            {ticket?.ticket_code || `#${ticket?.id}`}
          </div>
        </div>
      </div>

      {/* Quick info */}
      <div className="w-full space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Khách hàng</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {customerName}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Sản phẩm</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {productName}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Trạng thái</span>
          <span 
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
          >
            Tiếp nhận
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Ngày tạo</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {ticket?.created_at 
              ? new Date(ticket.created_at).toLocaleString('vi-VN')
              : new Date().toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full space-y-3">
        <button
          onClick={() => { onClose(); navigate(detailPath) }}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: 'var(--brand-600)' }}
        >
          Xem chi tiết phiếu
        </button>
        
        <button
          onClick={onCreateAnother}
          className="w-full py-3 rounded-xl text-sm font-medium border transition-all"
          style={{ 
            borderColor: 'var(--border)', 
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          Tạo phiếu khác
        </button>
      </div>
    </div>
  )
}
