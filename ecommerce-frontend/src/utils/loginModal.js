/**
 * Mở modal "Đăng nhập" từ bất kỳ đâu trong storefront.
 *
 * Modal được mount ở `SiteHeader` (nơi duy nhất giữ state), nên các component
 * khác chỉ cần phát sự kiện toàn cục. Cách này tránh việc phải nâng state
 * modal lên tận App (và tránh render 2 modal).
 *
 * Tương tự `warrantyModal.js` — nhưng cho luồng đăng nhập.
 */

const EVENT_NAME = 'auth:login';

/**
 * Mở modal đăng nhập.
 * @param {'login'|'register'|'forgot'} [mode='login']
 */
export function openLoginModal(mode = 'login') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { mode } }));
}

/**
 * Đăng ký listener — trả về hàm để huỷ listener.
 * @param {(mode: string) => void} handler
 * @returns {() => void}
 */
export function onOpenLoginModal(handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (event) => handler(event.detail?.mode ?? 'login');
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

export default { openLoginModal, onOpenLoginModal };
