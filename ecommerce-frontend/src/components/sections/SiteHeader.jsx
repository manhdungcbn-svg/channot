import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Cart,
  ChevronDown,
  Close,
  Fire,
  Grid,
  Heart,
  Logout,
  Menu,
  Phone,
  Search,
  Shield,
  User,
} from '../icons';
import { cn } from '../../utils/cn';
import { trapFocus } from '../../utils/a11y';
import { useAuth } from '../../context/AuthContext';
import { buildCrossAppUrl } from '../../utils/sessionBridge';
import { onOpenWarrantyRegister } from '../../utils/warrantyModal';
import { onOpenLoginModal } from '../../utils/loginModal';
import { WarrantyRegisterModal } from './WarrantyRegisterModal';
import { LoginModal } from './LoginModal';
import { FlashSalePopup } from './FlashSalePopup';
import { ThemeToggle } from './ThemeToggle';

/** URL của app BảoHành Pro (cổng 5174 ở dev, có thể override bằng env). */
const WARRANTY_APP_URL =
  import.meta.env.VITE_WARRANTY_APP_URL || 'http://localhost:5174';

const NAV_LINKS = [
  { label: 'Tivi & âm thanh', to: '/search?category=tivi' },
  { label: 'Máy lọc nước', to: '/search?category=may-loc-nuoc' },
  { label: 'Điện gia dụng', to: '/search?category=thiet-bi-gia-dung' },
  { label: 'Lạnh & quạt', to: '/search?category=lam-lanh' },
  { label: 'Phụ kiện', to: '/search?category=phu-kien' },
];

/**
 * Header chuẩn E-commerce 2 tầng:
 * - Tầng 1: Logo + Ô tìm kiếm trung tâm lớn + Bảo hành Pro + Theme + Wishlist + Cart + Dropdown Tài khoản
 * - Tầng 2: Danh mục sản phẩm ngang + Flash sale + Đăng ký bảo hành + Hotline
 * - Mobile: Hamburger gọn gàng + Drawer tiện lợi
 *
 * @param {object} props
 * @param {number} [props.cartCount=0]
 * @param {number} [props.wishlistCount=0]
 */
export function SiteHeader({ cartCount = 0, wishlistCount = 0 }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [warrantySerial, setWarrantySerial] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState('login');
  const [flashPromoOpen, setFlashPromoOpen] = useState(false);

  const drawerRef = useRef(null);
  const accountMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Quản trị viên / nhân viên quản trị
  const isManager = Boolean(user && ['staff', 'admin'].includes(user.role));

  // Đóng dropdown tài khoản khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Popup quảng cáo flash sale
  useEffect(() => {
    if (!user) return undefined;
    if (isManager) return undefined;

    const timer = window.setTimeout(() => {
      setFlashPromoOpen(true);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [user, isManager]);

  // Modal đăng ký bảo hành có thể được mở từ thẻ sản phẩm
  useEffect(
    () =>
      onOpenWarrantyRegister((serial) => {
        setWarrantySerial(serial);
        setWarrantyOpen(true);
      }),
    [],
  );

  // Modal đăng nhập có thể được mở từ bất kỳ đâu
  useEffect(
    () =>
      onOpenLoginModal((mode) => {
        setLoginMode(mode);
        setLoginOpen(true);
      }),
    [],
  );

  // Đóng drawer và menu khi đổi route
  useEffect(() => {
    setDrawerOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  // Khoá cuộn + trap focus khi drawer mở
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        return;
      }
      trapFocus(drawerRef.current, event);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = keyword.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const closeFlashPromo = useCallback(() => setFlashPromoOpen(false), []);

  const userInitial = (user?.full_name ?? user?.email ?? 'U').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line-200 bg-surface-card/95 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-surface-card/85">
      {/* ============================================================
          TẦNG 1: MAIN BAR (Logo, Ô tìm kiếm trung tâm lớn, Tiện ích, Tài khoản)
          ============================================================ */}
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20 lg:gap-8">
        {/* 1. Logo ĐiệnTử */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Về trang chủ ĐiệnTử">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-cta text-white shadow-brand">
            <Cart className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
            Điện<span className="text-brand-600">Tử</span>
          </span>
        </Link>

        {/* 2. Ô tìm kiếm trung tâm lớn (Desktop) */}
        <form
          role="search"
          onSubmit={handleSearch}
          className="hidden flex-1 max-w-xl mx-2 lg:flex"
        >
          <div className="relative w-full">
            <label htmlFor="site-search" className="sr-only">
              Tìm kiếm sản phẩm
            </label>
            <input
              id="site-search"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm kiếm tivi, máy lọc nước, tủ lạnh, quạt, đồ gia dụng..."
              className="h-11 w-full rounded-xl border border-line-200 bg-surface-subtle pl-11 pr-24 text-sm text-ink-900 placeholder:text-ink-300 transition-all duration-150 focus:border-brand-accent focus:bg-white focus:shadow-sm focus:outline-none"
            />
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
              aria-hidden="true"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-cta text-white shadow-sm transition-opacity hover:opacity-95"
            >
              Tìm kiếm
            </button>
          </div>
        </form>

        {/* 3. Cụm Tiện ích & Tài khoản (Desktop) */}
        <div className="hidden items-center gap-2.5 lg:flex shrink-0">
          {/* Nút sang app Bảo hành Pro */}
          <a
            href={buildCrossAppUrl(WARRANTY_APP_URL, '/my-products')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-cta shadow-sm transition-opacity duration-150 hover:opacity-95 whitespace-nowrap"
            title="Hệ thống quản lý & tra cứu bảo hành điện tử"
          >
            <Shield className="h-4 w-4" />
            <span>Bảo hành Pro</span>
          </a>

          {/* Toggle sáng / tối */}
          <ThemeToggle />

          {/* Yêu thích */}
          <Link
            to="/wishlist"
            aria-label={`Yêu thích, ${wishlistCount} sản phẩm`}
            title="Sản phẩm yêu thích"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-200 bg-surface-card text-ink-700 transition-colors duration-150 hover:bg-surface-hover hover:text-brand-600"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-price-600 px-1 text-[10px] font-bold text-white shadow-sm">
                {wishlistCount}
              </span>
            ) : null}
          </Link>

          {/* Giỏ hàng (hoặc Quản trị nếu là Manager) */}
          {isManager ? (
            <Link
              to="/admin/orders"
              aria-label="Khu vực quản trị bán hàng"
              title="Quản lý bán hàng"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 text-xs font-semibold text-brand-700 transition-colors duration-150 hover:bg-brand-100"
            >
              <Grid className="h-4 w-4" />
              <span>Quản trị</span>
            </Link>
          ) : (
            <Link
              to="/cart"
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
              title="Giỏ hàng của bạn"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-200 bg-surface-card text-ink-700 transition-colors duration-150 hover:bg-surface-hover hover:text-brand-600"
            >
              <Cart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-price-600 px-1 text-[10px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          )}

          {/* Cụm Tài khoản / Menu Đăng nhập */}
          {user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-200 bg-surface-card px-3 text-xs font-semibold text-ink-700 transition-colors duration-150 hover:bg-surface-hover focus:border-brand-accent"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-2xs font-bold text-brand-700">
                  {userInitial}
                </span>
                <span className="max-w-[110px] truncate font-medium">
                  {user.full_name || user.phone || 'Tài khoản'}
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-ink-400 transition-transform duration-200', accountMenuOpen && 'rotate-180')} />
              </button>

              {/* Popover Menu tài khoản */}
              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-line-200 bg-surface-card p-2 shadow-card-hover z-50 animate-scale-in"
                >
                  {/* Header tài khoản */}
                  <div className="px-3 py-2.5 border-b border-line-100 mb-1">
                    <p className="text-sm font-bold text-ink-900 truncate">
                      {user.full_name || 'Khách hàng'}
                    </p>
                    <p className="text-xs text-ink-500 truncate mt-0.5">
                      {user.email || user.phone}
                    </p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                      {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                    </span>
                  </div>

                  {/* Danh sách mục tiện ích */}
                  <div className="space-y-0.5">
                    <Link
                      to="/orders"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-ink-700 transition-colors hover:bg-surface-hover hover:text-brand-600"
                    >
                      <span>📦</span>
                      <span>Đơn hàng của tôi</span>
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setWarrantyOpen(true);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-ink-700 transition-colors hover:bg-surface-hover hover:text-brand-600"
                    >
                      <Shield className="h-4 w-4 text-brand-600" />
                      <span>Đăng ký bảo hành</span>
                    </button>

                    {isManager && (
                      <Link
                        to="/admin/orders"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50/60 transition-colors hover:bg-brand-100"
                      >
                        <Grid className="h-4 w-4" />
                        <span>Khu vực quản lý bán hàng</span>
                      </Link>
                    )}

                    <Link
                      to="/account"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-ink-700 transition-colors hover:bg-surface-hover hover:text-brand-600"
                    >
                      <User className="h-4 w-4 text-ink-400" />
                      <span>Cài đặt tài khoản</span>
                    </Link>
                  </div>

                  {/* Phân cách & Đăng xuất */}
                  <div className="pt-1.5 mt-1.5 border-t border-line-100">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-status-danger transition-colors hover:bg-status-danger-bg"
                    >
                      <Logout className="h-4 w-4" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoginMode('login');
                setLoginOpen(true);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-cta px-4 text-xs font-bold text-white shadow-sm transition-opacity duration-150 hover:opacity-95"
            >
              <User className="h-4 w-4" />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>

        {/* Cụm điều khiển Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle className="h-10 w-10" />

          {isManager ? (
            <Link
              to="/admin/orders"
              aria-label="Khu vực quản trị"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-200 bg-surface-card text-ink-700"
            >
              <Grid className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/cart"
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-200 bg-surface-card text-ink-700"
            >
              <Cart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-price-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          )}

          <button
            type="button"
            aria-label={drawerOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-200 bg-surface-card text-ink-700 transition-colors hover:bg-surface-hover"
          >
            {drawerOpen ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ============================================================
          TẦNG 2: CATEGORY & QUICK LINKS BAR (Desktop)
          ============================================================ */}
      <nav
        aria-label="Danh mục sản phẩm & tiện ích"
        className="hidden border-t border-line-200/80 bg-surface-subtle/70 lg:block"
      >
        <div className="container-page flex h-11 items-center justify-between gap-6 text-xs font-semibold">
          {/* Menu 5 danh mục sản phẩm chính */}
          <ul className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-ink-700 transition-colors duration-150 hover:text-brand-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Tiện ích nhanh bên phải */}
          <div className="flex items-center gap-5 text-ink-500">
            <button
              type="button"
              onClick={() => setWarrantyOpen(true)}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600"
            >
              <Shield className="h-3.5 w-3.5 text-brand-600" />
              <span>Đăng ký bảo hành</span>
            </button>

            <Link
              to="/search?sort=price-asc"
              className="inline-flex items-center gap-1 text-flash-600 transition-colors hover:text-flash-700"
            >
              <Fire className="h-3.5 w-3.5" />
              <span>Flash Sale cuối tuần</span>
            </Link>

            <a
              href="tel:0827461460"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink-900"
            >
              <Phone className="h-3.5 w-3.5 text-ink-400" />
              <span>Hotline: <strong className="text-ink-800">0827461460</strong></span>
            </a>
          </div>
        </div>
      </nav>

      {/* ============================================================
          DRAWER MOBILE (Menu trượt mượt mà)
          ============================================================ */}
      {createPortal(
        <div
          className={cn(
            'fixed inset-0 z-[75] lg:hidden',
            drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
          )}
          aria-hidden={!drawerOpen}
        >
          <div
            className={cn(
              'absolute inset-0 bg-ink-900/50 backdrop-blur-sm transition-opacity duration-200',
              drawerOpen ? 'opacity-100' : 'opacity-0',
            )}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            tabIndex={-1}
            className={cn(
              'absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-surface-card px-5 py-5 shadow-2xl transition-transform duration-300 ease-out-soft',
              drawerOpen ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-line-100">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-cta text-white">
                  <Cart className="h-4 w-4" />
                </span>
                <span className="text-base font-bold text-ink-900">ĐiệnTử</span>
              </div>
              <button
                type="button"
                aria-label="Đóng menu"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-surface-hover"
              >
                <Close className="h-5 w-5" />
              </button>
            </div>

            {/* Ô tìm kiếm Mobile */}
            <form role="search" onSubmit={handleSearch} className="mt-4">
              <div className="relative">
                <label htmlFor="mobile-search" className="sr-only">
                  Tìm kiếm sản phẩm
                </label>
                <input
                  id="mobile-search"
                  type="search"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="h-11 w-full rounded-xl border border-line-200 bg-surface-subtle pl-10 pr-4 text-sm placeholder:text-ink-300 focus:border-brand-accent focus:bg-white focus:outline-none"
                />
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                  aria-hidden="true"
                />
              </div>
            </form>

            {/* Danh mục */}
            <nav aria-label="Danh mục chính (mobile)" className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-2">
                Danh mục sản phẩm
              </p>
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="flex min-h-[44px] items-center border-b border-line-100 text-sm font-medium text-ink-700 hover:text-brand-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Menu tác vụ */}
            <div className="mt-6 flex flex-col gap-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1">
                Tài khoản & Dịch vụ
              </p>

              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setLoginMode('login');
                    setLoginOpen(true);
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-cta text-sm font-semibold text-white shadow-sm"
                >
                  <User className="h-4 w-4" />
                  Đăng nhập / Đăng ký
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-surface-subtle border border-line-200 mb-2">
                  <p className="text-xs font-bold text-ink-900 truncate">
                    {user.full_name || 'Khách hàng'}
                  </p>
                  <p className="text-2xs text-ink-500 truncate mt-0.5">
                    {user.email || user.phone}
                  </p>
                </div>
              )}

              <a
                href={buildCrossAppUrl(WARRANTY_APP_URL, '/my-products')}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-cta text-sm font-semibold text-white shadow-sm"
              >
                <Shield className="h-4 w-4" />
                Mở Bảo hành Pro
              </a>

              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setWarrantyOpen(true);
                }}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line-200 bg-white text-sm font-semibold text-ink-700 hover:bg-surface-hover"
              >
                <Shield className="h-4 w-4 text-brand-600" />
                Đăng ký bảo hành
              </button>

              <Link
                to="/orders"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line-200 bg-white text-sm font-semibold text-ink-700 hover:bg-surface-hover"
              >
                Đơn hàng của tôi
              </Link>

              <Link
                to="/wishlist"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line-200 bg-white text-sm font-semibold text-ink-700 hover:bg-surface-hover"
              >
                Yêu thích ({wishlistCount})
              </Link>

              {isManager && (
                <Link
                  to="/admin/orders"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-50 text-sm font-semibold text-brand-700 border border-brand-200"
                >
                  <Grid className="h-4 w-4" />
                  Khu vực quản lý bán hàng
                </Link>
              )}

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    logout();
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line-200 bg-white text-sm font-semibold text-status-danger hover:bg-status-danger-bg"
                >
                  <Logout className="h-4 w-4" />
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Modal đăng ký bảo hành */}
      {createPortal(
        <WarrantyRegisterModal
          isOpen={warrantyOpen}
          initialSerial={warrantySerial}
          onClose={() => {
            setWarrantyOpen(false);
            setWarrantySerial('');
          }}
        />,
        document.body,
      )}

      {/* Modal đăng nhập */}
      {createPortal(
        <LoginModal
          isOpen={loginOpen}
          initialMode={loginMode}
          onClose={() => setLoginOpen(false)}
        />,
        document.body,
      )}

      {/* Popup quảng cáo flash sale */}
      {createPortal(
        <FlashSalePopup isOpen={flashPromoOpen} onClose={closeFlashPromo} />,
        document.body,
      )}
    </header>
  );
}

export default SiteHeader;
