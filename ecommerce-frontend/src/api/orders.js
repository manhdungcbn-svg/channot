import { request } from './client';

/**
 * API cho luồng bán hàng của storefront (đơn hàng, địa chỉ, đánh giá).
 *
 * LƯU Ý VỀ ĐƯỜNG DẪN: vite proxy rewrite `/api/*` → `/api/v1/*`, nên frontend
 * gọi `/api/shop/...` (không gồm `/v1`).
 */

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
 * Chuẩn hoá đơn hàng từ snake_case (backend) sang camelCase (app).
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeOrder(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    orderCode: raw.order_code ?? '',
    userId: raw.user_id,
    status: raw.status ?? 'PENDING',
    subtotal: Number(raw.subtotal ?? 0),
    shippingFee: Number(raw.shipping_fee ?? 0),
    discount: Number(raw.discount ?? 0),
    total: Number(raw.total ?? 0),
    paymentStatus: raw.payment_status ?? 'UNPAID',
    paymentMethod: raw.payment_method ?? 'cod',
    receiverName: raw.receiver_name ?? '',
    receiverPhone: raw.receiver_phone ?? '',
    shippingAddress: raw.shipping_address ?? '',
    note: raw.note ?? '',
    couponCode: raw.coupon_code ?? '',
    createdAt: raw.created_at ?? '',
    items: (raw.items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.name ?? '',
      slug: item.slug ?? '',
      serialNumber: item.serial_number ?? '',
      imageUrl: item.image_url ?? '',
      unitPrice: Number(item.unit_price ?? 0),
      quantity: Number(item.quantity ?? 1),
    })),
  };
}

/**
 * Tạo đơn hàng mới.
 * @param {object} payload
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>} đơn đã chuẩn hoá
 */
export async function createOrder(payload, options = {}) {
  const data = await authRequest('/api/shop/orders', {
    method: 'POST',
    body: {
      items: (payload.items ?? []).map((item) => ({
        // `productId` có thể là id (số) hoặc slug (chuỗi) tuỳ nguồn dữ liệu —
        // backend tự phân giải, gửi kèm slug để chắc chắn tìm được sản phẩm.
        product_id: item.productId ?? item.id ?? null,
        slug: item.slug ?? null,
        quantity: Number(item.quantity ?? 1),
      })),
      receiver_name: payload.receiverName,
      receiver_phone: payload.receiverPhone || null,
      shipping_address: payload.shippingAddress,
      payment_method: payload.paymentMethod ?? 'cod',
      note: payload.note ?? null,
      coupon_code: payload.couponCode || null,
    },
    signal: options.signal,
  });
  return normalizeOrder(data);
}

/**
 * Danh sách đơn hàng của tôi.
 * @param {{status?: string, signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>}
 */
export async function getMyOrders(options = {}) {
  const { status, signal } = options;
  const search = new URLSearchParams();
  if (status) search.set('status', status);
  const query = search.toString();
  const data = await authRequest(`/api/shop/orders${query ? `?${query}` : ''}`, { signal });
  return (Array.isArray(data) ? data : []).map(normalizeOrder);
}

/**
 * Chi tiết một đơn hàng.
 * @param {number|string} orderId
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object|null>}
 */
export async function getOrder(orderId, options = {}) {
  const data = await authRequest(`/api/shop/orders/${orderId}`, { signal: options.signal });
  return normalizeOrder(data);
}

/**
 * Huỷ đơn hàng của tôi.
 * @param {number|string} orderId
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object|null>}
 */
export async function cancelOrder(orderId, options = {}) {
  const data = await authRequest(`/api/shop/orders/${orderId}/cancel`, {
    method: 'POST',
    signal: options.signal,
  });
  return normalizeOrder(data);
}

// === Địa chỉ giao hàng ===

/**
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>}
 */
export async function getAddresses(options = {}) {
  const data = await authRequest('/api/shop/addresses', { signal: options.signal });
  return (Array.isArray(data) ? data : []).map((item) => ({
    id: item.id,
    label: item.label ?? '',
    receiverName: item.receiver_name ?? '',
    phone: item.phone ?? '',
    address: item.address ?? '',
    isDefault: Boolean(item.is_default),
  }));
}

/**
 * @param {object} payload
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>}
 */
export async function createAddress(payload, options = {}) {
  const data = await authRequest('/api/shop/addresses', {
    method: 'POST',
    body: {
      label: payload.label || null,
      receiver_name: payload.receiverName,
      phone: payload.phone,
      address: payload.address,
      is_default: Boolean(payload.isDefault),
    },
    signal: options.signal,
  });
  return {
    id: data.id,
    label: data.label ?? '',
    receiverName: data.receiver_name ?? '',
    phone: data.phone ?? '',
    address: data.address ?? '',
    isDefault: Boolean(data.is_default),
  };
}

/**
 * @param {number|string} id
 * @param {object} payload
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>}
 */
export async function updateAddress(id, payload, options = {}) {
  const data = await authRequest(`/api/shop/addresses/${id}`, {
    method: 'PUT',
    body: {
      label: payload.label || null,
      receiver_name: payload.receiverName,
      phone: payload.phone,
      address: payload.address,
      is_default: Boolean(payload.isDefault),
    },
    signal: options.signal,
  });
  return {
    id: data.id,
    label: data.label ?? '',
    receiverName: data.receiver_name ?? '',
    phone: data.phone ?? '',
    address: data.address ?? '',
    isDefault: Boolean(data.is_default),
  };
}

/**
 * @param {number|string} id
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<void>}
 */
export async function deleteAddress(id, options = {}) {
  await authRequest(`/api/shop/addresses/${id}`, {
    method: 'DELETE',
    signal: options.signal,
  });
}

// === Đánh giá sản phẩm ===

/**
 * @param {number|string} productId
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>}
 */
export async function getReviews(productId, options = {}) {
  const search = productId ? `?product_id=${productId}` : '';
  const data = await request(`/api/shop/reviews${search}`, { signal: options.signal });
  return (Array.isArray(data) ? data : []).map((item) => ({
    id: item.id,
    productId: item.product_id,
    userName: item.user_name ?? 'Khách hàng',
    rating: Number(item.rating ?? 5),
    title: item.title ?? '',
    content: item.content ?? '',
    createdAt: item.created_at ?? '',
  }));
}

/**
 * @param {number|string} productId
 * @param {{rating: number, title?: string, content?: string}} payload
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object>}
 */
export async function createReview(productId, payload, options = {}) {
  const data = await authRequest(`/api/shop/reviews?product_id=${productId}`, {
    method: 'POST',
    body: {
      rating: Number(payload.rating ?? 5),
      title: payload.title || null,
      content: payload.content || null,
    },
    signal: options.signal,
  });
  return {
    id: data.id,
    productId: data.product_id,
    rating: Number(data.rating ?? 5),
    title: data.title ?? '',
    content: data.content ?? '',
  };
}

export default {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getReviews,
  createReview,
  normalizeOrder,
};
