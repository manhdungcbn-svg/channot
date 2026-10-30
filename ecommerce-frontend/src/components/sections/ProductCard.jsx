import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui';
import { Cart, Heart, Shield, Star } from '../icons';
import { cn } from '../../utils/cn';
import { discountPercent, formatInstallment, formatPrice, formatSold } from '../../utils/format';
import { normalizeProduct } from '../../api/shop';
import { openWarrantyRegister } from '../../utils/warrantyModal';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';

/**
 * Thẻ sản phẩm — layout 1:1 ảnh, badge trạng thái, wishlist 44×44,
 * tên clamp 2 dòng, rating + đã bán, chip thuộc tính, giá + giá gốc,
 * dòng trả góp và nút giỏ hàng.
 *
 * @param {object} props
 * @param {object} props.product - ShopProduct (chuẩn hoá tự động nếu shape khác)
 * @param {function(object): void} [props.onAddToCart]
 * @param {boolean} [props.showLink=true] - bọc tên bằng link tới trang chi tiết
 */
export function ProductCard({ product, onAddToCart, showLink = true }) {
  const { hasItem, toggleItem } = useWishlist();
  const toast = useToast();

  if (!product) return null;

  const item = normalizeProduct(product);
  const discount = discountPercent(item.price, item.originalPrice);
  const saved = item.originalPrice
    ? formatPrice(item.originalPrice - item.price, { withSymbol: false })
    : 0;
  const soldOut = item.status === 'out_of_stock';
  const liked = hasItem(item.id);

  const handleAddToCart = () => {
    if (onAddToCart) onAddToCart(item);
  };

  const handleToggleWishlist = () => {
    toggleItem(item);
    toast.show(liked ? 'Đã bỏ khỏi yêu thích' : 'Đã thêm vào yêu thích', { tone: 'info' });
  };

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line-200 bg-surface-card p-3 transition-shadow duration-200 hover:shadow-card-hover">
      {/* Ảnh + badge + wishlist */}
      <div className="relative overflow-hidden rounded-xl bg-surface-subtle">
        <Link
          to={`/product/${item.slug}`}
          className="block"
          aria-label={`Xem chi tiết ${item.name}`}
        >
          <div className="aspect-square w-full">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain p-2 transition-transform duration-300 ease-out-soft group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xs text-ink-300">
                Chưa có ảnh
              </div>
            )}
          </div>
        </Link>

        {item.badge ? (
          <div className="absolute left-0 top-0">
            <Badge tone={item.badge.tone} className="rounded-br-lg rounded-tl-none">
              {item.badge.label}
            </Badge>
          </div>
        ) : null}

        <button
          type="button"
          aria-label={liked ? `Bỏ yêu thích ${item.name}` : `Yêu thích ${item.name}`}
          aria-pressed={liked}
          onClick={handleToggleWishlist}
          className={cn(
            'absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-lg bg-white/90 transition-colors duration-150 hover:bg-white',
            liked ? 'text-price-600' : 'text-ink-300 hover:text-price-600',
          )}
        >
          <Heart className={cn('h-5 w-5', liked ? 'fill-current' : '')} />
        </button>
      </div>

      {/* Thương hiệu */}
      {item.brand ? (
        <p className="mt-3 text-2xs uppercase tracking-wide text-ink-300">{item.brand}</p>
      ) : null}

      {/* Tên sản phẩm */}
      <h3 className="clamp-2 mt-1 min-h-[2.5rem] text-sm font-medium leading-5 text-ink-900 text-pretty">
        {showLink ? (
          <Link to={`/product/${item.slug}`} className="transition-colors duration-150 hover:text-brand-600">
            {item.name}
          </Link>
        ) : (
          item.name
        )}
      </h3>

      {/* Rating + đã bán */}
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-700">
          <Star className="h-3.5 w-3.5 fill-star text-star" aria-hidden="true" />
          <span className="tabular-nums">{item.rating ? item.rating.toFixed(1) : '—'}</span>
        </span>
        {item.reviewCount ? (
          <>
            <span className="text-xs text-ink-300">·</span>
            <span className="text-xs text-ink-500 tabular-nums">{item.reviewCount} đánh giá</span>
          </>
        ) : null}
        <span className="text-xs text-ink-300">·</span>
        <span className="text-xs text-ink-500">Đã bán {formatSold(item.sold ?? 0)}</span>
      </div>

      {/* Chip thuộc tính */}
      {item.attributes?.length ? (
        <ul className="mt-2 flex flex-wrap gap-1">
          {item.attributes.slice(0, 3).map((attribute) => (
            <li
              key={attribute}
              className="rounded-md border border-line-100 bg-surface-subtle px-1.5 py-0.5 text-2xs text-ink-500"
            >
              {attribute}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Giá */}
      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="text-xl font-bold text-price-600 tabular-nums">{formatPrice(item.price)}</span>
        {item.originalPrice ? (
          <span className="text-xs text-ink-300 line-through tabular-nums">
            {formatPrice(item.originalPrice)}
          </span>
        ) : null}
        {discount > 0 ? (
          <span className="ml-auto rounded-md bg-price-50 px-1.5 py-0.5 text-2xs font-semibold text-price-600">
            Tiết kiệm {saved} ₫
          </span>
        ) : null}
      </div>

      {/* Trả góp */}
      {item.installmentMonthly ? (
        <p className="mt-1 text-xs text-ink-500 tabular-nums">
          Trả góp {formatInstallment(item.price, item.installmentMonths)}
        </p>
      ) : null}

      {/* Nút giỏ */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={soldOut}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-cta text-sm font-semibold text-white transition-shadow duration-150 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Cart className="h-4 w-4" />
        {soldOut ? 'Hết hàng' : 'Thêm vào giỏ'}
      </button>

      {/* Bảo hành */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-2xs text-ink-500">
          <Shield className="h-3.5 w-3.5 shrink-0 text-status-success" aria-hidden="true" />
          {item.warranty || 'Bảo hành chính hãng'}
        </p>
      </div>

      {/* Serial + nút kích hoạt bảo hành */}
      {item.serialNumber ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-line-100 bg-surface-subtle px-2.5 py-1.5">
          <span className="min-w-0 truncate font-mono text-2xs text-ink-500" title={item.serialNumber}>
            {item.serialNumber}
          </span>
          <button
            type="button"
            onClick={() => openWarrantyRegister(item.serialNumber)}
            className="shrink-0 rounded-md bg-brand-50 px-2 py-1 text-2xs font-semibold text-brand-600 transition-colors duration-150 hover:bg-brand-100"
          >
            Kích hoạt
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default ProductCard;
