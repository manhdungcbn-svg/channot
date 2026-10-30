import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Giỏ hàng phía khách (chưa đăng nhập) — lưu localStorage để giữ giữa các phiên.
 */

const STORAGE_KEY = 'shop:cart:v1';

/**
 * @typedef {object} CartItem
 * @property {number|string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} brand
 * @property {number} price
 * @property {string} image
 * @property {number} quantity
 */

const CartContext = createContext(null);

/**
 * Đọc giỏ hàng từ localStorage (an toàn khi SSR / storage bị chặn).
 * @returns {CartItem[]}
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
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStorage());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage bị chặn (private mode) — bỏ qua, giỏ vẫn hoạt động trong phiên.
    }
  }, [items]);

  const addItem = useCallback((product, quantity = 1) => {
    if (!product) return;
    const id = product.id ?? product.slug;
    setItems((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) {
        return current.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [
        ...current,
        {
          id,
          slug: product.slug ?? '',
          name: product.name ?? 'Sản phẩm',
          brand: product.brand ?? '',
          price: Number(product.price ?? 0) || 0,
          image: product.image ?? product.image_url ?? '',
          quantity,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, Number(quantity) || 1) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [items],
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clear, count, total }),
    [items, addItem, removeItem, updateQuantity, clear, count, total],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook truy cập giỏ hàng.
 * @returns {{items: CartItem[], addItem: Function, removeItem: Function, updateQuantity: Function, clear: Function, count: number, total: number}}
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được dùng bên trong <CartProvider>.');
  }
  return context;
}

export { CartContext, STORAGE_KEY as CART_STORAGE_KEY };

export default CartProvider;
