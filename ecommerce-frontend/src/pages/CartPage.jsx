import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState } from '../components/ui';
import { Cart, Close, CreditCard, Shield, Truck, User } from '../components/icons';
import { StoreLayout } from '../layouts/StoreLayout';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, getAddresses } from '../api/orders';
import { AddressPicker } from '../components/sections/AddressPicker';
import { openLoginModal } from '../utils/loginModal';
import { cn } from '../utils/cn';
import { formatPrice } from '../utils/format';

const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

const COUPONS = {
  WELCOME10: { type: 'percent', value: 0.1, max: 200000, label: 'Giảm 10% (tối đa 200k)' },
  FREESHIP: { type: 'shipping', value: 0, label: 'Miễn phí vận chuyển' },
  SAVE50: { type: 'fixed', value: 50000, label: 'Giảm 50k' },
};

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt cho shipper' },
  { id: 'momo', label: 'Ví MoMo', desc: 'Quét mã QR khi thanh toán' },
  { id: 'zalo_pay', label: 'ZaloPay', desc: 'Thanh toán qua ứng dụng Zalo' },
  { id: 'card', label: 'Thẻ quốc tế / ATM', desc: 'Visa, Mastercard, ATM nội địa' },
];

/** Class chung cho ô nhập — cao, rộng, chữ 16px (không bị iOS zoom, không bị che). */
const INPUT_CLASS =
  'h-12 w-full rounded-xl border-2 border-line-200 bg-white px-4 text-base text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-accent focus:outline-none';

/**
 * Trang giỏ hàng — quản lý số lượng, mã giảm giá, đặt hàng (checkout inline).
 *
 * LƯU Ý UX: nút "Đặt hàng" nằm NGAY DƯỚI form giao hàng + tổng kết (không
 * phải ở cột bên phải) — khách điền xong bấm 1 lần là xong, không phải nhìn
 * sang bên kia. Trên mobile có thêm thanh sticky đáy màn hình.
 */
export function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clear, count, total } = useCart();

  // Quản trị viên / nhân viên quản trị KHÔNG dùng giỏ hàng — họ đặt hàng
  // hộ khách trong khu vực quản trị (`/admin/orders`).
  const isManager = Boolean(user && ['staff', 'admin'].includes(user.role));

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [receiverName, setReceiverName] = useState(user?.full_name ?? '');
  const [receiverPhone, setReceiverPhone] = useState(user?.phone ?? '');
  const [shippingAddress, setShippingAddress] = useState('');
  // Địa chỉ đã lưu đang được chọn (dữ liệu cũ chỉ có string, không tách tỉnh/xã).
  const [savedAddressText, setSavedAddressText] = useState('');
  // Thành phần địa chỉ do khách chọn trong AddressPicker.
  const [provinceCode, setProvinceCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [wardName, setWardName] = useState('');
  const [note, setNote] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [doneOrder, setDoneOrder] = useState(null);
  const summaryRef = useRef(null);

  // Cuộn tới phần tổng kết khi báo lỗi (trên mobile nút nằm dưới form).
  useEffect(() => {
    if (formError && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [formError]);

  const totals = useMemo(() => {
    let discount = 0;
    let shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    const rule = COUPONS[coupon];
    if (rule) {
      if (rule.type === 'percent') discount = Math.min(total * rule.value, rule.max);
      else if (rule.type === 'fixed') discount = Math.min(rule.value, total);
      else if (rule.type === 'shipping') shipping = 0;
    }

    return {
      discount,
      shipping,
      grandTotal: Math.max(0, total - discount + shipping),
    };
  }, [total, coupon]);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    setCouponError('');
    if (!code) return;
    if (!COUPONS[code]) {
      setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      setCoupon('');
      return;
    }
    setCoupon(code);
    toast.show(`Đã áp dụng mã ${code}`, { tone: 'success' });
  };

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const data = await getAddresses();
      setAddresses(data);
      const preferred = data.find((item) => item.isDefault) ?? data[0];
      if (preferred) {
        setReceiverName(preferred.receiverName);
        setReceiverPhone(preferred.phone);
        setShippingAddress(preferred.address);
        setSavedAddressText(preferred.address);
        // Địa chỉ đã lưu chỉ có string tổng hợp — không tách được tỉnh/xã.
        setProvinceCode('');
        setWardCode('');
        setAddressDetail('');
        setProvinceName('');
        setWardName('');
      }
    } catch {
      // Không có sổ địa chỉ — khách nhập tay.
    }
  };

  /** Chọn 1 địa chỉ đã lưu (dữ liệu cũ chỉ có string tổng hợp). */
  const selectSavedAddress = (address) => {
    setReceiverName(address.receiverName);
    setReceiverPhone(address.phone);
    setShippingAddress(address.address);
    setSavedAddressText(address.address);
    setProvinceCode('');
    setWardCode('');
    setAddressDetail('');
    setProvinceName('');
    setWardName('');
  };

  /** Khách tự chọn tỉnh/xã/số nhà — ghép thành chuỗi địa chỉ gửi API. */
  const handleAddressChange = (next) => {
    setProvinceCode(next.provinceCode ?? '');
    setWardCode(next.wardCode ?? '');
    setAddressDetail(next.addressDetail ?? '');
    setProvinceName(next.provinceName ?? '');
    setWardName(next.wardName ?? '');
    setSavedAddressText('');
    const composed = [next.addressDetail, next.wardName, next.provinceName]
      .filter(Boolean)
      .join(', ');
    setShippingAddress(composed);
  };

  /** Kiểm tra thông tin trước khi gọi API — trả về lỗi đầu tiên (hoặc null). */
  const validate = () => {
    if (!user) return 'Bạn cần đăng nhập để đặt hàng. Bấm nút "Đăng nhập / Đăng ký" phía trên nhé.';
    if (!receiverName.trim()) return 'Vui lòng nhập tên người nhận.';
    // Đang dùng địa chỉ đã lưu → chỉ cần chuỗi địa chỉ.
    if (!savedAddressText) {
      if (!provinceCode) return 'Vui lòng chọn tỉnh/thành phố.';
      if (!wardCode) return 'Vui lòng chọn phường/xã.';
      if (!addressDetail.trim()) return 'Vui lòng nhập số nhà và tên đường.';
    }
    if (!shippingAddress.trim()) return 'Vui lòng nhập địa chỉ giao hàng.';
    return null;
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    setFormError('');

    const invalid = validate();
    if (invalid) {
      setFormError(invalid);
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        items: items.map((item) => ({
          productId: item.id,
          slug: item.slug,
          quantity: item.quantity,
        })),
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
        note: note.trim(),
        couponCode: coupon || null,
      });

      clear();
      setDoneOrder(order);
      toast.show(`Đặt hàng thành công — mã ${order.orderCode}`, { tone: 'success' });
    } catch (error) {
      setFormError(error?.message || 'Không đặt được hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Tài khoản quản trị không dùng giỏ hàng — hướng dẫn sang khu vực quản trị.
  if (isManager) {
    return (
      <StoreLayout title="Giỏ hàng không dành cho quản trị">
        <div className="container-page py-12">
          <div className="mx-auto max-w-2xl rounded-2xl border border-line-200 bg-surface-card p-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Shield className="h-8 w-8" />
            </span>
            <h1 className="mt-4 text-2xl font-bold text-ink-900">
              Tài khoản quản trị không dùng giỏ hàng
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Bạn có thể đặt hàng hộ khách tại trang Đơn hàng trong khu vực quản trị.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={() => navigate('/admin/orders')}>
                <Truck className="h-4 w-4" />
                Đến trang Đơn hàng
              </Button>
              <Button variant="secondary" onClick={() => navigate('/admin')}>
                Khu vực quản trị
              </Button>
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  // Màn thành công
  if (doneOrder) {
    return (
      <StoreLayout title="Đặt hàng thành công">
        <div className="container-page py-12">
          <div className="mx-auto max-w-2xl rounded-2xl border border-line-200 bg-surface-card p-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-success-bg text-status-success-text">
              <Shield className="h-8 w-8" />
            </span>
            <h1 className="mt-4 text-2xl font-bold text-ink-900">Đặt hàng thành công!</h1>
            <p className="mt-2 text-sm text-ink-500">
              Mã đơn hàng:{' '}
              <span className="font-semibold text-brand-700">{doneOrder.orderCode}</span>
            </p>

            <dl className="mt-6 divide-y divide-line-100 rounded-xl border border-line-200 text-left text-sm">
              {doneOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{item.name}</p>
                    <p className="text-xs text-ink-500">Số lượng: {item.quantity}</p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-ink-900">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-ink-500">Tổng thanh toán</dt>
                <dd className="text-lg font-bold tabular-nums text-price-600">
                  {formatPrice(doneOrder.total)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-ink-500 text-pretty">
              Serial bảo hành sẽ được cấp khi đơn xuất kho. Bạn có thể theo dõi và kích hoạt
              bảo hành ngay trong mục <strong>Đơn của tôi</strong>.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={() => navigate('/orders')}>Xem đơn của tôi</Button>
              <Button variant="secondary" onClick={() => navigate('/')}>
                Tiếp tục mua sắm
              </Button>
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  // Giỏ trống
  if (!items.length) {
    return (
      <StoreLayout title="Giỏ hàng">
        <div className="container-page py-12">
          <EmptyState
            icon={<Cart className="h-6 w-6" />}
            title="Giỏ hàng của bạn đang trống"
            description="Hãy khám phá các sản phẩm nổi bật và thêm vào giỏ nhé."
            action={
              <Button onClick={() => navigate('/')}>
                <Cart className="h-4 w-4" />
                Mua sắm ngay
              </Button>
            }
          />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout title="Giỏ hàng">
      <div className="container-page py-8 pb-28 lg:pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Giỏ hàng</h1>
        <p className="mt-1 text-sm text-ink-500">{count} sản phẩm trong giỏ</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Cột trái: sản phẩm + form giao hàng */}
          <div className="space-y-4">
            <ul className="divide-y divide-line-100 rounded-2xl border border-line-200 bg-surface-card">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 p-4">
                  <Link
                    to={`/product/${item.slug}`}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-subtle"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-contain p-1.5"
                      />
                    ) : null}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${item.slug}`}
                      className="text-sm font-medium text-ink-900 transition-colors hover:text-brand-600"
                    >
                      {item.name}
                    </Link>
                    {item.brand ? (
                      <p className="mt-0.5 text-xs text-ink-400">{item.brand}</p>
                    ) : null}
                    <p className="mt-1.5 text-sm font-bold tabular-nums text-price-600">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Xoá ${item.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-surface-hover hover:text-status-danger-text"
                    >
                      <Close className="h-4 w-4" />
                    </button>

                    <div className="inline-flex h-9 items-center rounded-lg border border-line-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Giảm số lượng"
                        className="flex h-9 w-9 items-center justify-center text-ink-600 hover:bg-surface-hover"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={(event) =>
                          updateQuantity(item.id, Number(event.target.value) || 1)
                        }
                        aria-label={`Số lượng ${item.name}`}
                        className="h-9 w-10 border-x border-line-200 text-center text-xs font-semibold tabular-nums focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Tăng số lượng"
                        className="flex h-9 w-9 items-center justify-center text-ink-600 hover:bg-surface-hover"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex justify-between">
              <Link
                to="/"
                className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
              >
                ← Tiếp tục mua sắm
              </Link>
              <button
                type="button"
                onClick={clear}
                className="text-sm text-ink-500 transition-colors hover:text-status-danger-text"
              >
                Xoá tất cả
              </button>
            </div>

            {/* ==== Form giao hàng ==== */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-line-200 bg-surface-card p-5"
            >
              <h2 className="text-base font-bold text-ink-900">Thông tin giao hàng</h2>

              {user ? (
                <button
                  type="button"
                  onClick={loadAddresses}
                  className="mt-3 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Dùng địa chỉ đã lưu
                </button>
              ) : (
                <div className="mt-3 rounded-xl bg-surface-subtle px-4 py-3">
                  <p className="text-sm leading-relaxed text-ink-700">
                    Bạn cần <span className="font-semibold">đăng nhập</span> để đặt hàng và lưu địa
                    chỉ giao hàng cho lần sau.
                  </p>
                  <button
                    type="button"
                    onClick={() => openLoginModal('login')}
                    className="mt-2.5 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
                  >
                    <User className="h-4 w-4" />
                    Đăng nhập / Đăng ký
                  </button>
                </div>
              )}

              {addresses.length ? (
                <div className="mt-3 grid gap-2">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line-200 p-3 text-xs transition-colors hover:border-brand-300"
                    >
                      <input
                        type="radio"
                        name="saved-address"
                        checked={
                          shippingAddress === address.address &&
                          receiverName === address.receiverName
                        }
                        onChange={() => selectSavedAddress(address)}
                        className="mt-0.5 accent-brand-600"
                      />
                      <span>
                        <span className="block font-semibold text-ink-900">
                          {address.label ? `${address.label} — ` : ''}
                          {address.receiverName}
                        </span>
                        <span className="block text-ink-500">{address.phone}</span>
                        <span className="block text-ink-500">{address.address}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="cart-name"
                    className="mb-1.5 block text-sm font-medium text-ink-700"
                  >
                    Người nhận
                  </label>
                  <input
                    id="cart-name"
                    type="text"
                    value={receiverName}
                    onChange={(event) => setReceiverName(event.target.value)}
                    placeholder="Nguyễn Văn A"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cart-phone"
                    className="mb-1.5 block text-sm font-medium text-ink-700"
                  >
                    Số điện thoại
                  </label>
                  <input
                    id="cart-phone"
                    type="tel"
                    inputMode="tel"
                    value={receiverPhone}
                    onChange={(event) => setReceiverPhone(event.target.value)}
                    placeholder="0900 000 000"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 block text-sm font-medium text-ink-700">
                  Địa chỉ giao hàng
                </p>
                <AddressPicker
                  idPrefix="cart"
                  provinceCode={provinceCode}
                  wardCode={wardCode}
                  detail={addressDetail}
                  onChange={handleAddressChange}
                />
                {savedAddressText ? (
                  <p className="mt-2 rounded-xl bg-surface-subtle px-3.5 py-2.5 text-xs text-ink-500">
                    Đang dùng địa chỉ đã lưu:{' '}
                    <span className="font-medium text-ink-900">{savedAddressText}</span>
                  </p>
                ) : null}
              </div>

              <div className="mt-4">
                <label
                  htmlFor="cart-note"
                  className="mb-1.5 block text-sm font-medium text-ink-700"
                >
                  Ghi chú <span className="font-normal text-ink-400">(không bắt buộc)</span>
                </label>
                <input
                  id="cart-note"
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Ví dụ: giao sau 18h"
                  className={INPUT_CLASS}
                />
              </div>

              <fieldset className="mt-5">
                <legend className="text-sm font-semibold text-ink-900">
                  Phương thức thanh toán
                </legend>
                <div className="mt-2 grid gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors',
                        paymentMethod === method.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-line-200 hover:border-line-300',
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
                      />
                      <span>
                        <span className="block font-semibold text-ink-900">{method.label}</span>
                        <span className="block text-sm text-ink-500">{method.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </form>
          </div>

          {/* ==== Cột phải: tổng kết + nút đặt hàng ==== */}
          <aside className="lg:sticky lg:top-24 lg:h-fit" ref={summaryRef}>
            <div className="rounded-2xl border border-line-200 bg-surface-card p-5">
              <h2 className="text-base font-bold text-ink-900">Tổng kết đơn hàng</h2>

              {/* Mã giảm giá */}
              <div className="mt-4">
                <label htmlFor="cart-coupon" className="mb-1.5 block text-sm font-medium text-ink-700">
                  Mã giảm giá
                </label>
                <div className="flex gap-2">
                  <input
                    id="cart-coupon"
                    type="text"
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                    className="h-11 min-w-0 flex-1 rounded-xl border-2 border-line-200 px-3 text-base uppercase focus:border-brand-accent focus:outline-none"
                  />
                  <Button variant="secondary" onClick={applyCoupon} className="h-11 shrink-0 px-4">
                    Áp dụng
                  </Button>
                </div>
                {couponError ? (
                  <p className="mt-1.5 text-sm font-medium text-status-danger-text">{couponError}</p>
                ) : null}
                {coupon ? (
                  <p className="mt-1.5 text-sm font-medium text-status-success-text">
                    Đã áp dụng: {COUPONS[coupon].label}
                  </p>
                ) : null}
              </div>

              <dl className="mt-5 space-y-2.5 border-t border-line-100 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Tạm tính ({count} sản phẩm)</dt>
                  <dd className="font-medium tabular-nums text-ink-900">{formatPrice(total)}</dd>
                </div>
                {totals.discount > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">Giảm giá</dt>
                    <dd className="font-medium tabular-nums text-price-600">
                      −{formatPrice(totals.discount)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Phí vận chuyển</dt>
                  <dd className="font-medium tabular-nums text-ink-900">
                    {totals.shipping === 0 ? 'Miễn phí' : formatPrice(totals.shipping)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-line-100 pt-3">
                  <dt className="font-semibold text-ink-900">Tổng cộng</dt>
                  <dd className="text-lg font-bold tabular-nums text-price-600">
                    {formatPrice(totals.grandTotal)}
                  </dd>
                </div>
              </dl>

              {formError ? (
                <p
                  role="alert"
                  className="mt-3 rounded-xl border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm font-medium leading-relaxed text-status-danger-text"
                >
                  {formError}
                </p>
              ) : null}

              {/* Nút đặt hàng — desktop nằm cột phải, mobile nằm trong thanh sticky */}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-4 hidden w-full lg:inline-flex"
                size="lg"
              >
                <CreditCard className="h-4 w-4" />
                {submitting ? 'Đang đặt hàng…' : 'Đặt hàng'}
              </Button>

              <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-500 text-pretty">
                <Truck className="mt-px h-3.5 w-3.5 shrink-0 text-brand-600" />
                Giao hàng 2-4 ngày. Miễn phí vận chuyển cho đơn từ 500.000 ₫.
              </p>
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-500 text-pretty">
                <Shield className="mt-px h-3.5 w-3.5 shrink-0 text-brand-600" />
                Khi đơn xuất kho, serial bảo hành được cấp tự động trong mục Đơn của tôi.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ==== Thanh sticky đáy màn hình (mobile) — nút đặt hàng luôn tới được ==== */}
      <div className="fixed inset-x-0 bottom-0 z-30 hide-when-modal-open border-t border-line-200 bg-surface-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-ink-500">Tổng cộng</p>
            <p className="text-lg font-bold leading-tight tabular-nums text-price-600">
              {formatPrice(totals.grandTotal)}
            </p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
            className="shrink-0 px-6"
          >
            <CreditCard className="h-4 w-4" />
            {submitting ? 'Đang đặt hàng…' : 'Đặt hàng'}
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}

export default CartPage;
