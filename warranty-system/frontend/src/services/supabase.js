import { createClient } from '@supabase/supabase-js'
import { initSupabase, isSupabaseConfigured } from './supabaseClientInit'

// S2 fix: đọc Supabase config từ Vite env (không hard-code trong source).
// File .env (frontend) phải có VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.
// File này KHÔNG được commit — xem .gitignore.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Lazy-init: KHÔNG gọi createClient() khi thiếu cấu hình.
// createClient() ném lỗi "supabaseUrl is required." ngay lúc import module,
// khiến toàn bộ app không mount được (React crash trước createRoot).
// Trả null thay vì ném lỗi để app vẫn chạy; chỉ nút Google Login bị vô hiệu hóa.
export const supabaseConfigured = isSupabaseConfigured(supabaseUrl, supabaseAnonKey)

const supabase = supabaseConfigured
  ? initSupabase(supabaseUrl, supabaseAnonKey, createClient)
  : null

if (!supabaseConfigured) {
  console.warn(
    '[supabase.js] VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY chưa được cấu hình. ' +
    'Đăng nhập với Google sẽ không hoạt động. Set giá trị trong file frontend/.env.'
  )
}

export default supabase
