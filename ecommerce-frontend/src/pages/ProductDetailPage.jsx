import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, EmptyState, SectionHeader, Skeleton } from '../components/ui';
import {
  Cart,
  Check,
  ChevronRight,
  Heart,
  Refresh,
  Shield,
  Star,
  Truck,
} from '../components/icons';
import { StoreLayout } from '../layouts/StoreLayout';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getProductBySlug } from '../api/shop';
import { getReviews, createReview } from '../api/orders';
import { cn } from '../utils/cn';
import {
  discountPercent,
  formatInstallment,
  formatPrice,
  formatSold,
} from '../utils/format';
import { openWarrantyRegister } from '../utils/warrantyModal';

const INSTALLMENT_PLANS = [3, 6, 12, 24];

/**
 * Trang chi tiết sản phẩm — gallery, thông tin giá, trả góp, đánh giá,
 * thêm giỏ / mua ngay, liên kết bảo hành.
 */
export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { hasItem, toggleItem } = useWishlist();
  const toast = useToast();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [installmentMonths, setInstallmentMonths] = useState(12);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Tải sản phẩm theo slug
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setNotFound(false);
    setQuantity(1);

    getProductBySlug(slug, { signal: controller.signal })
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
          setProduct(null);
        } else {
          setProduct(data);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug]);

  // Tải đánh giá
  useEffect(() => {
    if (!product?.id) return undefined;
    let cancelled = false;
    getReviews(product.id)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  const discount = useMemo(
    () => discountPercent(product?.price, product?.originalPrice),
    [product],
  );

  const installmentMonthly = useMemo(() => {
    if (!product?.price || !installmentMonths) return 0;
    return Math.round(product.price / installmentMonths);
  }, [product, installmentMonths]);

  if (loading) {
    return (
      <StoreLayout title="Đang tải sản phẩm…">
        <div className="container-page py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-10 w-2/3 rounded-lg" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (notFound || !product) {
    return (
      <StoreLayout title="Không tìm thấy sản phẩm">
        <div className="container-page py-16">
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Sản phẩm bạn tìm có thể đã được gỡ bỏ hoặc đường dẫn không đúng."
            action={
              <Button onClick={() => navigate('/')}>
                <Cart className="h-4 w-4" />
                Về trang chủ
              </Button>
            }
          />
        </div>
      </StoreLayout>
    );
  }

  const soldOut = product.status === 'out_of_stock' || product.stock <= 0;
  const liked = hasItem(product.id);

  const handleAddToCart = (buyNow = false) => {
    if (soldOut) return;
    addItem(product, quantity);
    toast.show(
      buyNow
        ? `Đã thêm ${quantity} sản phẩm, đang chuyển tới giỏ hàng…`
        : `Đã thêm "${product.name}" vào giỏ hàng`,
      { tone: 'success' },
    );
    if (buyNow) navigate('/cart');
  };

  const handleToggleWishlist = () => {
    toggleItem(product);
    toast.show(liked ? 'Đã bỏ khỏi yêu thích' : 'Đã thêm vào yêu thích', { tone: 'info' });
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewError('');
    if (!user) {
      setReviewError('Vui lòng đăng nhập để đánh giá sản phẩm.');
      return;
    }
    setReviewing(true);
    try {
      await createReview(product.id, reviewForm);
      setReviewForm({ rating: 5, title: '', content: '' });
      const data = await getReviews(product.id);
      setReviews(data);
      toast.show('Cảm ơn bạn đã đánh giá sản phẩm!', { tone: 'success' });
    } catch (error) {
      setReviewError(error?.message || 'Không gửi được đánh giá. Vui lòng thử lại.');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <StoreLayout title={`${product.name} | ĐiệnTử`}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-page pt-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
          <li>
            <Link to="/" className="transition-colors hover:text-brand-600">
              Trang chủ
            </Link>
          </li>
          <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
          <li>
            <Link
              to={`/search?category=${product.categorySlug}`}
              className="transition-colors hover:text-brand-600"
            >
              {product.category}
            </Link>
          </li>
          <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
          <li className="truncate font-medium text-ink-700" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="container-page grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-8">
        {/* Ảnh + thông tin phụ */}
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-line-200 bg-surface-card">
            {product.badge ? (
              <div className="absolute left-0 top-0 z-10">
                <Badge tone={product.badge.tone} className="rounded-br-lg rounded-tl-none">
                  {product.badge.label}
                </Badge>
              </div>
            ) : null}

            <div className="aspect-square w-full">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-contain p-6"
                  decoding="async"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-ink-300">
                  Chưa có ảnh sản phẩm
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-pressed={liked}
              aria-label={liked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
              className={cn(
                'absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-line-200 bg-white shadow-sm transition-colors duration-150',
                liked ? 'text-price-600' : 'text-ink-500 hover:text-price-600',
              )}
            >
              <Heart className={cn('h-5 w-5', liked ? 'fill-current' : '')} />
            </button>
          </div>

          {/* Thẻ cam kết */}
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Shield className="h-5 w-5" />, title: product.warranty, desc: 'Bảo hành chính hãng' },
              { icon: <Truck className="h-5 w-5" />, title: 'Giao hàng 2-4 ngày', desc: 'Miễn phí từ 500k' },
              { icon: <Refresh className="h-5 w-5" />, title: 'Đổi trả 30 ngày', desc: 'Theo điều kiện nhà sản xuất' },
            ].map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-2.5 rounded-xl border border-line-200 bg-surface-card p-3"
              >
                <span className="mt-0.5 shrink-0 text-brand-600">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-900 text-pretty">{item.title}</p>
                  <p className="mt-0.5 text-2xs text-ink-500">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Thông tin + mua hàng */}
        <div>
          {product.brand ? (
            <p className="text-xs uppercase tracking-wide text-ink-400">{product.brand}</p>
          ) : null}

          <h1 className="mt-1 text-2xl font-bold leading-tight text-ink-900 text-pretty lg:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-semibold text-ink-900">
              <Star className="h-4 w-4 fill-star text-star" aria-hidden="true" />
              <span className="tabular-nums">
                {product.rating ? product.rating.toFixed(1) : '—'}
              </span>
            </span>
            <span className="text-ink-300">|</span>
            <span className="text-ink-500">{product.reviewCount} đánh giá</span>
            <span className="text-ink-300">|</span>
            <span className="text-ink-500">Đã bán {formatSold(product.sold ?? 0)}</span>
          </div>

          {/* Giá */}
          <div className="mt-5 rounded-2xl border border-line-200 bg-surface-subtle p-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-price-600 tabular-nums">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice ? (
                <span className="text-sm text-ink-400 line-through tabular-nums">
                  {formatPrice(product.originalPrice)}
                </span>
              ) : null}
              {discount > 0 ? (
                <span className="rounded-md bg-price-50 px-2 py-0.5 text-xs font-semibold text-price-600">
                  Giảm {discount}%
                </span>
              ) : null}
            </div>

            {/* Trả góp */}
            {installmentMonthly > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold text-ink-700">Trả góp không lãi</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INSTALLMENT_PLANS.map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setInstallmentMonths(months)}
                      aria-pressed={installmentMonths === months}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-left text-xs transition-colors duration-150',
                        installmentMonths === months
                          ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700'
                          : 'border-line-200 bg-white text-ink-600 hover:border-line-300',
                      )}
                    >
                      <span className="block tabular-nums">
                        {formatPrice(Math.round(product.price / months))}/kỳ
                      </span>
                      <span className="text-2xs text-ink-400">{months} tháng</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-500 tabular-nums">
                  {formatInstallment(product.price, installmentMonths)}
                </p>
              </div>
            ) : null}
          </div>

          {/* Thuộc tính nhanh */}
          {product.attributes?.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {product.attributes.map((attribute) => (
                <li
                  key={attribute}
                  className="rounded-md border border-line-100 bg-surface-subtle px-2 py-1 text-xs text-ink-600"
                >
                  {attribute}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Số lượng + nút mua */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex h-11 items-center rounded-lg border border-line-200 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                aria-label="Giảm số lượng"
                className="flex h-11 w-11 items-center justify-center text-ink-600 transition-colors hover:bg-surface-hover disabled:opacity-40"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                min={1}
                max={99}
                onChange={(event) =>
                  setQuantity(Math.min(99, Math.max(1, Number(event.target.value) || 1)))
                }
                aria-label="Số lượng"
                className="h-11 w-12 border-x border-line-200 text-center text-sm font-semibold tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                aria-label="Tăng số lượng"
                className="flex h-11 w-11 items-center justify-center text-ink-600 transition-colors hover:bg-surface-hover"
              >
                +
              </button>
            </div>

            <span className="text-xs text-ink-500">
              {soldOut ? 'Hết hàng' : `Còn ${product.stock} sản phẩm trong kho`}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              onClick={() => handleAddToCart(false)}
              disabled={soldOut}
              className="flex-1"
            >
              <Cart className="h-4 w-4" />
              Thêm vào giỏ
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => handleAddToCart(true)}
              disabled={soldOut}
              className="flex-1"
            >
              Mua ngay
            </Button>
          </div>

          {/* Bảo hành */}
          {product.serialNumber ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-200 bg-surface-card px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Mã serial sản phẩm</p>
                <p className="truncate font-mono text-xs text-ink-500">{product.serialNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => openWarrantyRegister(product.serialNumber)}
                className="shrink-0 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
              >
                Kích hoạt bảo hành
              </button>
            </div>
          ) : null}

          {/* Mô tả */}
          {product.description ? (
            <section className="mt-6">
              <h2 className="text-base font-bold text-ink-900">Mô tả sản phẩm</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600 text-pretty">
                {product.description}
              </p>
            </section>
          ) : null}

          {/* Thông số */}
          {product.specs && Object.keys(product.specs).length ? (
            <section className="mt-6">
              <h2 className="text-base font-bold text-ink-900">Thông số kỹ thuật</h2>
              <dl className="mt-3 divide-y divide-line-100 rounded-xl border border-line-200 bg-surface-card">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex gap-4 px-4 py-2.5 text-sm">
                    <dt className="w-2/5 shrink-0 text-ink-500">{key}</dt>
                    <dd className="min-w-0 flex-1 font-medium text-ink-900 text-pretty">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </div>

      {/* Đánh giá */}
      <section className="container-page py-8">
        <SectionHeader
          title="Đánh giá sản phẩm"
          description={`${reviews.length} đánh giá từ khách hàng`}
        />

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Danh sách đánh giá */}
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <EmptyState
                title="Chưa có đánh giá nào"
                description="Hãy là người đầu tiên đánh giá sản phẩm này."
              />
            ) : (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-line-200 bg-surface-card p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-0.5" aria-label={`${review.rating} sao`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            'h-3.5 w-3.5',
                            index < review.rating ? 'fill-star text-star' : 'text-ink-200',
                          )}
                        />
                      ))}
                    </span>
                    <span className="text-sm font-semibold text-ink-900">{review.userName}</span>
                  </div>
                  {review.title ? (
                    <p className="mt-1.5 text-sm font-semibold text-ink-900 text-pretty">
                      {review.title}
                    </p>
                  ) : null}
                  {review.content ? (
                    <p className="mt-1 text-sm text-ink-600 text-pretty">{review.content}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>

          {/* Form đánh giá */}
          <form onSubmit={handleSubmitReview} className="rounded-xl border border-line-200 bg-surface-card p-4">
            <h3 className="text-sm font-bold text-ink-900">Viết đánh giá</h3>

            <fieldset className="mt-3">
              <legend className="text-xs font-medium text-ink-600">Chấm điểm</legend>
              <div className="mt-1.5 flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewForm((form) => ({ ...form, rating: value }))}
                      aria-label={`${value} sao`}
                      aria-pressed={reviewForm.rating === value}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'h-6 w-6',
                          value <= reviewForm.rating ? 'fill-star text-star' : 'text-ink-200',
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="mt-3 block text-xs font-medium text-ink-600" htmlFor="review-title">
              Tiêu đề
            </label>
            <input
              id="review-title"
              type="text"
              value={reviewForm.title}
              onChange={(event) =>
                setReviewForm((form) => ({ ...form, title: event.target.value }))
              }
              placeholder="Tóm tắt trải nghiệm của bạn"
              className="mt-1 h-10 w-full rounded-lg border border-line-200 px-3 text-sm focus:border-brand-accent focus:outline-none"
            />

            <label className="mt-3 block text-xs font-medium text-ink-600" htmlFor="review-content">
              Nội dung
            </label>
            <textarea
              id="review-content"
              rows={4}
              value={reviewForm.content}
              onChange={(event) =>
                setReviewForm((form) => ({ ...form, content: event.target.value }))
              }
              placeholder="Sản phẩm dùng thế nào? Có đáng mua không?"
              className="mt-1 w-full rounded-lg border border-line-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            />

            {reviewError ? (
              <p className="mt-2 text-xs font-medium text-status-danger-text">{reviewError}</p>
            ) : null}

            <Button type="submit" disabled={reviewing} className="mt-3 w-full">
              {reviewing ? 'Đang gửi…' : 'Gửi đánh giá'}
            </Button>

            {!user ? (
              <p className="mt-2 flex items-center gap-1 text-2xs text-ink-500">
                <Check className="h-3.5 w-3.5 text-brand-600" />
                Bạn cần đăng nhập để gửi đánh giá.
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </StoreLayout>
  );
}

export default ProductDetailPage;
