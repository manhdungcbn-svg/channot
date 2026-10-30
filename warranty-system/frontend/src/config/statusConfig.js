// ============================================
// WARRANTY STATUS CONFIG
// Centralized status management
// ============================================

export const STATUSES = {
  RECEIVED: {
    label: 'Tiếp nhận',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    border: '#FCD34D',
    icon: 'clock',
    description: 'Phiếu đã được tiếp nhận, chờ kiểm tra',
  },
  INSPECTION: {
    label: 'Đang kiểm tra',
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    border: '#93C5FD',
    icon: 'search',
    description: 'Kỹ thuật viên đang kiểm tra sản phẩm',
  },
  REPAIRING: {
    label: 'Đang sửa chữa',
    color: 'var(--accent-violet)',
    bg: 'var(--brand-50)',
    border: '#C4B5FD',
    icon: 'tool',
    description: 'Sản phẩm đang được sửa chữa',
  },
  WAITING_PARTS: {
    label: 'Chờ linh kiện',
    color: 'var(--accent-orange)',
    bg: 'var(--warning-bg)',
    border: '#FDBA74',
    icon: 'package',
    description: 'Đang chờ linh kiện thay thế',
  },
  COMPLETED: {
    label: 'Hoàn tất',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    border: '#6EE7B7',
    icon: 'check',
    description: 'Đã hoàn tất sửa chữa và bàn giao',
  },
  REJECTED: {
    label: 'Từ chối',
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
    border: '#FECACA',
    icon: 'x',
    description: 'Phiếu bảo hành bị từ chối',
  },
  DELIVERED: {
    label: 'Đã bàn giao',
    color: 'var(--success-text)',
    bg: 'var(--success-bg)',
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
    color: 'var(--text-muted)',
    bg: 'var(--bg-hover)',
    icon: 'arrow-down',
  },
  NORMAL: {
    label: 'Bình thường',
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    icon: 'minus',
  },
  HIGH: {
    label: 'Cao',
    color: 'var(--accent-orange)',
    bg: 'var(--warning-bg)',
    icon: 'arrow-up',
  },
  URGENT: {
    label: 'Khẩn cấp',
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
    icon: 'alert',
  },
}

// Warranty status
export const WARRANTY_STATUS = {
  ACTIVE: {
    id: 'active',
    label: 'Còn bảo hành',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
  },
  EXPIRED: {
    id: 'expired',
    label: 'Hết bảo hành',
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
  },
  WARNING: {
    id: 'warning',
    label: 'Sắp hết hạn',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
  },
  UNKNOWN: {
    id: 'unknown',
    label: 'Không rõ',
    color: 'var(--text-light)',
    bg: 'var(--bg-hover)',
  },
}

// Payment status
export const PAYMENT_STATUS = {
  UNPAID: {
    label: 'Chưa thanh toán',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
  },
  PAID: {
    label: 'Đã thanh toán',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
  },
  WAIVED: {
    label: 'Miễn phí',
    color: 'var(--info)',
    bg: 'var(--info-bg)',
  },
}

// Issue categories (for AI classification)
export const ISSUE_CATEGORIES = {
  HARDWARE: {
    label: 'Phần cứng',
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
  },
  SOFTWARE: {
    label: 'Phần mềm',
    color: 'var(--info)',
    bg: 'var(--info-bg)',
  },
  NETWORK: {
    label: 'Mạng',
    color: 'var(--accent-violet)',
    bg: 'var(--brand-50)',
  },
  PHYSICAL: {
    label: 'Vật lý',
    color: 'var(--accent-orange)',
    bg: 'var(--warning-bg)',
  },
  POWER: {
    label: 'Nguồn điện',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
  },
  OTHER: {
    label: 'Khác',
    color: 'var(--text-muted)',
    bg: 'var(--bg-hover)',
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

/**
 * Tính ngày hết hạn bảo hành = ngày sản xuất + số tháng bảo hành.
 *
 * KHÔNG dùng `setMonth()` trực tiếp vì JS sẽ overflow: 31/01 + 1 tháng → 03/03.
 * Thay vào đó tính theo (năm, tháng) rồi clamp ngày vào ngày cuối tháng đích.
 *
 * @param {string|Date} manufactureDate
 * @param {number} warrantyMonths
 * @returns {Date|null}
 */
export function getWarrantyEndDate(manufactureDate, warrantyMonths) {
  if (!manufactureDate || !warrantyMonths) return null

  const start = new Date(manufactureDate)
  if (Number.isNaN(start.getTime())) return null

  const totalMonths = start.getMonth() + warrantyMonths
  const year = start.getFullYear() + Math.floor(totalMonths / 12)
  const month = totalMonths % 12

  // Ngày cuối tháng đích (0-based month → new Date(year, month+1, 0)).
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(start.getDate(), lastDay))
}

export function getWarrantyStatus(manufactureDate, warrantyMonths) {
  if (!manufactureDate || !warrantyMonths) {
    return WARRANTY_STATUS.UNKNOWN
  }

  const endDate = getWarrantyEndDate(manufactureDate, warrantyMonths)
  if (!endDate) return WARRANTY_STATUS.UNKNOWN

  const today = new Date()
  const daysUntilExpiry = Math.floor((endDate - today) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) {
    return { ...WARRANTY_STATUS.EXPIRED, daysRemaining: daysUntilExpiry, endDate }
  } else if (daysUntilExpiry <= 30) {
    return { ...WARRANTY_STATUS.WARNING, daysRemaining: daysUntilExpiry, endDate }
  } else {
    return { ...WARRANTY_STATUS.ACTIVE, daysRemaining: daysUntilExpiry, endDate }
  }
}

export function formatWarrantyExpiry(manufactureDate, warrantyMonths) {
  const endDate = getWarrantyEndDate(manufactureDate, warrantyMonths)
  if (!endDate) return '—'

  return endDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function getDaysRemaining(manufactureDate, warrantyMonths) {
  const endDate = getWarrantyEndDate(manufactureDate, warrantyMonths)
  if (!endDate) return null

  const today = new Date()
  return Math.floor((endDate - today) / (1000 * 60 * 60 * 24))
}
