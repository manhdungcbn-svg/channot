// ============================================
// WARRANTY STATUS CONFIG
// Centralized status management
// ============================================

export const STATUSES = {
  RECEIVED: {
    label: 'Tiếp nhận',
    color: '#F59E0B',
    bg: '#FEF3C7',
    border: '#FCD34D',
    icon: 'clock',
    description: 'Phiếu đã được tiếp nhận, chờ kiểm tra',
  },
  INSPECTION: {
    label: 'Đang kiểm tra',
    color: '#3B82F6',
    bg: '#DBEAFE',
    border: '#93C5FD',
    icon: 'search',
    description: 'Kỹ thuật viên đang kiểm tra sản phẩm',
  },
  REPAIRING: {
    label: 'Đang sửa chữa',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    border: '#C4B5FD',
    icon: 'tool',
    description: 'Sản phẩm đang được sửa chữa',
  },
  WAITING_PARTS: {
    label: 'Chờ linh kiện',
    color: '#F97316',
    bg: '#FFEDD5',
    border: '#FDBA74',
    icon: 'package',
    description: 'Đang chờ linh kiện thay thế',
  },
  COMPLETED: {
    label: 'Hoàn tất',
    color: '#10B981',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    icon: 'check',
    description: 'Đã hoàn tất sửa chữa và bàn giao',
  },
  REJECTED: {
    label: 'Từ chối',
    color: '#EF4444',
    bg: '#FEE2E2',
    border: '#FECACA',
    icon: 'x',
    description: 'Phiếu bảo hành bị từ chối',
  },
  DELIVERED: {
    label: 'Đã bàn giao',
    color: '#059669',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    icon: 'truck',
    description: 'Sản phẩm đã được bàn giao cho khách',
  },
}

// Status flow - what transitions are allowed
export const STATUS_FLOW = {
  RECEIVED: ['INSPECTION', 'REJECTED'],
  INSPECTION: ['REPAIRING', 'WAITING_PARTS', 'REJECTED'],
  WAITING_PARTS: ['REPAIRING', 'REJECTED'],
  REPAIRING: ['COMPLETED', 'WAITING_PARTS', 'REJECTED'],
  COMPLETED: ['DELIVERED'],
  DELIVERED: [],
  REJECTED: [],
}

// Priority config
export const PRIORITIES = {
  LOW: {
    label: 'Thấp',
    color: '#6B7280',
    bg: '#F3F4F6',
    icon: 'arrow-down',
  },
  NORMAL: {
    label: 'Bình thường',
    color: '#3B82F6',
    bg: '#DBEAFE',
    icon: 'minus',
  },
  HIGH: {
    label: 'Cao',
    color: '#F97316',
    bg: '#FFEDD5',
    icon: 'arrow-up',
  },
  URGENT: {
    label: 'Khẩn cấp',
    color: '#EF4444',
    bg: '#FEE2E2',
    icon: 'alert',
  },
}

// Warranty status
export const WARRANTY_STATUS = {
  ACTIVE: {
    label: 'Còn bảo hành',
    color: '#10B981',
    bg: '#D1FAE5',
  },
  EXPIRED: {
    label: 'Hết bảo hành',
    color: '#EF4444',
    bg: '#FEE2E2',
  },
  WARNING: {
    label: 'Sắp hết hạn',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
}

// Payment status
export const PAYMENT_STATUS = {
  UNPAID: {
    label: 'Chưa thanh toán',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  PAID: {
    label: 'Đã thanh toán',
    color: '#10B981',
    bg: '#D1FAE5',
  },
  WAIVED: {
    label: 'Miễn phí',
    color: '#3B82F6',
    bg: '#DBEAFE',
  },
}

// Issue categories (for AI classification)
export const ISSUE_CATEGORIES = {
  HARDWARE: {
    label: 'Phần cứng',
    color: '#EF4444',
    bg: '#FEE2E2',
  },
  SOFTWARE: {
    label: 'Phần mềm',
    color: '#3B82F6',
    bg: '#DBEAFE',
  },
  NETWORK: {
    label: 'Mạng',
    color: '#8B5CF6',
    bg: '#EDE9FE',
  },
  PHYSICAL: {
    label: 'Vật lý',
    color: '#F97316',
    bg: '#FFEDD5',
  },
  POWER: {
    label: 'Nguồn điện',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  OTHER: {
    label: 'Khác',
    color: '#6B7280',
    bg: '#F3F4F6',
  },
}

// Helper functions
export function getStatusConfig(status) {
  return STATUSES[status] || STATUSES.RECEIVED
}

export function getPriorityConfig(priority) {
  return PRIORITIES[priority] || PRIORITIES.NORMAL
}

export function canTransition(from, to) {
  return STATUS_FLOW[from]?.includes(to) || false
}

export function getNextStatuses(currentStatus) {
  return STATUS_FLOW[currentStatus] || []
}

export function getWarrantyStatus(manufactureDate, warrantyMonths) {
  if (!manufactureDate || !warrantyMonths) {
    return WARRANTY_STATUS.UNKNOWN
  }
  
  const endDate = new Date(manufactureDate)
  endDate.setMonth(endDate.getMonth() + warrantyMonths)
  
  const today = new Date()
  const daysUntilExpiry = Math.floor((endDate - today) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry < 0) {
    return { ...WARRANTY_STATUS.EXPIRED, daysRemaining: daysUntilExpiry }
  } else if (daysUntilExpiry <= 30) {
    return { ...WARRANTY_STATUS.WARNING, daysRemaining: daysUntilExpiry }
  } else {
    return { ...WARRANTY_STATUS.ACTIVE, daysRemaining: daysUntilExpiry }
  }
}

export function formatWarrantyExpiry(manufactureDate, warrantyMonths) {
  if (!manufactureDate || !warrantyMonths) return '—'
  
  const endDate = new Date(manufactureDate)
  endDate.setMonth(endDate.getMonth() + warrantyMonths)
  
  return endDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function getDaysRemaining(manufactureDate, warrantyMonths) {
  if (!manufactureDate || !warrantyMonths) return null
  
  const endDate = new Date(manufactureDate)
  endDate.setMonth(endDate.getMonth() + warrantyMonths)
  
  const today = new Date()
  return Math.floor((endDate - today) / (1000 * 60 * 60 * 24))
}
