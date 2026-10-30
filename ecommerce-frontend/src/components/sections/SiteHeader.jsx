import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cart, Close, Grid, Heart, Logout, Menu, Search, Shield, User } from '../icons';
import { cn } from '../../utils/cn';
import { trapFocus } from '../../utils/a11y';
import { useAuth } from '../../context/AuthContext';
import { buildCrossAppUrl } from '../../utils/sessionBridge';
import { onOpenWarrantyRegister } from '../../utils/warrantyModal';
import { onOpenLoginModal } from '../../utils/loginModal';
import { WarrantyRegisterModal } from './WarrantyRegisterModal';
import { LoginModal } from './LoginModal';
import { FlashSalePopup } from './FlashSalePopup';

/** URL của app BảoHành Pro (cổng 5174 ở dev, có thể override bằng env). */
const WARRANTY_APP_URL =
  import.meta.env.VITE_WARRANTY_APP_URL || 'http://localhost:5174';

const NAV_LINKS = [
  { label: 'Tivi & âm thanh', to: '/search?q=tivi' },
  { label: 'Máy lọc nước', to: '/search?q=máy+lọc+nước' },
  { label: 'Điện gia dụng', to: '/search?q=điện+gia+dụng' },
  { label: 'Lạnh & quạt', to: '/search?q=máy+lạnh' },
  { label: 'Phụ kiện', to: '/search?q=phụ+kiện' },
];

/**
 * Header tối giản, sticky. Desktop: logo + nav + tìm kiếm + wishlist + giỏ + CTA.
 * Mobile: hamburger mở drawer đơn giản.
 *
 * @param {object} props
 * @param {number} [props.cartCount=0]
 * @param {number} [props.wishlistCount=0]
 */
export function SiteHeader({ cartCount = 0, wishlistCount = 0 }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [warrantySerial, setWarrantySerial] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState('login');
  const [flashPromoOpen, setFlashPromoOpen] = useState(false);
  const drawerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Quản trị viên / nhân viên quản trị KHÔNG dùng giỏ hàng & không đặt hàng
  // trên storefront — họ đặt hàng hộ khách trong khu vực quản trị.
  const isManager = Boolean(user && ['staff', 'admin'].includes(user.role));

  // Popup quảng cáo flash sale — hiện 1 lần/phiên khi khách đăng nhập.
  // Áp dụng cho cả 2 trường hợp: vừa đăng nhập xong, hoặc vào trang khi đã
  // đăng nhập sẵn (refresh trang). Cờ `sessionStorage` do chính FlashSalePopup
  // quản lý (chỉ hiện 1 lần mỗi phiên trình duyệt).
  useEffect(() => {
    if (!user) return undefined;
    if (isManager) return undefined;

    // Chờ modal đăng nhập đóng hẳn rồi mới bật popup lên (không chồng lên nhau).
    const timer = window.setTimeout(() => {
      setFlashPromoOpen(true);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [user, isManager]);

  // Modal đăng ký bảo hành có thể được mở từ thẻ sản phẩm (prefill serial).
  useEffect(
    () =>
      onOpenWarrantyRegister((serial) => {
        setWarrantySerial(serial);
        setWarrantyOpen(true);
      }),
    [],
  );

  // Modal đăng nhập có thể được mở từ bất kỳ đâu (giỏ hàng, trang tài khoản...).
  useEffect(
    () =>
      onOpenLoginModal((mode) => {
        setLoginMode(mode);
        setLoginOpen(true);
      }),
    [],
  );

  // Đóng drawer khi đổi route
  useEffect(() => {
    setDrawerOpen(false);
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

  return (
    <header className="sticky top-0 z-40 border-b border-line-200 bg-surface-card/95 backdrop-blur supports-[backdrop-filter]:bg-surface-card/80">
      <div className="container-page flex h-16 items-center gap-3 lg:h-20 lg:gap-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Về trang chủ">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-cta text-white">
            <Cart className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight text-ink-900 sm:block">
            Điện<span className="text-brand-600">Tử</span>
          </span>
        </Link>

        {/* Nav (desktop) */}
        <nav aria-label="Danh mục chính" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm font-medium text-ink-700 transition-colors duration-150 hover:text-brand-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Ô tìm kiếm (desktop) */}
        <form
          role="search"
          onSubmit={handleSearch}
          className="ml-auto hidden min-w-0 flex-1 items-center lg:flex max-w-md"
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
              placeholder="Tìm tivi, máy lọc nước, quạt..."
              className="h-11 w-full rounded-lg border border-line-200 bg-surface-subtle pl-10 pr-3 text-sm text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-accent focus:bg-white focus:outline-none"
            />
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
              aria-hidden="true"
            />
          </div>
        </form>

        {/* Hành động (desktop) */}
        <div className="ml-auto hidden items-center gap-1 lg:flex">
          <Link
            to="/wishlist"
            aria-label={`Yêu thích, ${wishlistCount} sản phẩm`}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors duration-150 hover:bg-surface-hover hover:text-brand-600"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-price-600 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            ) : null}
          </Link>

          {/* Quản trị viên/nhân viên quản trị: ẩn giỏ hàng, thay bằng link Quản trị */}
          {isManager ? (
            <Link
              to="/admin"
              aria-label="Khu vực quản trị"
              className="ml-1 inline-flex h-11 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 text-sm font-semibold text-brand-700 transition-colors duration-150 hover:bg-brand-100"
            >
              <Grid className="h-4 w-4" />
              <span className="hidden xl:inline">Quản trị</span>
            </Link>
          ) : (
            <Link
              to="/cart"
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors duration-150 hover:bg-surface-hover hover:text-brand-600"
            >
              <Cart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-price-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setWarrantyOpen(true)}
            className="ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg border border-line-200 bg-white px-4 text-sm font-semibold text-ink-700 transition-colors duration-150 hover:bg-surface-hover"
          >
            <Shield className="h-4 w-4 text-brand-600" />
            Đăng ký bảo hành
          </button>

          <a
            href={buildCrossAppUrl(WARRANTY_APP_URL, '/my-products')}
            target="_blank"
            rel="noreferrer"
            className="ml-2 inline-flex h-11 items-center rounded-lg bg-gradient-cta px-4 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
          >
            Bảo hành Pro
          </a>

          {user ? (
            <>
              {isManager ? (
                <Link
                  to="/admin/orders"
                  className="ml-2 hidden h-11 items-center rounded-lg border border-brand-200 bg-brand-50 px-3 text-sm font-semibold text-brand-700 transition-colors duration-150 hover:bg-brand-100 xl:inline-flex"
                >
                  Quản lý bán hàng
                </Link>
              ) : null}

              <Link
                to="/orders"
                className="ml-2 hidden h-11 items-center rounded-lg border border-line-200 bg-white px-3 text-sm font-semibold text-ink-700 transition-colors duration-150 hover:bg-surface-hover xl:inline-flex"
              >
                Đơn hàng
              </Link>
              <Link
                to="/account"
                className="ml-2 inline-flex h-11 items-center gap-2 rounded-lg border border-line-200 bg-white px-3 text-sm font-semibold text-ink-700 transition-colors duration-150 hover:bg-surface-hover"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-2xs font-bold text-brand-600">
                  {(user.full_name ?? 'U').trim().charAt(0).toUpperCase()}
                </span>
                <span className="hidden xl:inline">Tài khoản</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                title={`Đăng xuất (${user.email ?? ''})`}
                className="ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg border border-line-200 bg-white px-3 text-sm font-semibold text-ink-700 transition-colors duration-150 hover:bg-surface-hover"
              >
                <Logout className="h-4 w-4 text-ink-500" />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            /* Chưa đăng nhập — nút rõ ràng, dễ nhận biết với người không rành công nghệ */
            <button
              type="button"
              onClick={() => {
                setLoginMode('login');
                setLoginOpen(true);
              }}
              className="ml-2 inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-cta px-4 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            >
              <User className="h-4 w-4" />
              Đăng nhập
            </button>
          )}
        </div>

        {/* Nút mobile */}
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          {isManager ? (
            <Link
              to="/admin"
              aria-label="Khu vực quản trị"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors duration-150 hover:bg-surface-hover hover:text-brand-600"
            >
              <Grid className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/cart"
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-700"
            >
              <Cart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-price-600 px-1 text-[10px] font-bold text-white">
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors duration-150 hover:bg-surface-hover"
          >
            {drawerOpen ? <Close className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Drawer mobile — render qua portal ra document.body để không bị header
          (sticky + backdrop-blur) khoanh vùng làm che/kẹt menu. */}
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
              'absolute inset-0 bg-ink-900/40 transition-opacity duration-200',
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
              'absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-surface-card px-5 py-5 shadow-xl transition-transform duration-300 ease-out-soft',
              drawerOpen ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-ink-900">Menu</span>
              <button
                type="button"
                aria-label="Đóng menu"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors duration-150 hover:bg-surface-hover"
              >
                <Close className="h-5 w-5" />
              </button>
            </div>

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
                  className="h-11 w-full rounded-lg border border-line-200 bg-surface-subtle pl-10 pr-3 text-sm placeholder:text-ink-300 focus:border-brand-accent focus:bg-white focus:outline-none"
                />
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
                  aria-hidden="true"
                />
              </div>
            </form>

            <nav aria-label="Danh mục chính (mobile)" className="mt-5">
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="flex min-h-[44px] items-center border-b border-line-100 text-sm font-medium text-ink-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-5 flex flex-col gap-2">
              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setLoginMode('login');
                    setLoginOpen(true);
                  }}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-gradient-cta text-base font-semibold text-white"
                >
                  <User className="h-5 w-5" />
                  Đăng nhập / Đăng ký
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setWarrantyOpen(true);
                }}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-line-200 bg-white text-base font-semibold text-ink-700"
              >
                <Shield className="h-4 w-4 text-brand-600" />
                Đăng ký bảo hành
              </button>
              <a
                href={buildCrossAppUrl(WARRANTY_APP_URL, '/my-products')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-gradient-cta text-base font-semibold text-white"
              >
                Mở Bảo hành Pro
              </a>
              <Link
                to="/wishlist"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-line-200 bg-white text-base font-semibold text-ink-700"
              >
                Yêu thích ({wishlistCount})
              </Link>
              <Link
                to="/orders"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-line-200 bg-white text-base font-semibold text-ink-700"
              >
                Đơn hàng của tôi
              </Link>
              {isManager ? (
                <Link
                  to="/admin"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-brand-50 text-base font-semibold text-brand-700"
                >
                  <Grid className="h-5 w-5" />
                  Khu vực quản trị
                </Link>
              ) : null}
              <Link
                to="/account"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-line-200 bg-white text-base font-semibold text-ink-700"
              >
                Tài khoản của tôi
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    logout();
                  }}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-line-200 bg-white text-base font-semibold text-ink-700"
                >
                  <Logout className="h-5 w-5 text-ink-500" />
                  Đăng xuất
                </button>
              ) : null}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Modal đăng ký bảo hành — portal để không bị header che. */}
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

      {/* Modal đăng nhập / đăng ký / quên mật khẩu — portal để không bị header che. */}
      {createPortal(
        <LoginModal
          isOpen={loginOpen}
          initialMode={loginMode}
          onClose={() => setLoginOpen(false)}
        />,
        document.body,
      )}

      {/* Popup quảng cáo flash sale — portal, z-85, tự đóng sau 5s. */}
      {createPortal(
        <FlashSalePopup isOpen={flashPromoOpen} onClose={closeFlashPromo} />,
        document.body,
      )}
    </header>
  );
}

export default SiteHeader;