/**
 * Định dạng tiền tệ & số liệu.
 * Toàn bộ logic thuần, không phụ thuộc thư viện ngoài.
 */

const VND_FORMAT = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
});

/**
 * Định dạng số nguyên theo chuẩn Việt Nam (dấu chấm phân tách nghìn).
 * @param {number|string} value
 * @returns {string}
 */
export function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return VND_FORMAT.format(n);
}

/**
 * Định dạng giá tiền Việt Nam: 12990000 → "12.990.000 ₫"
 * @param {number|string} value
 * @param {{ withSymbol?: boolean }} [options]
 * @returns {string}
 */
export function formatPrice(value, options = {}) {
  const { withSymbol = true } = options;
  const formatted = formatNumber(value);
  return withSymbol ? `${formatted} ₫` : formatted;
}

/**
 * Định dạng giá rút gọn: 12990000 → "12,99 triệu"
 * @param {number|string} value
 * @returns {string}
 */
export function formatPriceShort(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000_000) {
    const v = n / 1_000_000_000;
    return `${v.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  }
  if (Math.abs(n) >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} triệu`;
  }
  if (Math.abs(n) >= 1_000) {
    const v = n / 1_000;
    return `${v.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}k`;
  }
  return formatNumber(n);
}

/**
 * Định dạng khoản trả góp: (12990000, 12) → "1.082.500 ₫/kỳ × 12"
 * @param {number|string} price
 * @param {number} [months]
 * @returns {string}
 */
export function formatInstallment(price, months = 12) {
  const n = Number(price);
  const m = Number(months) || 12;
  if (!Number.isFinite(n) || n <= 0) return '';
  const per = Math.round(n / m);
  return `${formatPrice(per)}/kỳ × ${m}`;
}

/**
 * Định dạng số lượng đã bán: 1234 → "1,2k", 123456 → "123k"
 * @param {number|string} value
 * @returns {string}
 */
export function formatSold(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}k`;
  }
  return formatNumber(n);
}

/**
 * Phần trăm giảm giá: (9000000, 12000000) → 25
 * @param {number} current
 * @param {number} original
 * @returns {number}
 */
export function discountPercent(current, original) {
  const c = Number(current);
  const o = Number(original);
  if (!Number.isFinite(c) || !Number.isFinite(o) || o <= 0 || c >= o) return 0;
  return Math.round(((o - c) / o) * 100);
}
