import { useEffect, useRef, useState } from 'react';
import { Check, Close, Shield, User } from '../icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buildCrossAppUrl } from '../../utils/sessionBridge';
import { openLoginModal } from '../../utils/loginModal';
import { registerWarranty } from '../../api/warranty';
import { setModalOpen } from '../../utils/modalState';

/** URL của app BảoHành Pro (dev: cổng 5174). */
const WARRANTY_APP_URL =
  import.meta.env.VITE_WARRANTY_APP_URL || 'http://localhost:5174';

/**
 * Modal "Đăng ký bảo hành" trên storefront.
 *
 * Luồng:
 * 1. Khách nhập mã serial (in trên tem vỏ/hộp sản phẩm).
 * 2. Nếu chưa đăng nhập → hiện lời nhắc thân thiện + nút "Đăng nhập" (mở modal
 *    đăng nhập dùng chung `LoginModal` — 1 nơi duy nhất để sửa form đăng nhập).
 * 3. Gọi `/api/shop/warranty/register` → sản phẩm được gán vào tài khoản.
 * 4. Nút "Đăng ký bảo hành" trong header đổi thành link sang app bảo hành.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} [props.initialSerial]
 */
export function WarrantyRegisterModal({ isOpen, onClose, initialSerial = '' }) {
  const { user } = useAuth();
  const { show } = useToast();

  const [serial, setSerial] = useState(initialSerial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Reset khi mở lại modal.
  useEffect(() => {
    if (!isOpen) return;
    setSerial(initialSerial);
    setError('');
    setBusy(false);
    // Focus vào ô đầu tiên để bàn phím dễ dùng.
    window.setTimeout(() => firstFieldRef.current?.focus(), 60);
  }, [isOpen, initialSerial]);

  // Đóng bằng Esc + khoá cuộn nền.
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
      // Trap focus trong modal.
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

  const handleRegister = async (event) => {
    event?.preventDefault?.();
    setError('');
    setBusy(true);
    try {
      const result = await registerWarranty(serial);
      show(result.message, { tone: result.registered ? 'success' : 'info' });
      if (result.registered) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Không thể đăng ký bảo hành. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  /** Submit đăng ký bảo hành (nút nằm ở footer cố định). */
  const handleRegisterSubmit = () => handleRegister();

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
        aria-labelledby="warranty-register-title"
        className="my-auto flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start gap-3 border-b border-line-100 bg-brand-50/60 px-5 py-5 sm:px-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            <Shield className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="warranty-register-title" className="text-lg font-bold text-ink-900 sm:text-xl">
              Đăng ký bảo hành
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-700">
              Kích hoạt bảo hành để theo dõi &amp; gửi yêu cầu sửa chữa dễ dàng hơn.
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

          {!user ? (
            /* Chưa đăng nhập — hướng dẫn rõ ràng, 1 nút bấm là xong */
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl bg-surface-subtle px-4 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <User className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink-900">
                    Bạn cần đăng nhập để đăng ký bảo hành
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">
                    Đăng nhập xong, bạn chỉ cần dán mã serial là xong. Nếu chưa có tài khoản, bấm
                    &ldquo;Tạo tài khoản&rdquo; để đăng ký trong 1 phút.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  openLoginModal('login');
                }}
                className="btn btn-gradient h-14 w-full text-base"
              >
                <User className="h-5 w-5" />
                Đăng nhập / Đăng ký ngay
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label
                  htmlFor="wr-serial"
                  className="mb-2 block text-sm font-semibold text-ink-900"
                >
                  Mã serial sản phẩm
                </label>
                <input
                  id="wr-serial"
                  ref={firstFieldRef}
                  type="text"
                  required
                  value={serial}
                  onChange={(event) => setSerial(event.target.value.toUpperCase())}
                  placeholder="VD: TND-AC10-001"
                  className="h-14 w-full rounded-xl border-2 border-line-200 bg-white px-4 font-mono text-base uppercase text-ink-900 placeholder:font-sans placeholder:normal-case placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-accent focus:outline-none"
                />
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Serial nằm trên tem vỏ hoặc hộp sản phẩm. Nếu không có, liên hệ hotline 1900
                  6868.
                </p>
              </div>

              <div className="rounded-xl bg-surface-subtle px-4 py-3">
                <p className="text-sm leading-relaxed text-ink-700">
                  Đang đăng nhập với{' '}
                  <span className="font-semibold">{user?.email ?? 'tài khoản của bạn'}</span>. Sản
                  phẩm sẽ xuất hiện ở trang <span className="font-semibold">Sản phẩm của tôi</span> trong
                  app BảoHành Pro.
                </p>
              </div>

              {/* Nút submit ẩn — để phím Enter trong ô nhập vẫn hoạt động */}
              <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
                Kích hoạt bảo hành
              </button>
            </form>
          )}
        </div>

        {/* Footer — nút hành động luôn tới được + link sang app bảo hành */}
        <div className="shrink-0 border-t border-line-100 bg-white px-5 py-4 sm:px-6">
          {user ? (
            <button
              type="button"
              onClick={handleRegisterSubmit}
              disabled={busy || !serial.trim()}
              className="btn btn-gradient h-14 w-full text-base"
            >
              {busy ? 'Đang đăng ký...' : 'Kích hoạt bảo hành'}
            </button>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-100 pt-3">
            <p className="flex items-center gap-1.5 text-sm text-ink-600">
              <Check className="h-4 w-4 text-status-success" />
              Tra cứu bảo hành miễn phí
            </p>
            <a
              href={buildCrossAppUrl(WARRANTY_APP_URL, '/my-products')}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-brand-600 transition-colors duration-150 hover:text-brand-700"
            >
              Mở app BảoHành Pro →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarrantyRegisterModal;
