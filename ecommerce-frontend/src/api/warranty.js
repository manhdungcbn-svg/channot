import { request } from './client';

/**
 * API cho luồng "storefront ↔ app bảo hành".
 *
 * LƯU Ý VỀ ĐƯỜNG DẪN: vite proxy rewrite `/api/*` → `/api/v1/*`, nên frontend
 * gọi `/api/shop/...` (không gồm `/v1`).
 */

/**
 * Lấy token hiện tại từ localStorage (dùng chung key với app bảo hành).
 * @returns {string|null}
 */
function authToken() {
  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
}

/**
 * Gọi API có kèm Bearer token.
 * @param {string} url
 * @param {{method?: string, body?: any, signal?: AbortSignal}} [options]
 * @returns {Promise<any>}
 */
function authRequest(url, options = {}) {
  const token = authToken();
  return request(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

/**
 * Đăng ký bảo hành theo serial → gán sản phẩm vào tài khoản khách.
 *
 * Sau khi gọi thành công, sản phẩm sẽ xuất hiện ở trang "Sản phẩm của tôi"
 * trong app bảo hành.
 *
 * @param {string} serial
 * @param {{purchaseDate?: string, signal?: AbortSignal}} [options]
 * @returns {Promise<{registered: boolean, message: string, product: object|null, already_owned: boolean}>}
 */
export async function registerWarranty(serial, options = {}) {
  const clean = String(serial ?? '').trim().toUpperCase();
  if (!clean) {
    throw new Error('Vui lòng nhập mã serial sản phẩm.');
  }

  const data = await authRequest('/api/shop/warranty/register', {
    method: 'POST',
    body: {
      serial: clean,
      ...(options.purchaseDate ? { purchase_date: options.purchaseDate } : {}),
    },
    signal: options.signal,
  });

  return {
    registered: Boolean(data?.registered),
    message: data?.message ?? '',
    product: data?.product ?? null,
    alreadyOwned: Boolean(data?.already_owned),
  };
}

/**
 * Danh sách sản phẩm đã đăng ký bảo hành của tài khoản đang đăng nhập.
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{items: object[], total: number}>}
 */
export async function getMyWarrantyProducts(options = {}) {
  const data = await authRequest('/api/shop/warranty/my-products', {
    signal: options.signal,
  });
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total ?? 0) || 0,
  };
}

/**
 * Tra cứu bảo hành theo serial (public — không cần đăng nhập).
 * @param {string} serial
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>}
 */
export async function lookupWarrantyPublic(serial, options = {}) {
  const clean = String(serial ?? '').trim().toUpperCase();
  const data = await request('/api/shop/warranty/lookup', {
    method: 'POST',
    body: { serial: clean },
    signal: options.signal,
  });
  return {
    found: Boolean(data?.found),
    serial: data?.serial ?? clean,
    productName: data?.product_name ?? '',
    category: data?.category ?? '',
    withinWarranty: data?.within_warranty ?? 'NO',
    warrantyEndDate: data?.warranty_end_date ?? '',
    warrantyMonths: Number(data?.warranty_months ?? 0) || 0,
    message: data?.message ?? '',
  };
}

export default { registerWarranty, getMyWarrantyProducts, lookupWarrantyPublic };
