/**
 * Gộp className có điều kiện (thay thế clsx, không cần thư viện).
 * @param {...(string|false|null|undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default cn;
