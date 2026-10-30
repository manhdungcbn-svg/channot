/**
 * Phân quyền theo vai trò — nguồn sự thật duy nhất cho cả frontend app bảo hành.
 *
 * Nguyên tắc:
 * - `customer` CHỈ thao tác trên dữ liệu của chính mình, không vào được khu vực
 *   quản trị (khách hàng, thanh toán, AI console, quản lý sản phẩm toàn hệ thống).
 * - `technician` chỉ sửa phiếu được phân công (backend đã chặn).
 * - `admin` / `staff` có toàn quyền.
 */

/** Vai trò quản trị (được thấy mọi trang). */
export const ADMIN_ROLES = ['admin', 'staff']

/** Nhân viên kỹ thuật (được vào AI console, sửa phiếu được giao). */
export const TECH_ROLES = ['admin', 'staff', 'technician']

/**
 * Kiểm tra user có thuộc vai trò nào không.
 * @param {{role?: string}|null} user
 * @param {string[]} roles
 * @returns {boolean}
 */
export function hasRole(user, roles) {
  if (!user?.role) return false
  return roles.includes(user.role)
}

/**
 * User có phải khách hàng (vai trò hạn chế) không.
 * @param {{role?: string}|null} user
 * @returns {boolean}
 */
export function isCustomer(user) {
  return user?.role === 'customer'
}

/**
 * User có phải quản trị (admin/staff) không.
 * @param {{role?: string}|null} user
 * @returns {boolean}
 */
export function isManager(user) {
  return hasRole(user, ADMIN_ROLES)
}

/**
 * User có thể tạo phiếu bảo hành không.
 * - Khách hàng: có (phiếu của chính mình).
 * - Nhân viên: có (tạo thay khách).
 * @param {{role?: string}|null} user
 * @returns {boolean}
 */
export function canCreateTicket(user) {
  return Boolean(user?.role)
}

/**
 * User có thể đổi trạng thái phiếu không.
 * @param {{role?: string}|null} user
 * @returns {boolean}
 */
export function canChangeTicketStatus(user) {
  return hasRole(user, TECH_ROLES)
}

/**
 * User có thể quản lý sản phẩm toàn hệ thống không.
 * @param {{role?: string}|null} user
 * @returns {boolean}
 */
export function canManageProducts(user) {
  return hasRole(user, ADMIN_ROLES)
}

/**
 * User có thể xem danh sách khách hàng không.
 * @param {{role?: string}|null} user
 * @returns {boolean}
 */
export function canViewCustomers(user) {
  return hasRole(user, ADMIN_ROLES)
}

/**
 * User có thể vào trang thanh toán / tài chính không.
 * @param {{role?: string}|null} user
 * @returns {boolean}
 */
export function canViewPayments(user) {
  return user?.role === 'admin'
}

/**
 * User có thể vào AI console không.
 * @param {{role?: string}|null} user
 * @returns {boolean}
 */
export function canUseAiConsole(user) {
  return hasRole(user, TECH_ROLES)
}

/**
 * Route mặc định khi đăng nhập — theo vai trò.
 * @param {{role?: string}|null} user
 * @returns {string}
 */
export function defaultRouteFor(user) {
  if (isCustomer(user)) return '/my-tickets'
  if (user?.role === 'technician') return '/tickets'
  return '/'
}

export default {
  ADMIN_ROLES,
  TECH_ROLES,
  hasRole,
  isCustomer,
  isManager,
  canCreateTicket,
  canChangeTicketStatus,
  canManageProducts,
  canViewCustomers,
  canViewPayments,
  canUseAiConsole,
  defaultRouteFor,
}
