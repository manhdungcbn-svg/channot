import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { ChevronRight, Close, MapPin, Shield, Truck, User } from '../components/icons';
import { StoreLayout } from '../layouts/StoreLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAddresses, createAddress, deleteAddress } from '../api/orders';
import { getMyWarrantyProducts } from '../api/warranty';
import { AddressPicker } from '../components/sections/AddressPicker';
import { openLoginModal } from '../utils/loginModal';
import { cn } from '../utils/cn';

const EMPTY_ADDRESS = {
  label: '',
  receiverName: '',
  phone: '',
  // `address` là chuỗi tổng hợp gửi lên API (tối đa 500 ký tự).
  address: '',
  addressDetail: '',
  provinceCode: '',
  wardCode: '',
  provinceName: '',
  wardName: '',
  isDefault: false,
};

/**
 * Trang "Tài khoản của tôi" — thông tin cá nhân, sổ địa chỉ giao hàng,
 * sản phẩm đã bảo hành.
 */
export function AccountPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [warrantyProducts, setWarrantyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;

    Promise.allSettled([getAddresses(), getMyWarrantyProducts()]).then(
      ([addressResult, warrantyResult]) => {
        if (cancelled) return;
        if (addressResult.status === 'fulfilled') setAddresses(addressResult.value);
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

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.receiverName.trim() || !form.phone.trim()) {
      setFormError('Vui lòng điền đủ tên người nhận và số điện thoại.');
      return;
    }
    if (!form.provinceCode) {
      setFormError('Vui lòng chọn tỉnh/thành phố.');
      return;
    }
    if (!form.wardCode) {
      setFormError('Vui lòng chọn phường/xã.');
      return;
    }
    if (!form.addressDetail.trim()) {
      setFormError('Vui lòng nhập số nhà và tên đường.');
      return;
    }

    // Ghép chuỗi địa chỉ đầy đủ: "số nhà, đường, phường/xã, tỉnh/thành"
    const fullAddress = [form.addressDetail.trim(), form.wardName, form.provinceName]
      .filter(Boolean)
      .join(', ');

    setSaving(true);
    try {
      const created = await createAddress({
        label: form.label.trim(),
        receiverName: form.receiverName.trim(),
        phone: form.phone.trim(),
        address: fullAddress,
        isDefault: form.isDefault,
      });
      setAddresses((current) =>
        created.isDefault
          ? [created, ...current.map((item) => ({ ...item, isDefault: false }))]
          : [created, ...current],
      );
      setForm(EMPTY_ADDRESS);
      toast.show('Đã lưu địa chỉ giao hàng', { tone: 'success' });
    } catch (error) {
      setFormError(error?.message || 'Không lưu được địa chỉ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address) => {
    try {
      await deleteAddress(address.id);
      setAddresses((current) => current.filter((item) => item.id !== address.id));
      toast.show('Đã xoá địa chỉ', { tone: 'success' });
    } catch (error) {
      toast.show(error?.message || 'Không xoá được địa chỉ.', { tone: 'error' });
    }
  };

  if (!user) {
    return (
      <StoreLayout title="Tài khoản">
        <div className="container-page py-12">
          <EmptyState
            icon={<User className="h-6 w-6" />}
            title="Bạn cần đăng nhập"
            description="Đăng nhập để quản lý địa chỉ giao hàng và xem sản phẩm đã bảo hành."
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
    <StoreLayout title="Tài khoản | ĐiệnTử">
      <div className="container-page py-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Tài khoản của tôi</h1>
        <p className="mt-1 text-sm text-ink-500">Quản lý thông tin, địa chỉ và bảo hành</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            {/* Thông tin cá nhân */}
            <section className="rounded-2xl border border-line-200 bg-surface-card p-5">
              <h2 className="text-base font-bold text-ink-900">Thông tin cá nhân</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Họ và tên', value: user.full_name },
                  { label: 'Email', value: user.email },
                  { label: 'Số điện thoại', value: user.phone || 'Chưa cập nhật' },
                  { label: 'Vai trò', value: user.role === 'customer' ? 'Khách hàng' : user.role },
                ].map((field) => (
                  <div key={field.label} className="rounded-lg bg-surface-subtle px-3 py-2.5">
                    <dt className="text-2xs uppercase tracking-wide text-ink-400">{field.label}</dt>
                    <dd className="mt-0.5 truncate text-sm font-medium text-ink-900">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Sổ địa chỉ */}
            <section className="rounded-2xl border border-line-200 bg-surface-card p-5">
              <h2 className="text-base font-bold text-ink-900">Địa chỉ giao hàng</h2>

              {loading ? (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              ) : addresses.length === 0 ? (
                <p className="mt-3 text-sm text-ink-500">
                  Chưa có địa chỉ nào. Thêm địa chỉ bên dưới để thanh toán nhanh hơn.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {addresses.map((address) => (
                    <li
                      key={address.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-line-200 p-3"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                          {address.label ? (
                            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-2xs text-brand-700">
                              {address.label}
                            </span>
                          ) : null}
                          {address.receiverName}
                          {address.isDefault ? (
                            <span className="rounded bg-status-success-bg px-1.5 py-0.5 text-2xs text-status-success-text">
                              Mặc định
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-ink-500">{address.phone}</p>
                        <p className="mt-0.5 text-xs text-ink-500 text-pretty">{address.address}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(address)}
                        aria-label="Xoá địa chỉ"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-surface-hover hover:text-status-danger-text"
                      >
                        <Close className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Form thêm địa chỉ */}
              <form onSubmit={handleSave} className="mt-5 border-t border-line-100 pt-5">
                <h3 className="text-sm font-semibold text-ink-800">Thêm địa chỉ mới</h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="addr-label" className="block text-xs font-medium text-ink-600">
                      Nhãn (không bắt buộc)
                    </label>
                    <input
                      id="addr-label"
                      type="text"
                      value={form.label}
                      onChange={(event) => setForm({ ...form, label: event.target.value })}
                      placeholder="Nhà, Văn phòng..."
                      className="mt-1 h-10 w-full rounded-lg border border-line-200 px-3 text-sm focus:border-brand-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="addr-name" className="block text-xs font-medium text-ink-600">
                      Người nhận
                    </label>
                    <input
                      id="addr-name"
                      type="text"
                      value={form.receiverName}
                      onChange={(event) =>
                        setForm({ ...form, receiverName: event.target.value })
                      }
                      placeholder="Nguyễn Văn A"
                      className="mt-1 h-10 w-full rounded-lg border border-line-200 px-3 text-sm focus:border-brand-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="addr-phone" className="block text-xs font-medium text-ink-600">
                      Số điện thoại
                    </label>
                    <input
                      id="addr-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      placeholder="0900 000 000"
                      className="mt-1 h-10 w-full rounded-lg border border-line-200 px-3 text-sm focus:border-brand-accent focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <AddressPicker
                      idPrefix="addr"
                      provinceCode={form.provinceCode}
                      wardCode={form.wardCode}
                      detail={form.addressDetail}
                      onChange={(next) => setForm((current) => ({ ...current, ...next }))}
                    />
                  </div>
                </div>

                <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-ink-600">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
                    className="h-4 w-4 accent-brand-600"
                  />
                  Đặt làm địa chỉ mặc định
                </label>

                {formError ? (
                  <p className="mt-2 text-xs font-medium text-status-danger-text">{formError}</p>
                ) : null}

                <Button type="submit" disabled={saving} className="mt-3">
                  {saving ? 'Đang lưu…' : 'Lưu địa chỉ'}
                </Button>
              </form>
            </section>
          </div>

          {/* Cột phụ */}
          <aside className="space-y-4 lg:h-fit lg:sticky lg:top-24">
            <div className="rounded-2xl border border-line-200 bg-surface-card p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <Shield className="h-4 w-4 text-brand-600" />
                Sản phẩm đã bảo hành
              </h2>
              {loading ? (
                <Skeleton className="mt-3 h-20 rounded-xl" />
              ) : warrantyProducts.length === 0 ? (
                <p className="mt-3 text-xs text-ink-500 text-pretty">
                  Chưa có sản phẩm nào. Kích hoạt bảo hành từ trang chi tiết sản phẩm hoặc
                  khi đơn hàng được xuất kho.
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
            </div>

            <nav className="rounded-2xl border border-line-200 bg-surface-card p-2">
              {[
                { to: '/orders', label: 'Đơn hàng của tôi', icon: <Truck className="h-4 w-4" /> },
                // Tài khoản quản trị không dùng giỏ hàng — ẩn link này.
                ...(user && ['staff', 'admin'].includes(user.role)
                  ? [{ to: '/admin', label: 'Khu vực quản trị', icon: <Shield className="h-4 w-4" /> }]
                  : [{ to: '/cart', label: 'Giỏ hàng', icon: <MapPin className="h-4 w-4" /> }]),
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-ink-700 transition-colors hover:bg-surface-hover"
                >
                  <span className="flex items-center gap-2">
                    {link.icon}
                    {link.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-300" />
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
}

export default AccountPage;
