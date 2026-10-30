import { cn } from '../../utils/cn';

/**
 * Container chuẩn của hệ thống (max 1280px, gutter responsive).
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export function Container({ className, children, ...rest }) {
  return (
    <div className={cn('container-page', className)} {...rest}>
      {children}
    </div>
  );
}

export default Container;