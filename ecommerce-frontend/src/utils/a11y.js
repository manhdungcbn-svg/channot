/**
 * Hỗ trợ a11y: trap focus trong một container (dùng cho modal/drawer).
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Lấy danh sách phần tử có thể focus bên trong container.
 * @param {HTMLElement|null} container
 * @returns {HTMLElement[]}
 */
export function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

/**
 * Trap focus: khi người dùng Tab ra khỏi container, đưa focus về phần tử hợp lệ.
 * @param {HTMLElement|null} container
 * @param {KeyboardEvent} event
 * @returns {void}
 */
export function trapFocus(container, event) {
  if (!container || event.key !== 'Tab') return;

  const focusables = getFocusable(container);
  if (focusables.length === 0) {
    event.preventDefault();
    container.focus?.();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Trả về nhãn trợ năng chuẩn cho slide carousel.
 * @param {number} index
 * @param {number} total
 * @returns {string}
 */
export function slideLabel(index, total) {
  return `Slide ${index + 1} trên ${total}`;
}
