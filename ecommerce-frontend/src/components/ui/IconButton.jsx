import { cn } from '../../utils/cn';

/**
 * Nút chỉ chứa icon — bắt buộc có `aria-label` (kiểm tra dev).
 *
 * @param {object} props
 * @param {string} props.ariaLabel - nhãn trợ năng (bắt buộc)
 * @param {'sm'|'md'} [props.size='md']
 * @param {string} [props.className]
 */
export function IconButton({
  ariaLabel,
  label,
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}) {
  const accessibleName = ariaLabel || label;
  const sizes = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
  };

  return (
    <button
      type={type}
      aria-label={accessibleName}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-white/90 text-ink-700 border border-line-200 shadow-sm transition-colors duration-150 hover:bg-white hover:text-brand-600 disabled:opacity-50',
        sizes[size] ?? sizes.md,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export default IconButton;
