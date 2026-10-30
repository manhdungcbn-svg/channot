/**
 * Trạng thái "đang mở modal" dùng chung.
 *
 * Khi modal (đăng nhập / đăng ký bảo hành) mở, các thanh cố định ở đáy màn
 * hình (ví dụ thanh "Đặt hàng" trong giỏ hàng) sẽ bị overlay phủ lên và trông
 * rất rối. Các modal gọi `setModalOpen(true/false)`; các thanh cố định theo dõi
 * qua `onModalOpenChange` để tự ẩn.
 */

const ATTRIBUTE = 'data-modal-open';
const EVENT_NAME = 'ui:modal-open';

/**
 * Bật/tắt cờ "đang mở modal".
 * @param {boolean} open
 */
export function setModalOpen(open) {
  if (typeof document === 'undefined') return;
  if (open) document.body.setAttribute(ATTRIBUTE, 'true');
  else document.body.removeAttribute(ATTRIBUTE);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { open } }));
}

/**
 * Đăng ký listener — trả về hàm huỷ listener.
 * @param {(open: boolean) => void} handler
 * @returns {() => void}
 */
export function onModalOpenChange(handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (event) => handler(Boolean(event.detail?.open));
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

export default { setModalOpen, onModalOpenChange };
