import { useState } from 'react'
import { authService } from '../../services/services'

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  technician: 'Kỹ thuật viên',
  customer: 'Khách hàng',
}

export default function ProfileTab({ user, onUserUpdate }) {
  const [name, setName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Tên không được trống'); return }
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      await authService.updateProfile({ full_name: name.trim(), phone: phone.trim() || undefined })
      onUserUpdate({ ...user, full_name: name.trim(), phone: phone.trim() })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Cập nhật thất bại')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={user?.full_name} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: '#1A3A6B' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1F2937' }}>{user?.full_name}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{user?.email}</p>
          <p className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block" style={{ background: '#EEF4FF', color: '#2563EB' }}>
            {ROLE_LABELS[user?.role] || user?.role}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Họ và tên</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={{ borderColor: '#D1DCF0', background: '#F8FAFC', color: '#0F1929' }}
          placeholder="Nguyễn Văn A" required />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Số điện thoại</label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={{ borderColor: '#D1DCF0', background: '#F8FAFC', color: '#0F1929' }}
          placeholder="0912 345 678" />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Email</label>
        <input type="email" value={user?.email} disabled
          className="w-full px-4 py-3 rounded-xl border text-sm"
          style={{ borderColor: '#E5E7EB', background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }}
          placeholder="Không thể thay đổi" />
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Email không thể thay đổi</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: '#D1FAE5', color: '#065F46' }}>
          <CheckIcon /> Cập nhật thành công!
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: loading ? '#94A3B8' : '#1A3A6B', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </form>
  )
}