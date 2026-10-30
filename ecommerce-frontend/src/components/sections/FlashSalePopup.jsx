import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Check, Close, Fire, Truck } from '../icons';
import { cn } from '../../utils/cn';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  FLASH_SALE_BANNER,
  FLASH_SALE_BANNER_WIDTH,
  FLASH_SALE_BANNER_HEIGHT,
} from '../../data/flashSaleBanner';

/** Khoá session: popup chỉ hiện 1 lần mỗi phiên trình duyệt. */
export const FLASH_PROMO_SEEN_KEY = 'shop:flash-promo-seen';

/** Thời gian tự đóng (giây). */
const AUTO_CLOSE_SECONDS = 5;

/** Danh sách mã giảm giá đang có hiệu lực (khớp với CartPage). */
const COUPON_CODES = ['WELCOME10', 'FREESHIP', 'SAVE50'];

function readSeenFlag() {
  try {
    return window.sessionStorage.getItem(FLASH_PROMO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSeenFlag() {
  try {
    window.sessionStorage.setItem(FLASH_PROMO_SEEN_KEY, '1');
  } catch {
    /* bỏ qua lỗi storage (private mode / sandbox) */
  }
}

/**
 * Popup quảng cáo flash sale: hiện 1 lần/phiên sau khi khách đăng nhập.
 *
 * - Ảnh banner được TẠO bằng SVG trong code (không tải từ mạng ngoài).
 * - Tự đóng sau 5 giây, có thanh progress đếm ngược.
 * - Đóng được bằng nút ✕, nút "Để sau" hoặc phím Esc.
 * - KHÔNG khoá cuộn trang (popup quảng cáo không nên chặn người dùng đọc).
 *
 * @param {object} props
 * @param {boolean} [props.open] - trạng thái mở (alias: isOpen)
 * @param {boolean} [props.isOpen] - alias của `open`
 * @param {() => void} props.onClose
 */
export function FlashSalePopup({ open, isOpen, onClose }) {
  const isVisible = Boolean(open ?? isOpen);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS);
  const [allowShow, setAllowShow] = useState(false);
  const navigate = useNavigate();
  const ctaRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // Chỉ hiện 1 lần/phiên — đọc cờ sessionStorage mỗi lần popup mở.
  // Chỉ render nội dung khi cờ báo "chưa xem"; ghi cờ ngay khi mở lần đầu.
  useEffect(() => {
    if (!isVisible) {
      setAllowShow(false);
      return;
    }
    if (readSeenFlag()) {
      setAllowShow(false);
      return;
    }
    setAllowShow(true);
    writeSeenFlag();
  }, [isVisible]);

  // Đếm ngược 5 giây + tự đóng.
  useEffect(() => {
    if (!isVisible) return undefined;
    setSecondsLeft(AUTO_CLOSE_SECONDS);

    const tick = window.setInterval(() => {
      setSecondsLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    const closeTimer = window.setTimeout(
      () => onClose?.(),
      AUTO_CLOSE_SECONDS * 1000,
    );

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(closeTimer);
    };
  }, [isVisible, onClose]);

  // Esc đóng được + đưa focus vào nút CTA (KHÔNG khoá cuộn trang).
  useEffect(() => {
    if (!isVisible) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);

    const focusTimer = window.setTimeout(() => ctaRef.current?.focus(), 60);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isVisible, onClose]);

  const goToFlashSale = useCallback(() => {
    onClose?.();
    navigate('/search?discount=1');
  }, [navigate, onClose]);

  if (!isVisible || !allowShow) return null;

  const progress = (secondsLeft / AUTO_CLOSE_SECONDS) * 100;

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center overflow-y-auto bg-ink-900/60 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flash-sale-title"
        className={cn(
          'relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-surface-card shadow-2xl',
          reducedMotion ? '' : 'animate-fade-in-up',
        )}
      >
        {/* Nút đóng */}
        <button
          type="button"
          aria-label="Đóng"
          onClick={() => onClose?.()}
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-sm transition-colors duration-150 hover:bg-white hover:text-ink-900"
        >
          <Close className="h-5 w-5" />
        </button>

        {/* Ảnh banner (SVG tạo bằng code) */}
        <img
          src={FLASH_SALE_BANNER}
          alt="Flash sale hôm nay — giảm tới 50% cho hơn 200 sản phẩm"
          width={FLASH_SALE_BANNER_WIDTH}
          height={FLASH_SALE_BANNER_HEIGHT}
          className="h-auto w-full bg-ink-900 object-cover"
        />

        {/* Nội dung */}
        <div className="px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-flash-100 px-3 py-1 text-2xs font-bold uppercase tracking-wide text-flash-700">
              <Fire className="h-3.5 w-3.5" />
              Flash sale
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-2xs font-bold uppercase tracking-wide text-brand-700">
              <Truck className="h-3.5 w-3.5" />
              Miễn phí vận chuyển
            </span>
          </div>

          <h2
            id="flash-sale-title"
            className="mt-3 text-xl font-bold tracking-tight text-ink-900"
          >
            FLASH SALE HÔM NAY — Giảm tới 50%
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
            Chào mừng bạn! Dùng mã{' '}
            <strong className="text-price-600">WELCOME10</strong> để được giảm thêm 10%
            (tối đa 200.000 ₫) cho đơn hàng đầu tiên. Số lượng sản phẩm flash sale có hạn.
          </p>

          {/* Mã giảm giá */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {COUPON_CODES.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-flash-500 bg-flash-50 px-3 py-1.5 text-sm font-bold tracking-wide text-flash-700"
              >
                <Check className="h-3.5 w-3.5" />
                {code}
              </span>
            ))}
          </div>

          {/* CTA + nút phụ */}
          <div className="mt-5 flex flex-col gap-2">
            <button
              ref={ctaRef}
              type="button"
              onClick={goToFlashSale}
              className="btn btn-gradient min-h-[52px] w-full px-6 text-base"
            >
              Xem ngay sản phẩm giảm giá
            </button>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="btn btn-secondary min-h-[44px] w-full text-sm"
            >
              Để sau
            </button>
          </div>

          {/* Đếm ngược 5 giây + thanh progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-ink-500">
              <span>Tự đóng sau {secondsLeft}s</span>
              <span className="tabular-nums">Nhấn Esc để đóng</span>
            </div>
            <div
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line-100"
              role="progressbar"
              aria-label="Thời gian tự đóng còn lại"
              aria-valuemin={0}
              aria-valuemax={AUTO_CLOSE_SECONDS}
              aria-valuenow={secondsLeft}
            >
              <div
                className={cn(
                  'h-full rounded-full bg-flash-500',
                  reducedMotion ? '' : 'transition-[width] duration-1000 ease-linear',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default FlashSalePopup;
