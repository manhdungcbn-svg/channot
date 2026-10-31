import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { Cart, ChevronRight, Close, Filter, Search, Shield, Star } from '../components/icons';
import { ProductCard } from '../components/sections';
import { StoreLayout } from '../layouts/StoreLayout';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getCategories, getProducts } from '../api/shop';
import { cn } from '../utils/cn';

const SORT_OPTIONS = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'price-asc', label: 'Giá: Thấp → Cao' },
  { id: 'price-desc', label: 'Giá: Cao → Thấp' },
  { id: 'rating', label: 'Đánh giá cao nhất' },
  { id: 'newest', label: 'Mới nhất' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'Tất cả', min: 0, max: Infinity },
  { id: 'under-5', label: 'Dưới 5 triệu', min: 0, max: 5_000_000 },
  { id: '5-15', label: '5 – 15 triệu', min: 5_000_000, max: 15_000_000 },
  { id: '15-30', label: '15 – 30 triệu', min: 15_000_000, max: 30_000_000 },
  { id: 'over-30', label: 'Trên 30 triệu', min: 30_000_000, max: Infinity },
];

const RATING_OPTIONS = [4, 3, 0];

/** Gợi ý tìm kiếm nhanh khi không có kết quả. */
const QUICK_SUGGESTIONS = [
  { label: 'Tivi', query: 'tivi' },
  { label: 'Máy lọc nước', query: 'máy lọc nước' },
  { label: 'Tủ lạnh', query: 'tủ lạnh' },
  { label: 'Máy giặt', query: 'máy giặt' },
  { label: 'Điều hòa', query: 'điều hòa' },
  { label: 'Quạt', query: 'quạt' },
  { label: 'Bếp từ', query: 'bếp từ' },
  { label: 'Phụ kiện', query: 'phụ kiện' },
];

/**
 * Trang tìm kiếm & danh mục — dùng chung cho `/search` và `/category/:slug`.
 *
 * Bộ lọc (giá, thương hiệu, đánh giá, có khuyến mãi) chạy phía client trên
 * tập kết quả đã tải — backend hiện chưa hỗ trợ truy vấn tổ hợp.
 */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: routeCategory } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const toast = useToast();

  const keyword = searchParams.get('q') ?? '';
  // Hỗ trợ cả `/search?category=tivi` và `/category/tivi`.
  const category = routeCategory || searchParams.get('category') || '';
  const sort = searchParams.get('sort') ?? 'featured';
  const priceRange = searchParams.get('price') ?? 'all';
  const brand = searchParams.get('brand') ?? '';
  const minRating = Number(searchParams.get('rating') ?? 0);
  const onlyDiscount = searchParams.get('discount') === '1';

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const searchInputRef = useRef(null);

  // Đồng bộ ô nhập khi URL đổi (back/forward, điều hướng từ nav...).
  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  // Danh mục
  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sản phẩm
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    getProducts({
      q: keyword || undefined,
      category: category || undefined,
      sort,
      limit: 60,
      signal: controller.signal,
    })
      .then((data) => {
        if (!cancelled) {
          setProducts(data.items ?? []);
          setTotal(Number(data.total ?? data.items?.length ?? 0) || 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [keyword, category, sort]);

  // Thương hiệu có trong kết quả
  const brands = useMemo(() => {
    const set = new Set(products.map((item) => item.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  // Lọc phía client
  const filtered = useMemo(() => {
    const range = PRICE_RANGES.find((item) => item.id === priceRange) ?? PRICE_RANGES[0];
    return products.filter((item) => {
      if (item.price < range.min || item.price > range.max) return false;
      if (brand && item.brand !== brand) return false;
      if (minRating && (item.rating ?? 0) < minRating) return false;
      if (onlyDiscount && !(item.originalPrice && item.originalPrice > item.price)) return false;
      return true;
    });
  }, [products, priceRange, brand, minRating, onlyDiscount]);

  const updateParam = (key, value) => {
    // Khi đang ở route `/category/:slug`, đổi danh mục phải đổi cả path.
    if (key === 'category' && routeCategory) {
      const next = new URLSearchParams(searchParams);
      if (!value) next.delete('category');
      else next.set('category', value);
      navigate(value ? `/category/${value}?${next.toString()}` : `/search?${next.toString()}`);
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === '0') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (keyword) next.set('q', keyword);
    setSearchParams(next, { replace: true });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const query = draftKeyword.trim();
    if (query) next.set('q', query);
    else next.delete('q');
    // Tìm kiếm mới nên bắt đầu từ danh mục rộng.
    if (routeCategory) {
      navigate(query ? `/search?${next.toString()}` : '/search');
      return;
    }
    setSearchParams(next, { replace: true });
  };

  const runSuggestion = (query) => {
    const next = new URLSearchParams();
    next.set('q', query);
    if (routeCategory) navigate(`/search?${next.toString()}`);
    else setSearchParams(next, { replace: true });
  };

  const activeCategory = categories.find((item) => item.slug === category);
  const heading = keyword
    ? `Kết quả cho "${keyword}"`
    : activeCategory
      ? activeCategory.name
      : 'Tất cả sản phẩm';

  const activeFilters = useMemo(() => {
    const chips = [];
    if (category) {
      chips.push({
        key: 'category',
        label: activeCategory?.name ?? category,
        clear: () => updateParam('category', ''),
      });
    }
    if (priceRange !== 'all') {
      const range = PRICE_RANGES.find((item) => item.id === priceRange);
      chips.push({
        key: 'price',
        label: range?.label ?? priceRange,
        clear: () => updateParam('price', ''),
      });
    }
    if (brand) chips.push({ key: 'brand', label: brand, clear: () => updateParam('brand', '') });
    if (minRating) {
      chips.push({
        key: 'rating',
        label: `${minRating}★ trở lên`,
        clear: () => updateParam('rating', ''),
      });
    }
    if (onlyDiscount) {
      chips.push({
        key: 'discount',
        label: 'Đang giảm giá',
        clear: () => updateParam('discount', ''),
      });
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, priceRange, brand, minRating, onlyDiscount, activeCategory]);

  const handleAddToCart = (product) => {
    addItem(product, 1);
    toast.show(`Đã thêm "${product.name}" vào giỏ hàng`, { tone: 'success' });
  };

  /** Pill bộ lọc dạng hàng ngang. */
  const FilterPill = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors duration-150',
        active
          ? 'border-brand-accent bg-brand-50 font-semibold text-brand-700'
          : 'border-line-200 bg-white text-ink-700 hover:border-brand-200 hover:bg-surface-hover',
      )}
    >
      {children}
    </button>
  );

  /**
   * Bộ lọc dạng hàng ngang.
   * - `bar` (desktop): các nhóm nằm cạnh nhau, wrap khi hết chỗ.
   * - `drawer` (mobile): xếp dọc cho dễ cuộn trong khung kéo.
   */
  const renderFilterGroups = (variant = 'bar') => {
    const isBar = variant === 'bar';

    return (
      <div className={cn(isBar ? 'flex flex-col gap-4' : 'flex flex-col gap-4')}>
        {/* Danh mục — luôn chiếm trọn một hàng để pill không bị bó hẹp */}
        <fieldset className="w-full">
          <legend className="mb-1.5 block text-xs font-semibold text-ink-700">Danh mục</legend>
          <div className="flex flex-wrap gap-2">
            <FilterPill active={!category} onClick={() => updateParam('category', '')}>
              Tất cả
            </FilterPill>
            {categories.map((item) => (
              <FilterPill
                key={item.slug}
                active={category === item.slug}
                onClick={() => updateParam('category', item.slug)}
              >
                {item.name}
                <span className="text-2xs font-semibold text-ink-300">{item.count}</span>
              </FilterPill>
            ))}
          </div>
        </fieldset>

        {/* Các nhóm bộ lọc còn lại — nằm ngang trên desktop */}
        <div className={cn(isBar ? 'flex flex-wrap items-start gap-x-6 gap-y-4' : 'flex flex-col gap-4')}>
          {/* Khoảng giá */}
          <fieldset className={cn(isBar ? 'w-full sm:w-52' : 'w-full')}>
            <legend className="mb-1.5 block text-xs font-semibold text-ink-700">Khoảng giá</legend>
            <select
              aria-label="Khoảng giá"
              value={priceRange}
              onChange={(event) => updateParam('price', event.target.value)}
              className="h-10 w-full rounded-lg border border-line-200 bg-white px-3 text-sm text-ink-900 focus:border-brand-accent focus:outline-none"
            >
              {PRICE_RANGES.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
          </fieldset>

          {/* Thương hiệu */}
          {brands.length ? (
            <fieldset className={cn(isBar ? 'w-full sm:w-52' : 'w-full')}>
              <legend className="mb-1.5 block text-xs font-semibold text-ink-700">Thương hiệu</legend>
              <select
                aria-label="Thương hiệu"
                value={brand}
                onChange={(event) => updateParam('brand', event.target.value)}
                className="h-10 w-full rounded-lg border border-line-200 bg-white px-3 text-sm text-ink-900 focus:border-brand-accent focus:outline-none"
              >
                <option value="">Tất cả thương hiệu</option>
                {brands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </fieldset>
          ) : null}

          {/* Đánh giá */}
          <fieldset className={cn(isBar ? 'w-full lg:w-auto' : 'w-full')}>
            <legend className="mb-1.5 block text-xs font-semibold text-ink-700">Đánh giá</legend>
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map((value) => (
                <FilterPill
                  key={value}
                  active={minRating === value}
                  onClick={() => updateParam('rating', String(value))}
                >
                  {value > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              'h-3.5 w-3.5',
                              index < value ? 'fill-star text-star' : 'text-ink-300',
                            )}
                          />
                        ))}
                      </span>
                      <span className="text-xs">trở lên</span>
                    </>
                  ) : (
                    'Tất cả'
                  )}
                </FilterPill>
              ))}
            </div>
          </fieldset>

          {/* Khuyến mãi */}
          <fieldset className={cn(isBar ? 'w-full lg:w-auto' : 'w-full')}>
            <legend className="mb-1.5 block text-xs font-semibold text-ink-700">Khuyến mãi</legend>
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-line-200 bg-white px-3.5 text-sm text-ink-700 transition-colors duration-150 hover:border-brand-200 hover:bg-surface-hover">
              <input
                type="checkbox"
                checked={onlyDiscount}
                onChange={(event) => updateParam('discount', event.target.checked ? '1' : '')}
                className="h-4 w-4 accent-brand-600"
              />
              Chỉ sản phẩm đang giảm giá
            </label>
          </fieldset>
        </div>
      </div>
    );
  };

  return (
    <StoreLayout title={`${heading} | ĐiệnTử`}>
      <div className="container-page py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-500">
          <Link to="/" className="transition-colors hover:text-brand-600">
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
          <span className="font-medium text-ink-700">{heading}</span>
        </nav>

        {/* Tiêu đề + ô tìm kiếm */}
        <div className="mt-4 rounded-2xl border border-line-200 bg-surface-card p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">{heading}</h1>
              <p className="mt-1 text-sm text-ink-500">
                {loading
                  ? 'Đang tải sản phẩm…'
                  : `${filtered.length} sản phẩm${keyword ? ' phù hợp' : ''}${
                      category && activeCategory ? ` trong ${activeCategory.name}` : ''
                    }`}
              </p>
            </div>
          </div>

          <form role="search" onSubmit={handleSearchSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="search-page-input" className="sr-only">
                Tìm kiếm sản phẩm
              </label>
              <input
                id="search-page-input"
                ref={searchInputRef}
                type="search"
                value={draftKeyword}
                onChange={(event) => setDraftKeyword(event.target.value)}
                placeholder="Nhập tên sản phẩm, hãng, danh mục… (gõ không dấu cũng được)"
                className="h-11 w-full rounded-lg border border-line-200 bg-surface-subtle pl-10 pr-10 text-sm text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-accent focus:bg-white focus:outline-none"
              />
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
                aria-hidden="true"
              />
              {draftKeyword ? (
                <button
                  type="button"
                  aria-label="Xoá từ khoá"
                  onClick={() => {
                    setDraftKeyword('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-300 transition-colors hover:bg-surface-hover hover:text-ink-700"
                >
                  <Close className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <Button type="submit" className="h-11 shrink-0 px-5">
              Tìm kiếm
            </Button>
          </form>

          {/* Gợi ý nhanh */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-500">Gợi ý:</span>
            {QUICK_SUGGESTIONS.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion.query}
                type="button"
                onClick={() => runSuggestion(suggestion.query)}
                className="rounded-full border border-line-200 bg-surface-subtle px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bộ lọc — giữ nguyên vị trí, cuộn tự nhiên cùng trang (không chạy theo che sản phẩm) */}
        <div className="mt-4 hidden lg:block">
          <div className="rounded-2xl border border-line-200 bg-surface-card p-4 shadow-card">
            {renderFilterGroups('bar')}
          </div>
        </div>

        {/* Bộ lọc (mobile) — drawer */}
        {filterOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink-900/40" onClick={() => setFilterOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm overflow-y-auto bg-surface-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-ink-900">Bộ lọc</h2>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="rounded-lg border border-line-200 px-3 py-1.5 text-sm font-medium text-ink-700"
                >
                  Đóng
                </button>
              </div>
              {renderFilterGroups('drawer')}
              <Button className="mt-5 w-full" onClick={() => setFilterOpen(false)}>
                Xem {filtered.length} sản phẩm
              </Button>
            </div>
          </div>
        ) : null}

        {/* Thanh công cụ + bộ lọc đang bật */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-expanded={filterOpen}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line-200 bg-white px-3 text-sm font-medium text-ink-700 lg:hidden"
            >
              <Filter className="h-4 w-4" />
              Bộ lọc
            </button>
            <p className="hidden text-sm text-ink-700 sm:block">
              {loading ? (
                'Đang tải…'
              ) : (
                <>
                  Hiển thị <strong>{filtered.length}</strong>
                  {total > filtered.length ? ` / ${total}` : ''} sản phẩm
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="sr-only">
              Sắp xếp
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value)}
              className="h-10 rounded-lg border border-line-200 bg-white px-3 text-sm text-ink-700 focus:border-brand-accent focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chip bộ lọc đang bật */}
        {activeFilters.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-brand-200 bg-brand-50 pl-3 pr-1 text-xs font-semibold text-brand-700"
              >
                {filter.label}
                <button
                  type="button"
                  onClick={filter.clear}
                  aria-label={`Bỏ lọc ${filter.label}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-brand-100"
                >
                  <Close className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-ink-500 underline-offset-2 transition-colors hover:text-brand-700 hover:underline"
            >
              Xoá tất cả
            </button>
          </div>
        ) : null}

        {/* Kết quả */}
        <div className="mt-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-line-200 bg-surface-card px-5 py-10 sm:px-8">
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title={
                  keyword
                    ? `Không tìm thấy sản phẩm cho "${keyword}"`
                    : 'Không tìm thấy sản phẩm phù hợp'
                }
                description={
                  keyword
                    ? 'Bạn thử kiểm tra chính tả, dùng từ khoá ngắn hơn (ví dụ "tivi", "tủ lạnh") hoặc chọn một gợi ý bên dưới.'
                    : 'Thử bỏ bớt bộ lọc hoặc chọn một danh mục khác.'
                }
                action={
                  <div className="flex flex-col items-center gap-3">
                    {activeFilters.length ? (
                      <Button variant="secondary" onClick={clearFilters}>
                        Xoá tất cả bộ lọc
                      </Button>
                    ) : null}
                    <div className="flex flex-wrap justify-center gap-2">
                      {QUICK_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion.query}
                          type="button"
                          onClick={() => runSuggestion(suggestion.query)}
                          className="rounded-full border border-line-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    </div>
                  </div>
                }
                className="border-0 bg-transparent px-0 py-0 shadow-none"
              />
            </div>
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => (
                  <li key={product.id} className="h-full">
                    <ProductCard product={product} onAddToCart={handleAddToCart} />
                  </li>
                ))}
              </ul>

              <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-500">
                <Shield className="h-3.5 w-3.5 text-status-success" aria-hidden="true" />
                Tất cả sản phẩm đều được bảo hành chính hãng và hỗ trợ đổi trả 30 ngày.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Thanh điều hướng nhanh cho mobile */}
      <div className="hide-when-modal-open fixed inset-x-0 bottom-0 z-30 border-t border-line-200 bg-surface-card/95 p-3 backdrop-blur lg:hidden">
        <Button className="w-full" onClick={() => setFilterOpen(true)}>
          <Cart className="h-4 w-4" />
          {filtered.length} sản phẩm · Bộ lọc
        </Button>
      </div>
    </StoreLayout>
  );
}

export default SearchPage;
