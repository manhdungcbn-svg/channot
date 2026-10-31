import { useState } from 'react';
import { Close, Eye, EyeOff, Shield } from '../icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Modal nhắc đổi mật khẩu sau khi nhận tài khoản tự tạo (SĐT/SĐT).
 * Có nút X ở góc trên bên phải để người dùng có thể bỏ qua nếu muốn đổi sau.
 */
export function MustChangePasswordModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const { show } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user?.must_change_password) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          old_password: oldPassword || user.phone || undefined,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
      }

      show('Đã cập nhật mật khẩu mới thành công!', { tone: 'success' });
      if (updateUser && data.user) {
        updateUser(data.user);
      } else {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.must_change_password = false;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in"
      >
        {/* Nút X bỏ qua */}
        <button
          type="button"
          aria-label="Bỏ qua đổi mật khẩu"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-surface-hover hover:text-ink-900"
        >
          <Close className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="border-b border-line-100 bg-brand-50/70 p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
            <Shield className="h-7 w-7" />
          </div>
          <h2 id="change-password-title" className="text-xl font-bold text-ink-900">
            Đổi mật khẩu bảo mật
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
            Tài khoản của bạn được tạo tự động khi mua hàng (mật khẩu ban đầu là số điện thoại). Vui lòng đặt mật khẩu mới để bảo vệ tài khoản.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-status-danger/40 bg-status-danger-bg p-3 text-xs font-semibold text-status-danger-text">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Mật khẩu ban đầu (mặc định là SĐT của bạn)
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={user.phone || 'Nhập số điện thoại'}
                className="h-11 w-full rounded-xl border border-line-200 bg-surface-subtle px-3.5 pr-10 text-sm text-ink-900 outline-none focus:border-brand-accent focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Mật khẩu mới (tối thiểu 6 ký tự)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="h-11 w-full rounded-xl border border-line-200 bg-surface-subtle px-3.5 pr-10 text-sm text-ink-900 outline-none focus:border-brand-accent focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="h-11 w-full rounded-xl border border-line-200 bg-surface-subtle px-3.5 text-sm text-ink-900 outline-none focus:border-brand-accent focus:bg-white"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={busy}
              className="btn btn-gradient h-11 w-full text-sm font-semibold text-white shadow-brand hover:opacity-95"
            >
              {busy ? 'Đang cập nhật...' : 'Cập nhật mật khẩu ngay'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-center font-medium text-ink-500 hover:text-ink-800 transition-colors py-1"
            >
              Để sau (bỏ qua lần này)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MustChangePasswordModal;
