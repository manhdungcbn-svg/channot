import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { ChevronRight, Shield, Truck, User } from '../components/icons';
import { StoreLayout } from '../layouts/StoreLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMyOrders, cancelOrder } from '../api/orders';
import { getMyWarrantyProducts } from '../api/warranty';
import { openLoginModal } from '../utils/loginModal';
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
 * Trang "Đơn của tôi" — lịch sử mua hàng, theo dõi trạng thái, serial bảo hành,
 * và liên kết sang app Bảo hành Pro.
 */
export function OrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [warrantyProducts, setWarrantyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;

    Promise.allSettled([getMyOrders(), getMyWarrantyProducts()]).then(
      ([orderResult, warrantyResult]) => {
        if (cancelled) return;
        if (orderResult.status === 'fulfilled') setOrders(orderResult.value);
        if (warrantyResult.status === 'fulfilled') {
          setWarrantyProducts(warrantyResult.value.items ?? []);
        }
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [user]);

  const visibleOrders = useMemo(
    () => (filter ? orders.filter((order) => order.status === filter) : orders),
    [orders, filter],
  );

  const handleCancel = async (order) => {
    setCancellingId(order.id);
    try {
      const updated = await cancelOrder(order.id);
      setOrders((current) => current.map((item) => (item.id === order.id ? updated : item)));
      toast.show(`Đã huỷ đơn ${order.orderCode}`, { tone: 'success' });
    } catch (error) {
      toast.show(error?.message || 'Không huỷ được đơn hàng.', { tone: 'error' });
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <StoreLayout title="Đơn của tôi">
        <div className="container-page py-12">
          <EmptyState
            icon={<User className="h-6 w-6" />}
            title="Bạn cần đăng nhập"
            description="Đăng nhập để xem lịch sử đơn hàng và quản lý bảo hành của bạn."
            action={
              <Button size="lg" onClick={() => openLoginModal('login')}>
                <User className="h-5 w-5" />
                Đăng nhập / Đăng ký
              </Button>
            }
          />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout title="Đơn của tôi | ĐiệnTử">
      <div className="container-page py-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Đơn của tôi</h1>
        <p className="mt-1 text-sm text-ink-500">
          {loading
            ? 'Đang tải…'
            : `${orders.length} đơn hàng · ${warrantyProducts.length} sản phẩm đã bảo hành`}
        </p>

        {/* Lọc trạng thái */}
        <div className="mt-4 flex flex-wrap gap-2">
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

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Danh sách đơn */}
          <div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : visibleOrders.length === 0 ? (
              <EmptyState
                title={filter ? 'Không có đơn nào ở trạng thái này' : 'Chưa có đơn hàng nào'}
                description={
                  filter
                    ? 'Hãy chọn trạng thái khác để xem các đơn còn lại.'
                    : 'Mua sắm sản phẩm yêu thích để xem lịch sử đơn hàng tại đây.'
                }
                action={!filter ? <Button onClick={() => navigate('/')}>Mua sắm ngay</Button> : null}
              />
            ) : (
              <ul className="space-y-3">
                {visibleOrders.map((order) => {
                  const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
                  const hasSerial = (order.items ?? []).some((item) => Boolean(item.serialNumber));
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
                                  Serial: {item.serialNumber}
                                </p>
                              ) : null}
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
                          {order.discount > 0 ? (
                            <span className="ml-2 text-2xs text-status-success-text">
                              (đã giảm {formatPrice(order.discount)})
                            </span>
                          ) : null}
                        </p>

                        <div className="flex gap-2">
                          {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
                            <button
                              type="button"
                              onClick={() => handleCancel(order)}
                              disabled={cancellingId === order.id}
                              className="rounded-lg border border-line-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-status-danger/40 hover:text-status-danger-text disabled:opacity-50"
                            >
                              {cancellingId === order.id ? 'Đang huỷ…' : 'Huỷ đơn'}
                            </button>
                          ) : null}

                          {hasSerial ? (
                            <Link
                              to="/orders"
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                            >
                              Kích hoạt bảo hành
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Sản phẩm đã bảo hành */}
          <aside className="lg:h-fit lg:sticky lg:top-24">
            <div className="rounded-2xl border border-line-200 bg-surface-card p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <Shield className="h-4 w-4 text-brand-600" />
                Sản phẩm đã bảo hành
              </h2>

              {warrantyProducts.length === 0 ? (
                <p className="mt-3 text-xs text-ink-500 text-pretty">
                  Chưa có sản phẩm nào được kích hoạt bảo hành. Serial được cấp tự động khi đơn
                  hàng xuất kho.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {warrantyProducts.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-line-100 bg-surface-subtle p-2.5"
                    >
                      <p className="truncate text-xs font-semibold text-ink-900">{item.name}</p>
                      <p className="mt-0.5 font-mono text-2xs text-ink-500">{item.serial_number}</p>
                      {item.warranty_end_date ? (
                        <p className="mt-1 flex items-center gap-1 text-2xs text-status-success-text">
                          <Truck className="h-3 w-3" />
                          BH đến {item.warranty_end_date}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              <Link
                to="/my-products"
                className="mt-4 flex items-center justify-between rounded-lg border border-line-200 px-3 py-2 text-xs font-medium text-ink-700 transition-colors hover:bg-surface-hover"
              >
                Mở trang Bảo hành Pro
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
}

export default OrdersPage;
