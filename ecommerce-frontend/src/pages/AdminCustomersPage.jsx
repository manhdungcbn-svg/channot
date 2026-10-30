/**
 * Trang quản lý khách hàng — `/admin/customers`.
 *
 * Nguồn dữ liệu: `GET /api/shop/admin/customers` (+ tìm kiếm `q`).
 * Lịch sử đơn: `GET /api/shop/admin/customers/{id}/orders`.
 */

import { useEffect, useState } from 'react';
import { AdminModal } from '../components/AdminModal';
import { AdminOrderModal } from '../components/AdminOrderModal';
import { Badge, Button, EmptyState, Skeleton } from '../components/ui';
import { Search, Truck, User } from '../components/icons';
import { AdminLayout } from '../layouts/AdminLayout';
import { useToast } from '../context/ToastContext';
import { getAdminCustomerOrders, getAdminCustomers } from '../api/admin';
import { formatPrice } from '../utils/format';

/** Class chung cho ô nhập. */
const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-line-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-accent focus:outline-none';

const STATUS_META = {
  PENDING: { label: 'Chờ xác nhận', tone: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'info' },
  SHIPPED: { label: 'Đang giao', tone: 'brand' },
  DELIVERED: { label: 'Đã giao', tone: 'success' },
  CANCELLED: { label: 'Đã huỷ', tone: 'danger' },
};

export function AdminCustomersPage() {
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');

  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Debounce 400ms trước khi gọi API.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminCustomers({ q: query, limit: 200 })
      .then((data) => {
        if (!cancelled) setCustomers(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.show(error?.message || 'Không tải được danh sách khách hàng.', { tone: 'error' });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const openDetail = async (customer) => {
    setSelected(customer);
    setDetailOpen(true);
    setOrdersLoading(true);
    try {
      const data = await getAdminCustomerOrders(customer.id);
      setOrders(data);
    } catch (error) {
      setOrders([]);
      toast.show(error?.message || 'Không tải được lịch sử đơn hàng.', { tone: 'error' });
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Quản lý khách hàng"
      description="Xem thông tin khách, lịch sử mua hàng và đặt hàng hộ khách"
    >
      <div className="relative">
        <label htmlFor="admin-customer-search" className="sr-only">
          Tìm khách hàng
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
          aria-hidden="true"
        />
        <input
          id="admin-customer-search"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên, email hoặc số điện thoại..."
          className={`${INPUT_CLASS} pl-9`}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line-200 bg-surface-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<User className="h-6 w-6" />}
            title="Chưa có khách hàng nào"
            description={
              query
                ? 'Không tìm thấy khách hàng phù hợp với từ khoá đã nhập.'
                : 'Danh sách khách hàng sẽ hiển thị ở đây.'
            }
            className="border-0"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-200 bg-surface-subtle text-2xs uppercase tracking-wide text-ink-500">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Khách hàng
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Điện thoại
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Số đơn
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tổng chi tiêu
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Ngày đăng ký
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="transition-colors hover:bg-surface-subtle">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openDetail(customer)}
                        className="text-left font-medium text-ink-900 hover:text-brand-600"
                      >
                        {customer.fullName || '(chưa có tên)'}
                      </button>
                      {customer.isActive ? null : (
                        <Badge tone="neutral" className="ml-2">
                          Đã khoá
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{customer.email}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-700">{customer.phone || '—'}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-ink-900">
                      {customer.orderCount}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-price-600">
                      {formatPrice(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {customer.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(customer)}
                          className="rounded-lg border border-line-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-surface-hover"
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(customer);
                            setOrderModalOpen(true);
                          }}
                          className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                        >
                          Đặt hàng hộ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel chi tiết khách hàng */}
      <AdminModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected?.fullName || selected?.email || 'Chi tiết khách hàng'}
        description={
          selected
            ? `${selected.email}${selected.phone ? ` · ${selected.phone}` : ''}`
            : undefined
        }
      >
        {selected ? (
          <>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line-200 bg-surface-subtle px-3 py-2.5">
                <dt className="text-2xs uppercase tracking-wide text-ink-500">Tổng đơn</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums text-ink-900">
                  {selected.orderCount}
                </dd>
              </div>
              <div className="rounded-xl border border-line-200 bg-surface-subtle px-3 py-2.5">
                <dt className="text-2xs uppercase tracking-wide text-ink-500">Tổng chi tiêu</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums text-price-600">
                  {formatPrice(selected.totalSpent)}
                </dd>
              </div>
              <div className="rounded-xl border border-line-200 bg-surface-subtle px-3 py-2.5">
                <dt className="text-2xs uppercase tracking-wide text-ink-500">Ngày đăng ký</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                  {selected.createdAt
                    ? new Date(selected.createdAt).toLocaleDateString('vi-VN')
                    : '—'}
                </dd>
              </div>
            </dl>

            <h3 className="mt-5 text-sm font-bold text-ink-900">Lịch sử đơn hàng</h3>

            {ordersLoading ? (
              <div className="mt-3 space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="mt-3 rounded-xl bg-surface-subtle px-3 py-6 text-center text-sm text-ink-500">
                Khách này chưa có đơn hàng nào.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {orders.map((order) => {
                  const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
                  return (
                    <li
                      key={order.id}
                      className="rounded-xl border border-line-200 px-3 py-2.5 transition-colors hover:bg-surface-subtle"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink-900">
                          #{order.orderCode}
                        </span>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-500">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString('vi-VN')
                          : ''}
                        {order.items?.length ? ` · ${order.items.length} sản phẩm` : ''}
                      </p>
                      <p className="mt-1 text-sm font-bold tabular-nums text-price-600">
                        {formatPrice(order.total)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setDetailOpen(false);
                  setOrderModalOpen(true);
                }}
              >
                <Truck className="h-4 w-4" />
                Đặt hàng hộ khách
              </Button>
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>
                Đóng
              </Button>
            </div>
          </>
        ) : null}
      </AdminModal>

      {/* Modal đặt hàng hộ khách */}
      <AdminOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        customer={selected}
      />
    </AdminLayout>
  );
}

export default AdminCustomersPage;
