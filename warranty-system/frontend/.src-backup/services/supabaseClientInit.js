/**
 * Khởi tạo Supabase client — hàm thuần, không phụ thuộc Vite.
 *
 * Lý do tách riêng: `import.meta.env` chỉ tồn tại trong Vite, nên
 * `supabase.js` không thể import trực tiếp trong test runner của Node.
 * Hàm này giữ nguyên logic quyết định "có cấu hình hay không" để test được
 * cả hai nhánh mà không cần dựng app.
 */

/**
 * @param {string} url      VITE_SUPABASE_URL
 * @param {string} anonKey  VITE_SUPABASE_ANON_KEY
 * @param {(url: string, key: string) => object} factory  Hàm tạo client (mặc định createClient)
 * @returns {object|null} Client, hoặc null khi thiếu cấu hình
 */
export function initSupabase(url, anonKey, factory) {
  if (!url || !anonKey) return null
  return factory(url, anonKey)
}

/** Cấu hình có đủ để bật Google Login hay không. */
export function isSupabaseConfigured(url, anonKey) {
  return Boolean(url && anonKey)
}
