/**
 * Tiện ích hiển thị tên người dùng.
 *
 * VÍ DỤ: "Quản trị viên" → lấy "Quản trị" (không phải "viên" như cách
 * `full_name.split(' ').slice(-1)[0]` — cách đó cắt sai vì tên tiếng Việt có
 * dấu và chức danh có thể nhiều từ).
 */

/** Các từ chức danh/phòng ban thường đứng cuối tên tiếng Việt */
const TITLE_PREFIXES = new Set([
  'quản', 'quan', 'nhân', 'nhan', 'kỹ', 'ky', 'chuyên', 'trưởng', 'truong',
  'giám', 'giam', 'phó', 'po', 'trợ', 'tro', 'bộ', 'bo', 'nhóm', 'nhom',
  'admin', 'staff', 'tech', 'user',
])

/** Từ chức danh — dùng để nhận ra tên hoàn toàn là chức danh */
const TITLE_WORDS = new Set([
  ...TITLE_PREFIXES,
  'trị', 'tri', 'viên', 'vien', 'đốc', 'doc', 'kế', 'ke', 'toán', 'toan',
  'văn', 'van', 'hành', 'hanh', 'tổng', 'tong',
])

/**
 * Từ bỏ dạng tên tiếng Việt ("Văn", "Thị", "Hữu"...) — thường nằm giữa
 * họ và tên, bỏ đi thì "Phạm Văn A" → "Phạm A" (đúng cách gọi tên).
 */
const MIDDLE_NAME_WORDS = new Set([
  'văn', 'van', 'thị', 'thi', 'hữu', 'huu', 'hoàng', 'hoang', 'ngọc', 'ngoc',
  'đức', 'duc', 'mạnh', 'manh', 'tiếp', 'tiep', 'thuận', 'thuan',
])

/** Tên hoàn toàn là chức danh, ví dụ "Quản trị viên" */
function isTitleOnly(fullName) {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean)
  return parts.length > 0 && parts.every((p) => TITLE_WORDS.has(p.toLowerCase()))
}

/**
 * Lấy tên hiển thị thân thiện từ full_name.
 * @param {string} [fullName]
 * @param {{ maxWords?: number }} [options]
 * @returns {string}
 */
export function getDisplayName(fullName, { maxWords = 2 } = {}) {
  if (!fullName) return 'bạn'
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]

  // Tên chỉ là chức danh (vd "Quản trị viên") → giữ nguyên, không cắt
  if (isTitleOnly(fullName)) return parts.join(' ')

  // Bỏ các từ chức danh ở cuối
  let end = parts.length
  while (end > 1 && TITLE_PREFIXES.has(parts[end - 1].toLowerCase())) end -= 1

  // Bỏ từ bỏ dạng ở giữa (vd "Phạm Văn A" → "Phạm A")
  const cleaned = parts.slice(0, end).filter((p, i) => {
    if (i === 0 || i === parts.slice(0, end).length - 1) return true
    return !MIDDLE_NAME_WORDS.has(p.toLowerCase())
  })

  const nameParts = cleaned.slice(Math.max(0, cleaned.length - maxWords))
  return nameParts.join(' ') || parts[parts.length - 1]
}

/**
 * Chữ cái đầu của tên (dùng cho avatar).
 * @param {string} [fullName]
 * @returns {string}
 */
export function getInitials(fullName) {
  if (!fullName) return 'U'
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

  // Tên là chức danh → lấy 2 chữ cái đầu của 2 từ đầu (vd "Quản trị viên" → "QT")
  if (isTitleOnly(fullName)) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }

  const first = parts[0]?.charAt(0) || ''
  const last = parts[parts.length - 1]?.charAt(0) || ''
  return (first + last).toUpperCase() || 'U'
}

export default getDisplayName
