/**
 * API cho khu vực quản trị của storefront (web bán hàng 5175).
 *
 * LƯU Ý VỀ ĐƯỜNG DẪN: vite proxy rewrite `/api/*` → `/api/v1/*`, nên frontend
 * gọi `/api/shop/...` (không gồm `/v1`).
 *
 * Backend đã có sẵn toàn bộ endpoint (không sửa backend):
 *  - GET    /api/shop/admin/provinces
 *  - GET    /api/shop/admin/wards?province_code=
 *  - GET    /api/shop/admin/products?q=&limit=&offset=
 *  - POST   /api/shop/admin/products
 *  - PUT    /api/shop/admin/products/{id}
 *  - DELETE /api/shop/admin/products/{id}
 *  - GET    /api/shop/admin/customers?q=&limit=&offset=
 *  - GET    /api/shop/admin/customers/{id}/orders
 *  - GET    /api/shop/admin/stats
 *  - GET    /api/shop/orders            (staff/admin thấy TẤT CẢ đơn)
 *  - POST   /api/shop/orders/{id}/status
 *  - POST   /api/shop/orders            (đặt hàng — dùng để admin đặt hộ khách)
 */

import { normalizeOrder } from './orders';

/**
 * Lấy token hiện tại từ localStorage (cùng key với app bảo hành).
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
 * Gọi API quản trị — luôn kèm Bearer token.
 * Khác `request()` ở `api/client.js`: xử lý được 204 (xoá) và đọc `detail`
 * của lỗi FastAPI để thông báo tiếng Việt rõ ràng.
 *
 * @param {string} url
 * @param {{method?: string, body?: any, signal?: AbortSignal}} [options]
 * @returns {Promise<any>}
 */
async function adminRequest(url, options = {}) {
  const { method = 'GET', body, signal } = options;
  const token = authToken();

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      const aborted = new Error('Yêu cầu đã bị huỷ');
      aborted.type = 'abort';
      throw aborted;
    }
    const networkError = new Error('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
    networkError.type = 'network';
    throw networkError;
  }

  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data?.detail || data?.error?.message || '';
    } catch {
      /* không đọc được body lỗi */
    }
    const httpError = new Error(detail || `Yêu cầu thất bại (${response.status})`);
    httpError.type = 'http';
    httpError.status = response.status;
    throw httpError;
  }

  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Chuẩn hoá sản phẩm trả về từ màn hình quản trị.
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeAdminProduct(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    serialNumber: raw.serial_number ?? '',
    brand: raw.brand ?? '',
    category: raw.category ?? '',
    categorySlug: raw.category_slug ?? '',
    price: Number(raw.price ?? 0),
    originalPrice: raw.original_price ? Number(raw.original_price) : null,
    stock: Number(raw.stock ?? 0),
    sold: Number(raw.sold ?? 0),
    imageUrl: raw.image_url ?? '',
    description: raw.description ?? '',
    warrantyMonths: Number(raw.warranty_months ?? 0),
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.review_count ?? 0),
    status: raw.status ?? 'available',
    badgeLabel: raw.badge_label ?? '',
    badgeTone: raw.badge_tone ?? '',
    installmentMonths: Number(raw.installment_months ?? 0),
  };
}

/**
 * Chuẩn hoá khách hàng trả về từ màn hình quản trị.
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeAdminCustomer(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    email: raw.email ?? '',
    fullName: raw.full_name ?? '',
    phone: raw.phone ?? '',
    isActive: Boolean(raw.is_active),
    createdAt: raw.created_at ?? '',
    orderCount: Number(raw.order_count ?? 0),
    totalSpent: Number(raw.total_spent ?? 0),
  };
}

/**
 * Chuẩn hoá số liệu tổng quan.
 * @param {object} raw
 * @returns {object}
 */
export function normalizeAdminStats(raw) {
  const source = raw ?? {};
  const byStatus = {};
  Object.entries(source.by_status ?? {}).forEach(([key, value]) => {
    byStatus[key] = Number(value ?? 0);
  });
  return {
    totalCustomers: Number(source.total_customers ?? 0),
    totalProducts: Number(source.total_products ?? 0),
    totalOrders: Number(source.total_orders ?? 0),
    byStatus,
    revenue: Number(source.revenue ?? 0),
    topProducts: (source.top_products ?? []).map((item) => ({
      name: item.name ?? '',
      quantity: Number(item.quantity ?? 0),
    })),
    lowStock: (source.low_stock ?? []).map((item) => ({
      id: item.id,
      name: item.name ?? '',
      stock: Number(item.stock ?? 0),
    })),
  };
}

// === Địa chỉ hành chính ===

/**
 * Danh sách tỉnh/thành phố.
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{code: string, name: string}[]>}
 */
export async function getProvinces(options = {}) {
  const data = await adminRequest('/api/shop/admin/provinces', { signal: options.signal });
  return (Array.isArray(data) ? data : []).map((item) => ({
    code: item.code ?? '',
    name: item.name ?? '',
  }));
}

/**
 * Danh sách phường/xã theo tỉnh.
 * @param {string} provinceCode
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{code: string, name: string, provinceCode: string}[]>}
 */
export async function getWards(provinceCode, options = {}) {
  const query = provinceCode ? `?province_code=${encodeURIComponent(provinceCode)}` : '';
  const data = await adminRequest(`/api/shop/admin/wards${query}`, { signal: options.signal });
  return (Array.isArray(data) ? data : []).map((item) => ({
    code: item.code ?? '',
    name: item.name ?? '',
    provinceCode: item.province_code ?? provinceCode ?? '',
  }));
}

// === Sản phẩm ===

/**
 * Danh sách sản phẩm trong catalog.
 * @param {{q?: string, limit?: number, offset?: number, signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>}
 */
export async function getAdminProducts(options = {}) {
  const { q = '', limit = 100, offset = 0, signal } = options;
  const search = new URLSearchParams();
  if (q) search.set('q', q);
  search.set('limit', String(limit));
  search.set('offset', String(offset));

  const data = await adminRequest(`/api/shop/admin/products?${search.toString()}`, { signal });
  return (Array.isArray(data) ? data : []).map(normalizeAdminProduct);
}

/**
 * Chuyển form (camelCase) → payload backend (snake_case).
 * @param {object} payload
 * @returns {object}
 */
function toProductPayload(payload) {
  const body = {};
  const set = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    body[key] = value;
  };

  set('name', payload.name);
  set('slug', payload.slug);
  set('serial_number', payload.serialNumber);
  set('brand', payload.brand);
  set('category', payload.category);
  set('category_slug', payload.categorySlug);
  set('price', payload.price);
  set('original_price', payload.originalPrice);
  set('stock', payload.stock);
  set('sold', payload.sold);
  set('image_url', payload.imageUrl);
  set('description', payload.description);
  set('warranty_months', payload.warrantyMonths);
  set('status', payload.status);
  set('badge_label', payload.badgeLabel);
  set('badge_tone', payload.badgeTone);
  set('installment_months', payload.installmentMonths);

  return body;
}

/**
 * Thêm sản phẩm mới.
 * @param {object} payload
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>}
 */
export async function createAdminProduct(payload, options = {}) {
  const data = await adminRequest('/api/shop/admin/products', {
    method: 'POST',
    body: toProductPayload(payload),
    signal: options.signal,
  });
  return normalizeAdminProduct(data);
}

/**
 * Cập nhật sản phẩm — chỉ gửi các field thực sự thay đổi.
 * @param {number|string} id
 * @param {object} payload
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>}
 */
export async function updateAdminProduct(id, payload, options = {}) {
  const data = await adminRequest(`/api/shop/admin/products/${id}`, {
    method: 'PUT',
    body: toProductPayload(payload),
    signal: options.signal,
  });
  return normalizeAdminProduct(data);
}

/**
 * Xoá sản phẩm.
 * @param {number|string} id
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<void>}
 */
export async function deleteAdminProduct(id, options = {}) {
  await adminRequest(`/api/shop/admin/products/${id}`, {
    method: 'DELETE',
    signal: options.signal,
  });
}

// === Khách hàng ===

/**
 * Danh sách khách hàng.
 * @param {{q?: string, limit?: number, offset?: number, signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>}
 */
export async function getAdminCustomers(options = {}) {
  const { q = '', limit = 100, offset = 0, signal } = options;
  const search = new URLSearchParams();
  if (q) search.set('q', q);
  search.set('limit', String(limit));
  search.set('offset', String(offset));

  const data = await adminRequest(`/api/shop/admin/customers?${search.toString()}`, { signal });
  return (Array.isArray(data) ? data : []).map(normalizeAdminCustomer);
}

/**
 * Lịch sử đơn hàng của một khách.
 * @param {number|string} customerId
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>}
 */
export async function getAdminCustomerOrders(customerId, options = {}) {
  const data = await adminRequest(`/api/shop/admin/customers/${customerId}/orders`, {
    signal: options.signal,
  });
  return (Array.isArray(data) ? data : []).map(normalizeOrder);
}

// === Thống kê ===

/**
 * Số liệu tổng quan vận hành.
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>}
 */
export async function getAdminStats(options = {}) {
  const data = await adminRequest('/api/shop/admin/stats', { signal: options.signal });
  return normalizeAdminStats(data);
}

// === Đơn hàng ===

/**
 * Toàn bộ đơn hàng (staff/admin thấy tất cả).
 * @param {{limit?: number, offset?: number, signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>}
 */
export async function getAdminOrders(options = {}) {
  const { limit = 100, offset = 0, signal } = options;
  const search = new URLSearchParams();
  search.set('limit', String(limit));
  search.set('offset', String(offset));

  const data = await adminRequest(`/api/shop/orders?${search.toString()}`, { signal });
  return (Array.isArray(data) ? data : []).map(normalizeOrder);
}

/**
 * Đổi trạng thái đơn hàng.
 * @param {number|string} orderId
 * @param {string} status
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>}
 */
export async function updateOrderStatus(orderId, status, options = {}) {
  const data = await adminRequest(`/api/shop/orders/${orderId}/status`, {
    method: 'POST',
    body: { status },
    signal: options.signal,
  });
  return normalizeOrder(data);
}

/**
 * Đặt hàng hộ khách — giá luôn tính ở server.
 * @param {object} payload
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>}
 */
export async function createAdminOrder(payload, options = {}) {
  const data = await adminRequest('/api/shop/orders', {
    method: 'POST',
    body: {
      items: (payload.items ?? []).map((item) => ({
        product_id: item.productId ?? item.id ?? null,
        slug: item.slug ?? null,
        quantity: Number(item.quantity ?? 1),
      })),
      receiver_name: payload.receiverName,
      receiver_phone: payload.receiverPhone || null,
      shipping_address: payload.shippingAddress,
      payment_method: payload.paymentMethod ?? 'cod',
      note: payload.note || null,
      coupon_code: payload.couponCode || null,
    },
    signal: options.signal,
  });
  return normalizeOrder(data);
}

export default {
  getProvinces,
  getWards,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminCustomers,
  getAdminCustomerOrders,
  getAdminStats,
  getAdminOrders,
  updateOrderStatus,
  createAdminOrder,
  normalizeAdminProduct,
  normalizeAdminCustomer,
  normalizeAdminStats,
};
