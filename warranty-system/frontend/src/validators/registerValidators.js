// Bộ validator schema tay cho form Đăng ký, thay thế Zod (không thêm lib).
// Trả về { valid: boolean, error?: string }.
//
// Cách dùng:
//   const v = validate(form)
//   if (!v.valid) { setError(v.error); return }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-\s()]{8,20}$/

export const registerValidators = {
  email(form) {
    if (!form.email) return { valid: false, error: 'Email không được trống.' }
    if (!EMAIL_RE.test(form.email)) return { valid: false, error: 'Email không đúng định dạng.' }
    return { valid: true }
  },
  full_name(form) {
    if (!form.full_name) return { valid: false, error: 'Họ và tên không được trống.' }
    if (form.full_name.trim().length < 2) return { valid: false, error: 'Họ và tên quá ngắn.' }
    return { valid: true }
  },
  phone(form) {
    if (!form.phone) return { valid: true } // optional
    if (!PHONE_RE.test(form.phone)) return { valid: false, error: 'Số điện thoại không hợp lệ.' }
    return { valid: true }
  },
  password(form) {
    if (!form.password) return { valid: false, error: 'Mật khẩu không được trống.' }
    if (form.password.length < 6) return { valid: false, error: 'Mật khẩu phải từ 6 ký tự trở lên.' }
    return { valid: true }
  },
  confirm_password(form) {
    if (form.password !== form.confirm_password) {
      return { valid: false, error: 'Mật khẩu xác nhận không khớp.' }
    }
    return { valid: true }
  },
}

/**
 * Chạy tất cả validator theo thứ tự; trả lỗi đầu tiên gặp.
 */
export function validateRegister(form) {
  for (const key of Object.keys(registerValidators)) {
    const result = registerValidators[key](form)
    if (!result.valid) return result
  }
  return { valid: true }
}