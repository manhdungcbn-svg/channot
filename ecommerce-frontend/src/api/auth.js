import { request } from './client';

/**
 * API cho luồng đăng nhập / đăng ký / quên mật khẩu của storefront.
 *
 * LƯU Ý VỀ ĐƯỜNG DẪN: vite proxy rewrite `/api/*` → `/api/v1/*`, nên frontend
 * gọi `/api/auth/...` (không gồm `/v1`).
 *
 * `login` / `register` chạy qua `AuthContext` (vì cần cập nhật state + ghi
 * session). File này chỉ phục vụ các endpoint phụ trợ như quên mật khẩu.
 */

/**
 * Gửi mã xác nhận 6 số về email để đặt lại mật khẩu.
 * @param {string} email
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<string>} thông báo từ server
 */
export async function requestResetCode(email, options = {}) {
  const data = await request('/api/auth/request-reset-code', {
    method: 'POST',
    body: { email },
    signal: options.signal,
  });
  return data?.message ?? 'Mã xác nhận đã được gửi.';
}

/**
 * Đặt lại mật khẩu bằng mã xác nhận.
 * @param {{email: string, code: string, newPassword: string}} payload
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<string>} thông báo từ server
 */
export async function resetPassword(payload, options = {}) {
  const data = await request('/api/auth/reset-password', {
    method: 'POST',
    body: {
      email: payload.email,
      code: payload.code,
      new_password: payload.newPassword,
    },
    signal: options.signal,
  });
  return data?.message ?? 'Đổi mật khẩu thành công.';
}

export default { requestResetCode, resetPassword };
