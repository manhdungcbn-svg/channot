/**
 * Trang tổng quan khu vực quản trị — `/admin`.
 *
 * Nguồn dữ liệu: `GET /api/shop/admin/stats`.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, EmptyState, Skeleton } from '../components/ui';
import { ChevronRight, Fire, Shield, Truck, User } from '../components/icons';
import { AdminLayout } from '../layouts/AdminLayout';
import { useToast } from '../context/ToastContext';
import { getAdminStats } from '../api/admin';
import { formatNumber, formatPrice } from '../utils/format';

/** Nhãn + tone cho từng trạng thái đơn hàng. */
const STATUS_META = {
  PENDING: { label: 'Chờ xác nhận', tone: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'info' },
  SHIPPED: { label: 'Đang giao', tone: 'brand' },
  DELIVERED: { label: 'Đã giao', tone: 'success' },
  CANCELLED: { label: 'Đã huỷ', tone: 'danger' },
};

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function AdminDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.show(error?.message || 'Không tải được số liệu tổng quan.', { tone: 'error' });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusRows = useMemo(() => {
    if (!stats) return [];
    const total = Object.values(stats.byStatus).reduce((sum, value) => sum + value, 0);
    return STATUS_ORDER.map((key) => {
      const meta = STATUS_META[key];
      const count = stats.byStatus[key] ?? 0;
      return {
        key,
        label: meta.label,
        tone: meta.tone,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    }).filter((row) => row.count > 0 || row.key !== 'CANCELLED');
  }, [stats]);

  const maxTopQuantity = useMemo(() => {
    if (!stats?.topProducts?.length) return 0;
    return stats.topProducts.reduce((max, item) => Math.max(max, item.quantity), 0);
  }, [stats]);

  if (loading) {
    return (
      <AdminLayout title="Tổng quan">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout title="Tổng quan">
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title="Chưa tải được số liệu"
          description="Không đọc được dữ liệu tổng quan vận hành. Vui lòng thử tải lại trang."
        />
      </AdminLayout>
    );
  }

  const cards = [
    { label: 'Doanh thu', value: formatPrice(stats.revenue), tone: 'text-price-600' },
    { label: 'Tổng đơn hàng', value: formatNumber(stats.totalOrders), tone: 'text-ink-900' },
    { label: 'Tổng khách hàng', value: formatNumber(stats.totalCustomers), tone: 'text-ink-900' },
    { label: 'Tổng sản phẩm', value: formatNumber(stats.totalProducts), tone: 'text-ink-900' },
  ];

  return (
    <AdminLayout
      title="Tổng quan"
      description="Theo dõi doanh thu, đơn hàng, khách hàng và tồn kho cửa hàng"
    >
      {/* 4 thẻ số liệu */}
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-line-200 bg-surface-card p-4">
            <dt className="text-xs text-ink-500">{card.label}</dt>
            <dd className={`mt-1 text-xl font-bold tabular-nums ${card.tone}`}>{card.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {/* Đơn theo trạng thái */}
        <section className="rounded-2xl border border-line-200 bg-surface-card p-5">
          <h2 className="text-base font-bold text-ink-900">Đơn hàng theo trạng thái</h2>

          {statusRows.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">Chưa có đơn hàng nào.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {statusRows.map((row) => (
                <li key={row.key}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={row.tone}>{row.label}</Badge>
                    <span className="text-sm font-semibold tabular-nums text-ink-900">
                      {formatNumber(row.count)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-subtle">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-300"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-2xs text-ink-500">{row.percent}% tổng số đơn</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Sản phẩm bán chạy */}
        <section className="rounded-2xl border border-line-200 bg-surface-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ink-900">Sản phẩm bán chạy</h2>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Quản lý sản phẩm
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {stats.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">Chưa có dữ liệu bán hàng.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.topProducts.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-2xs font-bold text-brand-700">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-medium text-ink-900">{item.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-700">
                      {formatNumber(item.quantity)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-subtle">
                    <div
                      className="h-full rounded-full bg-brand-accent transition-all duration-300"
                      style={{
                        width: `${
                          maxTopQuantity > 0
                            ? Math.round((item.quantity / maxTopQuantity) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Cảnh báo tồn kho thấp */}
      <section className="mt-5 rounded-2xl border border-line-200 bg-surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
            <Fire className="h-4 w-4 text-flash-600" />
            Cảnh báo tồn kho thấp
          </h2>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Xem danh sách sản phẩm
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.lowStock.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">
            Tất cả sản phẩm đều còn tồn kho tốt.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {stats.lowStock.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line-200 bg-surface-subtle px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-900">
                    {item.name}
                  </span>
                  <span className="block text-2xs text-ink-500">Còn {item.stock} sản phẩm</span>
                </span>
                <Badge tone={item.stock <= 0 ? 'danger' : 'warning'}>
                  {item.stock <= 0 ? 'Hết hàng' : 'Sắp hết'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Liên kết nhanh */}
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { to: '/admin/products', label: 'Thêm & sửa sản phẩm', icon: <Shield className="h-4 w-4" /> },
          { to: '/admin/customers', label: 'Quản lý khách hàng', icon: <User className="h-4 w-4" /> },
          { to: '/admin/orders', label: 'Đơn hàng & đặt hộ khách', icon: <Truck className="h-4 w-4" /> },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center justify-between gap-2 rounded-2xl border border-line-200 bg-surface-card px-4 py-3 text-sm font-semibold text-ink-900 transition-colors hover:border-brand-200 hover:text-brand-700"
          >
            <span className="flex items-center gap-2">
              {link.icon}
              {link.label}
            </span>
            <ChevronRight className="h-4 w-4 text-ink-300" />
          </Link>
        ))}
      </section>
    </AdminLayout>
  );
}

export default AdminDashboardPage;
