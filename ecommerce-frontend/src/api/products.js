import { getProducts } from './shop';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/**
 * Lấy danh sách sản phẩm nổi bật (tương thích API cũ).
 * Dùng chung tầng `shop.js` nên luôn có fallback mock.
 *
 * @param {{ signal?: AbortSignal, limit?: number }} [options]
 * @returns {Promise<object[]>}
 */
export async function getFeaturedProducts(options = {}) {
  const { signal, limit = 8 } = options;
  const data = await getProducts({ limit, sort: 'featured', signal });
  return data?.items ?? [];
}

export { USE_MOCK };

export default { getFeaturedProducts };
