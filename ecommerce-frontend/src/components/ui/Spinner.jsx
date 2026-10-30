import { cn } from '../../utils/cn';

/**
 * Spinner nội bộ (không dùng thư viện).
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {string} [props.label='Đang tải']
 */
export function Spinner({ className, label = 'Đang tải' }) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-line-200 border-t-brand-600"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default Spinner;