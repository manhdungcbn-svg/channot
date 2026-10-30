/**
 * Ảnh quảng cáo flash sale — TẠO BẰNG CODE (SVG) để không phụ thuộc asset ngoài.
 *
 * Vì sao dùng data-URI?
 *  - Không cần file nhị phân, không cần network, không rủi ro link chết.
 *  - Nhúng thẳng vào <img src="data:image/svg+xml,..."> hoặc background-image.
 *  - Build Vite không cần khai báo asset, chạy được cả khi offline.
 *
 * Thiết kế (viewBox 1200×600 — tỉ lệ 2:1 cho banner ngang trong modal):
 *  - Lớp 1: nền gradient tím đậm → tím → đỏ → cam.
 *  - Lớp 2: hai vòng sáng toả (radial gradient) ở góc phải và góc trái.
 *  - Lớp 3: tia sáng loé toả từ góc trên-phải.
 *  - Lớp 4: hạt confetti / kim tuyến rải rác.
 *  - Lớp 5: chữ lớn "FLASH SALE", ribbon "HÔM NAY", dòng "Giảm tới 50%".
 *  - Lớp 6: badge tròn "-50%" xoay nhẹ.
 *  - Lớp 7: bóng sản phẩm (tivi 4K + loa Bluetooth) + dải mã giảm giá.
 *
 * Lưu ý XML: mọi ký tự "&" đều phải escape thành "&amp;".
 */

const FLASH_SALE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600" role="img" aria-label="Flash sale hôm nay - giảm tới 50%">
  <defs>
    <linearGradient id="fsBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2E1065"/>
      <stop offset="30%" stop-color="#5B21B6"/>
      <stop offset="62%" stop-color="#BE123C"/>
      <stop offset="100%" stop-color="#F97316"/>
    </linearGradient>
    <radialGradient id="fsGlowWarm" cx="0.82" cy="0.14" r="0.6">
      <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.9"/>
      <stop offset="42%" stop-color="#FB923C" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#FB923C" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fsGlowCool" cx="0.1" cy="0.95" r="0.55">
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#A78BFA" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fsRibbon" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="60%" stop-color="#FB923C"/>
      <stop offset="100%" stop-color="#EF4444"/>
    </linearGradient>
    <linearGradient id="fsBadge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="55%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
    <linearGradient id="fsScreen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22D3EE"/>
      <stop offset="55%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#312E81"/>
    </linearGradient>
    <linearGradient id="fsSpeaker" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#C7D2FE"/>
    </linearGradient>
    <linearGradient id="fsStrip" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#DB2777"/>
    </linearGradient>
    <linearGradient id="fsShine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Lớp 1: nền gradient -->
  <rect width="1200" height="600" fill="url(#fsBg)"/>

  <!-- Lớp 2: vòng sáng toả -->
  <rect width="1200" height="600" fill="url(#fsGlowWarm)"/>
  <rect width="1200" height="600" fill="url(#fsGlowCool)"/>

  <!-- Lớp 3: tia sáng loé từ góc trên-phải -->
  <g opacity="0.26" fill="#FEF3C7">
    <polygon points="1010,0 1200,0 1200,190"/>
    <polygon points="930,0 990,0 1200,400 1200,470"/>
    <polygon points="1090,0 1140,0 1200,120 1200,170"/>
  </g>

  <!-- Lớp 4: confetti / kim tuyến -->
  <g fill="#FDE68A">
    <circle cx="150" cy="80" r="5" opacity="0.9"/>
    <circle cx="268" cy="176" r="3.5" opacity="0.7"/>
    <circle cx="96" cy="300" r="4" opacity="0.6"/>
    <circle cx="392" cy="62" r="3" opacity="0.8"/>
    <circle cx="812" cy="546" r="3.5" opacity="0.5"/>
    <circle cx="640" cy="92" r="3" opacity="0.6"/>
    <circle cx="452" cy="512" r="3" opacity="0.5"/>
    <circle cx="1180" cy="330" r="3" opacity="0.5"/>
  </g>
  <g fill="#FCA5A5" opacity="0.85">
    <rect x="196" y="404" width="11" height="11" rx="2" transform="rotate(20 201 409)"/>
    <rect x="520" y="130" width="10" height="10" rx="2" transform="rotate(-15 525 135)"/>
    <rect x="884" y="392" width="11" height="11" rx="2" transform="rotate(35 889 397)"/>
    <rect x="336" y="248" width="9" height="9" rx="2" transform="rotate(45 340 252)"/>
  </g>
  <g fill="#67E8F9" opacity="0.75">
    <circle cx="742" cy="196" r="3.5"/>
    <circle cx="1006" cy="470" r="3"/>
    <circle cx="60" cy="470" r="3"/>
  </g>

  <!-- Lớp 5: chữ lớn -->
  <text x="80" y="176" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="96" font-weight="800" fill="#FFFFFF" letter-spacing="-2">FLASH SALE</text>

  <!-- Ribbon "HÔM NAY" -->
  <g transform="translate(80 206)">
    <path d="M0 0 H326 L306 27 L326 54 H0 L20 27 Z" fill="url(#fsRibbon)"/>
    <text x="163" y="37" text-anchor="middle" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" letter-spacing="3">HÔM NAY</text>
  </g>

  <!-- Dòng giảm giá -->
  <text x="80" y="352" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="46" font-weight="800" fill="#FDE68A">Giảm tới 50%</text>
  <rect x="80" y="372" width="330" height="8" rx="4" fill="#22D3EE" opacity="0.9"/>

  <text x="80" y="424" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="21" font-weight="600" fill="#FDE7F3">200+ sản phẩm đang giảm giá · Miễn phí vận chuyển</text>
  <text x="80" y="456" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="19" font-weight="500" fill="#E9D5FF">Số lượng có hạn, kết thúc khi hết hàng</text>

  <!-- Dải mã giảm giá -->
  <g transform="translate(80 492)">
    <rect x="0" y="0" width="430" height="46" rx="23" fill="url(#fsStrip)"/>
    <rect x="0" y="0" width="430" height="46" rx="23" fill="url(#fsShine)"/>
    <text x="24" y="30" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="19" font-weight="700" fill="#FFFFFF">Mã ưu đãi: WELCOME10</text>
  </g>

  <!-- Lớp 6: badge tròn -50% -->
  <g transform="translate(1012 148) rotate(-12)">
    <circle r="92" fill="url(#fsBadge)" stroke="#FFF7ED" stroke-width="7"/>
    <circle r="76" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.55" stroke-dasharray="7 10"/>
    <text x="0" y="-6" text-anchor="middle" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="800" fill="#FFFFFF">50%</text>
    <text x="0" y="32" text-anchor="middle" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="21" font-weight="800" fill="#FFF7ED">GIẢM</text>
  </g>

  <!-- Lớp 7: bóng sản phẩm -->
  <!-- Tivi 4K -->
  <g transform="translate(660 300)">
    <rect x="0" y="0" width="330" height="205" rx="18" fill="#111827" opacity="0.9"/>
    <rect x="14" y="14" width="302" height="150" rx="10" fill="url(#fsScreen)"/>
    <path d="M14 164 L110 60 L186 164 Z" fill="#FFFFFF" opacity="0.16"/>
    <rect x="120" y="176" width="90" height="10" rx="5" fill="#312E81"/>
    <rect x="146" y="186" width="38" height="8" rx="4" fill="#4F46E5"/>
    <text x="165" y="140" text-anchor="middle" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="800" fill="#FFFFFF" opacity="0.92">4K</text>
  </g>

  <!-- Loa Bluetooth -->
  <g transform="translate(1010 330)">
    <rect x="0" y="0" width="118" height="168" rx="24" fill="url(#fsSpeaker)" opacity="0.97"/>
    <circle cx="59" cy="62" r="34" fill="#312E81" opacity="0.9"/>
    <circle cx="59" cy="62" r="21" fill="#4F46E5" opacity="0.95"/>
    <circle cx="59" cy="62" r="8" fill="#C7D2FE"/>
    <rect x="36" y="112" width="46" height="9" rx="4.5" fill="#312E81" opacity="0.5"/>
    <rect x="46" y="132" width="26" height="7" rx="3.5" fill="#312E81" opacity="0.32"/>
    <path d="M132 48 h22 l-14 -14 v30 z" fill="#22D3EE"/>
    <path d="M154 48 h18" stroke="#22D3EE" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M166 34 c11 7 11 21 0 28" stroke="#22D3EE" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.85"/>
  </g>
</svg>`;

/**
 * Data-URI sẵn sàng dùng cho thẻ <img src={...}>.
 * @type {string}
 */
export const FLASH_SALE_BANNER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  FLASH_SALE_SVG,
)}`;

/**
 * Data-URI dạng nền CSS (dùng cho background-image).
 * @type {string}
 */
export const FLASH_SALE_BANNER_CSS = `url("${FLASH_SALE_BANNER}")`;

/** Kích thước gốc của ảnh (dùng cho thuộc tính width/height tránh layout shift). */
export const FLASH_SALE_BANNER_WIDTH = 1200;
export const FLASH_SALE_BANNER_HEIGHT = 600;

export default FLASH_SALE_BANNER;
