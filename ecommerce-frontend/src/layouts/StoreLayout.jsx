import { useEffect } from 'react';
import { Footer, SiteHeader, TopBar, ChatWidget } from '../components/sections';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

/**
 * Layout dùng chung cho các trang nội bộ (chi tiết SP, giỏ, tìm kiếm, tài khoản).
 * Cùng khung với trang chủ: TopBar → SiteHeader → nội dung → Footer.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.title] - tiêu đề tab trình duyệt
 */
export function StoreLayout({ children, title }) {
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    if (!title) return;
    document.title = title;
  }, [title]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <a href="#main" className="skip-link">
        Bỏ qua tới nội dung chính
      </a>

      <TopBar />
      <SiteHeader cartCount={cartCount} wishlistCount={wishlistCount} />

      <main id="main" className="flex-1">
        {children}
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}

export default StoreLayout;
