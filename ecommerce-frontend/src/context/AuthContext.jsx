import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  consumeSessionFragment,
  readSession,
  writeSession,
} from '../utils/sessionBridge';

/**
 * Auth của storefront — DÙNG CHUNG backend + DÙNG CHUNG key localStorage với
 * app bảo hành (`warranty-system/frontend`).
 *
 * Vì cùng key (`token` / `user`) và cùng origin-localStorage, khách đăng nhập
 * ở web bán hàng thì khi mở app bảo hành đã tự đăng nhập luôn — không phải
 * nhập lại tài khoản. Ngược lại (đăng nhập ở app bảo hành rồi quay lại
 * storefront) cũng tự đồng bộ.
 *
 * Lưu ý: localStorage CHIA THEO ORIGIN — `localhost:5175` và `localhost:5174`
 * KHÔNG dùng chung được storage. Vì vậy session được bàn giao chéo bằng
 * fragment URL (`utils/sessionBridge.js`): token đi kèm link sang app kia và
 * được app đích nhận + xoá khỏi URL ngay.
 */

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export function AuthProvider({ children }) {
  // Nhận session bàn giao từ app kia (fragment URL) TRƯỚC khi đọc state,
  // để khách vào app bảo hành bằng nút ở storefront là đã đăng nhập sẵn.
  const [session] = useState(() => {
    consumeSessionFragment();
    return readSession();
  });

  const [user, setUser] = useState(() => session.user);
  const [token, setToken] = useState(() => session.token);
  const [loading, setLoading] = useState(true);

  // Đồng bộ session giữa 2 tab (storefront ↔ app bảo hành mở song song).
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === TOKEN_KEY || event.key === USER_KEY) {
        const session = readSession();
        setToken(session.token);
        setUser(session.user);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Xác thực token với backend (token có thể đã hết hạn).
  useEffect(() => {
    let cancelled = false;
    const current = readSession();
    if (!current.token) {
      setLoading(false);
      return undefined;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${current.token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error('unauthorized');
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setUser(data);
        setToken(current.token);
        window.localStorage.setItem(USER_KEY, JSON.stringify(data));
      })
      .catch(() => {
        if (cancelled) return;
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Đăng nhập — dùng chung endpoint `/api/auth/login` của backend.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} user
   */
  const login = useCallback(async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let message = 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
      try {
        const data = await response.json();
        message = data?.error?.message || data?.detail || message;
      } catch {
        /* giữ message mặc định */
      }
      throw new Error(message);
    }

    const data = await response.json();
    writeSession(data.access_token, data.user);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  /**
   * Đăng ký tài khoản mới — dùng chung endpoint `/api/auth/register`.
   * @param {{email: string, password: string, full_name: string, phone?: string}} payload
   * @returns {Promise<object>} user
   */
  const register = useCallback(async (payload) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let message = 'Đăng ký thất bại. Vui lòng thử lại.';
      try {
        const data = await response.json();
        message = data?.error?.message || data?.detail || message;
      } catch {
        /* giữ message mặc định */
      }
      throw new Error(message);
    }

    const created = await response.json();
    // Đăng nhập luôn sau khi đăng ký để khách vào được app bảo hành ngay.
    return login(payload.email, payload.password).then(() => created);
  }, [login]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, isLoggedIn: Boolean(user) }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook truy cập auth.
 * @returns {{user: object|null, token: string|null, loading: boolean, login: Function, register: Function, logout: Function, isLoggedIn: boolean}}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>.');
  }
  return context;
}

export { AuthContext, TOKEN_KEY, USER_KEY };

export default AuthProvider;
