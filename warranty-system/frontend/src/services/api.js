import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Phase C: Axios interceptor chuẩn hoá response theo envelope.
 *
 * - Lỗi (status >= 400): backend trả envelope {success, error:{message, code}}.
 *   Interceptor này tách `error.message` rồi gán lại vào `err.response.data.detail`
 *   để 10+ call site hiện tại (đang dùng `err.response.data.detail`) KHÔNG cần sửa.
 * - Thành công: giữ nguyên r.data.
 * - 401 → xoá token + redirect.
 */
function unwrapError(err) {
  const data = err.response?.data
  if (data && typeof data === 'object' && data.success === false && data.error) {
    // Gán lại shape cũ để tương thích ngược với call site hiện tại
    err.response.data = {
      ...data,
      detail: data.error.message,
    }
  }
  return err
}

api.interceptors.response.use(
  r => r,
  err => {
    const normalized = unwrapError(err)
    if (normalized.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(normalized)
  }
)

export default api