/**
 * Tạo ảnh SVG data-URI nội bộ (gradient + nhãn) để giao diện vẫn hiển thị đúng
 * khi không có mạng hoặc ảnh ngoài bị chặn. Không phụ thuộc CDN.
 */

/**
 * @param {string} label
 * @param {{ from?: string, to?: string, accent?: string }} [options]
 * @returns {string} data-URI
 */
export function createProductImage(label, options = {}) {
  const {
    from = '#EEF2FF',
    to = '#FFFFFF',
    accent = '#4F46E5',
  } = options;

  const safeLabel = String(label).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <circle cx="300" cy="270" r="150" fill="${accent}" opacity="0.10"/>
  <rect x="150" y="140" width="300" height="270" rx="24" fill="none" stroke="${accent}" stroke-width="8" opacity="0.55"/>
  <path d="M210 410 L300 200 L390 410" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
  <text x="300" y="500" font-family="DM Sans, Segoe UI, sans-serif" font-size="40" font-weight="700" fill="${accent}" text-anchor="middle">${safeLabel}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}
