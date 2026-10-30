/**
 * Layout khu vực quản trị (admin/staff).
 *
 * Dùng lại `StoreLayout` (TopBar → SiteHeader → nội dung → Footer → ChatWidget)
 * để nhất quán với storefront, bổ sung sidebar quản trị bên trong nội dung.
 *
 * - Desktop: sidebar dọc cố định bên trái.
 * - Mobile: sidebar gập lại thành menu ngang cuộn được + nút mở/đóng.
 */

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cart, ChevronDown, Grid, Shield, Truck, User } from '../components/icons';
import { StoreLayout } from './StoreLayout';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

/** Các mục trong khu vực quản trị. */
export const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: Grid, end: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: Cart },
  { to: '/admin/customers', label: 'Khách hàng', icon: User },
  { to: '/admin/orders', label: 'Đơn hàng', icon: Truck },
];

/**
 * Kiểm tra một đường dẫn có khớp với mục đang active hay không.
 * @param {string} pathname
 * @param {{to: string, end?: boolean}} item
 * @returns {boolean}
 */
function isActive(pathname, item) {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.title] - tiêu đề tab trình duyệt
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.actions] - nút hành động trên đầu trang
 */
export function AdminLayout({ children, title, description, actions }) {
  const { user } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Đóng menu khi đổi route (mobile).
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const roleLabel = user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên';

  return (
    <StoreLayout title={title ? `${title} | ĐiệnTử Admin` : 'ĐiệnTử Admin'}>
      <div className="container-page py-6 lg:py-8">
        {/* Đầu trang */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <Shield className="h-3.5 w-3.5" />
              Khu vực quản trị
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
            {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>

        {/* Menu quản trị (mobile) */}
        <div className="mt-4 lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen((value) => !value)}
            aria-expanded={navOpen}
            className="flex h-11 w-full items-center justify-between rounded-lg border border-line-200 bg-surface-card px-3 text-sm font-semibold text-ink-900"
          >
            <span>
              {ADMIN_NAV_ITEMS.find((item) => isActive(location.pathname, item))?.label ??
                'Menu quản trị'}
            </span>
            <ChevronDown
              className={cn('h-4 w-4 text-ink-500 transition-transform duration-200', navOpen && 'rotate-180')}
            />
          </button>
          {navOpen ? (
            <nav
              aria-label="Menu quản trị"
              className="mt-2 grid gap-1 rounded-xl border border-line-200 bg-surface-card p-2"
            >
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(location.pathname, item);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-700 hover:bg-surface-hover',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>

        {/* Nội dung + sidebar (desktop) */}
        <div className="mt-5 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav
              aria-label="Menu quản trị"
              className="sticky top-28 rounded-2xl border border-line-200 bg-surface-card p-2"
            >
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(location.pathname, item);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-700 hover:bg-surface-hover hover:text-brand-600',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-2 border-t border-line-100 px-3 py-3">
                <p className="text-2xs uppercase tracking-wide text-ink-500">Đang đăng nhập</p>
                <p className="mt-1 truncate text-sm font-semibold text-ink-900">
                  {user?.full_name ?? user?.email ?? 'Không rõ'}
                </p>
                <p className="text-xs text-ink-500">{roleLabel}</p>
              </div>
            </nav>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </StoreLayout>
  );
}

export default AdminLayout;
