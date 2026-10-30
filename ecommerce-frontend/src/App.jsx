import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SearchPage } from './pages/SearchPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { OrdersPage } from './pages/OrdersPage';
import { SellerOrdersPage } from './pages/SellerOrdersPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminCustomersPage } from './pages/AdminCustomersPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminRoute } from './components/AdminRoute';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';

/**
 * Router ứng dụng storefront.
 *
 * CartProvider / WishlistProvider / ToastProvider bọc ở đây vì các trang và
 * section (ProductGrid, SiteHeader…) dùng useCart() / useWishlist() / useToast()
 * — không có provider thì trang trắng.
 */
export function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <WishlistProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:slug" element={<SearchPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/seller/orders" element={<SellerOrdersPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/coming-soon" element={<ComingSoonPage />} />

            {/* Khu vực quản trị — chỉ admin/staff */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProductsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <AdminRoute>
                  <AdminCustomersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrdersPage />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  );
}

export default App;
