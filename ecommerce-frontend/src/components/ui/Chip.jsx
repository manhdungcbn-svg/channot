import { cn } from '../../utils/cn';

/**
 * Chip quick-intent — dùng để điều hướng nhanh tới trang tìm kiếm.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {import('react').ReactNode} [props.icon]
 */
export function Chip({ className, icon, children, ...rest }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-white border border-line-200 text-sm text-ink-700 hover:border-brand-accent hover:text-brand-600 transition-colors duration-150',
        className,
      )}
      {...rest}
    >
      {icon ? <span className="shrink-0 text-ink-300">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

export default Chip;
