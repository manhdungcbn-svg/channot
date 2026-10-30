import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { Button, EmptyState, SectionHeader, Skeleton } from '../ui';
import { Grid } from '../icons';
import { getProducts } from '../../api/shop';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/**
 * Lưới sản phẩm — 4 trạng thái: loading / empty / error / default.
 * Dùng chung cho trang chủ, trang danh mục và trang tìm kiếm.
 *
 * @param {object} props
 * @param {number} [props.limit=8]
 * @param {string} [props.category] - slug danh mục để lọc
 * @param {string} [props.q] - từ khoá tìm kiếm
 * @param {string} [props.sort='featured']
 * @param {string} [props.eyebrow]
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.action]
 * @param {boolean} [props.showAction=true] - hiển thị thanh "Xem tất cả"
 */
export function ProductGrid({
  limit = 8,
  category,
  q,
  sort = 'featured',
  eyebrow = 'Sản phẩm nổi bật',
  title = 'Đang bán chạy tuần này',
  description = 'Thiết bị điện tử gia dụng chính hãng, bảo hành uy tín và giao hàng nhanh toàn quốc.',
  action,
  showAction = true,
}) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const { addItem } = useCart();
  const toast = useToast();

  const load = useCallback(
    async (signal) => {
      setStatus('loading');
      setErrorMessage('');
      try {
        const data = await getProducts({ category, q, sort, limit, signal });
        setProducts(data?.items ?? []);
        setStatus('ready');
      } catch (error) {
        if (error?.type === 'abort') return;
        setProducts([]);
        setErrorMessage(error?.message || 'Không tải được danh sách sản phẩm.');
        setStatus('error');
      }
    },
    [category, q, sort, limit],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const retry = () => setReloadKey((key) => key + 1);

  const handleAddToCart = (product) => {
    addItem(product);
    toast.show(`Đã thêm "${product.name}" vào giỏ hàng.`, { tone: 'success' });
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24" aria-labelledby="product-grid-title">
      <div className="container-page">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={
            action ??
            (showAction ? (
              <Link
                to="/search"
                className="inline-flex h-11 items-center rounded-lg border border-line-200 bg-white px-4 text-sm font-semibold text-ink-700 transition-colors duration-150 hover:bg-surface-hover"
              >
                Xem tất cả
              </Link>
            ) : null)
          }
        />

        <div className="mt-8">
          {status === 'loading' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {Array.from({ length: Math.min(limit, 8) }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col rounded-2xl border border-line-200 bg-surface-card p-3"
                >
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="mt-3 h-3 w-16" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1.5 h-4 w-3/4" />
                  <Skeleton className="mt-3 h-3 w-24" />
                  <Skeleton className="mt-3 h-6 w-28" />
                  <Skeleton className="mt-1.5 h-3 w-32" />
                  <Skeleton className="mt-3 h-11 w-full rounded-lg" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              ))}
            </div>
          ) : null}

          {status === 'error' ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-4 rounded-2xl border border-line-200 bg-surface-card px-6 py-14 text-center"
            >
              <h3 className="text-base font-semibold text-ink-900">Không tải được sản phẩm</h3>
              <p className="max-w-sm text-sm text-ink-500 text-pretty">{errorMessage}</p>
              <Button variant="gradient" onClick={retry}>
                Thử lại
              </Button>
            </div>
          ) : null}

          {status === 'ready' && products.length === 0 ? (
            <EmptyState
              icon={<Grid className="h-6 w-6" />}
              title="Chưa có sản phẩm nào"
              description="Hiện chưa có sản phẩm phù hợp. Hãy quay lại sau hoặc xem danh mục sản phẩm."
              action={
                <Button variant="secondary" onClick={retry}>
                  Tải lại
                </Button>
              }
            />
          ) : null}

          {status === 'ready' && products.length > 0 ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {products.map((product) => (
                <li key={product.id} className="min-w-0">
                  <ProductCard product={product} onAddToCart={handleAddToCart} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default ProductGrid;
