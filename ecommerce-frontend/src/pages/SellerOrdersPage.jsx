import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { ChevronRight, Shield, Truck } from '../components/icons';
import { StoreLayout } from '../layouts/StoreLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMyOrders, normalizeOrder } from '../api/orders';
import { cn } from '../utils/cn';
import { formatPrice } from '../utils/format';

const STATUS_META = {
  PENDING: { label: 'Chờ xác nhận', tone: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'info' },
  SHIPPED: { label: 'Đang giao', tone: 'brand' },
  DELIVERED: { label: 'Đã giao', tone: 'success' },
  CANCELLED: { label: 'Đã huỷ', tone: 'danger' },
};

const TONE_CLASS = {
  warning: 'bg-status-warning-bg text-status-warning-text',
  info: 'bg-status-info-bg text-status-info-text',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-status-success-bg text-status-success-text',
  danger: 'bg-status-danger-bg text-status-danger-text',
};

/**
 * Trang quản lý bán hàng — dành cho nhân viên bán hàng (staff) và quản trị (admin).
 *
 * Nhân viên thấy TOÀN BỘ đơn hàng của cửa hàng (backend tự lọc theo vai trò),
 * có thể chuyển trạng thái đơn. Khi đơn sang "Đang giao" → hệ thống **tự sinh
 * serial bảo hành** cho từng sản phẩm và gán về khách mua.
 */
export function SellerOrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const isSeller = user && ['staff', 'admin'].includes(user.role);

  useEffect(() => {
    if (!isSeller) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;

    getMyOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.show(error?.message || 'Không tải được danh sách đơn.', { tone: 'error' });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller]);

  const stats = useMemo(() => {
    const revenue = orders
      .filter((order) => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + order.total, 0);
    const pending = orders.filter((order) => order.status === 'PENDING').length;
    const shipping = orders.filter((order) => order.status === 'SHIPPED').length;
    return { revenue, pending, shipping, total: orders.length };
  }, [orders]);

  const visibleOrders = useMemo(
    () => (filter ? orders.filter((order) => order.status === filter) : orders),
    [orders, filter],
  );

  const handleStatusChange = async (order, status) => {
    setUpdatingId(order.id);
    try {
      const token = window.localStorage.getItem('token');
      const response = await fetch(`/api/shop/orders/${order.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || 'Không cập nhật được trạng thái đơn.');
      }
      const updated = await response.json();
      const normalized = normalizeOrder(updated);
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? { ...item, ...normalized, items: normalized.items ?? item.items }
            : item,
        ),
      );
      toast.show(
        status === 'SHIPPED'
          ? `Đơn ${order.orderCode} đã xuất kho — serial bảo hành đã được cấp cho khách.`
          : `Đã cập nhật đơn ${order.orderCode}.`,
        { tone: 'success' },
      );
    } catch (error) {
      toast.show(error?.message || 'Không cập nhật được trạng thái đơn.', { tone: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) {
    return (
      <StoreLayout title="Quản lý bán hàng">
        <div className="container-page py-12">
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </StoreLayout>
    );
  }

  if (!isSeller) {
    return (
      <StoreLayout title="Quản lý bán hàng">
        <div className="container-page py-12">
          <EmptyState
            icon={<Shield className="h-6 w-6" />}
            title="Bạn không có quyền truy cập"
            description="Khu vực quản lý bán hàng chỉ dành cho nhân viên bán hàng và quản trị viên."
            action={<Button onClick={() => navigate('/')}>Về trang chủ</Button>}
          />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout title="Quản lý bán hàng | ĐiệnTử">
      <div className="container-page py-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Quản lý bán hàng</h1>
        <p className="mt-1 text-sm text-ink-500">
          Theo dõi đơn hàng, xuất kho và cấp serial bảo hành cho khách
        </p>

        {/* Thống kê */}
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Tổng đơn', value: stats.total, tone: 'text-ink-900' },
            { label: 'Chờ xác nhận', value: stats.pending, tone: 'text-status-warning-text' },
            { label: 'Đang giao', value: stats.shipping, tone: 'text-brand-700' },
            { label: 'Doanh thu', value: formatPrice(stats.revenue), tone: 'text-price-600' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-line-200 bg-surface-card p-4"
            >
              <dt className="text-xs text-ink-500">{item.label}</dt>
              <dd className={cn('mt-1 text-xl font-bold tabular-nums', item.tone)}>{item.value}</dd>
            </div>
          ))}
        </dl>

        {/* Lọc */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { id: '', label: 'Tất cả' },
            ...Object.entries(STATUS_META).map(([id, meta]) => ({ id, label: meta.label })),
          ].map((option) => (
            <button
              key={option.id || 'all'}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                filter === option.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-line-200 bg-white text-ink-600 hover:border-line-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Danh sách đơn */}
        <div className="mt-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : visibleOrders.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="Chưa có đơn hàng nào"
              description="Các đơn khách đặt sẽ hiển thị ở đây."
            />
          ) : (
            <ul className="space-y-3">
              {visibleOrders.map((order) => {
                const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
                const nextActions = getNextActions(order.status);
                return (
                  <li
                    key={order.id}
                    className="rounded-2xl border border-line-200 bg-surface-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-ink-900">#{order.orderCode}</p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString('vi-VN')
                            : ''}
                          {order.receiverName ? ` · ${order.receiverName}` : ''}
                          {order.receiverPhone ? ` · ${order.receiverPhone}` : ''}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'rounded-md px-2 py-1 text-2xs font-semibold',
                          TONE_CLASS[meta.tone] ?? TONE_CLASS.info,
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {/* Địa chỉ giao hàng */}
                    <p className="mt-2 rounded-lg bg-surface-subtle px-3 py-2 text-xs text-ink-600">
                      {order.shippingAddress}
                    </p>

                    {/* Sản phẩm */}
                    <ul className="mt-3 divide-y divide-line-100 border-t border-line-100">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 py-2.5">
                          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-subtle">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                loading="lazy"
                                className="h-full w-full object-contain p-1"
                              />
                            ) : null}
                          </span>
                          <div className="min-w-0 flex-1">
                            {item.slug ? (
                              <Link
                                to={`/product/${item.slug}`}
                                className="truncate text-sm font-medium text-ink-900 hover:text-brand-600"
                              >
                                {item.name}
                              </Link>
                            ) : (
                              <span className="truncate text-sm font-medium text-ink-900">
                                {item.name}
                              </span>
                            )}
                            <p className="text-xs text-ink-500">Số lượng: {item.quantity}</p>
                            {item.serialNumber ? (
                              <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-2xs text-brand-700">
                                <Shield className="h-3 w-3" />
                                {item.serialNumber}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-2xs text-ink-400">
                                Chưa cấp serial — sẽ cấp khi xuất kho
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-100 pt-3">
                      <p className="text-xs text-ink-500">
                        Tổng:{' '}
                        <span className="font-bold tabular-nums text-price-600">
                          {formatPrice(order.total)}
                        </span>
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {nextActions.map((action) => (
                          <button
                            key={action.status}
                            type="button"
                            onClick={() => handleStatusChange(order, action.status)}
                            disabled={updatingId === order.id}
                            className={cn(
                              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
                              action.primary
                                ? 'bg-brand-600 text-white hover:bg-brand-700'
                                : 'border border-line-200 text-ink-600 hover:bg-surface-hover',
                            )}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="mt-6 flex items-start gap-1.5 text-xs text-ink-500 text-pretty">
          <Shield className="mt-px h-3.5 w-3.5 shrink-0 text-brand-600" />
          Khi bấm <strong>Xuất kho</strong>, hệ thống tự sinh serial cho từng sản phẩm trong đơn
          và gán về tài khoản khách mua — khách có thể kích hoạt bảo hành ngay trên storefront.
        </p>

        <Link
          to="/orders"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Xem trang Đơn của tôi
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </StoreLayout>
  );
}

/**
 * Các hành động trạng thái tiếp theo cho đơn.
 * @param {string} status
 * @returns {{status: string, label: string, primary?: boolean}[]}
 */
function getNextActions(status) {
  switch (status) {
    case 'PENDING':
      return [
        { status: 'CONFIRMED', label: 'Xác nhận đơn', primary: true },
        { status: 'CANCELLED', label: 'Huỷ đơn' },
      ];
    case 'CONFIRMED':
      return [{ status: 'SHIPPED', label: 'Xuất kho (cấp serial)', primary: true }];
    case 'SHIPPED':
      return [{ status: 'DELIVERED', label: 'Đã giao hàng', primary: true }];
    default:
      return [];
  }
}

export default SellerOrdersPage;
