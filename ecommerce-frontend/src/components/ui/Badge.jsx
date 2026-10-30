import { cn } from '../../utils/cn';

const TONES = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  success: 'bg-status-success-bg text-status-success-text border-transparent',
  warning: 'bg-status-warning-bg text-status-warning-text border-transparent',
  danger: 'bg-status-danger-bg text-status-danger-text border-transparent',
  info: 'bg-status-info-bg text-status-info-text border-transparent',
  flash: 'bg-flash-50 text-flash-700 border-flash-100',
  neutral: 'bg-surface-subtle text-ink-700 border-line-200',
};

/**
 * Badge nhỏ dùng cho nhãn trạng thái / nhãn khuyến mãi.
 *
 * @param {object} props
 * @param {'brand'|'success'|'warning'|'danger'|'info'|'flash'|'neutral'} [props.tone='brand']
 * @param {string} [props.className]
 */
export function Badge({ tone = 'brand', className, children, ...rest }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs font-semibold leading-none',
        TONES[tone] ?? TONES.brand,
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

export default Badge;
