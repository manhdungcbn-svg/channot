import { useState } from 'react';
import { cn } from '../../utils/cn';

const RATIO_CLASSES = {
  '1/1': 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '3/4': 'aspect-[3/4]',
  '16/9': 'aspect-video',
};

/**
 * Ảnh thông minh:
 *  - hỗ trợ srcset / sizes
 *  - `loading` + `fetchpriority`
 *  - chống CLS bằng `aspect-ratio` (ratio prop)
 *  - fallback khi ảnh lỗi (onError)
 *
 * @param {object} props
 * @param {string} props.src
 * @param {string} [props.alt]
 * @param {string} [props.sizes]
 * @param {string} [props.srcSet]
 * @param {'eager'|'lazy'} [props.loading='lazy']
 * @param {'high'|'low'|'auto'} [props.fetchPriority='auto']
 * @param {'1/1'|'4/3'|'3/4'|'16/9'} [props.ratio='1/1']
 * @param {string} [props.fallbackSrc]
 * @param {string} [props.className] - class cho thẻ <img>
 * @param {string} [props.wrapperClassName] - class cho wrapper
 */
export function SmartImage({
  src,
  alt = '',
  sizes,
  srcSet,
  loading = 'lazy',
  fetchPriority = 'auto',
  ratio = '1/1',
  fallbackSrc,
  className,
  wrapperClassName,
  ...rest
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!failed && fallbackSrc && currentSrc !== fallbackSrc) {
      setFailed(true);
      setCurrentSrc(fallbackSrc);
      return;
    }
    setFailed(true);
    setCurrentSrc('');
  };

  return (
    <div className={cn('relative overflow-hidden', RATIO_CLASSES[ratio] ?? RATIO_CLASSES['1/1'], wrapperClassName)}>
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          sizes={sizes}
          srcSet={srcSet}
          loading={loading}
          fetchPriority={fetchPriority}
          onError={handleError}
          className={cn('h-full w-full object-contain', className)}
          {...rest}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-subtle text-2xs text-ink-300">
          Không có ảnh
        </div>
      )}
    </div>
  );
}

export default SmartImage;