import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Danh sách yêu thích — lưu localStorage để giữ giữa các phiên.
 * Dùng chung cho thẻ sản phẩm, trang chi tiết và trang /wishlist.
 */

const STORAGE_KEY = 'shop:wishlist:v1';

const WishlistContext = createContext(null);

/**
 * Đọc wishlist từ localStorage (an toàn khi storage bị chặn).
 * @returns {object[]}
 */
function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => readStorage());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage bị chặn — bỏ qua.
    }
  }, [items]);

  /** @param {object} product */
  const addItem = useCallback((product) => {
    if (!product) return;
    const id = product.id ?? product.slug;
    setItems((current) => {
      if (current.some((item) => item.id === id)) return current;
      return [
        ...current,
        {
          id,
          slug: product.slug ?? '',
          name: product.name ?? 'Sản phẩm',
          brand: product.brand ?? '',
          price: Number(product.price ?? 0) || 0,
          image: product.image ?? product.image_url ?? '',
        },
      ];
    });
  }, []);

  /** @param {number|string} id */
  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  /** @param {number|string} id */
  const toggleItem = useCallback((product) => {
    if (!product) return;
    const id = product.id ?? product.slug;
    setItems((current) =>
      current.some((item) => item.id === id)
        ? current.filter((item) => item.id !== id)
        : [
            ...current,
            {
              id,
              slug: product.slug ?? '',
              name: product.name ?? 'Sản phẩm',
              brand: product.brand ?? '',
              price: Number(product.price ?? 0) || 0,
              image: product.image ?? product.image_url ?? '',
            },
          ],
    );
  }, []);

  /** @param {number|string} id */
  const hasItem = useCallback(
    (id) => items.some((item) => item.id === id),
    [items],
  );

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.length, [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, toggleItem, hasItem, clear, count }),
    [items, addItem, removeItem, toggleItem, hasItem, clear, count],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

/**
 * Hook truy cập wishlist.
 * @returns {{items: object[], addItem: Function, removeItem: Function, toggleItem: Function, hasItem: Function, clear: Function, count: number}}
 */
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist phải được dùng bên trong <WishlistProvider>.');
  }
  return context;
}

export { WishlistContext, STORAGE_KEY as WISHLIST_STORAGE_KEY };

export default WishlistProvider;
