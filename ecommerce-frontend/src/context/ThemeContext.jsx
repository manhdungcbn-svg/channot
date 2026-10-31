import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'shop:theme';
const THEMES = ['light', 'dark'];

/**
 * Đọc theme đã lưu; mặc định theo prefers-color-scheme của hệ điều hành.
 */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (THEMES.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Quản lý theme light/dark cho Storefront.
 *
 * Áp dụng class `dark` trên <html> (khớp `darkMode: 'class'` trong
 * tailwind.config.js). Toàn bộ màu đọc từ CSS variables trong `index.css`,
 * nên chuyển theme chỉ cần đổi 1 class — đồng bộ với app Bảo hành.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => {
      let hasExplicit = false;
      try {
        hasExplicit = Boolean(localStorage.getItem(STORAGE_KEY));
      } catch {
        hasExplicit = false;
      }
      if (!hasExplicit) setTheme(event.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      setTheme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: 'light', isDark: false, toggleTheme: () => {}, setTheme: () => {} };
  }
  return ctx;
}