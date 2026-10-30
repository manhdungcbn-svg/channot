import { cn } from '../../utils/cn';

/**
 * Tiêu đề section dùng chung.
 *
 * @param {object} props
 * @param {string} [props.eyebrow]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.action]
 * @param {'h1'|'h2'|'h3'} [props.headingLevel='h2']
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  headingLevel = 'h2',
}) {
  const Heading = headingLevel;
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
            {eyebrow}
          </p>
        ) : null}
        <Heading className="mt-2 text-3xl text-ink-900 tracking-tight text-balance">{title}</Heading>
        {description ? (
          <p className="mt-2 text-sm text-ink-500 max-w-container-prose text-pretty">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export default SectionHeader;