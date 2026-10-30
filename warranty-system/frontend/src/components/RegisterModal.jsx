import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EyeIcon } from './icons'
import ConfirmDialog from './ConfirmDialog'
import { validateRegister } from '../validators/registerValidators'
import { defaultRouteFor } from '../utils/permissions'

const labelStyle = { color: 'var(--text-secondary)' }
const requiredStyle = { color: 'var(--danger)' }
const inputStyle = {
  borderColor: 'var(--border)',
  background: 'var(--bg-subtle)',
  color: 'var(--text-primary)',
}

export default function RegisterModal({ onClose }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '', full_name: '', phone: '', password: '', confirm_password: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [showCfpw, setShowCfpw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  const isDirty = form.email || form.full_name || form.phone || form.password

  function update(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    setError('')
  }

  function handleClose() {
    // Nếu đang nhập dở → hỏi xác nhận bằng ConfirmDialog thay vì window.confirm
    if (isDirty) {
      setConfirmClose(true)
      return
    }
    onClose()
  }

  async function handleRegister(e) {
    e.preventDefault()
    const result = validateRegister(form)
    if (!result.valid) {
      setError(result.error)
      return
    }
    setLoading(true)
    try {
      const api = (await import('../services/api')).default
      await api.post('/auth/register', {
        email: form.email,
        full_name: form.full_name,
        phone: form.phone || undefined,
        password: form.password,
        role: 'customer',
      })
      await login(form.email, form.password)
      // Khách hàng mới đăng ký → về "Phiếu của tôi"; nhân viên → dashboard.
      navigate(defaultRouteFor({ role: 'customer' }), { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại. Email có thể đã được sử dụng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
    >
      <div
        className="rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', animation: 'contentFadeUp 0.4s ease-out both' }}
      >
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div>
            <h2
              id="register-modal-title"
              className="text-xl font-bold"
              style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
            >
              Tạo tài khoản mới
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Đăng ký để sử dụng dịch vụ bảo hành
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)]"
            aria-label="Đóng"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleRegister} className="px-6 pb-6 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>
                Email <span style={requiredStyle}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                style={inputStyle}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>
                Họ và tên <span style={requiredStyle}>*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => update('full_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                style={inputStyle}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>
                Số điện thoại
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                style={inputStyle}
                placeholder="0912 345 678"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>
                Mật khẩu <span style={requiredStyle}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm"
                  style={inputStyle}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>
                Nhập lại mật khẩu <span style={requiredStyle}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showCfpw ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={e => update('confirm_password', e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm"
                  style={inputStyle}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCfpw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  aria-label={showCfpw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <EyeIcon open={showCfpw} />
                </button>
              </div>
            </div>
          </div>
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{
                background: loading ? 'var(--border-strong)' : 'var(--brand-700)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </div>
        </form>
      </div>

      {/* Xác nhận đóng khi đang nhập dở */}
      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => { setConfirmClose(false); onClose() }}
        title="Đóng form đăng ký?"
        description="Một số trường chưa được lưu. Thông tin bạn nhập sẽ bị mất."
        confirmText="Đóng form"
        cancelText="Tiếp tục nhập"
        variant="warning"
      />
    </div>
  )
}