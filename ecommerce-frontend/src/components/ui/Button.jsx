import { cn } from '../../utils/cn';

/**
 * Nút chính — hỗ trợ các variant nền tảng của hệ thống.
 *
 * @param {object} props
 * @param {'gradient'|'secondary'|'ghost'|'solid'} [props.variant='gradient']
 * @param {'md'|'lg'} [props.size='md']
 * @param {string} [props.className]
 * @param {import('react').ReactNode} [props.children]
 */
export function Button({
  variant = 'gradient',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}) {
  const variants = {
    gradient: 'btn btn-gradient',
    secondary: 'btn btn-secondary',
    ghost: 'btn btn-ghost',
    solid: 'btn bg-brand-600 text-white hover:bg-brand-700',
  };

  const sizes = {
    md: '',
    lg: 'min-h-[52px] px-6 text-base',
  };

  return (
    <button type={type} className={cn(variants[variant] ?? variants.gradient, sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export default Button;
