import { request } from './client';
import {
  mockCategories,
  mockProducts,
  mockWarrantyRecords,
} from '../data/mockProducts';

/**
 * Tầng API cho storefront.
 *
 * LƯU Ý VỀ ĐƯỜNG DẪN: vite proxy đã rewrite `/api/*` → `/api/v1/*`
 * (xem `vite.config.js`). Vì vậy frontend phải gọi `/api/shop/...`,
 * không phải `/api/v1/shop/...` (sẽ bị rewrite thành `/api/v1/v1/...`).
 * Backend thực sự expose đúng path `/api/v1/shop/...` như hợp đồng API.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/** Path tương đối (đã bỏ prefix `/api/v1` vì proxy lo). */
const SHOP_PATH = '/api/shop';
const AI_PATH = '/api/ai/shop-chat';

/**
 * Chuẩn hoá lỗi từ API — trả về lỗi có kiểu để quyết định fallback.
 * @param {unknown} error
 * @returns {Error}
 */
function toError(error) {
  if (error && error.type) return error;
  const wrapped = new Error('Không thể tải dữ liệu từ máy chủ.');
  wrapped.type = 'network';
  return wrapped;
}

/**
 * Chạy một lời gọi API; nếu thất bại thì trả về giá trị fallback.
 * Không throw — đảm bảo UI luôn có dữ liệu để demo.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {() => T} fallback
 * @param {string} label
 * @returns {Promise<T>}
 */
async function withFallback(fn, fallback, label) {
  try {
    return await fn();
  } catch (error) {
    const normalized = toError(error);
    if (normalized.type !== 'abort') {
      console.warn(`[shop] ${label} thất bại (${normalized.type}) — dùng dữ liệu mock.`, normalized.message);
    }
    return fallback();
  }
}

/**
 * Chuẩn hoá sản phẩm từ backend về shape nội bộ.
 * Chấp nhận cả shape backend (snake_case) lẫn shape nội bộ (camelCase).
 *
 * @param {object} raw
 * @returns {import('../data/mockProducts').ShopProduct}
 */
export function normalizeProduct(raw) {
  if (!raw) return null;

  const price = Number(raw.price ?? raw.current_price ?? 0) || 0;
  const originalRaw = raw.original_price ?? raw.originalPrice ?? null;
  const originalParsed = originalRaw ? Number(originalRaw) || null : null;
  // Backend trả `original_price = price` khi không giảm giá → coi như không có
  // giá gốc để tránh hiển thị gạch ngang vô nghĩa.
  const originalPrice = originalParsed && originalParsed > price ? originalParsed : null;
  const discount = Number(raw.discount_percent ?? raw.discountPercent ?? 0) || 0;
  const computedDiscount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const category = raw.category ?? raw.category_name ?? 'Sản phẩm';
  const categorySlug =
    raw.category_slug ??
    raw.categorySlug ??
    String(category)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const attributes = Array.isArray(raw.attributes) ? raw.attributes : [];
  const warrantyMonths = Number(raw.warranty_months ?? raw.warrantyMonths ?? 0) || 0;
  const badge =
    raw.badge && typeof raw.badge === 'object'
      ? { label: raw.badge.label ?? '', tone: raw.badge.tone ?? 'neutral' }
      : null;

  const stock = Number(raw.stock ?? 0) || 0;
  const status = raw.status ?? (stock > 0 ? 'available' : 'out_of_stock');
  const installmentMonthlyRaw = raw.installment_monthly ?? raw.installmentMonthly ?? null;
  const installmentMonths = Number(raw.installment_months ?? raw.installmentMonths ?? 12) || 12;
  const installmentMonthly =
    installmentMonthlyRaw === null || installmentMonthlyRaw === undefined
      ? price > 0
        ? Math.floor(price / installmentMonths)
        : null
      : Number(installmentMonthlyRaw);

  return {
    id: raw.id ?? raw.product_id ?? raw.slug,
    slug: raw.slug ?? `product-${raw.id ?? ''}`,
    name: raw.name ?? 'Sản phẩm',
    brand: raw.brand ?? '',
    category,
    categorySlug,
    price,
    originalPrice,
    discountPercent: discount || computedDiscount,
    rating: Number(raw.rating ?? 0) || 0,
    reviewCount: Number(raw.review_count ?? raw.reviewCount ?? 0) || 0,
    sold: Number(raw.sold ?? 0) || 0,
    image: raw.image_url ?? raw.image ?? '',
    attributes,
    warrantyMonths,
    warranty: raw.warranty_label ?? raw.warranty ?? (warrantyMonths ? `Bảo hành ${warrantyMonths} tháng` : 'Bảo hành chính hãng'),
    stock,
    status,
    badge,
    installmentMonthly,
    installmentMonths,
    owned: Boolean(raw.owned),
    serialNumber: raw.serial_number ?? raw.serialNumber ?? '',
    description: raw.description ?? '',
    specs: raw.specs && typeof raw.specs === 'object' ? raw.specs : {},
    warrantyTerms: raw.warranty_terms ?? raw.warrantyTerms ?? '',
  };
}

/**
 * @typedef {object} ProductQuery
 * @property {string} [category] - slug danh mục
 * @property {string} [q] - từ khoá tìm kiếm
 * @property {'featured'|'price-asc'|'price-desc'|'rating'|'newest'} [sort]
 * @property {number} [limit=24]
 * @property {number} [offset=0]
 */

/**
 * Chuẩn hoá text tìm kiếm: bỏ dấu tiếng Việt, lowercase, gộp khoảng trắng.
 * Khớp với `normalize_search_text` phía backend để fallback cho cùng kết quả.
 * @param {string} [text]
 * @returns {string}
 */
export function normalizeSearchText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Từ đồng nghĩa danh mục — dùng khi backend không sẵn sàng. */
const MOCK_CATEGORY_ALIASES = {
  tivi: ['tivi'],
  tv: ['tivi'],
  loa: ['tivi'],
  'tai nghe': ['tivi'],
  'may loc nuoc': ['loc-nuoc'],
  'loc nuoc': ['loc-nuoc'],
  quat: ['quat'],
  'may hut bui': ['gia-dung'],
  'hut bui': ['gia-dung'],
  robot: ['gia-dung'],
  'dien gia dung': ['gia-dung', 'bep-dien', 'may-giat'],
  'do gia dung': ['gia-dung', 'bep-dien', 'may-giat'],
  'gia dung': ['gia-dung', 'bep-dien', 'may-giat'],
  'may lanh': ['may-lanh', 'tu-lanh'],
  'dieu hoa': ['may-lanh'],
  'tu lanh': ['tu-lanh'],
  'may giat': ['may-giat'],
  bep: ['bep-dien'],
  'phu kien': ['phu-kien'],
  den: ['phu-kien'],
};

/**
 * Lọc + sắp xếp danh sách mock theo query.
 * @param {ProductQuery} query
 * @returns {{items: object[], total: number}}
 */
function filterMockProducts(query = {}) {
  const { category, q, sort = 'featured', limit = 24, offset = 0 } = query;

  let items = [...mockProducts];

  if (category) {
    items = items.filter((item) => item.categorySlug === category);
  }

  const keyword = normalizeSearchText(q);
  if (keyword) {
    const direct = items.filter((item) => {
      const haystack = normalizeSearchText(
        [item.name, item.brand, item.category, item.serialNumber, ...(item.attributes ?? [])]
          .filter(Boolean)
          .join(' '),
      );
      return haystack.includes(keyword);
    });

    if (direct.length) {
      items = direct;
    } else {
      const aliasSlugs = Object.entries(MOCK_CATEGORY_ALIASES)
        .filter(([phrase]) => keyword.includes(phrase))
        .flatMap(([, slugs]) => slugs);
      if (aliasSlugs.length) {
        items = items.filter((item) => aliasSlugs.includes(item.categorySlug));
      } else {
        items = [];
      }
    }
  }

  const sorters = {
    featured: (a, b) => b.rating * 1000 + b.sold / 100 - (a.rating * 1000 + a.sold / 100),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    newest: (a, b) => b.id - a.id,
  };
  items.sort(sorters[sort] ?? sorters.featured);

  const total = items.length;
  const page = items.slice(offset, offset + limit);
  return { items: page.map(normalizeProduct), total };
}

/**
 * Lấy danh sách sản phẩm.
 * @param {ProductQuery & {signal?: AbortSignal}} [query]
 * @returns {Promise<{items: object[], total: number}>}
 */
export async function getProducts(query = {}) {
  const { signal, ...params } = query;
  const { category, q, sort, limit = 24, offset = 0 } = params;

  const search = new URLSearchParams();
  if (category) search.set('category', category);
  if (q) search.set('q', q);
  if (sort) search.set('sort', sort);
  search.set('limit', String(limit));
  search.set('offset', String(offset));

  return withFallback(
    async () => {
      const data = await request(`${API_BASE}${SHOP_PATH}/products?${search.toString()}`, { signal });
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      return {
        items: rawItems.map(normalizeProduct),
        total: Number(data?.total ?? rawItems.length) || rawItems.length,
        limit: Number(data?.limit ?? limit) || limit,
        offset: Number(data?.offset ?? offset) || offset,
      };
    },
    () => filterMockProducts(params),
    'getProducts',
  );
}

/**
 * Lấy chi tiết sản phẩm theo slug.
 * @param {string} slug
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object|null>}
 */
export async function getProductBySlug(slug, options = {}) {
  if (!slug) return null;

  return withFallback(
    async () => {
      const data = await request(`${API_BASE}${SHOP_PATH}/products/${encodeURIComponent(slug)}`, {
        signal: options.signal,
      });
      return normalizeProduct(data);
    },
    () => {
      const found = mockProducts.find(
        (item) => item.slug === slug || item.slug === slug.toLowerCase(),
      );
      if (found) return normalizeProduct(found);

      // Cho phép tra cứu bằng tên rút gọn: "tivi-qled-4k-55-inch" -> "tivi qled 4k 55 inch"
      const normalizedSlug = slug.replace(/-/g, ' ').toLowerCase();
      const fuzzy = mockProducts.find((item) =>
        item.name.toLowerCase().includes(normalizedSlug.slice(0, 14)),
      );
      return fuzzy ? normalizeProduct(fuzzy) : null;
    },
    `getProductBySlug(${slug})`,
  );
}

/**
 * Lấy danh sách danh mục.
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<import('../data/mockProducts').ShopCategory[]>}
 */
export async function getCategories(options = {}) {
  return withFallback(
    async () => {
      const data = await request(`${API_BASE}${SHOP_PATH}/categories`, { signal: options.signal });
      const items = Array.isArray(data) ? data : data?.items ?? [];
      return items.map((item) => ({
        slug: item.slug,
        name: item.name,
        icon: item.icon ?? 'grid',
        count: Number(item.count ?? 0) || 0,
        image_url: item.image_url ?? null,
      }));
    },
    () => mockCategories.map((item) => ({ ...item })),
    'getCategories',
  );
}

/**
 * Lấy dữ liệu flash sale.
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{ends_at: string, items: object[]}>}
 */
export async function getFlashSale(options = {}) {
  return withFallback(
    async () => {
      const data = await request(`${API_BASE}${SHOP_PATH}/flash-sale`, { signal: options.signal });
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      return {
        ends_at: data?.ends_at ?? '',
        items: rawItems.map(normalizeProduct),
      };
    },
    () => ({
      ends_at: new Date(Date.now() + 6 * 3600 * 1000 + 42 * 60 * 1000).toISOString(),
      items: mockProducts
        .filter((item) => item.originalPrice && item.originalPrice > item.price)
        .slice(0, 8)
        .map(normalizeProduct),
    }),
    'getFlashSale',
  );
}

/**
 * Tra cứu bảo hành theo serial.
 * @param {string} serial
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{found: boolean, serial: string, product_name?: string, category?: string, within_warranty?: string, warranty_end_date?: string, warranty_months?: number, message: string}>}
 */
export async function lookupWarranty(serial, options = {}) {
  const cleanSerial = String(serial ?? '').trim().toUpperCase();
  if (!cleanSerial) {
    return {
      found: false,
      serial: '',
      message: 'Vui lòng nhập mã serial của sản phẩm.',
    };
  }

  return withFallback(
    async () => {
      const data = await request(`${API_BASE}${SHOP_PATH}/warranty/lookup`, {
        method: 'POST',
        body: { serial: cleanSerial },
        signal: options.signal,
      });
      return {
        found: Boolean(data?.found),
        serial: data?.serial ?? cleanSerial,
        product_name: data?.product_name ?? '',
        category: data?.category ?? '',
        within_warranty: data?.within_warranty ?? (data?.found ? 'YES' : 'NO'),
        warranty_end_date: data?.warranty_end_date ?? '',
        warranty_months: Number(data?.warranty_months ?? 0) || 0,
        message: data?.message ?? '',
      };
    },
    () => {
      const record = mockWarrantyRecords[cleanSerial];
      if (record) return { ...record };
      return {
        found: false,
        serial: cleanSerial,
        message: `Chưa tìm thấy sản phẩm với serial "${cleanSerial}". Vui lòng kiểm tra lại mã serial hoặc liên hệ hotline 0827461460.`,
      };
    },
    'lookupWarranty',
  );
}

/**
 * Rule-based reply dự phòng khi endpoint AI lỗi.
 * @param {string} message
 * @returns {{reply: string, intent: string, confidence: number, source: string, suggestions: string[], data: object, actions: object[]}}
 */
function ruleBasedReply(message) {
  const text = String(message ?? '').toLowerCase();
  const limit = 15_000_000;

  const isSerial = /(serial|sn|imei|mã\s*số)/i.test(text);
  if (isSerial) {
    return {
      reply:
        'Để tra cứu bảo hành, bạn hãy nhập **mã serial** in trên tem vỏ hoặc hộp sản phẩm (ví dụ `TND-AC10-001`).\n\n' +
        'Bạn cũng có thể bấm nút **Tra cứu bảo hành** bên dưới để mở biểu mẫu tra cứu đầy đủ.',
      intent: 'warranty_lookup',
      confidence: 0.72,
      source: 'rule',
      suggestions: ['Tra cứu bảo hành', 'Chính sách đổi trả', 'Thời gian bảo hành'],
      data: {},
      actions: [
        {
          type: 'navigate',
          label: 'Mở trang tra cứu bảo hành',
          payload: { href: '/warranty', label: 'Tra cứu bảo hành' },
          requires_confirmation: false,
        },
      ],
    };
  }

  const wantsDiscount = /(giảm giá|flash|sale|đang giảm|rẻ hơn|khuyến mãi)/i.test(text);
  if (wantsDiscount) {
    const items = mockProducts
      .filter((item) => item.originalPrice && item.originalPrice > item.price)
      .slice(0, 4)
      .map(normalizeProduct);
    return {
      reply:
        'Hiện đang có **flash sale** với các mặt hàng sau. Bạn có thể bấm **Thêm vào giỏ** để đặt trước nhé!',
      intent: 'flash_sale',
      confidence: 0.8,
      source: 'rule',
      suggestions: ['Sản phẩm đang giảm giá', 'Tivi 4K dưới 15 triệu', 'Tra cứu bảo hành'],
      data: { products: items },
      actions: items.map((item) => ({
        type: 'view_product',
        label: `Xem ${item.name}`,
        payload: { slug: item.slug, name: item.name },
        requires_confirmation: false,
      })),
    };
  }

  const wantsProduct = /(tivi|máy lọc|quạt|tủ lạnh|máy lạnh|bếp|máy giặt|loa|robot|nồi|đèn)/i.test(
    text,
  );
  if (wantsProduct) {
    const budgetMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ)/);
    let items = filterMockProducts({ q: '' }).items;

    if (budgetMatch) {
      const amount = Number(budgetMatch[1].replace(',', '.'));
      const unit = budgetMatch[2];
      const budget = unit === 'tỷ' ? amount * 1_000_000_000 : amount * 1_000_000;
      const withinBudget = items.filter((item) => item.price <= budget);
      if (withinBudget.length) items = withinBudget;
    }

    const keyword = text.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
    const matched = filterMockProducts({ q: keyword }).items;
    if (matched.length) items = matched;

    items = items.slice(0, 4);

    return {
      reply:
        items.length > 0
          ? `Mình gợi ý cho bạn **${items.length} sản phẩm** phù hợp nhất. Bạn có thể xem chi tiết hoặc thêm thẳng vào giỏ.`
          : 'Mình chưa tìm thấy sản phẩm phù hợp. Bạn có thể mô tả rõ hơn hoặc xem **danh mục sản phẩm** nhé.',
      intent: 'product_recommendation',
      confidence: 0.68,
      source: 'rule',
      suggestions: ['So sánh sản phẩm', 'Máy lọc nước tốt', 'Chính sách đổi trả'],
      data: { products: items },
      actions: items.slice(0, 3).map((item) => ({
        type: 'add_to_cart',
        label: `Thêm ${item.name}`,
        payload: { product_id: item.id, slug: item.slug, name: item.name },
        requires_confirmation: false,
      })),
    };
  }

  if (/(đổi trả|hoàn tiền|chính sách)/i.test(text)) {
    return {
      reply:
        '**Chính sách đổi trả 30 ngày** — bạn không cần lý do.\n\n' +
        '- Sản phẩm còn nguyên tem, hộp và phụ kiện\n- Thời gian đổi trả trong vòng **30 ngày** kể từ khi nhận hàng\n- Phí vận chuyển đổi trả do khách hàng chịu\n\n' +
        'Bảo hành chính hãng áp dụng theo thời hạn ghi trên tem sản phẩm.',
      intent: 'policy',
      confidence: 0.75,
      source: 'rule',
      suggestions: ['Tra cứu bảo hành', 'Sản phẩm đang giảm giá', 'Tivi 4K dưới 15 triệu'],
      data: {},
      actions: [],
    };
  }

  return {
    reply:
      'Chào bạn! Mình là **Trợ lý ảo** của Điện Tử Việt Nam. Mình có thể giúp bạn:\n\n' +
      '- Gợi ý sản phẩm theo nhu cầu và ngân sách\n- Tìm sản phẩm đang giảm giá\n- Tra cứu bảo hành theo mã serial\n- Giải đáp chính sách đổi trả, bảo hành, trả góp\n\n' +
      'Bạn muốn tra cứu mã serial hay tìm sản phẩm theo ngân sách?',
    intent: 'greeting',
    confidence: 0.6,
    source: 'rule',
    suggestions: [
      'Tivi 4K dưới 15 triệu',
      'Máy lọc nước tốt',
      'Tra cứu bảo hành',
      'Chính sách đổi trả',
      'Sản phẩm đang giảm giá',
    ],
    data: {},
    actions: [],
  };
}

/**
 * Gửi tin nhắn tới chatbot AI.
 * @param {{message: string, sessionId?: string, history?: {role: string, content: string}[], context?: object}} payload
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{reply: string, intent: string, confidence: number, source: string, suggestions: string[], data: object, actions: object[]}>}
 */
export async function shopChat(payload, options = {}) {
  const { message, sessionId, history = [], context = {} } = payload;

  try {
    const data = await request(`${API_BASE}${AI_PATH}`, {
      method: 'POST',
      body: {
        message,
        session_id: sessionId,
        history,
        context,
      },
      signal: options.signal,
    });

    return {
      reply: data?.reply ?? '',
      intent: data?.intent ?? 'unknown',
      confidence: Number(data?.confidence ?? 0) || 0,
      source: data?.source ?? 'gemini',
      suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
      data: {
        ...(data?.data ?? {}),
        products: Array.isArray(data?.data?.products)
          ? data.data.products.map(normalizeProduct)
          : [],
      },
      actions: Array.isArray(data?.actions) ? data.actions : [],
    };
  } catch (error) {
    const normalized = toError(error);
    if (normalized.type !== 'abort') {
      console.warn(
        '[shop] shopChat thất bại — dùng trả lời rule-based cục bộ.',
        normalized.message,
      );
    }
    return ruleBasedReply(message);
  }
}

export default {
  getProducts,
  getProductBySlug,
  getCategories,
  getFlashSale,
  lookupWarranty,
  shopChat,
  normalizeProduct,
};
