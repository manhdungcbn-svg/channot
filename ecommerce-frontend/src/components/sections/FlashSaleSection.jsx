import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, SectionHeader, Skeleton } from '../ui';
import { Fire, Grid } from '../icons';
import { ProductCard } from './ProductCard';
import { getProducts } from '../../api/shop';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/**
 * Section Flash Sale cuối tuần — hiển thị sản phẩm đang giảm giá (có ảnh thật).
 *
 * Lấy danh sách sản phẩm từ API, lọc ra các sản phẩm có `originalPrice > price`
 * (đang giảm giá) và sắp xếp theo mức giảm giảm dần. Nếu không có sản phẩm giảm
 * giá, fallback về sản phẩm bán chạy để section không bao giờ trống ảnh.
 */
export function FlashSaleSection({ limit = 4 }) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [reloadKey, setReloadKey] = useState(0);
  const { addItem } = useCart();
  const toast = useToast();

  const load = useCallback(
    async (signal) => {
      setStatus('loading');
      try {
        const data = await getProducts({ sort: 'featured', limit: 24, signal });
        const items = data?.items ?? [];
        const discounted = items.filter(
          (item) => item.originalPrice && item.originalPrice > item.price,
        );
        const pool = discounted.length ? discounted : items;
        pool.sort((a, b) => {
          const da = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
          const db = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
          return db - da;
        });
        setProducts(pool.slice(0, limit));
        setStatus('ready');
      } catch (error) {
        if (error?.type === 'abort') return;
        setProducts([]);
        setStatus('error');
      }
    },
    [limit],
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

  const timeLabel = useMemo(() => {
    // Đếm ngược tới cuối ngày Chủ nhật gần nhất (chỉ hiển thị, không chặn mua).
    const now = new Date();
    return now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }, []);

  if (status === 'error') {
    return (
      <section className="py-12 sm:py-16" aria-labelledby="flash-sale-title">
        <div className="container-page">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-flash-100 bg-surface-card px-6 py-12 text-center">
            <h3 className="text-base font-semibold text-ink-900">Không tải được ưu đãi</h3>
            <Button variant="secondary" onClick={retry}>
              Thử lại
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20" aria-labelledby="flash-sale-title">
      <div className="container-page">
        {/* Banner tiêu đề flash sale */}
        <div className="rounded-2xl border border-flash-100 bg-gradient-to-r from-flash-50 via-surface-card to-surface-card p-5 sm:p-6 shadow-card">
          <SectionHeader
            eyebrow={
              <span className="inline-flex items-center gap-1.5 font-bold text-flash-600">
                <Fire className="h-4 w-4" /> Flash sale cuối tuần
              </span>
            }
            title="Giảm sốc cuối tuần — số lượng có hạn"
            description={
              <span className="text-ink-700">
                Ưu đãi hôm nay {timeLabel}, giá đã giảm sẵn trên từng sản phẩm. Nhanh tay kẻo lỡ!
              </span>
            }
            action={
              <Link
                to="/search?sort=price-asc"
                className="inline-flex h-11 items-center rounded-lg bg-flash-600 px-4 text-sm font-semibold text-white shadow-sm transition-opacity duration-150 hover:opacity-90"
              >
                Xem tất cả ưu đãi
              </Link>
            }
          />
        </div>

        {/* Danh sách sản phẩm giảm giá */}
        <div className="mt-6">
          {status === 'loading' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {Array.from({ length: limit }).map((_, index) => (
                <div key={index} className="flex flex-col rounded-2xl border border-line-200 bg-surface-card p-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-1.5 h-4 w-3/4" />
                  <Skeleton className="mt-3 h-6 w-28" />
                  <Skeleton className="mt-3 h-11 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : null}

          {status === 'ready' && products.length === 0 ? (
            <EmptyState
              icon={<Grid className="h-6 w-6" />}
              title="Chưa có ưu đãi nào"
              description="Hiện chưa có sản phẩm giảm giá. Hãy quay lại vào cuối tuần sau nhé."
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

export default FlashSaleSection;
