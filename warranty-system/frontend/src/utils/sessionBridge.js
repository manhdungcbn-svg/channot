/**
 * Bàn giao phiên đăng nhập giữa app BảoHành Pro (5174) và storefront (5175).
 *
 * VÌ SAO CẦN CÁI NÀY?
 * `localStorage` CHIA THEO ORIGIN — `localhost:5174` và `localhost:5175` là hai
 * origin khác nhau nên KHÔNG dùng chung được storage. Nếu chỉ dựa vào
 * localStorage thì khách đăng nhập ở web bán hàng, bấm "Bảo hành Pro" sẽ bị
 * đá về trang login.
 *
 * GIẢI PHÁP: truyền token qua fragment (`#s=...`) của URL. Fragment KHÔNG
 * được gửi lên server (nên không rò rỉ vào access log) và app đích nhận được
 * ngay lập tức. Sau khi nhận, app đích xoá fragment khỏi URL để token không
 * nằm lại trong lịch sử trình duyệt.
 *
 * LƯU Ý: fragment KHÔNG dùng `&` làm separator (sẽ bị hiểu là query param),
 * nên payload được đóng gói base64url trong 1 segment duy nhất.
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/** Fragment chứa token, ví dụ: `#s=eyJ0b2tlbiI6...` */
export const SESSION_FRAGMENT_KEY = 's';

/**
 * Đóng gói session thành 1 chuỗi base64url an toàn để gắn vào URL.
 * @param {string|null} token
 * @param {object|null} user
 * @returns {string} chuỗi rỗng nếu không có token
 */
export function encodeSession(token, user) {
  if (!token) return '';
  try {
    const payload = JSON.stringify({ t: token, u: user ?? null });
    // btoa chỉ hỗ trợ latin1 → encode UTF-8 trước.
    const utf8 = unescape(encodeURIComponent(payload));
    return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

/**
 * Giải mã chuỗi session.
 * @param {string} encoded
 * @returns {{token: string, user: object|null}|null}
 */
export function decodeSession(encoded) {
  if (!encoded) return null;
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const data = JSON.parse(json);
    if (!data?.t) return null;
    return { token: data.t, user: data.u ?? null };
  } catch {
    return null;
  }
}

/**
 * Đọc token + user hiện tại từ localStorage.
 * @returns {{token: string|null, user: object|null}}
 */
export function readSession() {
  try {
    let user = null;
    try {
      user = JSON.parse(window.localStorage.getItem(USER_KEY) || 'null');
    } catch {
      user = null;
    }
    return { token: window.localStorage.getItem(TOKEN_KEY), user };
  } catch {
    return { token: null, user: null };
  }
}

/**
 * Ghi session vào localStorage.
 * @param {string} token
 * @param {object|null} user
 */
export function writeSession(token, user) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage bị chặn → bỏ qua */
  }
}

/**
 * Dựng URL sang app khác kèm session (nếu đang đăng nhập).
 *
 * @param {string} baseUrl — ví dụ `http://localhost:5174`
 * @param {string} [path] — path đích, ví dụ `/my-products`
 * @returns {string}
 */
export function buildCrossAppUrl(baseUrl, path = '/') {
  const { token, user } = readSession();
  const encoded = encodeSession(token, user);
  const base = `${String(baseUrl).replace(/\/+$/, '')}${path}`;
  return encoded ? `${base}#${SESSION_FRAGMENT_KEY}=${encoded}` : base;
}

/**
 * Kiểm tra fragment của URL hiện tại có chứa session không.
 * @returns {boolean}
 */
export function hasSessionFragment() {
  if (typeof window === 'undefined') return false;
  return window.location.hash.includes(`${SESSION_FRAGMENT_KEY}=`);
}

/**
 * Nhận session từ fragment URL → lưu vào localStorage → xoá fragment.
 *
 * Gọi 1 lần khi app khởi động. Nếu fragment có token hợp lệ, trả về user để
 * app dùng ngay (tránh nháy màn hình login).
 *
 * @returns {{token: string, user: object|null}|null}
 */
export function consumeSessionFragment() {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const encoded = params.get(SESSION_FRAGMENT_KEY);
  if (!encoded) return null;

  const session = decodeSession(encoded);
  // Xoá fragment ngay, kể cả khi decode lỗi (không để token nằm lại trong URL).
  params.delete(SESSION_FRAGMENT_KEY);
  const rest = params.toString();
  const nextHash = rest ? `#${rest}` : '';
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${window.location.search}${nextHash}`,
  );

  if (!session) return null;
  writeSession(session.token, session.user);
  return session;
}

export default {
  SESSION_FRAGMENT_KEY,
  encodeSession,
  decodeSession,
  readSession,
  writeSession,
  buildCrossAppUrl,
  hasSessionFragment,
  consumeSessionFragment,
};
