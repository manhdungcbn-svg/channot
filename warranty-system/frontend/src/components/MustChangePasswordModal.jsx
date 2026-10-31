import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function MustChangePasswordModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen || !user?.must_change_password) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const res = await api.post('/auth/change-password', {
        old_password: oldPassword || user.phone || undefined,
        new_password: newPassword,
      })

      setSuccess('Đổi mật khẩu thành công!')
      if (updateUser && res.data?.user) {
        updateUser(res.data.user)
      } else {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        u.must_change_password = false
        localStorage.setItem('user', JSON.stringify(u))
      }
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể đổi mật khẩu. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl p-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Bỏ qua"
          className="absolute right-4 top-4 text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
        >
          ✕
        </button>

        <div className="text-center mb-5">
          <div
            className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
          >
            🛡️
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Đổi mật khẩu bảo mật
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Mật khẩu khởi tạo là số điện thoại của bạn. Bạn nên đặt mật khẩu riêng ngay để bảo vệ thông tin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-xs font-medium" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl text-xs font-medium" style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
              {success}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Mật khẩu ban đầu (SĐT của bạn)
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder={user.phone || 'Nhập số điện thoại'}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Mật khẩu mới (tối thiểu 6 ký tự)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
              style={{ background: 'var(--brand-600)' }}
            >
              {busy ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-center font-medium py-1 hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              Bỏ qua (nhắc tôi lần sau)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
