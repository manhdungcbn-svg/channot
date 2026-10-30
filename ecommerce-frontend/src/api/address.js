/**
 * API danh mục hành chính Việt Nam (tỉnh/thành phố + phường/xã) cho web bán hàng.
 *
 * LƯU Ý VỀ ĐƯỜNG DẪN: vite proxy rewrite `/api/*` → `/api/v1/*`, nên frontend
 * gọi `/api/shop/...` (không gồm `/v1`).
 *
 * Backend (đã có sẵn, endpoint PUBLIC — không cần token):
 *  - GET /api/shop/admin/provinces
 *      → [{ code: "01", name: "Hà Nội" }, ...]  (34 tỉnh/thành)
 *  - GET /api/shop/admin/wards?province_code=01
 *      → [{ code: "10101001", name: "Phường Phú Thượng", province_code: "01" }, ...]
 *
 * Dữ liệu theo sáp nhất hành chính 01/07/2025 (bỏ cấp quận/huyện).
 */

import { request } from './client';

/** Cache danh sách tỉnh trong module — danh sách này không thay đổi. */
let provinceCache = null;

/** Cache danh sách xã theo mã tỉnh — dùng lại nếu khách chọn lại cùng tỉnh. */
const wardCache = new Map();

/**
 * Chuẩn hoá 1 tỉnh.
 * @param {any} item
 * @returns {{code: string, name: string}}
 */
function normalizeProvince(item) {
  return {
    code: String(item?.code ?? ''),
    name: String(item?.name ?? ''),
  };
}

/**
 * Chuẩn hoá 1 phường/xã.
 * @param {any} item
 * @param {string} fallbackProvinceCode
 * @returns {{code: string, name: string, provinceCode: string}}
 */
function normalizeWard(item, fallbackProvinceCode) {
  return {
    code: String(item?.code ?? ''),
    name: String(item?.name ?? ''),
    provinceCode: String(item?.province_code ?? fallbackProvinceCode ?? ''),
  };
}

/**
 * Danh sách tỉnh/thành phố.
 *
 * Không throw: nếu lỗi thì trả mảng rỗng để form vẫn dùng được.
 *
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{code: string, name: string}[]>}
 */
export async function getProvinces(options = {}) {
  if (provinceCache && !options.signal) return provinceCache;

  try {
    const data = await request('/api/shop/admin/provinces', { signal: options.signal });
    const provinces = (Array.isArray(data) ? data : []).map(normalizeProvince);
    if (!options.signal) provinceCache = provinces;
    return provinces;
  } catch (error) {
    if (error?.type === 'abort') return [];
    console.warn('[address] Không tải được danh sách tỉnh/thành phố:', error?.message);
    return [];
  }
}

/**
 * Danh sách phường/xã theo tỉnh.
 *
 * Không throw: nếu lỗi thì trả mảng rỗng để form vẫn dùng được.
 *
 * @param {string} provinceCode
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{code: string, name: string, provinceCode: string}[]>}
 */
export async function getWards(provinceCode, options = {}) {
  const code = String(provinceCode ?? '').trim();
  if (!code) return [];

  if (wardCache.has(code) && !options.signal) return wardCache.get(code);

  try {
    const query = `?province_code=${encodeURIComponent(code)}`;
    const data = await request(`/api/shop/admin/wards${query}`, { signal: options.signal });
    const wards = (Array.isArray(data) ? data : []).map((item) => normalizeWard(item, code));
    if (!options.signal) wardCache.set(code, wards);
    return wards;
  } catch (error) {
    if (error?.type === 'abort') return [];
    console.warn('[address] Không tải được danh sách phường/xã:', error?.message);
    return [];
  }
}

/**
 * Xoá cache (dùng khi cần refresh danh sách tỉnh).
 */
export function clearAddressCache() {
  provinceCache = null;
  wardCache.clear();
}

export default { getProvinces, getWards, clearAddressCache };
