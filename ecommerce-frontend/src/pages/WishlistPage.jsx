import { Link } from 'react-router-dom';
import { Button, EmptyState } from '../components/ui';
import { Heart } from '../components/icons';
import { ProductCard } from '../components/sections';
import { StoreLayout } from '../layouts/StoreLayout';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

/**
 * Trang yêu thích — hiển thị sản phẩm đã lưu, cho phép thêm giỏ / bỏ yêu thích.
 */
export function WishlistPage() {
  const { items, removeItem, clear } = useWishlist();
  const { addItem } = useCart();
  const toast = useToast();

  const handleAddToCart = (product) => {
    addItem(product, 1);
    toast.show(`Đã thêm "${product.name}" vào giỏ hàng`, { tone: 'success' });
  };

  return (
    <StoreLayout title="Yêu thích | ĐiệnTử">
      <div className="container-page py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">Sản phẩm yêu thích</h1>
            <p className="mt-1 text-sm text-ink-500">
              {items.length} sản phẩm đã lưu trên thiết bị này
            </p>
          </div>
          {items.length ? (
            <button
              type="button"
              onClick={() => {
                clear();
                toast.show('Đã xoá toàn bộ danh sách yêu thích', { tone: 'info' });
              }}
              className="text-sm font-medium text-ink-500 transition-colors hover:text-status-danger-text"
            >
              Xoá tất cả
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          {items.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="Chưa có sản phẩm yêu thích"
              description="Bấm biểu tượng trái tim trên thẻ sản phẩm để lưu lại món đồ bạn thích."
              action={
                <Link to="/">
                  <Button>Khám phá sản phẩm</Button>
                </Link>
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <li key={item.id} className="h-full">
                  <ProductCard product={item} onAddToCart={handleAddToCart} />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="mt-2 w-full text-xs font-medium text-ink-500 transition-colors hover:text-status-danger-text"
                  >
                    Bỏ khỏi yêu thích
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}

export default WishlistPage;
