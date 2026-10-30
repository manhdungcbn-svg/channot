import { cn } from '../../utils/cn';

/**
 * Skeleton giữ nguyên kích thước của nội dung thật (CLS = 0).
 *
 * @param {object} props
 * @param {string} [props.className] - kích thước (dùng w/h của Tailwind)
 */
export function Skeleton({ className = '', ...rest }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} {...rest} />;
}

export default Skeleton;
