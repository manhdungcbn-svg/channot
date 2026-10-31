import { Moon, Sun } from '../icons';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

/**
 * Nút chuyển light/dark cho Storefront.
 * Đặt trong SiteHeader, cạnh wishlist/giỏ hàng.
 */
export function ThemeToggle({ className }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line-200 bg-surface-card text-ink-700 transition-colors duration-150 hover:bg-surface-hover',
        className,
      )}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export default ThemeToggle;