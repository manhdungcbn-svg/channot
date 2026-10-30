import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/services'

const EyeIcon = ({ open }) => (
  open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
)

function SuccessView() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--success-bg)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success-text)" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <p className="text-lg font-semibold mb-2" style={{ color: 'var(--success-text)' }}>Thành công!</p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Đang chuyển về trang đăng nhập...</p>
    </div>
  )
}

function ResetCodeForm({ email, setEmail, loading, error, success, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="p-4 rounded-xl" style={{ background: 'var(--info-bg)', border: '1px solid var(--info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--info-text)' }}>
          Nhập email của bạn. Chúng tôi sẽ gửi mã xác nhận để đặt lại mật khẩu.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={{ borderColor: 'var(--brand-200)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
          placeholder="you@example.com" required />
      </div>

      {error && <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>{error}</div>}
      {success && <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>{success}</div>}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: loading ? 'var(--border-strong)' : 'var(--brand-700)', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
      </button>
    </form>
  )
}

function VerifyCodeForm({ email, code, setCode, newPassword, setNewPassword, confirmPassword, setConfirmPassword, showNewPw, setShowNewPw, showConfirmPw, setShowConfirmPw, loading, error, success, onSubmit, onBack }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="p-4 rounded-xl" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--warning-text)' }}>
          Mã xác nhận đã được gửi đến <strong>{email}</strong>
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Mã xác nhận</label>
        <input type="text" value={code} onChange={e => setCode(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border text-sm font-mono tracking-widest text-center"
          style={{ borderColor: 'var(--brand-200)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
          placeholder="Nhập 6 số" maxLength={6} required />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Mật khẩu mới</label>
        <div className="relative">
          <input type={showNewPw ? 'text' : 'password'} value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border text-sm pr-10"
            style={{ borderColor: 'var(--brand-200)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
            placeholder="Tối thiểu 6 ký tự" minLength={6} required />
          <button type="button" onClick={() => setShowNewPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2">
            <EyeIcon open={showNewPw} />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nhập lại mật khẩu mới</label>
        <div className="relative">
          <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border text-sm pr-10"
            style={{ borderColor: 'var(--brand-200)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
            placeholder="Nhập lại mật khẩu mới" required />
          <button type="button" onClick={() => setShowConfirmPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2">
            <EyeIcon open={showConfirmPw} />
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>{error}</div>}
      {success && <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>{success}</div>}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: loading ? 'var(--border-strong)' : 'var(--success)', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
      </button>

      <button type="button" onClick={onBack}
        className="w-full py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        ← Gửi lại mã
      </button>
    </form>
  )
}

export default function PasswordChangeTab({ user }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState(user?.email || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleRequestCode(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Vui lòng nhập email'); return }
    setLoading(true)
    setError('')
    try {
      await authService.requestResetCode(email.trim())
      setSuccess(`Mã xác nhận đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư.`)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể gửi mã. Vui lòng thử lại.')
    } finally { setLoading(false) }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    if (!code.trim()) { setError('Vui lòng nhập mã xác nhận'); return }
    if (!newPassword || newPassword.length < 6) { setError('Mật khẩu mới phải từ 6 ký tự'); return }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }

    setLoading(true)
    try {
      await authService.resetPassword({ email: email.trim(), code: code.trim(), new_password: newPassword })
      setSuccess('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
      setStep(3)
      setTimeout(() => { localStorage.clear(); navigate('/login', { replace: true }) }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Mã không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.')
    } finally { setLoading(false) }
  }

  if (step === 3) return <SuccessView />

  if (step === 2) {
    return (
      <VerifyCodeForm
        email={email}
        code={code} setCode={setCode}
        newPassword={newPassword} setNewPassword={setNewPassword}
        confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
        showNewPw={showNewPw} setShowNewPw={setShowNewPw}
        showConfirmPw={showConfirmPw} setShowConfirmPw={setShowConfirmPw}
        loading={loading} error={error} success={success}
        onSubmit={handleResetPassword}
        onBack={() => setStep(1)}
      />
    )
  }

  return (
    <ResetCodeForm
      email={email} setEmail={setEmail}
      loading={loading} error={error} success={success}
      onSubmit={handleRequestCode}
    />
  )
}