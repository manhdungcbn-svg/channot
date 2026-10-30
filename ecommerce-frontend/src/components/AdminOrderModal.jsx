/**
 * Modal "Đặt hàng hộ khách" — dùng chung cho trang Đơn hàng và trang Khách hàng.
 *
 * Gọi `POST /api/shop/orders` (giá luôn tính ở server).
 * Địa chỉ nhập tay (không dùng sổ địa chỉ của admin) — có chọn nhanh
 * tỉnh/phường qua `GET /api/shop/admin/provinces` & `/wards`.
 */

import { useEffect, useMemo, useState } from 'react';
import { AdminModal } from './AdminModal';
import { Button } from './ui';
import { Close, Plus, Search } from './icons';
import { createAdminOrder, getAdminProducts } from '../api/admin';
import { AddressPicker } from './sections/AddressPicker';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils/cn';
import { formatPrice } from '../utils/format';

/** Class chung cho ô nhập trong khu vực quản trị. */
export const ADMIN_INPUT_CLASS =
  'h-11 w-full rounded-lg border border-line-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-accent focus:outline-none';

/** Class chung cho nhãn trong khu vực quản trị. */
export const ADMIN_LABEL_CLASS = 'mt-1 block text-xs font-medium text-ink-700';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'COD — trả tiền khi nhận hàng' },
  { id: 'momo', label: 'Ví MoMo' },
  { id: 'zalo_pay', label: 'ZaloPay' },
  { id: 'card', label: 'Thẻ quốc tế / ATM' },
];

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {object} [props.customer] - khách hàng được chọn (điền sẵn tên/email/điện thoại)
 * @param {(order: object) => void} [props.onCreated]
 */
export function AdminOrderModal({ isOpen, onClose, customer = null, onCreated }) {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState({});
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Nạp danh sách sản phẩm + tỉnh khi mở modal.
  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;

    getAdminProducts({ limit: 200 })
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Điền sẵn thông tin người nhận khi chọn khách hàng.
  useEffect(() => {
    if (!isOpen) return;
    setReceiverName(customer?.fullName ?? '');
    setReceiverPhone(customer?.phone ?? '');
  }, [isOpen, customer]);

  // Reset form mỗi lần mở modal.
  useEffect(() => {
    if (!isOpen) {
      setSelected({});
      setKeyword('');
      setShippingAddress('');
      setProvinceCode('');
      setWardCode('');
      setAddressDetail('');
      setPaymentMethod('cod');
      setNote('');
      setFormError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return products;
    return products.filter((item) =>
      [item.name, item.brand, item.serialNumber].join(' ').toLowerCase().includes(query),
    );
  }, [products, keyword]);

  const lines = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => {
          const product = products.find((item) => String(item.id) === id);
          return product ? { ...product, quantity } : null;
        })
        .filter(Boolean),
    [selected, products],
  );

  const estimatedTotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const changeQuantity = (id, delta) => {
    setSelected((current) => {
      const next = Math.max(0, (current[id] ?? 0) + delta);
      const updated = { ...current };
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  };

  const handleSubmit = async () => {
    setFormError('');

    if (lines.length === 0) {
      setFormError('Vui lòng chọn ít nhất một sản phẩm.');
      return;
    }
    if (!receiverName.trim()) {
      setFormError('Vui lòng nhập tên người nhận.');
      return;
    }
    if (!shippingAddress.trim()) {
      setFormError('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }
    setSubmitting(true);
    try {
      const order = await createAdminOrder({
        items: lines.map((line) => ({
          productId: line.id,
          slug: line.slug,
          quantity: line.quantity,
        })),
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
        note: note.trim(),
      });
      toast.show(`Đã tạo đơn ${order.orderCode} hộ khách.`, { tone: 'success' });
      onCreated?.(order);
      onClose();
    } catch (error) {
      setFormError(error?.message || 'Không tạo được đơn hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Đặt hàng hộ khách"
      description={
        customer
          ? `Khách: ${customer.fullName || customer.email}`
          : 'Tạo đơn hàng thay khách — giá được tính ở máy chủ.'
      }
      size="lg"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Cột trái: chọn sản phẩm */}
        <div>
          <label htmlFor="admin-order-search" className={ADMIN_LABEL_CLASS}>
            Tìm sản phẩm
          </label>
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
              aria-hidden="true"
            />
            <input
              id="admin-order-search"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tên sản phẩm, thương hiệu, serial..."
              className={`${ADMIN_INPUT_CLASS} pl-9`}
            />
          </div>

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <p className="rounded-xl bg-surface-subtle px-3 py-6 text-center text-sm text-ink-500">
                Không tìm thấy sản phẩm phù hợp.
              </p>
            ) : (
              filteredProducts.map((product) => {
                const quantity = selected[product.id] ?? 0;
                return (
                  <div
                    key={product.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                      quantity > 0 ? 'border-brand-200 bg-brand-50' : 'border-line-200',
                    )}
                  >
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-subtle">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-900">
                        {product.name}
                      </span>
                      <span className="block text-xs tabular-nums text-ink-500">
                        {formatPrice(product.price)} · còn {product.stock}
                      </span>
                    </span>
                    {quantity > 0 ? (
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => changeQuantity(product.id, -1)}
                          aria-label={`Giảm số lượng ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line-200 bg-white text-ink-700 hover:bg-surface-hover"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm font-semibold tabular-nums text-ink-900">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(product.id, 1)}
                          aria-label={`Tăng số lượng ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line-200 bg-white text-ink-700 hover:bg-surface-hover"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => changeQuantity(product.id, 1)}
                        className="shrink-0 rounded-lg border border-line-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-surface-hover"
                      >
                        Thêm
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cột phải: thông tin giao hàng */}
        <div>
          <label htmlFor="admin-order-name" className={ADMIN_LABEL_CLASS}>
            Người nhận
          </label>
          <input
            id="admin-order-name"
            type="text"
            value={receiverName}
            onChange={(event) => setReceiverName(event.target.value)}
            placeholder="Nguyễn Văn A"
            className={`${ADMIN_INPUT_CLASS} mt-1`}
          />

          <label htmlFor="admin-order-phone" className={ADMIN_LABEL_CLASS}>
            Số điện thoại
          </label>
          <input
            id="admin-order-phone"
            type="tel"
            inputMode="tel"
            value={receiverPhone}
            onChange={(event) => setReceiverPhone(event.target.value)}
            placeholder="0900 000 000"
            className={`${ADMIN_INPUT_CLASS} mt-1`}
          />

          <p className="mt-1 block text-xs font-medium text-ink-700">Địa chỉ giao hàng</p>
          <div className="mt-1">
            <AddressPicker
              idPrefix="admin-order"
              provinceCode={provinceCode}
              wardCode={wardCode}
              detail={addressDetail}
              onChange={(next) => {
                setProvinceCode(next.provinceCode ?? '');
                setWardCode(next.wardCode ?? '');
                setAddressDetail(next.addressDetail ?? '');
                setShippingAddress(
                  [next.addressDetail, next.wardName, next.provinceName]
                    .filter(Boolean)
                    .join(', '),
                );
              }}
            />
          </div>

          <label htmlFor="admin-order-payment" className={ADMIN_LABEL_CLASS}>
            Phương thức thanh toán
          </label>
          <select
            id="admin-order-payment"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className={`${ADMIN_INPUT_CLASS} mt-1`}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>

          <label htmlFor="admin-order-note" className={ADMIN_LABEL_CLASS}>
            Ghi chú
          </label>
          <input
            id="admin-order-note"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ví dụ: khách gọi đặt, giao sau 18h"
            className={`${ADMIN_INPUT_CLASS} mt-1`}
          />

          {/* Tổng kết */}
          <div className="mt-4 rounded-xl border border-line-200 bg-surface-subtle p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Số sản phẩm</span>
              <span className="font-semibold tabular-nums text-ink-900">{lines.length}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-ink-500">Tạm tính</span>
              <span className="font-bold tabular-nums text-price-600">
                {formatPrice(estimatedTotal)}
              </span>
            </div>
            {lines.length ? (
              <ul className="mt-2 space-y-1 border-t border-line-100 pt-2">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-ink-700">
                      {line.name} × {line.quantity}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-900">
                      {formatPrice(line.price * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {formError ? (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-status-danger/40 bg-status-danger-bg px-3 py-2.5 text-xs font-medium text-status-danger-text"
            >
              {formError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang tạo đơn…' : 'Tạo đơn hàng'}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              <Close className="h-4 w-4" />
              Huỷ
            </Button>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

export default AdminOrderModal;
