/**
 * Trang quản lý sản phẩm — `/admin/products`.
 *
 * Nguồn dữ liệu: `GET /api/shop/admin/products` (+ tìm kiếm `q`).
 * Thêm / sửa: `POST` + `PUT /api/shop/admin/products`. Xoá: `DELETE`.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminModal } from '../components/AdminModal';
import { Badge, Button, EmptyState, Skeleton } from '../components/ui';
import { Cart, Plus, Search } from '../components/icons';
import { AdminLayout } from '../layouts/AdminLayout';
import { useToast } from '../context/ToastContext';
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct,
} from '../api/admin';
import { getCategories } from '../api/shop';
import { cn } from '../utils/cn';
import { formatNumber, formatPrice } from '../utils/format';

/** Class chung cho ô nhập. */
const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-line-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-accent focus:outline-none';

const LABEL_CLASS = 'mt-1 block text-xs font-medium text-ink-700';

/** Form rỗng khi thêm mới. */
const EMPTY_FORM = {
  name: '',
  brand: '',
  category: '',
  categorySlug: '',
  price: '',
  originalPrice: '',
  stock: '',
  sold: '',
  imageUrl: '',
  description: '',
  warrantyMonths: '',
  status: 'available',
  badgeLabel: '',
  badgeTone: '',
  installmentMonths: '',
};

/** Nhãn + tone của trạng thái sản phẩm. */
const PRODUCT_STATUS = {
  available: { label: 'Đang bán', tone: 'success' },
  out_of_stock: { label: 'Hết hàng', tone: 'danger' },
  hidden: { label: 'Đang ẩn', tone: 'neutral' },
  draft: { label: 'Nháp', tone: 'warning' },
};

export function AdminProductsPage() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // Gõ xong 400ms mới gọi API (debounce).
  useEffect(() => {
    const timer = setTimeout(() => setQuery(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts({ q: query, limit: 200 });
      setProducts(data);
    } catch (error) {
      toast.show(error?.message || 'Không tải được danh sách sản phẩm.', { tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Danh mục (dùng cho select trong form).
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const openCreateModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditing(product);
    setForm({
      name: product.name ?? '',
      brand: product.brand ?? '',
      category: product.category ?? '',
      categorySlug: product.categorySlug ?? '',
      price: product.price ? String(product.price) : '',
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      stock: String(product.stock ?? 0),
      sold: String(product.sold ?? 0),
      imageUrl: product.imageUrl ?? '',
      description: product.description ?? '',
      warrantyMonths: String(product.warrantyMonths ?? 0),
      status: product.status ?? 'available',
      badgeLabel: product.badgeLabel ?? '',
      badgeTone: product.badgeTone ?? '',
      installmentMonths: String(product.installmentMonths ?? 0),
    });
    setFormError('');
    setModalOpen(true);
  };

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (form.price !== '' && Number(form.price) < 0) {
      setFormError('Giá sản phẩm không hợp lệ.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim(),
      categorySlug: form.categorySlug.trim(),
      price: form.price === '' ? undefined : Number(form.price),
      originalPrice: form.originalPrice === '' ? undefined : Number(form.originalPrice),
      stock: form.stock === '' ? undefined : Number(form.stock),
      sold: form.sold === '' ? undefined : Number(form.sold),
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim(),
      warrantyMonths: form.warrantyMonths === '' ? undefined : Number(form.warrantyMonths),
      status: form.status,
      badgeLabel: form.badgeLabel.trim(),
      badgeTone: form.badgeTone.trim(),
      installmentMonths:
        form.installmentMonths === '' ? undefined : Number(form.installmentMonths),
    };

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateAdminProduct(editing.id, payload);
        setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        toast.show(`Đã cập nhật "${updated.name}".`, { tone: 'success' });
      } else {
        const created = await createAdminProduct(payload);
        setProducts((current) => [created, ...current]);
        toast.show(`Đã thêm sản phẩm "${created.name}".`, { tone: 'success' });
      }
      setModalOpen(false);
    } catch (error) {
      setFormError(error?.message || 'Không lưu được sản phẩm. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Xoá sản phẩm "${product.name}"?\n\nSản phẩm sẽ bị gỡ khỏi cửa hàng và không thể hoàn tác.`,
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    try {
      await deleteAdminProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      toast.show(`Đã xoá "${product.name}".`, { tone: 'success' });
    } catch (error) {
      toast.show(error?.message || 'Không xoá được sản phẩm.', { tone: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(
    () => ({
      total: products.length,
      outOfStock: products.filter((item) => item.stock <= 0).length,
      lowStock: products.filter((item) => item.stock > 0 && item.stock <= 5).length,
    }),
    [products],
  );

  return (
    <AdminLayout
      title="Quản lý sản phẩm"
      description={`${formatNumber(stats.total)} sản phẩm trong danh mục · ${stats.lowStock} sắp hết hàng · ${stats.outOfStock} hết hàng`}
      actions={
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      }
    >
      {/* Tìm kiếm */}
      <div className="relative">
        <label htmlFor="admin-product-search" className="sr-only">
          Tìm sản phẩm
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
          aria-hidden="true"
        />
        <input
          id="admin-product-search"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên, thương hiệu hoặc serial..."
          className={`${INPUT_CLASS} pl-9`}
        />
      </div>

      {/* Bảng danh sách */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line-200 bg-surface-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Cart className="h-6 w-6" />}
            title="Chưa có sản phẩm nào"
            description={
              query
                ? 'Không tìm thấy sản phẩm phù hợp với từ khoá đã nhập.'
                : 'Thêm sản phẩm đầu tiên để bắt đầu bán hàng.'
            }
            className="border-0"
            action={
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Thêm sản phẩm
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-200 bg-surface-subtle text-2xs uppercase tracking-wide text-ink-500">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Sản phẩm
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Thương hiệu
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Giá
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tồn kho
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Đã bán
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-100">
                {products.map((product) => {
                  const meta = PRODUCT_STATUS[product.status] ?? PRODUCT_STATUS.available;
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-surface-subtle">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
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
                          <span className="min-w-0">
                            <Link
                              to={`/product/${product.slug}`}
                              className="block max-w-[260px] truncate font-medium text-ink-900 hover:text-brand-600"
                            >
                              {product.name}
                            </Link>
                            <span className="block font-mono text-2xs text-ink-500">
                              {product.serialNumber}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-700">{product.brand || '—'}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-price-600">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            product.stock <= 0
                              ? 'text-status-danger-text'
                              : product.stock <= 5
                                ? 'text-status-warning-text'
                                : 'text-ink-900',
                          )}
                        >
                          {formatNumber(product.stock)}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-700">
                        {formatNumber(product.sold)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="rounded-lg border border-line-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-surface-hover"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="rounded-lg border border-line-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-status-danger-text transition-colors hover:bg-status-danger-bg disabled:opacity-50"
                          >
                            {deletingId === product.id ? 'Đang xoá…' : 'Xoá'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal thêm / sửa sản phẩm */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        description={editing ? editing.name : 'Điền thông tin sản phẩm mới cho cửa hàng.'}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="ap-name" className={LABEL_CLASS}>
                Tên sản phẩm <span className="text-status-danger-text">*</span>
              </label>
              <input
                id="ap-name"
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Tivi QLED 4K 55 inch"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="ap-brand" className={LABEL_CLASS}>
                Thương hiệu
              </label>
              <input
                id="ap-brand"
                type="text"
                value={form.brand}
                onChange={(event) => updateField('brand', event.target.value)}
                placeholder="Samsung"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="ap-category" className={LABEL_CLASS}>
                Danh mục
              </label>
              <select
                id="ap-category"
                value={form.categorySlug}
                onChange={(event) => {
                  const slug = event.target.value;
                  const category = categories.find((item) => item.slug === slug);
                  setForm((current) => ({
                    ...current,
                    categorySlug: slug,
                    category: category?.name ?? current.category,
                  }));
                }}
                className={`${INPUT_CLASS} mt-1`}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ap-price" className={LABEL_CLASS}>
                Giá bán (VNĐ)
              </label>
              <input
                id="ap-price"
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => updateField('price', event.target.value)}
                placeholder="12990000"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="ap-original-price" className={LABEL_CLASS}>
                Giá gốc (VNĐ)
              </label>
              <input
                id="ap-original-price"
                type="number"
                min="0"
                value={form.originalPrice}
                onChange={(event) => updateField('originalPrice', event.target.value)}
                placeholder="15990000"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="ap-stock" className={LABEL_CLASS}>
                Tồn kho
              </label>
              <input
                id="ap-stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => updateField('stock', event.target.value)}
                placeholder="20"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="ap-sold" className={LABEL_CLASS}>
                Đã bán
              </label>
              <input
                id="ap-sold"
                type="number"
                min="0"
                value={form.sold}
                onChange={(event) => updateField('sold', event.target.value)}
                placeholder="0"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="ap-warranty" className={LABEL_CLASS}>
                Bảo hành (tháng)
              </label>
              <input
                id="ap-warranty"
                type="number"
                min="0"
                value={form.warrantyMonths}
                onChange={(event) => updateField('warrantyMonths', event.target.value)}
                placeholder="24"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="ap-status" className={LABEL_CLASS}>
                Trạng thái
              </label>
              <select
                id="ap-status"
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
                className={`${INPUT_CLASS} mt-1`}
              >
                {Object.entries(PRODUCT_STATUS).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ap-badge" className={LABEL_CLASS}>
                Nhãn khuyến mãi
              </label>
              <input
                id="ap-badge"
                type="text"
                value={form.badgeLabel}
                onChange={(event) => updateField('badgeLabel', event.target.value)}
                placeholder="Bán chạy"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="ap-badge-tone" className={LABEL_CLASS}>
                Màu nhãn
              </label>
              <select
                id="ap-badge-tone"
                value={form.badgeTone}
                onChange={(event) => updateField('badgeTone', event.target.value)}
                className={`${INPUT_CLASS} mt-1`}
              >
                <option value="">-- Mặc định --</option>
                <option value="flash">Flash sale</option>
                <option value="brand">Thương hiệu</option>
                <option value="success">Nổi bật</option>
                <option value="neutral">Trung tính</option>
              </select>
            </div>

            <div>
              <label htmlFor="ap-installment" className={LABEL_CLASS}>
                Số kỳ trả góp
              </label>
              <input
                id="ap-installment"
                type="number"
                min="0"
                value={form.installmentMonths}
                onChange={(event) => updateField('installmentMonths', event.target.value)}
                placeholder="12"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="ap-image" className={LABEL_CLASS}>
                Ảnh sản phẩm (URL)
              </label>
              <input
                id="ap-image"
                type="text"
                value={form.imageUrl}
                onChange={(event) => updateField('imageUrl', event.target.value)}
                placeholder="/static/shop/tivi-qled-4k-55-inch.svg"
                className={`${INPUT_CLASS} mt-1`}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="ap-description" className={LABEL_CLASS}>
                Mô tả
              </label>
              <textarea
                id="ap-description"
                rows={4}
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Mô tả chi tiết sản phẩm..."
                className="mt-1 w-full rounded-lg border border-line-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-accent focus:outline-none"
              />
            </div>
          </div>

          {formError ? (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-status-danger/40 bg-status-danger-bg px-3 py-2.5 text-xs font-medium text-status-danger-text"
            >
              {formError}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Huỷ
            </Button>
          </div>
        </form>
      </AdminModal>
    </AdminLayout>
  );
}

export default AdminProductsPage;
