import { forwardRef, useEffect, useRef, useState } from 'react';
import { Check, Close, Eye, EyeOff, Shield } from '../icons';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requestResetCode, resetPassword } from '../../api/auth';
import { setModalOpen } from '../../utils/modalState';

/**
 * Modal đăng nhập / đăng ký / quên mật khẩu — thiết kế cho người ít dùng công nghệ.
 *
 * NGUYÊN TẮC THIẾT KẾ:
 * 1. Chữ TO, dễ đọc (nhãn 15px, nội dung ô nhập 16px — không bị zoom trên iOS).
 * 2. Ô nhập CAO (56px) + padding rộng → chữ KHÔNG BAO GIỜ bị che/khuất.
 * 3. Nút to, rõ, luôn nằm trong tầm ngón tay → bấm 1 lần là xong.
 * 4. Nút "Xem mật khẩu" để không phải gõ lại khi sai.
 * 5. Thông báo lỗi bằng LỜI THÔNG THƯƠNG, có gợi ý cách xử lý.
 * 6. Không bắt buộc người dùng nhớ mật khẩu cũ (có luồng quên mật khẩu).
 * 7. Mọi trạng thái đều có nhãn rõ ràng: đang làm gì, kết quả ra sao.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} [props.initialMode='login'] — 'login' | 'register' | 'forgot'
 */
export function LoginModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, register } = useAuth();
  const { show } = useToast();

  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Login / register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Quên mật khẩu
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Reset mỗi lần mở modal.
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setBusy(false);
    setError('');
    setNotice('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setFullName('');
    setPhone('');
    setResetCode('');
    setNewPassword('');
    setShowNewPassword(false);
    setCodeSent(false);
    window.setTimeout(() => firstFieldRef.current?.focus(), 80);
  }, [isOpen, initialMode]);

  // Đóng bằng Esc + trap focus.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = panelRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), a[href], select, textarea',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  // Báo cho các lớp dưới biết modal đang mở (để ẩn thanh cố định đáy màn hình).
  useEffect(() => {
    if (!isOpen) return undefined;
    setModalOpen(true);
    return () => setModalOpen(false);
  }, [isOpen]);

  if (!isOpen) return null;

  /** Chuyển chế độ — luôn xoá lỗi cũ để không gây rối. */
  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
    window.setTimeout(() => firstFieldRef.current?.focus(), 60);
  };

  const handleAuth = async (event) => {
    event?.preventDefault?.();
    setError('');
    setNotice('');

    if (!email.trim() || !password) {
      setError(
        mode === 'login'
          ? 'Vui lòng nhập Email hoặc Số điện thoại cùng mật khẩu.'
          : 'Vui lòng nhập đầy đủ email và mật khẩu.',
      );
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        show('Đăng nhập thành công! Chào mừng bạn trở lại.', { tone: 'success' });
      } else {
        if (!fullName.trim()) {
          setError('Vui lòng nhập họ và tên của bạn.');
          setBusy(false);
          return;
        }
        await register({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        });
        show('Tạo tài khoản thành công! Bạn đã đăng nhập.', { tone: 'success' });
      }
      onClose();
    } catch (err) {
      const raw = err?.message || '';
      setError(translateError(raw, mode));
    } finally {
      setBusy(false);
    }
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email của bạn trước.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const message = await requestResetCode(email.trim());
      setCodeSent(true);
      setNotice(message);
    } catch (err) {
      setError(translateError(err?.message || '', 'forgot'));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (event) => {
    event?.preventDefault?.();
    setError('');
    setNotice('');

    if (!email.trim() || resetCode.trim().length !== 6 || !newPassword) {
      setError('Vui lòng nhập email, mã xác nhận 6 số và mật khẩu mới.');
      return;
    }

    setBusy(true);
    try {
      const message = await resetPassword({
        email: email.trim(),
        code: resetCode.trim(),
        newPassword,
      });
      show(message || 'Đổi mật khẩu thành công. Bạn có thể đăng nhập ngay.', { tone: 'success' });
      switchMode('login');
    } catch (err) {
      setError(translateError(err?.message || '', 'forgot'));
    } finally {
      setBusy(false);
    }
  };

  /** Submit form đăng nhập / đăng ký (nút nằm ở footer cố định). */
  const handleAuthSubmit = () => handleAuth();

  /** Submit form đặt lại mật khẩu (nút nằm ở footer cố định). */
  const handleResetSubmit = () => handleReset();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto overscroll-contain bg-ink-900/60 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="my-auto flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start gap-3 border-b border-line-100 bg-brand-50/60 px-5 py-5 sm:px-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            <Shield className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="login-modal-title" className="text-lg font-bold text-ink-900 sm:text-xl">
              {mode === 'login' && 'Đăng nhập'}
              {mode === 'register' && 'Tạo tài khoản mới'}
              {mode === 'forgot' && 'Quên mật khẩu'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-700">
              {mode === 'login' && 'Nhập Email hoặc Số điện thoại cùng mật khẩu để vào tài khoản.'}
              {mode === 'register' &&
                'Điền thông tin bên dưới để tạo tài khoản. Chỉ mất khoảng 1 phút.'}
              {mode === 'forgot' &&
                'Chúng tôi sẽ gửi mã 6 số về email của bạn để bạn tự đặt mật khẩu mới.'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors duration-150 hover:bg-white hover:text-ink-900 disabled:opacity-50"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        {/* Body — cuộn được để mọi ô nhập đều tới được trên màn hình nhỏ */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6">
          {/* Thông báo lỗi / hướng dẫn */}
          {error ? (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm font-medium leading-relaxed text-status-danger-text"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-danger text-xs font-bold text-white">
                !
              </span>
              <span>{error}</span>
            </div>
          ) : null}

          {notice ? (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-status-success/40 bg-status-success-bg px-4 py-3 text-sm font-medium leading-relaxed text-status-success-text"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-success text-white">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{notice}</span>
            </div>
          ) : null}

          {mode === 'forgot' ? (
            <form onSubmit={handleReset} className="space-y-5">
              <Field
                id="lm-forgot-email"
                label="Email của bạn"
                hint="Email bạn đã dùng khi đăng ký tài khoản"
              >
                <input
                  id="lm-forgot-email"
                  ref={firstFieldRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ban@email.com"
                  className={INPUT_CLASS}
                />
              </Field>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={busy || codeSent}
                className={cn(
                  'btn btn-secondary h-14 w-full text-base',
                  codeSent && 'pointer-events-none opacity-60',
                )}
              >
                {codeSent ? 'Đã gửi mã — kiểm tra email' : 'Gửi mã xác nhận về email'}
              </button>

              <div className="border-t border-line-100 pt-5">
                <Field
                  id="lm-code"
                  label="Mã xác nhận"
                  hint="Mã gồm 6 chữ số, nằm trong email bạn vừa nhận"
                >
                  <input
                    id="lm-code"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(event) =>
                      setResetCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="123456"
                    className={cn(INPUT_CLASS, 'text-center text-xl font-semibold tracking-[0.3em]')}
                  />
                </Field>
              </div>

              <Field
                id="lm-new-password"
                label="Mật khẩu mới"
                hint="Ít nhất 6 ký tự. Nên có chữ cái và số."
              >
                <PasswordInput
                  id="lm-new-password"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNewPassword}
                  onToggle={() => setShowNewPassword((value) => !value)}
                  autoComplete="new-password"
                />
              </Field>

              {/* Nút submit ẩn — để phím Enter trong ô nhập vẫn hoạt động */}
              <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
                Đặt mật khẩu mới
              </button>

              <p className="text-center text-sm text-ink-600">
                Nhớ ra mật khẩu rồi?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
                >
                  Quay lại đăng nhập
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-5">
              {/* Chuyển đổi — nút to, dạng "tab" dễ hiểu */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-subtle p-1.5">
                {[
                  { id: 'login', label: 'Đã có tài khoản' },
                  { id: 'register', label: 'Tạo tài khoản' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchMode(tab.id)}
                    aria-pressed={mode === tab.id}
                    className={cn(
                      'min-h-[48px] rounded-lg px-3 text-sm font-semibold transition-colors duration-150',
                      mode === tab.id
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-ink-600 hover:text-ink-900',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {mode === 'register' ? (
                <Field
                  id="lm-fullname"
                  label="Họ và tên của bạn"
                  hint="Nhập đúng như trên giấy tờ để giao hàng dễ dàng"
                >
                  <input
                    id="lm-fullname"
                    ref={firstFieldRef}
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nguyễn Văn A"
                    className={INPUT_CLASS}
                  />
                </Field>
              ) : null}

              <Field
                id="lm-email"
                label={mode === 'login' ? 'Email hoặc Số điện thoại' : 'Email'}
                hint={
                  mode === 'register'
                    ? 'Sẽ dùng email này để đăng nhập và nhận thông báo đơn hàng'
                    : 'Nhập email hoặc số điện thoại bạn đã đăng ký'
                }
              >
                <input
                  id="lm-email"
                  ref={mode === 'login' ? firstFieldRef : undefined}
                  type={mode === 'login' ? 'text' : 'email'}
                  required
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                  inputMode={mode === 'login' ? 'text' : 'email'}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={mode === 'login' ? 'ban@email.com hoặc 0827461460' : 'ban@email.com'}
                  className={INPUT_CLASS}
                />
              </Field>

              {mode === 'register' ? (
                <Field
                  id="lm-phone"
                  label="Số điện thoại"
                  hint="Không bắt buộc — giúp shop giao hàng nhanh hơn"
                >
                  <input
                    id="lm-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0912345678"
                    className={INPUT_CLASS}
                  />
                </Field>
              ) : null}

              <Field id="lm-password" label="Mật khẩu">
                <PasswordInput
                  id="lm-password"
                  ref={firstFieldRef}
                  value={password}
                  onChange={setPassword}
                  visible={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  hint={
                    mode === 'register'
                      ? 'Ít nhất 6 ký tự. Nên có chữ cái và số.'
                      : undefined
                  }
                />
              </Field>

              {mode === 'login' ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-sm font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              ) : null}

              <p className="text-center text-sm leading-relaxed text-ink-600">
                Tài khoản dùng chung với{' '}
                <span className="font-semibold text-brand-600">BảoHành Pro</span> — đăng nhập một lần là
                dùng được cả hai.
              </p>

              {/* Nút submit ẩn — để phím Enter trong ô nhập vẫn hoạt động */}
              <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
                Đăng nhập
              </button>
            </form>
          )}
        </div>

        {/* Footer cố định — nút hành động luôn tới được, không bị cuộn khuất */}
        <div className="shrink-0 border-t border-line-100 bg-white px-5 py-4 sm:px-6">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={handleResetSubmit}
              disabled={busy}
              className="btn btn-gradient h-14 w-full text-base"
            >
              {busy ? 'Đang đặt mật khẩu mới...' : 'Đặt mật khẩu mới'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAuthSubmit}
              disabled={busy}
              className="btn btn-gradient h-14 w-full text-base"
            >
              {busy
                ? 'Đang xử lý...'
                : mode === 'login'
                  ? 'Đăng nhập'
                  : 'Tạo tài khoản'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Class chung cho ô nhập — cao, rộng, chữ 16px (không bị iOS zoom, không bị che). */
const INPUT_CLASS =
  'h-14 w-full rounded-xl border-2 border-line-200 bg-white px-4 text-base text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-accent focus:outline-none';

/**
 * Nhóm nhãn + gợi ý + ô nhập.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string} [props.hint]
 * @param {import('react').ReactNode} props.children
 */
function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink-900">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Ô nhập mật khẩu có nút "Xem / Ẩn" — giúp người dùng không phải gõ lại.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {boolean} props.visible
 * @param {() => void} props.onToggle
 * @param {string} [props.autoComplete]
 * @param {string} [props.hint]
 */
const PasswordInput = forwardRef(function PasswordInput(
  { id, value, onChange, visible, onToggle, autoComplete, hint },
  ref,
) {
  return (
    <div>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={6}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nhập mật khẩu"
          className={cn(INPUT_CLASS, 'pr-28')}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink-700 transition-colors duration-150 hover:bg-surface-hover hover:text-brand-700"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          <span className="hidden sm:inline">{visible ? 'Ẩn' : 'Xem'}</span>
        </button>
      </div>
      {hint ? <p className="mt-2 text-sm leading-relaxed text-ink-600">{hint}</p> : null}
    </div>
  );
});

/**
 * Dịch lỗi kỹ thuật sang thông báo dễ hiểu + gợi ý cách xử lý.
 * @param {string} raw
 * @param {'login'|'register'|'forgot'} mode
 * @returns {string}
 */
function translateError(raw, mode) {
  const message = String(raw || '').trim();

  if (!message) {
    if (mode === 'forgot') return 'Không hoàn tất được. Vui lòng thử lại sau ít phút.';
    return 'Không đăng nhập được. Vui lòng thử lại.';
  }

  const lower = message.toLowerCase();

  if (lower.includes('email hoặc mật khẩu không đúng')) {
    return 'Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại, hoặc bấm "Quên mật khẩu?" để đặt mật khẩu mới.';
  }
  if (lower.includes('đã được đăng ký')) {
    return 'Email này đã có tài khoản. Hãy bấm "Đã có tài khoản" để đăng nhập, hoặc bấm "Quên mật khẩu?".';
  }
  if (lower.includes('khóa') || lower.includes('423') || lower.includes('vượt quá')) {
    return 'Bạn đã nhập sai mật khẩu quá nhiều lần. Tài khoản tạm thời bị khoá 15 phút — hãy thử lại sau đó.';
  }
  if (lower.includes('mã xác nhận không hợp lệ')) {
    return 'Mã xác nhận không đúng. Hãy kiểm tra lại 6 số trong email, hoặc bấm "Gửi mã xác nhận" để nhận mã mới.';
  }
  if (lower.includes('mã đã hết hạn')) {
    return 'Mã xác nhận đã hết hạn. Hãy bấm "Gửi mã xác nhận về email" để nhận mã mới.';
  }
  if (lower.includes('không tìm thấy')) {
    return 'Không tìm thấy tài khoản với email này. Hãy kiểm tra lại email hoặc tạo tài khoản mới.';
  }
  if (lower.includes('bị vô hiệu hóa')) {
    return 'Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ hotline 0827461460 để được hỗ trợ.';
  }
  if (lower.includes('quá thời gian') || lower.includes('kết nối')) {
    return 'Mạng đang chậm hoặc mất kết nối. Vui lòng kiểm tra mạng rồi thử lại.';
  }
  if (lower.includes('password') || lower.includes('mật khẩu')) {
    return 'Mật khẩu phải có ít nhất 6 ký tự. Vui lòng nhập lại.';
  }

  return message;
}

export { translateError };
export default LoginModal;
