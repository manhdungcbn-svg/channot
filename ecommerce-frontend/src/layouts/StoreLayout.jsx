import { useEffect, useState } from 'react';
import { Footer, SiteHeader, TopBar, ChatWidget } from '../components/sections';
import { MustChangePasswordModal } from '../components/sections/MustChangePasswordModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (!title) return;
    document.title = title;
  }, [title]);

  // Tự động bật modal đổi mật khẩu nếu user có cờ must_change_password
  useEffect(() => {
    if (user?.must_change_password) {
      // Chỉ hiện 1 lần trong phiên hoặc khi chưa bị người dùng tắt bằng nút X
      const dismissed = sessionStorage.getItem('dismiss_pwd_prompt');
      if (!dismissed) {
        setShowPasswordModal(true);
      }
    }
  }, [user]);

  function handleClosePasswordModal() {
    setShowPasswordModal(false);
    sessionStorage.setItem('dismiss_pwd_prompt', '1');
  }

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

      <MustChangePasswordModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
      />
    </div>
  );
}

export default StoreLayout;
