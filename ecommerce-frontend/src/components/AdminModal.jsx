/**
 * Modal dùng chung cho khu vực quản trị.
 *
 * Render qua `createPortal` ra `document.body` để không bị header sticky /
 * backdrop-blur che. Khi mở: khoá cuộn trang + trap focus + đóng bằng Esc.
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Close } from './icons';
import { trapFocus } from '../utils/a11y';
import { cn } from '../utils/cn';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.description]
 * @param {() => void} props.onClose
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.size='md'] - 'md' | 'lg'
 */
export function AdminModal({ isOpen, title, description, onClose, children, size = 'md' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      trapFocus(dialogRef.current, event);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = {
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface-card shadow-xl sm:rounded-2xl',
          widths[size] ?? widths.md,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink-900">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-ink-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-surface-hover hover:text-ink-900"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default AdminModal;
