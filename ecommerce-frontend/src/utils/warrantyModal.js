/**
 * Mở modal "Đăng ký bảo hành" từ bất kỳ đâu trong storefront.
 *
 * Modal được mount ở `SiteHeader` (nơi duy nhất giữ state), nên các component
 * khác chỉ cần phát sự kiện toàn cục. Cách này tránh việc phải nâng state
 * modal lên tận App (và tránh render 2 modal).
 */

const EVENT_NAME = 'warranty:register';

/**
 * Mở modal đăng ký bảo hành, tuỳ chọn prefill serial.
 * @param {string} [serial] — mã serial sản phẩm
 */
export function openWarrantyRegister(serial = '') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { serial } }));
}

/**
 * Đăng ký listener — trả về hàm để huỷ listener.
 * @param {(serial: string) => void} handler
 * @returns {() => void}
 */
export function onOpenWarrantyRegister(handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (event) => handler(event.detail?.serial ?? '');
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

export default { openWarrantyRegister, onOpenWarrantyRegister };
