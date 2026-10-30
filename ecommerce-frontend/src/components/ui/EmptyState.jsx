import { cn } from '../../utils/cn';

/**
 * Trạng thái rỗng — hiển thị khi danh sách không có dữ liệu.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.action]
 */
export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-line-200 bg-surface-card px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-subtle text-ink-300">
          {icon}
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-ink-500 text-pretty">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export default EmptyState;