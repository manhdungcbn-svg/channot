import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import supabase, { supabaseConfigured } from '../services/supabase'
import RegisterModal from '../components/RegisterModal'
import LookupModal from '../components/LookupModal'
import { EyeIcon, SpinnerIcon, MailIcon, LockIcon, SearchIcon } from '../components/icons'

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z" />
        <rect x="4" y="8" width="16" height="12" rx="2" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
      </svg>
    ),
    title: 'Phân loại lỗi tự động',
    desc: 'AI phân tích triệu chứng & gợi ý chi phí dự kiến',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Theo dõi realtime',
    desc: 'Cập nhật trạng thái phiếu bảo hành theo thời gian thực',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Thông báo tự động',
    desc: 'Gửi tin nhắn cập nhật tới khách hàng sau mỗi bước',
  },
]

const DEVELOPER = {
  name: 'Vũ Mạnh Dũng',
  email: 'manhdungdbn@gmail.com',
  phone: '0827461460',
}

// Thông báo dùng chung cho cả nút bị disable và thao tác bấm (phòng trường hợp gọi qua script).
const GOOGLE_DISABLED_MSG =
  'Đăng nhập với Google chưa được cấu hình. Vui lòng dùng email và mật khẩu.'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@warranty.vn')
  const [password, setPassword] = useState('Admin@123')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showLookup, setShowLookup] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleLogin() {
    setError('')
    // Client là null khi thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
    // Chặn ở đây để không ném TypeError khi gọi supabase.auth.
    if (!supabase) {
      setError(GOOGLE_DISABLED_MSG)
      return
    }
    setGoogleLoading(true)
    try {
      const { error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: window.location.origin + '/login',
        },
      })
      if (sbError) throw sbError

      // Lấy ID token sau khi callback về
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr || !sessionData?.session?.provider_token) {
        throw new Error('Không lấy được session từ Google')
      }

      const idToken = sessionData.session.provider_token

      // Proxy sang backend để tạo JWT nội bộ
      const api = (await import('../services/api')).default
      const r = await api.post('/auth/supabase-token', { id_token: idToken, provider: 'google' })
      localStorage.setItem('token', r.data.access_token)
      localStorage.setItem('user', JSON.stringify(r.data.user))
      window.location.href = '/'
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.')
    } finally {
      setGoogleLoading(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      // UX fix: KHÔNG xóa email/password để user không phải gõ lại khi lỗi mạng
      setError(err.response?.data?.detail || 'Email hoặc mật khẩu không đúng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '5fr 7fr', background: '#0A1628' }}>

      {/* ═══════════════ LEFT — Brand Panel ═══════════════ */}
      <div className="relative flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0D2040 35%, #112244 65%, #1A3A6B 100%)' }}>

        {/* Decorative orbs */}
        <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] right-[-40px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%)' }} />

        {/* Top-right corner nav */}
        <div className="relative z-10 flex items-center justify-end gap-3 p-8">
          <button onClick={() => setShowLookup(true)}
            className="text-sm font-medium px-5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2"
            style={{ color: '#93C5FD', border: '1px solid rgba(37,99,235,0.4)', background: 'rgba(37,99,235,0.08)' }}>
            <SearchIcon size={16} />
            Tra cứu
          </button>
          <button onClick={() => setShowRegister(true)}
            className="text-sm font-medium px-5 py-2 rounded-xl transition-all duration-200"
            style={{ color: '#93C5FD', border: '1px solid rgba(37,99,235,0.4)', background: 'rgba(37,99,235,0.08)' }}>
            Đăng kí
          </button>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-12 py-8">
          {/* Shield badge */}
          <div className="mb-10">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 40%, #2563EB 100%)',
                boxShadow: '0 0 80px rgba(37,99,235,0.45), 0 0 40px rgba(37,99,235,0.2)',
              }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-center mb-4 leading-tight"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#FFFFFF' }}>
            Hệ thống quản lý<br />
            <span style={{ color: '#60A5FA' }}>BẢO HÀNH</span>
          </h1>

          {/* Tagline */}
          <p className="text-center text-sm leading-relaxed mb-10"
            style={{ color: '#93C5FD', maxWidth: 380 }}>
            Tích hợp <strong style={{ color: '#BFDBFE' }}>AI</strong> giúp phân loại lỗi nhanh chóng, theo dõi tiến độ realtime &amp; quản lý tài chính minh bạch.
          </p>

          {/* Feature cards — 3 columns */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-auto">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-2xl p-4 text-center flex flex-col items-center gap-2"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  {f.icon}
                </div>
                <div className="text-xs font-semibold text-center leading-snug"
                  style={{ fontFamily: 'DM Sans, sans-serif', color: '#E2E8F0' }}>
                  {f.title}
                </div>
                <div className="text-xs text-center leading-snug" style={{ color: '#64748B' }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Developer footer */}
        <div className="relative z-10 text-center pb-8 px-8">
          <div className="h-px w-full mb-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }} />
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#3B82F6' }}>
            Phát triển bởi
          </p>
          <p className="text-sm font-bold mb-3" style={{ fontFamily: 'DM Sans, sans-serif', color: '#FFFFFF' }}>
            {DEVELOPER.name}
          </p>
          <div className="flex items-center justify-center gap-3 text-xs" style={{ color: '#64748B' }}>
            <div className="flex items-center gap-1.5">
              <MailIcon size={12} color="#64748B" />
              {DEVELOPER.email}
            </div>
            <span style={{ color: '#1E3A5F' }}>|</span>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {DEVELOPER.phone}
            </div>
          </div>
          <p className="text-xs mt-4" style={{ color: '#1E3A5F' }}>
            © 2026 Warranty AI. All rights reserved.
          </p>
        </div>
      </div>

      {/* ═══════════════ RIGHT — Login Form ═══════════════ */}
      <div className="flex items-center justify-center p-8"
        style={{ background: 'linear-gradient(180deg, #F1F5F9 0%, #E8EEF5 100%)' }}>

        {/* Login card */}
        <div className="w-full max-w-sm">
          <div className="rounded-3xl p-8 shadow-2xl"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 25px 60px rgba(15, 25, 41, 0.12), 0 8px 24px rgba(15, 25, 41, 0.08)',
            }}>
            {/* Card header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'DM Sans, sans-serif', color: '#0F1929' }}>
                Đăng nhập
              </h2>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Truy cập hệ thống quản lý bảo hành
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {/* ── Google OAuth ── */}
              <button type="button" onClick={handleGoogleLogin} disabled={googleLoading || !supabaseConfigured}
                aria-label={supabaseConfigured ? 'Đăng nhập với Google' : GOOGLE_DISABLED_MSG}
                className="w-full py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2.5 transition-all duration-200"
                style={{
                  borderColor: '#D1DCF0',
                  background: googleLoading || !supabaseConfigured ? '#F1F5F9' : '#FFFFFF',
                  color: supabaseConfigured ? '#374151' : '#94A3B8',
                  cursor: googleLoading || !supabaseConfigured ? 'not-allowed' : 'pointer',
                }}>
                {googleLoading ? (
                  <>
                    <SpinnerIcon />
                    Đang kết nối Google...
                  </>
                ) : supabaseConfigured ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Đăng nhập với Google
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="4" y="11" width="16" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                    Đăng nhập Google (chưa cấu hình)
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: '#E4EBF7' }} />
                <span className="text-xs" style={{ color: '#94A3B8' }}>hoặc</span>
                <div className="flex-1 h-px" style={{ background: '#E4EBF7' }} />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <MailIcon />
                  </div>
                  <input type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#D1DCF0', background: '#F8FAFC', color: '#0F1929' }}
                    placeholder="you@example.com" required />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <LockIcon />
                  </div>
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm"
                    style={{ borderColor: '#D1DCF0', background: '#F8FAFC', color: '#0F1929' }}
                    placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center"
                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl text-sm flex items-center gap-2"
                  style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: loading
                    ? '#94A3B8'
                    : 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #2563EB 100%)',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                {loading ? (
                  <>
                    <SpinnerIcon />
                    Đang xác thực...
                  </>
                ) : 'Đăng nhập'}
              </button>
            </form>

            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                Chưa có tài khoản?{' '}
                <button onClick={() => setShowRegister(true)}
                  className="font-semibold transition-colors"
                  style={{ color: '#1A3A6B' }}>
                  Đăng kí ngay
                </button>
              </p>
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-xs text-center mt-6" style={{ color: '#94A3B8' }}>
            Bằng việc đăng nhập, bạn đồng ý với{' '}
            <span style={{ color: '#64748B' }}>Điều khoản sử dụng</span> &
            <span style={{ color: '#64748B' }}> Chính sách bảo mật</span>.
          </p>
        </div>
      </div>

      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      {showLookup && <LookupModal onClose={() => setShowLookup(false)} />}
    </div>
  )
}