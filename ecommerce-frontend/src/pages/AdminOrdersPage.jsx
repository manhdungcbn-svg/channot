/**
 * Trang quản lý đơn hàng — `/admin/orders`.
 *
 * Nguồn dữ liệu: `GET /api/shop/orders` (staff/admin thấy TẤT CẢ đơn).
 * Đổi trạng thái: `POST /api/shop/orders/{id}/status`.
 * Đặt hàng hộ khách: `POST /api/shop/orders`.
 */

import { useEffect, useMemo, useState } from 'react';
import { AdminOrderModal } from '../components/AdminOrderModal';
import { Badge, Button, EmptyState, Skeleton } from '../components/ui';
import { Truck } from '../components/icons';
import { AdminLayout } from '../layouts/AdminLayout';
import { useToast } from '../context/ToastContext';
import { getAdminOrders, updateOrderStatus } from '../api/admin';
import { formatPrice } from '../utils/format';
import { cn } from '../utils/cn';

const STATUS_META = {
  PENDING: { label: 'Chờ xác nhận', tone: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'info' },
  SHIPPED: { label: 'Đang giao', tone: 'brand' },
  DELIVERED: { label: 'Đã giao', tone: 'success' },
  CANCELLED: { label: 'Đã huỷ', tone: 'danger' },
};

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

/**
 * Các hành động trạng thái tiếp theo cho một đơn.
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

export function AdminOrdersPage() {
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminOrders({ limit: 200 })
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.show(error?.message || 'Không tải được danh sách đơn hàng.', { tone: 'error' });
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

  const visibleOrders = useMemo(
    () => (filter ? orders.filter((order) => order.status === filter) : orders),
    [orders, filter],
  );

  const summary = useMemo(() => {
    const revenue = orders
      .filter((order) => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + order.total, 0);
    return {
      revenue,
      total: orders.length,
      pending: orders.filter((order) => order.status === 'PENDING').length,
      shipping: orders.filter((order) => order.status === 'SHIPPED').length,
    };
  }, [orders]);

  const handleStatusChange = async (order, status) => {
    setUpdatingId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? { ...item, ...updated, items: updated.items ?? item.items }
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

  return (
    <AdminLayout
      title="Quản lý đơn hàng"
      description="Theo dõi toàn bộ đơn, xuất kho cấp serial và đặt hàng hộ khách"
      actions={
        <Button onClick={() => setOrderModalOpen(true)}>
          <Truck className="h-4 w-4" />
          Đặt hàng hộ khách
        </Button>
      }
    >
      {/* Thống kê nhanh */}
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng đơn', value: summary.total, tone: 'text-ink-900' },
          { label: 'Chờ xác nhận', value: summary.pending, tone: 'text-status-warning-text' },
          { label: 'Đang giao', value: summary.shipping, tone: 'text-brand-700' },
          { label: 'Doanh thu', value: formatPrice(summary.revenue), tone: 'text-price-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line-200 bg-surface-card p-4">
            <dt className="text-xs text-ink-500">{item.label}</dt>
            <dd className={cn('mt-1 text-xl font-bold tabular-nums', item.tone)}>{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* Lọc trạng thái */}
      <div className="mt-5 flex flex-wrap gap-2">
        {[{ id: '', label: 'Tất cả' }, ...STATUS_ORDER.map((id) => ({ id, label: STATUS_META[id].label }))].map(
          (option) => (
            <button
              key={option.id || 'all'}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                filter === option.id
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-line-200 bg-white text-ink-700 hover:border-line-300',
              )}
            >
              {option.label}
            </button>
          ),
        )}
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
            action={<Button onClick={() => setOrderModalOpen(true)}>Đặt hàng hộ khách</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {visibleOrders.map((order) => {
              const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
              const nextActions = getNextActions(order.status);
              return (
                <li key={order.id} className="rounded-2xl border border-line-200 bg-surface-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink-900">#{order.orderCode}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}
                        {order.receiverName ? ` · ${order.receiverName}` : ''}
                        {order.receiverPhone ? ` · ${order.receiverPhone}` : ''}
                      </p>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>

                  <p className="mt-2 rounded-lg bg-surface-subtle px-3 py-2 text-xs text-ink-700">
                    {order.shippingAddress}
                  </p>

                  <ul className="mt-3 divide-y divide-line-100 border-t border-line-100">
                    {(order.items ?? []).map((item) => (
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
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-900">
                            {item.name}
                          </span>
                          <span className="block text-xs text-ink-500">
                            Số lượng: {item.quantity}
                          </span>
                        </span>
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
                              : 'border border-line-200 text-ink-700 hover:bg-surface-hover',
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

      <AdminOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onCreated={(order) => setOrders((current) => [order, ...current])}
      />
    </AdminLayout>
  );
}

export default AdminOrdersPage;
